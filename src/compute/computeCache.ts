import type { ComputeRequest, ComputeResult } from "./types";
import type { RowData } from "../types/rowData";

/**
 * Explicit version-based cache for compute results.
 * Key = dataVersion + groupBy/value ids + n (not data contents) — avoids hashing million rows.
 * Must bump dataVersion when data content changes; with dataVersion 0 (default when omitted)
 * two distinct datasets with same length/grouping will collide — caller must provide version for correctness.
 * Invalidation is explicit via dataVersion increment (usePivotTable dataVersion) or config change.
 */

export class ComputeCache<TData extends RowData = RowData> {
  private map = new Map<string, ComputeResult<TData>>();

  private key(req: ComputeRequest<TData>): string {
    const rg = req.rowGroupBy.map((g) => g.id).join(",");
    const cg = req.columnGroupBy.map((g) => g.id).join(",");
    const vals = req.values.map((v) => `${v.id}:${String(v.aggregation ?? "sum")}`).join(",");
    return `${req.dataVersion ?? 0}|rg:${rg}|cg:${cg}|vals:${vals}|n:${req.data.length}`;
  }

  get(req: ComputeRequest<TData>): ComputeResult<TData> | undefined {
    return this.map.get(this.key(req));
  }

  set(req: ComputeRequest<TData>, result: ComputeResult<TData>): void {
    this.map.set(this.key(req), result);
    // simple LRU cap
    if (this.map.size > 64) {
      const first = this.map.keys().next().value as string | undefined;
      if (first) this.map.delete(first);
    }
  }

  clear(): void {
    this.map.clear();
  }

  size(): number {
    return this.map.size;
  }
}
