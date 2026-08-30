/**
 * Dedicated Worker entry — runs ComputeEngine (CPU or WebGPU fallback) off main thread.
 * Usage: new Worker(new URL('./compute.worker.ts', import.meta.url), { type: 'module' })
 *
 * Note: Vitest/Node without Worker will not load this module; controller guards isWorkerAvailable().
 */

import type { ComputeWorkerRequest, ComputeWorkerResponse } from "./protocol";
import { CpuComputeEngine } from "../cpuEngine";
// GpuComputeEngine is lazy-imported only if available, to keep Worker bundle small.
// For Phase 6 we use CPU only inside Worker; GPU will be added after Phase 5b validation.

const cpu = new CpuComputeEngine();

self.onmessage = async (e: MessageEvent<ComputeWorkerRequest>) => {
  const req = e.data;
  const t0 = performance.now();
  try {
    // Basic validation (security)
    if (!req || typeof req.id !== "number" || !req.payload) {
      const err: ComputeWorkerResponse = { id: (req as { id?: number })?.id ?? -1, ok: false, error: "Invalid request shape" };
      (self as unknown as { postMessage: (m: unknown) => void }).postMessage(err);
      return;
    }

    if (req.payload.data.length > 5_000_000) {
      const err: ComputeWorkerResponse = { id: req.id, ok: false, error: "Dataset too large", code: "TOO_LARGE" };
      (self as unknown as { postMessage: (m: unknown) => void }).postMessage(err);
      return;
    }

    const computeStart = performance.now();
    const result = cpu.execute(req.payload) as Awaited<ReturnType<typeof cpu.execute>>;
    const computeMs = performance.now() - computeStart;
    const totalMs = performance.now() - t0;

    const response: ComputeWorkerResponse = {
      id: req.id,
      ok: true,
      result,
      timings: { transferMs: 0, computeMs, totalMs },
    };
    (self as unknown as { postMessage: (m: unknown) => void }).postMessage(response);
  } catch (err) {
    const response: ComputeWorkerResponse = {
      id: (e.data as { id?: number })?.id ?? -1,
      ok: false,
      error: (err as Error)?.message ?? String(err),
    };
    (self as unknown as { postMessage: (m: unknown) => void }).postMessage(response);
  }
};

export {};
