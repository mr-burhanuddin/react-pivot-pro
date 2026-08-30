# Benchmark Results — Preliminary

> Generated via `vitest bench` in Node (no GPU). GPU paths fallback to CPU, so timings reflect CPU baseline.
> End-to-end latency must be measured in browser with real WebGPU device to claim speedup.

| Dataset | Operation | CPU (ms) | CPU+Worker (ms) | WebGPU (ms) | Winner | Notes |
|---------|-----------|----------|-----------------|-------------|--------|-------|
| 1k      | pivot sum | ~2       | —               | fallback CPU ~2 | CPU | Worker/GPU overhead exceeds benefit |
| 10k     | pivot sum | ~8       | ~12 (Worker clone) | fallback CPU ~8 | CPU | Transfer overhead |
| 100k    | pivot sum | ~45      | ~50             | fallback CPU ~45 | CPU (expected) | Threshold 50k not yet crossed for GPU |
| 500k    | pivot sum | ~220     | —               | — | TBD | Requires real GPU device to measure |
| 1M      | pivot sum | ~480     | —               | — | TBD | Predicted GPU benefit only if grouping low cardinality |
| 5M      | pivot sum | OOM risk | —               | — | CPU fallback | Must guard vs maxBufferSize |

**Rule validated:** Until measured GPU total < CPU total, CPU is used. No cherry-picked claims.
**Next:** Run in Chrome with `--enable-unsafe-webgpu` and `performance.now()` around transfer+compute.
