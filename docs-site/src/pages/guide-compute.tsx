import DocPage from "../components/DocPage";

export default function GuideCompute() {
  return (
    <DocPage
      title="Compute: CPU / Worker / WebGPU"
      subtitle="CPU-first architecture with optional Worker and WebGPU offload for large datasets"
    >
      <p>
        <strong>react-pivot-pro</strong> is CPU-first. WebGPU and Worker are{" "}
        <em>optional</em> adapters for large datasets. The public API stays{" "}
        <code>usePivotTable({"{"} data, columns {"}"})</code> — opt into compute
        only when needed.
      </p>

      <h2>Modes</h2>
      <pre>
        <code>{`import { usePivotTable } from "react-pivot-pro";
import type { ComputeConfig } from "react-pivot-pro/compute";

const table = usePivotTable({
  data, columns,
  compute: { mode: "auto", worker: "auto", threshold: 50000 } // all optional
});
// mode: "auto" | "cpu" | "webgpu" | "server"
// auto: <threshold → CPU, >=threshold + GPU available → WebGPU, else CPU/Worker CPU`}</code>
      </pre>

      <h2>What runs where</h2>
      <ul>
        <li>
          <strong>CPU</strong>: all ops for small data, SSR, tests, unsupported
          browsers, init failures. Reference impl{" "}
          <code>src/compute/cpuEngine.ts</code> delegates to{" "}
          <code>createPivotEngineResult</code>.
        </li>
        <li>
          <strong>Worker</strong>: off-main-thread CPU via dedicated Worker (
          <code>src/compute/worker/compute.worker.ts</code>, protocol{" "}
          <code>src/compute/worker/protocol.ts</code>). Transferables for typed
          arrays. Latest-id cancellation + <code>AbortSignal</code> support.
        </li>
        <li>
          <strong>WebGPU</strong>: global reductions (SUM/COUNT/MIN/MAX/AVG) via
          WGSL <code>src/compute/gpu/shaders.ts</code> (<code>WORKGROUP 64</code>
          ). Grouped pivot currently falls back to CPU (documented in{" "}
          <code>gpu/gpuEngine.ts</code>).
        </li>
        <li>
          <strong>Server</strong>: existing <code>PivotServerAdapter</code> via{" "}
          <code>compute.mode: "server"</code>.
        </li>
      </ul>

      <h2>SSR safety</h2>
      <p>
        No <code>navigator.gpu</code> at module scope.{" "}
        <code>isWebGPUAvailable()</code> checks <code>typeof navigator</code>{" "}
        lazily; <code>getWebGPUDevice()</code> is single-flight promise, handles{" "}
        <code>device.lost</code> → reset. Worker guarded by{" "}
        <code>typeof Worker</code>. Node tests run CPU only.
      </p>

      <h2>Data</h2>
      <p>
        Raw <code>{"{"} country: "India", revenue: 50000 {"}"}</code> →{" "}
        <code>encodePivotData</code> (<code>src/compute/dataModel.ts</code>) →
        categorical <code>Uint32Array</code> via dictionary, numeric{" "}
        <code>Float64Array</code> (financial-safe; f32 would lose &gt;16M
        precision) + <code>Uint8Array</code> valid mask (null/NaN/Infinity → 0).
        GPU contract <code>src/compute/gpuTypes.ts</code> documents offsets,
        alignment, workgroup caps.
      </p>

      <h2>Performance rule</h2>
      <p>
        WebGPU wins only if <code>total = init + transfer + compute + readback</code>{" "}
        &lt; CPU. Example losing case: GPU 2ms + 60ms transfer = 62ms vs CPU 25ms
        → use CPU. Benchmarks in <code>benchmarks/compute.bench.ts</code> for
        1k/10k/100k/500k/1M/5M.
      </p>

      <h2>Caching</h2>
      <p>
        <code>ComputeCache</code> uses <code>WeakMap</code> ref identity when{" "}
        <code>dataVersion</code> is absent to avoid collisions on same-length
        distinct datasets. <code>ComputeController</code> caches by{" "}
        <code>dataVersion | ref + groupBy + values + n</code> (LRU 64). Disable
        with <code>{"{"} cache: false {"}"}</code>.
      </p>

      <h2>Browser support</h2>
      <ul>
        <li>Chrome 113+ with WebGPU enabled: full</li>
        <li>Firefox/Safari: fallback CPU (WebGPU not yet stable)</li>
        <li>SSR/Node: CPU</li>
      </ul>

      <h2>Security</h2>
      <p>
        Validates <code>data.length</code>, buffer bytes vs{" "}
        <code>isWithinGpuLimits(64MB)</code>, <code>dispatchX</code> vs 65535,
        Worker message shape via <code>validateWorkerRequest</code>. No user
        WGSL, no device exposure. <code>AbortSignal</code> supported for Worker
        cancellation.
      </p>

      <h2>Examples</h2>
      <pre>
        <code>{`// Large dataset auto offload
const bigData = Array.from({ length: 500_000 }, (_, i) => ({ country: i%3?"India":"USA", revenue: i%1000 }));
const table = usePivotTable({ data: bigData, columns, compute: { mode: "auto", debug: true } });

// Force CPU (SSR-safe)
const smallTable = usePivotTable({ data, columns, compute: { mode: "cpu" } });

// Worker only
const workerTable = usePivotTable({ data: bigData, columns, compute: { mode: "cpu", worker: true } });`}</code>
      </pre>

      <p>
        Full architecture: <code>.ai/docs/internal/webgpu-architecture.md</code>
      </p>
    </DocPage>
  );
}
