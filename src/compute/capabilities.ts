/**
 * SSR-safe capability checks. No side effects at import time; no navigator.gpu access at module scope.
 */

export function isWebGPUAvailable(): boolean {
  if (typeof navigator === "undefined") return false;
  try {
    const maybe = navigator as unknown as { gpu?: unknown };
    return !!maybe.gpu;
  } catch {
    return false;
  }
}

export function isWorkerAvailable(): boolean {
  return typeof Worker !== "undefined";
}

type GpuDeviceLike = { destroy?: () => void; lost?: Promise<unknown> };

export async function getWebGPUDevice(): Promise<GpuDeviceLike | null> {
  if (!isWebGPUAvailable()) return null;
  try {
    const gpu = (navigator as unknown as { gpu: { requestAdapter: () => Promise<{ requestDevice: () => Promise<GpuDeviceLike> } | null> } }).gpu;
    const adapter = await gpu.requestAdapter();
    if (!adapter) return null;
    return await adapter.requestDevice();
  } catch {
    return null;
  }
}

export function resetWebGPUDevice(): void {}

/**
 * Guard that data size is within sane GPU limits.
 * WebGPU maxStorageBufferBindingSize is typically 128 MB; maxBufferSize up to 256 MB.
 * We clamp at 64 MB per buffer as safe portability default and fallback to CPU if exceeded.
 */
export function isWithinGpuLimits(byteLength: number, limitBytes = 64 * 1024 * 1024): boolean {
  if (!Number.isFinite(byteLength) || byteLength < 0) return false;
  return byteLength <= limitBytes;
}

export function isWithinWorkgroupLimits(
  dispatchX: number,
  workgroupSize = 256,
): boolean {
  // WebGPU maxComputeWorkgroupsPerDimension typically 65535
  return dispatchX >= 1 && dispatchX <= 65535 && workgroupSize >= 1 && workgroupSize <= 256;
}
