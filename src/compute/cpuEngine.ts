import { createPivotEngineResult } from "../core/pivotEngine";
import type { RowData } from "../types/rowData";
import type {
  ComputeEngine,
  ComputeRequest,
  ComputeResult,
} from "./types";

/**
 * CPU baseline — directly delegates to existing synchronous pivot engine.
 * Reference implementation for correctness of WebGPU/Worker paths.
 * No allocation beyond what pivotEngine does; SSR-safe; no side effects.
 */
export class CpuComputeEngine<TData extends RowData = RowData>
  implements ComputeEngine<TData>
{
  readonly kind = "cpu" as const;

  isAvailable(): boolean {
    return true;
  }

  execute(request: ComputeRequest<TData>): ComputeResult<TData> {
    return createPivotEngineResult({
      data: request.data,
      rowGroupBy: request.rowGroupBy,
      columnGroupBy: request.columnGroupBy,
      values: request.values,
      aggregationFns: request.aggregationFns,
    });
  }

  destroy(): void {}
}
