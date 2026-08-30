import type {
  PivotEngineResult,
  PivotGroupByDef,
  PivotValueDef,
} from "../core/pivotEngine";
import type { RowData } from "../types/rowData";
import type { LegacyAggregationFn } from "../utils/aggregationFns";

export type ComputeMode = "auto" | "cpu" | "webgpu" | "server";

export interface ComputeConfig {
  /**
   * Compute mode.
   * - auto: choose between CPU / WebGPU based on dataset size and capability (default, behaves as 'cpu' until benchmarks finalize threshold)
   * - cpu: always CPU on main thread (or Worker-CPU if worker:true)
   * - webgpu: prefer WebGPU, fall back to CPU on failure/unavailable
   * - server: delegate to PivotServerAdapter
   */
  mode?: ComputeMode;
  /**
   * Whether to offload to a Web Worker.
   * - true: use Worker when available
   * - false: main thread only
   * - 'auto': use Worker for datasets above threshold when Worker available (default)
   */
  worker?: boolean | "auto";
  /**
   * Dataset size threshold where auto mode considers WebGPU/Worker.
   * Benchmarks must justify default; until then CPU path is used.
   */
  threshold?: number;
  /**
   * Opt-in debug logging (mode selection + timings). Off by default to avoid noisy production.
   */
  debug?: boolean;
}

export interface ComputeRequest<TData extends RowData = RowData> {
  data: TData[];
  rowGroupBy: PivotGroupByDef<TData>[];
  columnGroupBy: PivotGroupByDef<TData>[];
  values: PivotValueDef<TData>[];
  aggregationFns?: Record<string, LegacyAggregationFn<TData>>;
  /** Monotonic version for caching (optional, derived from usePivotTable dataVersion if present). */
  dataVersion?: number;
  /** Optional request id for Worker cancellation (filled by controller). */
  requestId?: number;
}

export type ComputeResult<TData extends RowData = RowData> = PivotEngineResult<TData>;

export interface ComputeEngine<TData extends RowData = RowData> {
  readonly kind: ComputeMode;
  /** Sync, SSR-safe, no side effects — true if this engine can run in current environment. */
  isAvailable(): boolean;
  /** Execute pivot/aggregation. CPU may be sync; GPU/Server are async — callers await uniformly. */
  execute(request: ComputeRequest<TData>): Promise<ComputeResult<TData>> | ComputeResult<TData>;
  /** Release resources (GPU buffers/device, Worker). No-op for CPU. */
  destroy?(): void;
}

export interface ComputeTimings {
  transferMs?: number;
  computeMs?: number;
  totalMs?: number;
  mode: ComputeMode;
  kind: string;
}

/** Default threshold is intentionally conservative until benchmarks prove crossover. */
export const DEFAULT_COMPUTE_THRESHOLD = 50_000;
export const DEFAULT_COMPUTE_MODE: ComputeMode = "auto";

/** Shared hard cap for GPU/Worker offload — same as pivotEngine bucket guard. */
export const MAX_COMPUTE_ROWS = 5_000_000;
