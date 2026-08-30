# WebGPU Compute Architecture — React Pivot Pro

> Status: PHASE 0 audit complete, pre-implementation. All claims backed by repository evidence at `src/` (commit 0f2e68b). Unresolved questions marked 🔍.
> Location: `.ai/docs/internal/webgpu-architecture.md` (canonical). Mirror at `docs/internal/webgpu-architecture.md` if `docs/` re-created.

---

## 1. Current Architecture

### 1.1 High-level (evidence: `src/core/usePivotTable.ts:171-439`, `src/store/pivotTableStore.ts:31-52`, `.ai/docs/02-architecture.md`)

```
Consumer (data: TData[], columns: ColumnDef[], plugins: PivotTablePlugin[])
  → usePivotTable()
    → normalizeColumns()               // id dedup, valid pattern, 128 truncate
    → buildCoreRowModel()              // O(n·m) projection: values[ col.id ] = accessor(row)
    → createPivotTableStore(initial)   // Zustand vanilla store {state,setState,resetState}
    → mergeStates(internal, controlled)// controlled precedence
    → plugin pipeline (insertion order) // transformRows → transformColumns, 2-level cache
  → { columns, rowModel, state, setState, getCoreRowModel, registerPlugin… }
  → consumer renders rows/columns
  → useVirtualRows / useVirtualColumns ( @tanstack/virtual-core isolated, horizontal:false/true )
```

### 1.2 Layers

```
types (leaf) ← utils (pure) ← store (zustand) ← core (hook+engine) ← plugins (independent) ← hooks (adapter)
```

No circular deps. Plugins never import each other. `src/index.ts` barrel + 9 subpath exports (`package.json:31-96`, `tsup.config.ts:4-17`).

### 1.3 Data representation today

- `RowData = Record<string,unknown>` (`src/types/table.ts:6`)
- `ColumnDef` may have `accessorKey: Extract<keyof TData,string>` or `accessorFn: (row,index)=>unknown` (`src/types/column.ts:3-14`)
- `Row` = `{ id:string, index:number, original:TData, values:Record<string,unknown>, getValue():TValue|undefined, meta?:RowMeta }` (`src/types/row.ts:9-16`)
- `values` materialized once in `buildCoreRowModel` (`src/core/usePivotTable.ts:117-139`) via `getValueByAccessorKey` (`src/utils/accessorHelpers.ts:10-26`, `isSafeKey` guards `__proto__`)
- `PivotEngineResult` = `{ rowTree, rowHeaders:string[][], columnHeaders:PivotColumnHeader[], matrix:PivotCell[], matrixByRowKey, grandTotals }` (`src/core/pivotEngine.ts:41-48`)
- Aggregation inputs: legacy `legacyAggregationFns` (`src/utils/aggregationFns.ts:23-74`) and plugin `aggregators.ts:163-176` (12 fns) both operate on `unknown[]`→`number|null`, with `toNumber` (`aggregators.ts:3-7`) and `toFiniteNumbers` (`aggregationFns.ts:8-21`) divergences (Infinity handling, empty-set returns).

### 1.4 State

- `TableState { sorting, filters, columnVisibility, rowSelection, expanded }` (`src/types/state.ts:26-32`) + per-plugin slices via `getInitialState` (`pluginRegistry.ts:119-174` overlaps: `pivot↔grouping`, `columnOrdering↔dndColumn`)
- Store `shallowEqualState` bail-out (`src/store/pivotTableStore.ts:21-29`); `stableSetState` → `onStateChange` → `pluginCache.clear()` + `setStateVersion++` (`usePivotTable.ts:227-243`)
- Caching: pipeline `Map<string,PluginCacheEntry>` keyed `plugin_${name}_v${pluginVersion}` (`usePivotTable.ts:365,410`) + per-plugin closures (e.g. `sorting: {rows,sorting,result}`, `filtering: {rows,filterableIds,filters,globalFilter,result}`)

### 1.5 React

- All pipeline ops synchronous on main thread; `useDeepCompareMemo` JSON-stringifies deps (`usePivotTable.ts:156`) — render-blocking for large deps.
- No memoization of `data/columns/plugins` inside library — consumer must provide stable refs.
- Virtualization isolated via `useIsomorphicLayoutEffect` (`useVirtualRows.ts:56-57`, clipboard/export guards `typeof window/document`).

### 1.6 Package

