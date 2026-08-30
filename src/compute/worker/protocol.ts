import type { ComputeRequest, ComputeResult } from "../types";
import type { RowData } from "../../types/rowData";

/**
 * Typed Worker protocol (structured clone + transferables).
 * No GPU objects cross the boundary — only typed arrays / plain data.
 */

export type ComputeWorkerOp = "pivot" | "aggregate";

export interface ComputeWorkerRequest<TData extends RowData = RowData> {
  id: number;
  op: ComputeWorkerOp;
  payload: ComputeRequest<TData>;
  /** Optional transfer list for ArrayBuffers (encoded typed arrays). */
  transfer?: ArrayBuffer[];
}

export interface ComputeWorkerSuccess<TData extends RowData = RowData> {
  id: number;
  ok: true;
  result: ComputeResult<TData>;
  timings: { transferMs: number; computeMs: number; totalMs: number };
}

export interface ComputeWorkerError {
  id: number;
  ok: false;
  error: string;
  code?: string;
}

export type ComputeWorkerResponse<TData extends RowData = RowData> =
  | ComputeWorkerSuccess<TData>
  | ComputeWorkerError;

export function isWorkerSuccess<TData extends RowData>(
  r: ComputeWorkerResponse<TData>,
): r is ComputeWorkerSuccess<TData> {
  return r.ok;
}

// Validation (security: do not trust Worker messages without checks — validate shape and array)
export function validateWorkerRequest(msg: unknown): msg is ComputeWorkerRequest {
  if (!msg || typeof msg !== "object") return false;
  const m = msg as Record<string, unknown>;
  const payload = m.payload as Record<string, unknown> | undefined;
  return (
    typeof m.id === "number" &&
    Number.isFinite(m.id) &&
    (m.op === "pivot" || m.op === "aggregate") &&
    !!payload &&
    Array.isArray(payload.data)
  );
}
