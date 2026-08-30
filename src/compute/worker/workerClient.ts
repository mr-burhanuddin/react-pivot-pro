import { isWorkerAvailable } from "../capabilities";
import type { ComputeRequest, ComputeResult } from "../types";
import type { RowData } from "../../types/rowData";
import type { ComputeWorkerRequest, ComputeWorkerResponse } from "./protocol";

/**
 * WorkerClient — manages lazy Worker, request ids, cancellation via latest-id, and fallback.
 * Only the latest response updates state; stale results are dropped.
 */

export class WorkerClient<TData extends RowData = RowData> {
  private worker: Worker | null = null;
  private nextId = 1;
  private latestId = 0;
  private pending = new Map<number, { resolve: (r: ComputeResult<TData>) => void; reject: (e: Error) => void }>();

  isAvailable(): boolean {
    return isWorkerAvailable();
  }

  private ensureWorker(): Worker | null {
    if (!this.isAvailable()) return null;
    if (this.worker) return this.worker;
    const attach = (w: Worker): Worker => {
      w.onmessage = (e: MessageEvent<ComputeWorkerResponse<TData>>) => {
        const msg = e.data;
        const entry = this.pending.get(msg.id);
        if (!entry) return;
        this.pending.delete(msg.id);
        if (msg.id !== this.latestId) { entry.reject(new Error("stale result dropped")); return; }
        if (msg.ok) entry.resolve(msg.result);
        else entry.reject(new Error(msg.error));
      };
      w.onerror = (ev) => {
        for (const [, e] of this.pending) e.reject(new Error((ev as ErrorEvent).message ?? "Worker error"));
        this.pending.clear();
      };
      return w;
    };
    try {
      this.worker = attach(new Worker(new URL("./compute.worker.ts", import.meta.url), { type: "module" }));
      return this.worker;
    } catch {
      return null;
    }
  }

  execute(request: ComputeRequest<TData>): Promise<ComputeResult<TData>> {
    const worker = this.ensureWorker();
    if (!worker) return Promise.reject(new Error("Worker not available"));

    const id = this.nextId++;
    // Supersede any pending prior requests
    for (const [, e] of this.pending) e.reject(new Error("superseded by newer request"));
    this.pending.clear();
    this.latestId = id;

    return new Promise<ComputeResult<TData>>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
        const entry = this.pending.get(id);
        if (entry) { this.pending.delete(id); entry.reject(new Error("Worker timeout")); }
      }, 30_000);
      const done = (fn: () => void) => { if (timer) clearTimeout(timer); timer = null; fn(); };
      this.pending.set(id, {
        resolve: (r) => done(() => resolve(r)),
        reject: (e) => done(() => reject(e)),
      });
      try {
        worker.postMessage({ id, op: "pivot", payload: request } as ComputeWorkerRequest<TData>);
      } catch (e) {
        done(() => {});
        this.pending.delete(id);
        reject(e as Error);
      }
    });
  }

  destroy(): void {
    try {
      this.worker?.terminate();
    } catch {
      // ignore
    }
    this.worker = null;
    this.pending.clear();
  }
}

export function createWorkerClient<TData extends RowData = RowData>(): WorkerClient<TData> {
  return new WorkerClient<TData>();
}