- `package.json:1.1.4`, `type:module`, `sideEffects:false`, `files:["dist"]`, `exports: "." + 9 plugin subpaths + hooks/store/utils` (aggregation subpath missing despite `src/plugins/aggregation/` existing — filed as doc fix)
- `tsup.config.ts` 13 entries, `format:['esm','cjs']`, `minify:true`, `dts:true`, `splitting:false`
- `dist/` 269K (esm 40K + cjs 41K), `npm pack --dry-run` 51.2kB tarball, `docs-site` Vite build separate.
- Tests: only `src/plugins/aggregation/__tests__/{aggregators,aggregationPlugin}.test.ts` (vitest, no config file); no benchmarks/workers/WebGPU code.

---

## 2. Current Bottlenecks (measured or evidence-backed)

> No runtime benchmarks yet — bottlenecks inferred from code complexity; must be validated in Phase 10 with 1k-5M rows.

| Area | Code location | Complexity | Why bottleneck |
|------|---------------|------------|----------------|
| **Pivot matrix** (`R×C×V` + bucket + per-cell aggregation) | `pivotEngine.ts:182-231` (`O(n·(R+C))` bucket + `O(R·C·V)` aggregation) + `pivot.ts:146-179` | `R=rowHeader uniq`, `C=colHeader uniq`, `V=values.length` | Cartesian product × `aggregateRows` per cell (`rows.map(accessor)` + `resolveAggregationFn`) recreates arrays per cell; `toPathValue` `JSON.stringify` for objects (`pivotEngine.ts:95`) per row. Top candidate. |
| **Grouping tree** | `grouping.ts:68-161` (`buildGroupedTree O(n·d)` + `flatten`) | `d=grouping.length` | Map grouping per depth, recursive `Array.from(...).map`, synthesizes `groupRow` objects with `__group, __depth…`; high cardinality → many groups + many `group::path` strings. |
| **Aggregation per column** | `aggregationPlugin.ts:25-42` (`O(C·n)` grand totals) + `aggregators.ts:9-150` + per-group subtotals | `C=columnAggregators keys` | Re-allocates `rows.map(row=>values[colId])` per column, `JSON.stringify` cache key (`aggregationPlugin.ts:174`) per row transform; `median` `O(n log n)` sort (`aggregators.ts:67`), `variance` double-pass. |
| **Core projection** | `usePivotTable.ts:91-148` (`O(n·m)`) | `n` rows × `m` cols | Double loop `columnAccessors` + per-cell `accessorFn`/`getValueByAccessorKey` (split by `.` each call). |
| **Sorting** | `sorting.ts:107-134` (`O(k·n)` fill + `O(n log n·k)` sort) | `k` sort rules | `Int32Array` index sort still main-thread; `comparePrimitives` includes `String.localeCompare` + `Date/Boolean` branches. |
| **Filtering** | `filtering.ts:244-368` (`O(n·f)`) | `f` active filters | `applyColumnFilter` dispatch per row×filter plus regex/string lowercasing; `globalFilter` scans `filterableIds`. |
| **Deep-compare memo** | `usePivotTable.ts:150-169` (`JSON.stringify` per deps) | — | Serializes deps on every render; non-canonical keys, extra cost for large `state`. |

**Not bottlenecks (evidence: O(c) or trivial):** column ordering/pinning (`O(c)` single pass), pinning meta injection, DnD `reorderByIds` early-exit when empty, CSV/export, clipboard.

**Actual bottleneck ranking requires benchmarks** — cannot assume pivot > sort for every workload (e.g., filtered small pivot vs large unfiltered sort).

---

## 3. Proposed Architecture (preserve API)

```
                         React Application
                                │
                                ▼
                       usePivotTable({ data, columns, plugins, compute?: ComputeConfig })
                                │
                                ▼
                         Pivot Engine (unchanged public shape)
                                │
                                ▼
                         Compute Engine  ← new internal layer, replaceable
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
             CPU             WebGPU             Server (existing PivotServerAdapter)
              │                 │                 │
              ▼                 ▼                 ▼
        CpuCompute        GpuCompute        ServerCompute  (adapter.execute)
              │                 │                 │
              └─────────────────┼─────────────────┘
                                │
                                ▼
                         PivotResult (same RowModel shape)
                                │
                                ▼
                       Existing Table Model
                                │
                                ▼
                   Virtualized Rendering (unchanged)
```

**Invariants (NON-NEGOTIABLE per MASTER LOOP §§3,22-23):**

