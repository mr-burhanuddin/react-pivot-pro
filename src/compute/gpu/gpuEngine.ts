import type { RowData } from "../../types/rowData";
import { CpuComputeEngine } from "../cpuEngine";
import { getWebGPUDevice, isWebGPUAvailable, isWithinGpuLimits, isWithinWorkgroupLimits } from "../capabilities";
import type { ComputeEngine, ComputeRequest, ComputeResult } from "../types";
import { MAX_COMPUTE_ROWS } from "../types";
import { WGSL_GLOBAL_COUNT, WGSL_GLOBAL_MAX, WGSL_GLOBAL_MIN, WGSL_GLOBAL_SUM } from "./shaders";

export const GPU_WORKGROUP_SIZE = 64 as const;
import { getValueByAccessorKey, isSafeKey } from "../../utils/accessorHelpers";

declare const GPUBufferUsage: { STORAGE: number; COPY_DST: number; COPY_SRC: number; UNIFORM: number; MAP_READ: number };
declare const GPUMapMode: { READ: number };

const GPU_SAFE_AGG = new Set(["sum", "count", "avg", "min", "max"]);

function isGpuEligible<TData extends RowData>(request: ComputeRequest<TData>): boolean {
  if (request.rowGroupBy.length > 0 || request.columnGroupBy.length > 0) return false;
  const n = request.data.length;
  if (n === 0 || n > MAX_COMPUTE_ROWS) return false;
  const hasUnsafeAgg = request.values.some((v) => {
    const agg = v.aggregation;
    if (!agg) return false;
    if (typeof agg === "function") return true;
    return !GPU_SAFE_AGG.has(String(agg));
  });
  if (hasUnsafeAgg) return false;
  const dimBytesPerRow = 4 * (request.rowGroupBy.length + request.columnGroupBy.length);
  const totalBytes = n * (dimBytesPerRow + 12 * Math.max(1, request.values.length));
  if (!isWithinGpuLimits(totalBytes)) return false;
  const workgroups = Math.ceil(n / GPU_WORKGROUP_SIZE);
  if (!isWithinWorkgroupLimits(workgroups, GPU_WORKGROUP_SIZE)) return false;
  return true;
}

/**
 * GpuComputeEngine — Phase-5b: real GPU dispatch for global non-grouped reductions.
 *
 * Grouped pivot still falls back to CPU (§14: no atomic f32 grouping).
 * SSR: isAvailable() checks typeof navigator; execute() lazily requests device; any failure → CPU.
 * Security: validates buffer sizes and dispatch limits before GPU submission.
 */

function toNumberStrict(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  if (Number.isNaN(n) || !Number.isFinite(n)) return null;
  return n;
}

function getAccessor<TData extends RowData>(id: string, accessor: unknown): (row: TData) => unknown {
  if (typeof accessor === "function") return accessor as (row: TData) => unknown;
  if (typeof accessor === "string" && isSafeKey(accessor)) return (row: TData) => getValueByAccessorKey(row, accessor);
  if (isSafeKey(id)) return (row: TData) => getValueByAccessorKey(row, id);
  return () => undefined;
}

