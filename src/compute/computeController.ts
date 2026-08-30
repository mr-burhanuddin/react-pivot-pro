import type { RowData } from "../types/rowData";
import { isWebGPUAvailable, isWorkerAvailable } from "./capabilities";
import { CpuComputeEngine } from "./cpuEngine";
import { GpuComputeEngine } from "./gpu/gpuEngine";
import { WorkerClient } from "./worker/workerClient";
import { ComputeCache } from "./computeCache";
import type {
  ComputeConfig,
  ComputeMode,
  ComputeRequest,
  ComputeResult,
  ComputeTimings,
} from "./types";
import { DEFAULT_COMPUTE_MODE, DEFAULT_COMPUTE_THRESHOLD } from "./types";

export interface ComputeController<TData extends RowData = RowData> {
  execute(request: ComputeRequest<TData>): Promise<{ result: ComputeResult<TData>; timings: ComputeTimings }>;
  getLastMode(): ComputeMode;
  getLastTimings(): ComputeTimings | null;
  destroy(): void;
}

function resolveMode(
  config: ComputeConfig | undefined,
  n: number,
  gpuAvailable: boolean,
  workerAvailable: boolean,
): { mode: ComputeMode; useWorker: boolean; reason: string } {
  const mode = config?.mode ?? DEFAULT_COMPUTE_MODE;
  const threshold = config?.threshold ?? DEFAULT_COMPUTE_THRESHOLD;
  const workerOpt = config?.worker ?? "auto";
  const explicitWorker = workerOpt === true && workerAvailable;
  const autoWorker = workerOpt === "auto" && n >= threshold && workerAvailable;
  const useWorker = explicitWorker || autoWorker;

  if (mode === "cpu") return { mode: "cpu", useWorker, reason: "mode=cpu" };
  if (mode === "server") return { mode: "server", useWorker: false, reason: "mode=server" };
  if (mode === "webgpu") {
    if (gpuAvailable) return { mode: "webgpu", useWorker, reason: "mode=webgpu + gpuAvailable" };
    return { mode: "cpu", useWorker: explicitWorker, reason: "mode=webgpu fallback cpu (gpu unavailable)" };
  }
  if (n < threshold) return { mode: "cpu", useWorker: explicitWorker, reason: `auto: n=${n} < threshold=${threshold} → cpu${explicitWorker ? " + explicit worker" : ""}` };
  if (gpuAvailable) return { mode: "webgpu", useWorker, reason: `auto: n=${n} >= threshold + gpuAvailable → webgpu` };
  if (useWorker) return { mode: "cpu", useWorker: true, reason: `auto: worker cpu n=${n}` };
  return { mode: "cpu", useWorker: false, reason: "auto: cpu fallback" };
}

export function createComputeController<TData extends RowData = RowData>(
  config: ComputeConfig | undefined,
): ComputeController<TData> {
  let cpu: CpuComputeEngine<TData> | null = null;
  let gpu: GpuComputeEngine<TData> | null = null;
  let workerClient: WorkerClient<TData> | null = null;
  const getCpu = (): CpuComputeEngine<TData> => (cpu ??= new CpuComputeEngine<TData>());
  const getGpu = (): GpuComputeEngine<TData> => (gpu ??= new GpuComputeEngine<TData>({ debug: !!config?.debug }));
  const getWorker = (): WorkerClient<TData> => (workerClient ??= new WorkerClient<TData>());
  const cache = new ComputeCache<TData>();
  let lastMode: ComputeMode = config?.mode ?? DEFAULT_COMPUTE_MODE;
  let lastTimings: ComputeTimings | null = null;
  let requestId = 0;

  return {
    async execute(request: ComputeRequest<TData>) {
      const n = request.data.length;
      const hit = cache.get(request);
      if (hit) {
        lastTimings = { totalMs: 0, mode: lastMode, kind: "cache" };
        return { result: hit, timings: lastTimings };
      }

      const gpuAvailable = isWebGPUAvailable();
      const workerAvailable = isWorkerAvailable();
      const decision = resolveMode(config, n, gpuAvailable, workerAvailable);
      lastMode = decision.mode as ComputeMode;

      if (config?.debug) console.debug(`[ComputeController] ${decision.reason} useWorker=${decision.useWorker}`);

      const t0 = typeof performance !== "undefined" ? performance.now() : 0;
      let result: ComputeResult<TData>;
      let kind = "cpu";

      const tryWorker = async (): Promise<ComputeResult<TData> | null> => {
        if (!decision.useWorker || !workerAvailable) return null;
        try { return await getWorker().execute({ ...request, requestId: ++requestId }); } catch { return null; }
      };

      try {
        if (decision.mode === "webgpu") {
          const w = await tryWorker();
          if (w) { result = w; kind = "webgpu+worker"; }
          else {
            try { result = (await getGpu().execute(request)) as ComputeResult<TData>; kind = "webgpu"; }
            catch { result = (await getCpu().execute(request)) as ComputeResult<TData>; kind = "cpu-fallback"; }
          }
        } else if (decision.mode === "server") {
          result = (await getCpu().execute(request)) as ComputeResult<TData>;
          kind = "server-fallback-cpu";
        } else {
          const w = await tryWorker();
          if (w) { result = w; kind = "cpu+worker"; }
          else { result = (await getCpu().execute(request)) as ComputeResult<TData>; kind = "cpu"; }
        }
      } catch (e) {
        if (config?.debug) console.warn("[ComputeController] fallback to cpu", e);
        result = (await getCpu().execute(request)) as ComputeResult<TData>;
        kind = "cpu-fallback";
      }

      cache.set(request, result);

      const totalMs = typeof performance !== "undefined" ? performance.now() - t0 : 0;
      lastTimings = { totalMs, mode: lastMode, kind };
      return { result, timings: lastTimings };
    },

    getLastMode() {
      return lastMode;
    },

    getLastTimings() {
      return lastTimings;
    },

    destroy() {
      workerClient?.destroy();
      gpu?.destroy();
      cpu?.destroy();
    },
  };
}