- `src/index.ts` public API stays compatible; new `compute` config is optional, defaults to CPU-compatible behavior.
- No `navigator.gpu` at module scope; SSR (`tsc --noEmit`, Node, Vitest) must not touch GPU.
- Tree-shaking preserved (`sideEffects:false`); WebGPU code not forced into core bundle (dynamic import or separate entry, validated).
- `dist/` stays ESM+CJS; strict TypeScript stays.
- Rendering stays React + `@tanstack/virtual-core`; WebGPU only computes, never renders.

---

## 4. CPU Compute Path

### 4.1 Role

- Baseline, reference implementation; all other paths tested against it for correctness within floating tolerance.
- Used for: small datasets, SSR/Node/test, disabled/unsupported WebGPU, init failures, unsupported ops, dev fallback.

### 4.2 Implementation sketch (derived from current engine, not speculative)

```ts
// internal/compute/types.ts
interface ComputeRequest {
  data: RowData[];                 // or normalized typed arrays (see §8)
  rowGroupBy: PivotGroupByDef[];   // as in pivotEngine.ts:9
  columnGroupBy: PivotGroupByDef[];
  values: PivotValueDef[];
  filters?: ColumnFilter[];        // future: if filtering offloaded
  aggregationFns?: Record<string, LegacyAggregationFn>;
  dataVersion?: number;            // for caching, see §10
}
interface ComputeResult extends PivotEngineResult {} // reuse

interface ComputeEngine {
  readonly kind: 'cpu' | 'webgpu' | 'server';
  readonly isAvailable(): boolean;            // sync, no side effects
  execute(req: ComputeRequest): Promise<ComputeResult> | ComputeResult; // sync for CPU, async for GPU/server
  destroy?(): void;
}
```

`CpuComputeEngine` simply calls `createPivotEngineResult(req)` (`pivotEngine.ts:160`) and `computeGrandTotals` etc., already pure synchronous. It will be the test oracle for `toNumber` vs `toFiniteNumbers` divergences (document which is canonical — currently `aggregators.ts` is new plugin; `aggregationFns.ts` is legacy pivot).

### 4.3 Guarantees

- Identical results to today for all inputs (including null/undefined/NaN/Infinity, empty, object keys). Treat legacy divergence (`sum 0 vs null`, `avg 0 vs null`, `median Infinity handling`) as open 🔍: pick one canonical behavior, document, add migration note.

---

## 5. Worker Compute Path

### 5.1 Motivation

Off-main-thread for any engine (CPU or WebGPU) to keep UI responsive for 100k+ rows; transfers amortized via Transferables.

### 5.2 Architecture

```
React Main Thread
  → ComputeController (selects engine, versions, cancellation)
    → Worker (dedicated, lazy-created)
      → ComputeEngine (CpuCompute or GpuCompute)
```

- Worker not owning React state; communicates via typed `protocol.ts`:
  ```ts
  type ComputeWorkerRequest = { id:number, op:'pivot'|'aggregate'|'filter', payload:ComputeRequest, transfer?: ArrayBuffer[] };
  type ComputeWorkerResponse = { id:number, ok:true, result:ComputeResult, timings:{ transfer, compute } } | { id:number, ok:false, error:string };
  ```
- Transferables: send `ArrayBuffer`s of typed arrays (see §8) via `postMessage(msg, transferList)` to avoid cloning millions of objects.
- Lazy creation: `new Worker(url, {type:'module'})` only when `compute.worker:true` and dataset exceeds threshold or user opts in.

### 5.3 Cancellation / stale-result policy

- Each compute gets monotonic `requestId`; main thread only applies `response.id === latestId`. Older results dropped.
- Alternatively `AbortController` per request. Worker may `terminate()` + recreate on rapid filtering (see `filtering.ts` rapid changes). Document worst-case: queue depth → drop intermediate.

### 5.4 SSR / Node

- Worker path disabled when `typeof Worker === 'undefined'`; fallback CPU on main thread.

🔍 Unresolved: pool vs single Worker; reuse vs terminate for memory; `SharedArrayBuffer` not assumed.

---

## 6. WebGPU Compute Path

### 6.1 Detection (see §10)

- SSR-safe function `isWebGPUAvailable(): boolean` checking `typeof navigator !== 'undefined' && !!navigator.gpu` lazily, never at import.
- Full capability requires async `navigator.gpu.requestAdapter()` + `adapter.requestDevice()` — done lazily on first needed compute, not before.

