import type { PivotGroupByDef, PivotValueDef } from "../core/pivotEngine";
import type { RowData } from "../types/rowData";
import { isSafeKey, getValueByAccessorKey } from "../utils/accessorHelpers";

type Accessor<TData extends RowData> = (row: TData) => unknown;

function isSafeAccessorPath(path: string): boolean {
  return path.split(".").every((seg) => isSafeKey(seg));
}

function toAccessor<TData extends RowData>(
  id: string,
  accessor?: PivotGroupByDef<TData>["accessor"] | PivotValueDef<TData>["accessor"],
): Accessor<TData> {
  if (typeof accessor === "function") {
    return accessor as Accessor<TData>;
  }
  if (typeof accessor === "string") {
    if (!isSafeAccessorPath(accessor)) return () => undefined;
    return (row: TData) => getValueByAccessorKey(row, accessor);
  }
  if (!isSafeAccessorPath(id)) return () => undefined;
  return (row: TData) => getValueByAccessorKey(row, id);
}

function toPathValue(value: unknown): string {
  if (value === null) return "__null__";
  if (value === undefined) return "__undefined__";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Encoded dataset for GPU/Worker transfer.
 *
 * Categorical dimensions → Uint32Array of dictionary ids (0..dictSize-1).
 * Numeric measures → Float64Array (preserves cents up to 2^53; Float32 would lose precision > 16M).
 * Null/invalid → sentinel handling (NaN for Float64, 0xFFFFFFFF for Uint32 + validMask if needed).
 *
 * Decision: financial exactness → Float64 on CPU fallback; GPU f64 WGSL not yet universal → fallback to CPU when GPU lacks f64.
 * Until benchmarks prove otherwise, Float64 is the safe default for values. If f32 suffices, caller may downcast.
 */
export interface EncodedPivotData {
  rowCount: number;
  dictionaries: Record<string, string[]>; // id -> [ "__null__", "India", ... ] ordered by first-seen
  dimensionBuffers: Record<string, Uint32Array>; // per groupBy id
  valueBuffers: Record<string, Float64Array>; // per value id
  /** Optional per-value validity: 1=valid finite, 0=invalid/null/NaN/Infinity (mirrors aggregators.ts toNumber). */
  validMasks?: Record<string, Uint8Array>;
}

export interface EncodeOptions {
  useValidMask?: boolean; // default true — produces Uint8Array per value
}

function buildDictionary(values: unknown[]): { dict: string[]; map: Map<string, number> } {
  const dict: string[] = [];
  const map = new Map<string, number>();
  for (const v of values) {
    const key = toPathValue(v);
    if (!map.has(key)) {
      map.set(key, dict.length);
      dict.push(key);
    }
  }
  return { dict, map };
}

function toNumberStrict(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

/**
 * Encode raw TData[] into typed arrays for efficient Worker transfer and GPU buffering.
 * Pure, synchronous, no side effects beyond allocation.
 * Security: caps at request.data.length; caller must guard huge allocations via threshold/limits (see capabilities.ts).
 */
export function encodePivotData<TData extends RowData>(
  data: TData[],
  rowGroupBy: PivotGroupByDef<TData>[],
  columnGroupBy: PivotGroupByDef<TData>[],
  values: PivotValueDef<TData>[],
  options: EncodeOptions = {},
): EncodedPivotData {
  const useValidMask = options.useValidMask !== false;
  const n = data.length;
  if (n > 5_000_000) {
    throw new Error(`encodePivotData: n=${n} exceeds MAX_COMPUTE_ROWS 5_000_000 — use CPU fallback`);
  }

  const allGroupBy = [...rowGroupBy, ...columnGroupBy];
  const dimensionAccessors = allGroupBy.map((g) => ({
    id: g.id,
    fn: toAccessor(g.id, g.accessor),
  }));

  const valueAccessors = values.map((v) => ({
    id: v.id,
    fn: toAccessor(v.id, v.accessor),
  }));

  // Collect raw dimension values per groupBy
  const rawDimValues: Record<string, unknown[]> = {};
  for (const { id } of dimensionAccessors) rawDimValues[id] = new Array(n);
  for (let i = 0; i < n; i++) {
    const row = data[i];
    for (const { id, fn } of dimensionAccessors) {
      rawDimValues[id][i] = fn(row);
    }
  }

  const dictionaries: Record<string, string[]> = {};
  const dimensionBuffers: Record<string, Uint32Array> = {};
  for (const { id } of dimensionAccessors) {
    // Deduplicate per groupBy
    const arr = rawDimValues[id];
    const { dict, map } = buildDictionary(arr);
    dictionaries[id] = dict;
    const buf = new Uint32Array(n);
    for (let i = 0; i < n; i++) {
      const key = toPathValue(arr[i]);
      buf[i] = map.get(key)!;
    }
    dimensionBuffers[id] = buf;
  }

  const valueBuffers: Record<string, Float64Array> = {};
  const validMasks: Record<string, Uint8Array> | undefined = useValidMask ? {} : undefined;

  for (const { id, fn } of valueAccessors) {
    const buf = new Float64Array(n);
    const mask = useValidMask ? new Uint8Array(n) : undefined;
    for (let i = 0; i < n; i++) {
      const raw = fn(data[i]);
      const num = toNumberStrict(raw);
      if (num === null || !Number.isFinite(num)) {
        buf[i] = 0; // sentinel, ignored via mask
        if (mask) mask[i] = 0;
      } else {
        buf[i] = num;
        if (mask) mask[i] = 1;
      }
    }
    valueBuffers[id] = buf;
    if (useValidMask && mask) validMasks![id] = mask;
  }

  return {
    rowCount: n,
    dictionaries,
    dimensionBuffers,
    valueBuffers,
    validMasks,
  };
}