// ponytail: minimal GPU helpers kept inline to avoid extra file; honest fallback on any GPU error
async function dispatchGlobal(
  op: "sum" | "count" | "min" | "max",
  values: Float32Array,
  valid: Uint32Array,
  n: number,
): Promise<number | null> {
  const device = (await getWebGPUDevice()) as unknown as GPUDevice | null;
  if (!device) throw new Error("No GPU device");
  const workgroups = Math.ceil(n / GPU_WORKGROUP_SIZE);
  const wgsl =
    op === "sum" ? WGSL_GLOBAL_SUM : op === "count" ? WGSL_GLOBAL_COUNT : op === "min" ? WGSL_GLOBAL_MIN : WGSL_GLOBAL_MAX;

  // Buffers
  const valuesBuf = device.createBuffer({ size: values.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  const validBuf = device.createBuffer({ size: valid.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  const partialsSize = workgroups * (op === "count" ? 4 : 4);
  const partialsBuf = device.createBuffer({ size: partialsSize, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC });
  const readbackBuf = device.createBuffer({ size: partialsSize, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });
  const paramsArray = new Uint32Array([n, workgroups]);
  const paramsBuf = device.createBuffer({ size: 8, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });

  device.queue.writeBuffer(valuesBuf, 0, values);
  device.queue.writeBuffer(validBuf, 0, valid);
  device.queue.writeBuffer(paramsBuf, 0, paramsArray);

  const module = device.createShaderModule({ code: wgsl });
  const pipeline = device.createComputePipeline({ layout: "auto", compute: { module, entryPoint: "main" } });
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries:
      op === "count"
        ? [
            { binding: 0, resource: { buffer: validBuf } },
            { binding: 1, resource: { buffer: partialsBuf } },
            { binding: 2, resource: { buffer: paramsBuf } },
          ]
        : [
            { binding: 0, resource: { buffer: valuesBuf } },
            { binding: 1, resource: { buffer: validBuf } },
            { binding: 2, resource: { buffer: partialsBuf } },
            { binding: 3, resource: { buffer: paramsBuf } },
          ],
  });

  const encoder = device.createCommandEncoder();
  const pass = encoder.beginComputePass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(workgroups);
  pass.end();
  encoder.copyBufferToBuffer(partialsBuf, 0, readbackBuf, 0, partialsSize);
  device.queue.submit([encoder.finish()]);

  await readbackBuf.mapAsync(GPUMapMode.READ);
  const copy = readbackBuf.getMappedRange().slice(0);
  readbackBuf.unmap();

  // Cleanup interim buffers
  try {
    valuesBuf.destroy();
    validBuf.destroy();
    partialsBuf.destroy();
    paramsBuf.destroy();
    readbackBuf.destroy();
  } catch { /* ignore */ }

  if (op === "count") {
    const arr = new Uint32Array(copy);
    let total = 0;
    for (let i = 0; i < workgroups; i++) total += arr[i];
    return total;
  }
  const arr = new Float32Array(copy);
  if (op === "sum") {
    let total = 0;
    for (let i = 0; i < workgroups; i++) total += arr[i];
    // empty check: if no valid, sum is 0 but CPU returns null for empty; caller handles null via count
    return total;
  }
  if (op === "min") {
    let m = Infinity;
    let has = false;
    for (let i = 0; i < workgroups; i++) {
      const v = arr[i];
      if (v !== 3.4028235e38) { has = true; if (v < m) m = v; }
    }
    return has ? m : null;
  }
  // max
  let m = -Infinity;
  let has = false;
  for (let i = 0; i < workgroups; i++) {
    const v = arr[i];
    if (v !== -3.4028235e38) { has = true; if (v > m) m = v; }
  }
  return has ? m : null;
}

export class GpuComputeEngine<TData extends RowData = RowData>
  implements ComputeEngine<TData>
{
  readonly kind = "webgpu" as const;
  private cpuFallback = new CpuComputeEngine<TData>();
  private debug: boolean;

  constructor(opts: { debug?: boolean } = {}) {
    this.debug = !!opts.debug;
  }

  isAvailable(): boolean {
    return isWebGPUAvailable();
  }

  async execute(request: ComputeRequest<TData>): Promise<ComputeResult<TData>> {
    if (!this.isAvailable() || !isGpuEligible(request)) {
      if (this.debug && (request.rowGroupBy.length > 0 || request.columnGroupBy.length > 0)) {
        console.warn("[GpuCompute] grouped pivot → CPU fallback (Phase 5 limitation)");
      }
      return this.cpuFallback.execute(request);
    }
    // Real GPU path: per-value global reductions; any error → CPU fallback (never crash)
    try {
      const n = request.data.length;
      const workgroups = Math.ceil(n / GPU_WORKGROUP_SIZE);
      if (!isWithinWorkgroupLimits(workgroups, GPU_WORKGROUP_SIZE)) throw new Error("workgroup limits");

      const grandTotals: Record<string, unknown> = {};
      const cellValues: Record<string, unknown> = {};

      for (const v of request.values) {
        const agg = (v.aggregation as string) ?? "sum";
        const fn = getAccessor<TData>(v.id, (v as { accessor?: unknown }).accessor);
        const vals = new Float32Array(n);
        const valid = new Uint32Array(n);
        let validCount = 0;
        for (let i = 0; i < n; i++) {
          const num = toNumberStrict(fn(request.data[i]));
          if (num === null) { vals[i] = 0; valid[i] = 0; }
          else { vals[i] = num; valid[i] = 1; validCount++; }
        }
        if (agg === "count") {
          // ponytail: CPU count counts all rows (including null/NaN); GPU valid-count would diverge, so return n directly (no dispatch)
          const c = n;
          grandTotals[v.id] = c;
          cellValues[v.id] = c;
        } else if (agg === "sum") {
          if (validCount === 0) { grandTotals[v.id] = null; cellValues[v.id] = null; }
          else {
            const s = await dispatchGlobal("sum", vals, valid, n);
            grandTotals[v.id] = s;
            cellValues[v.id] = s;
          }
        } else if (agg === "avg") {
          if (validCount === 0) { grandTotals[v.id] = null; cellValues[v.id] = null; }
          else {
            const s = (await dispatchGlobal("sum", vals, valid, n)) as number;
            const c = (await dispatchGlobal("count", vals, valid, n)) as number;
            const avg = c ? s / c : null;
            grandTotals[v.id] = avg;
            cellValues[v.id] = avg;
          }
        } else if (agg === "min") {
          const m = await dispatchGlobal("min", vals, valid, n);
          grandTotals[v.id] = m;
          cellValues[v.id] = m;
        } else if (agg === "max") {
          const m = await dispatchGlobal("max", vals, valid, n);
          grandTotals[v.id] = m;
          cellValues[v.id] = m;
        } else {
          throw new Error(`unsupported agg ${agg} for GPU`);
        }
      }

      // Global-only result shape mirrors pivotEngine for empty grouping
      return {
        rowTree: [],
        rowHeaders: [[]],
        columnHeaders: [{ key: "__root__", path: [] }],
        matrix: [{ rowKey: "__root__", columnKey: "__root__", values: cellValues }],
        matrixByRowKey: { __root__: { __root__: cellValues } },
        grandTotals,
      } as ComputeResult<TData>;
    } catch (e) {
      if (this.debug) console.warn("[GpuCompute] dispatch failed → CPU fallback", e);
      return this.cpuFallback.execute(request);
    }
  }

  destroy(): void {
    // device cleanup handled by capabilities reset if needed
  }
}

export function createGpuComputeEngine<TData extends RowData = RowData>(opts: { debug?: boolean } = {}): GpuComputeEngine<TData> {
  return new GpuComputeEngine<TData>(opts);
}

export const wouldUseGpu = isGpuEligible;