### 6.2 Init lifecycle (lazy)

```
request → isWebGPUAvailable()? NO → CPU
                          YES → getOrCreateDevice() [cached promise, single flight]
                                → adapter?
                                  device?
                                  shader compilation?
                                success → GPU
                                failure (no adapter/device, compile error, device lost, buffer OOM) → CPU fallback + warn if debug
```

- Device cached, handles `device.lost` → reset, next request falls back then retries.
- All failures non-fatal; table continues CPU.

### 6.3 Scope (start minimal)

- Only GPU-accelerate operations where end-to-end win proven (see §12). Start with **aggregation reduction**: `SUM, COUNT, MIN, MAX, AVG` (AVG = sum+count double-buffer). Median/variance deferred (sort, multi-pass).
- Data flow for million+ rows:
  ```
  Raw TData[] → categorical encoding → typed arrays → GPU buffers → compute pipeline (one dispatch)
    → small result buffer (per-group aggregates) → readback → CPU → RowModel
  ```
  Minimize CPU↔GPU transfers: encode once, reuse across computes with versioning; return only aggregated results, not whole rows.

### 6.4 Correctness hazards

- No assumption `multiple invocations + same cell = safe`. Use WGSL `atomic` (`atomicAdd`, `atomicMax/Min` for integers, compare-exchange for float min/max) with care. For `SUM` on Float, current browsers lack `atomicAdd<f32>` in core (requires extension); fallback to CPU for non-integer sums or use two-phase reduction (workgroup shared reduction → single atomic per workgroup) rather than naive per-element atomics. Document limitation.

🔍 Unresolved: exact atomics support matrix across Chrome/Firefox/Safari; whether to start with integer-cents path to allow `atomicAdd<u32>`.

---

## 7. Server Compute Path

- Reuses existing `PivotServerAdapter` (`pivotEngine.ts:56-58`); `ServerComputeEngine` wraps `adapter.execute(req)` (`pivot.ts:271-280`).
- Selection: when `compute.mode === 'server'` or adapter provided and threshold says offload; Server path never blocks UI (already async).
- Data contract for server: same `PivotEngineRequest` shape; for Worker→Server, avoid double JSON stringify — send typed arrays then server encodes.

---

## 8. Data Representation

### 8.1 Today

`{ country:"India", department:"Engineering", revenue:50000 }` as `unknown` values accessed per-cell via `accessorKey` split on `'.'` (`accessorHelpers.ts:14`).

### 8.2 Proposed normalized

- Encode categorical dimensions to dense ids:
  ```
  India → 0, USA → 1, Germany → 2  (per-column dictionary, persisted with dataVersion)
  countryId: Uint32Array(n), departmentId: Uint32Array(n)
  ```
- Numeric measures: choose typed array per required precision:
  - `Float32Array` — general, memory-halved but less precise for financial
  - `Float64Array` — higher precision, needed if `revenue` requires cents exactness
  - Integer cents (`Int32Array` of *100) — exact for currency within ±21M/100 range; overflow risk outside.
  Decision: 🔍 benchmark: financial values → `Float64Array` or integer cents with documented `MAX_SAFE_INTEGER` check; for non-financial, `Float32Array` acceptable. Default CPU path stays `number` (f64); GPU path will document choice and fallback to CPU when undecided/overflow.

### 8.3 Null / missing

- Preserve current sentinels `toPathValue` `'__null__'/'__undefined'` only for pivot grouping keys; for typed arrays: separate validity mask `Uint8Array` or sentinel value (e.g., `NaN` for Float, `0xFFFFFFFF` for Uint). Decide: 🔍 per-column validity bitmap vs sentinel, measured cost. Must handle `NaN/Infinity` per `aggregators.ts:toNumber` (currently allows `Infinity` — GPU must match or document divergence).

---

## 9. GPU Data Contract

### 9.1 Layout (explicit, documented)

```
field  | typed array | GPU buffer | type  | offset | stride | rows
-------|-------------|------------|-------|--------|--------|-----
countryId | Uint32Array(n) | storage | u32 | 0   | 4  | n
departmentId| Uint32Array(n)| storage| u32 | n*4| 4  | n
revenue   | Float64Array(n) or Uint32(cents) | storage | f32/f64/u32 | … | … | n
validMask | Uint8Array(n) | storage | u8  | … | 1 | n (if present)
groupKey  | (derived)     | storage | u32 | … | 4 | n
result[groups] | Float32/64 | storage+read | f32/f64 | 0 | 4/8 | groups
```

- Alignment: `f64` requires 8-byte; WebGPU `storage` buffer limits check `device.limits.maxStorageBufferBindingSize`. Document offsets, `arrayStride`, `workgroupSize` (e.g., 64/128/256, tuned).
- Dimensions: `rowCount`, `columnCount`, `groupCount`, `aggregationId`.
- Types frozen in `internal/compute/gpuTypes.ts`.

### 9.2 Transfer

- `ArrayBuffer` transferables for zero-copy to Worker; GPU buffers created via `device.createBuffer({mappedAtCreation:true, usage: STORAGE|COPY_SRC|COPY_DST})` with `bytes: arr.byteLength`.

🔍 Unresolved: `Float64` WGSL support (`enable f16` etc.); if unavailable, downgrade to `f32` and document error bound.

---

## 10. API Design (minimal public surface)

### 10.1 Public config (tentative, subject to audit)

```ts
// src/types/compute.ts (new)
type ComputeMode = 'auto' | 'cpu' | 'webgpu' | 'server';
interface ComputeConfig {
  mode?: ComputeMode;            // default 'auto' (today: behaves as 'cpu' for compat)
  worker?: boolean | 'auto';     // default 'auto' (= true when large & Worker available)
  webgpu?: boolean;              // explicit opt-in/out, default derived from mode
  threshold?: number;            // dataset size above which GPU/Worker considered (benchmarked default, e.g., 50_000)
  debug?: boolean;              // logs mode selection + timings (opt-in)
}
interface PivotTableOptions { compute?: ComputeConfig; adapter?: PivotServerAdapter }
```

- Simplicity: `usePivotTable({ data, columns })` unchanged; advanced `compute: { mode:'auto' }` opt-in.
- Do not expose `GPUDevice/Buffer/Adapter` publicly.

### 10.2 Tree-shaking

- WebGPU/Worker code in `src/compute/worker/` + `src/compute/gpu/` as separate tsup entries (`compute/worker`, `compute/gpu`, `compute/index`) or lazy `import()` from `src/index.ts` only when `compute.mode !== 'cpu'`. Bundle inspected post-build (see §13).

---

## 11. Fallback Strategy

```
WebGPU unavailable → CPU (main or Worker-CPU)
WebGPU init fail (adapter/device/compile/OOM/device lost) → CPU
Unsupported op (e.g., median) → CPU for that op; other ops may still GPU
Worker unavailable → main-thread CPU/GPU (if GPU available without Worker, still allowed)
SSR/Node/test → CPU (main)
Any GPU error must not crash table → log if debug, fallback, table renders stale or CPU result
```

- Graceful degradation per-operation, not all-or-nothing.
- Forced `compute.mode:'cpu'` always honoured.

---

## 12. SSR Strategy

- Never `navigator`/`window`/`GPU*` at module top-level. All detection inside functions (`isWebGPUAvailable`, `isWorkerAvailable`, `getOrCreateDevice`).
- Tests: `npx tsc --noEmit` in Node must pass; Vitest (`jsdom` or node) must pass without `navigator.gpu`; build `dist/` must not contain `navigator.gpu` at top-scope (grep check in Final Cleanup).
- SSR renders with CPU only; hydration may upgrade to GPU on client after first interactive compute.

---

## 13. Performance Strategy

### 13.1 What we will measure (end-to-end, not shader-only)

- `initTime` (adapter/device/createPipeline), `transferTime` (CPU→GPU, GPU→CPU), `computeTime` (GPU dispatch + readback), `totalLatency`, `memory` (buffer sizes), UI responsiveness (main-thread blocked time), `throughput`.

### 13.2 Datasets (minimum)

`1k, 10k, 100k, 500k, 1M, 5M` rows × representative configs (different `R×C×V`). Benchmark harness in `benchmarks/` or Vitest bench.

### 13.3 Rule

WebGPU wins only if `totalLatency(GPU) < totalLatency(CPU)` for that workload. Example where it loses:

```
GPU compute 2 ms + transfer 40 ms + readback 20 ms = 62 ms  vs  CPU 25 ms → use CPU
```

Auto threshold derived from measured crossover, not invented (benchmark → config `threshold` default, e.g., ~100k for simple SUM but may be 500k for MIN/MAX across many groups). Document: GPU not always faster.

---

## 14. Fallback to CPU for now — known correct

- `CpuComputeEngine` is oracle; `compareResults(cpu, gpu, tolerance)` for floats uses relative epsilon (e.g., 1e-6 for f32 vs f64).
- For financial exactness, tolerance is 0; GPU path limited to integer-cents or f64.

---

## 15. Testing Strategy

### 15.1 New tests (strict TypeScript, run with `npm run test:run`)

- **Correctness:** `CPU vs WebGPU` for each aggregation (`SUM/COUNT/MIN/MAX/AVG`) over random datasets, same `ComputeRequest` → `expect(gpu).toEqualWithTolerance(cpu)`; also pivot/grouping end-to-end.
- **Edge cases (§37):** empty, single row/col, null/undefined, NaN, Infinity, -0, negative, large (1e12), duplicate groups, high cardinality (>10k groups), rapid filter/pivot updates, worker termination/error, GPU init failure, device loss, unsupported browser.
- **Regression:** full existing suite (`sorting, filtering, grouping, pivot, columnOrdering/Pinning, virtualization, rowSelection, state`) must stay green; vitest run before declaring phase complete.

### 15.2 Environments

- Node (no GPU) → CPU path only
- Browser (real GPU) — manual + CI with `chrome --enable-unsafe-webgpu` flag if available
- `navigator.gpu` mocked tests for detection/init.

---

## 16. Security Considerations (GPU-specific)

- Validate `data.length` and `groupCount` before buffer alloc; guard against maliciously large allocations (DoS) vs `device.limits.maxStorageBufferBindingSize` and `maxBufferSize` — clamp and fallback to CPU with error if exceeds.
- Shader inputs: validate workgroup size, `dispatchWorkgroups` bounds to avoid runaway; no user-supplied WGSL.
- Data trust: validate Worker messages shape, types, `id` monotonic, buffer lengths match `rowCount`; reject malformed/oversized messages.
- Null/NaN/Infinity: sanitize `Infinity` propagation (currently allowed) — GPU must not overflow to `Infinity` silently for integer paths.
- Device loss: `device.lost.then(...)` → reset state, cancel pending computes, fallback.
- No secrets in GPU buffers (still sensitive — clear buffers on destroy).

---

## 17. Package-Size Considerations

- Goal: no size increase for users not opting into GPU. Strategy: separate entries (`src/compute/gpu/shaders.ts`, `worker.ts`) loaded via `import('./compute/gpu.js')` or `new Worker(new URL('./compute/worker.ts', import.meta.url))`; `sideEffects:false` preserved, `dist/` inspected via `npm pack --dry-run`.
- Measure before/after `dist/index.js` and tarball; budget: ≤ 5-8 kB gz extra for core+auto logic, GPU kernels tree-shaken unless `compute.mode` !== 'cpu'. Document actual sizes.
- `src/index.ts` re-exports minimal: `type ComputeMode` + maybe `isWebGPUAvailable` for debug; do not expose `GPUDevice/Buffer`.

---

## 18. Unresolved Questions (must answer before completing relevant phase)

- [ ] Canonical aggregation null/empty semantics (`toNumber` Infinity handling, `sum 0 vs null`, `avg 0 vs null`) — PHASE 2/3
- [ ] Financial precision: `f64` vs integer cents vs `f32` — document, benchmark error — PHASE 3
- [ ] Typed-array per column vs single interleaved buffer — PHASE 3
- [ ] Validity mask vs sentinel — PHASE 3
- [ ] `Float64` WGSL support matrix — PHASE 5
- [ ] Atomic strategy for f32 SUM — reduction vs atomics, perf — PHASE 5
- [ ] Worker pool vs single Worker lifecycle — PHASE 6
- [ ] Auto threshold value (measured crossover) — PHASE 7/10
- [ ] Cache key: WeakMap vs version counter vs explicit `dataId` — PHASE 9 (existing `dataVersion` leverage)
- [ ] Which plugins to GPU-accelerate beyond pivot/aggregate (filter/sort/group?) — PHASE 8 (audit says pivot/aggregate highest value)
- [ ] Device limit / OOM handling policy — PHASE 4
- [ ] Documentation site IA for compute — PHASE 12

Evidence stitched from: `src/core/pivotEngine.ts`, `usePivotTable.ts`, `types/*`, `plugins/*`, `store/*`, `hooks/*`, `utils/*`, `package.json`, `tsup.config.ts`, `tsconfig.json`, `dist/`/`npm pack --dry-run`, `docs-site/` inventory.

