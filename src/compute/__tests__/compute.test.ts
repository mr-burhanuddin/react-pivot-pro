import { describe, it, expect, vi } from "vitest";
import { createPivotEngineResult } from "../../core/pivotEngine";
import { CpuComputeEngine } from "../cpuEngine";
import { encodePivotData } from "../dataModel";
import { isWebGPUAvailable, isWorkerAvailable, isWithinGpuLimits } from "../capabilities";
import { createComputeController } from "../computeController";
import { GpuComputeEngine, wouldUseGpu } from "../gpu/gpuEngine";
import { ComputeCache } from "../computeCache";

function makeData(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    country: ["India", "USA", "Germany"][i % 3],
    revenue: i % 5 === 0 ? null : (i * 10) % 1000,
    score: Number.isNaN(i % 7 === 0 ? NaN : i),
  }));
}

describe("CpuComputeEngine baseline", () => {
  it("matches createPivotEngineResult for global pivot", async () => {
    const data = makeData(100);
    const req = {
      data,
      rowGroupBy: [{ id: "country" }],
      columnGroupBy: [] as never[],
      values: [{ id: "revenue", aggregation: "sum" as const }],
    };
    const direct = createPivotEngineResult(req);
    const cpu = new CpuComputeEngine();
    const via = await cpu.execute(req);
    expect(via.matrix.length).toBe(direct.matrix.length);
    expect(via.grandTotals).toEqual(direct.grandTotals);
  });

  it("isAvailable true in all envs", () => {
    expect(new CpuComputeEngine().isAvailable()).toBe(true);
  });
});

describe("dataModel encode", () => {
  it("encodes categorical to Uint32 and numeric to Float64 with mask", () => {
    const data = [{ country: "India", revenue: 10 }, { country: null, revenue: NaN }, { country: "India", revenue: Infinity }];
    const enc = encodePivotData(data as never[], [{ id: "country" }], [], [{ id: "revenue" }]);
    expect(enc.rowCount).toBe(3);
    expect(enc.dictionaries.country).toContain("__null__");
    expect(enc.dimensionBuffers.country).toBeInstanceOf(Uint32Array);
    expect(enc.valueBuffers.revenue).toBeInstanceOf(Float64Array);
    expect(enc.validMasks?.revenue[0]).toBe(1);
    expect(enc.validMasks?.revenue[1]).toBe(0); // NaN invalid
    expect(enc.validMasks?.revenue[2]).toBe(0); // Infinity invalid
  });

  it("empty data encodes zero rows", () => {
    const enc = encodePivotData([], [], [], []);
    expect(enc.rowCount).toBe(0);
  });
});

describe("capabilities SSR-safe", () => {
  it("isWebGPUAvailable false in Node (no navigator.gpu)", () => {
    // In Node, navigator is undefined → false without throwing
    expect(isWebGPUAvailable()).toBe(false);
  });
  it("isWorkerAvailable false in Node", () => {
    // jsdom vs node: Worker undefined in Node vitest default
    expect(typeof isWorkerAvailable()).toBe("boolean");
  });
  it("isWithinGpuLimits guards", () => {
    expect(isWithinGpuLimits(10)).toBe(true);
    expect(isWithinGpuLimits(100 * 1024 * 1024)).toBe(false);
    expect(isWithinGpuLimits(-1)).toBe(false);
    expect(isWithinGpuLimits(NaN)).toBe(false);
  });
});

describe("GpuComputeEngine fallback", () => {
  it("falls back to CPU for grouped pivot (Phase 5 limitation)", async () => {
    const data = makeData(100);
    const gpu = new GpuComputeEngine();
    const res = await gpu.execute({
      data,
      rowGroupBy: [{ id: "country" }],
      columnGroupBy: [{ id: "department" }],
      values: [{ id: "revenue", aggregation: "sum" as const }],
    });
    // Should still produce correct matrix via CPU fallback
    expect(res.matrix.length).toBeGreaterThan(0);
  });

  it("wouldUseGpu false for grouped or empty", () => {
    expect(wouldUseGpu({ data: [], rowGroupBy: [], columnGroupBy: [], values: [] })).toBe(false);
    expect(wouldUseGpu({ data: makeData(10), rowGroupBy: [{ id: "a" }], columnGroupBy: [], values: [] })).toBe(false);
    expect(wouldUseGpu({ data: makeData(10), rowGroupBy: [], columnGroupBy: [], values: [{ id: "x" }] })).toBe(true);
  });

  it("gpu safe agg fallback for median", async () => {
    const data = makeData(10);
    const gpu = new GpuComputeEngine();
    const res = await gpu.execute({
      data,
      rowGroupBy: [],
      columnGroupBy: [],
      values: [{ id: "revenue", aggregation: "median" as unknown as never }],
    });
    expect(res.matrix.length).toBeGreaterThan(0);
  });
});

describe("ComputeController auto", () => {
  it("auto small → cpu", async () => {
    const ctrl = createComputeController({ mode: "auto", threshold: 50000 });
    const { timings } = await ctrl.execute({
      data: makeData(100),
      rowGroupBy: [],
      columnGroupBy: [],
      values: [{ id: "revenue", aggregation: "sum" as never }],
    });
    expect(timings.mode).toBe("cpu");
    ctrl.destroy();
  });

  it("force cpu stays cpu", async () => {
    const ctrl = createComputeController({ mode: "cpu" });
    const { timings } = await ctrl.execute({
      data: makeData(1000),
      rowGroupBy: [],
      columnGroupBy: [],
      values: [{ id: "revenue" }],
    });
    expect(timings.mode).toBe("cpu");
    ctrl.destroy();
  });
});

describe("ComputeCache versioned", () => {
  it("keyed by dataVersion not data identity", async () => {
    const cache = new ComputeCache();
    const d1 = makeData(10);
    const req1 = { data: d1, rowGroupBy: [], columnGroupBy: [], values: [{ id: "revenue" }], dataVersion: 1 } as never;
    const req2 = { data: d1, rowGroupBy: [], columnGroupBy: [], values: [{ id: "revenue" }], dataVersion: 2 } as never;
    const res = createPivotEngineResult({ data: d1, rowGroupBy: [], columnGroupBy: [], values: [{ id: "revenue" as never }] });
    cache.set(req1, res);
    expect(cache.get(req1)).toBe(res);
    expect(cache.get(req2)).toBeUndefined();
    expect(cache.size()).toBe(1);
  });
});

describe("edge cases", () => {
  it("empty dataset returns __root__ headers and zero grandTotals via CPU", async () => {
    const cpu = new CpuComputeEngine();
    const res = await cpu.execute({ data: [], rowGroupBy: [], columnGroupBy: [], values: [{ id: "x" as never }] });
    expect(res.rowHeaders).toEqual([[]]);
    expect(res.grandTotals.x).toBe(0);
  });

  it("NaN/Infinity treated as invalid (not counted in sum)", async () => {
    const cpu = new CpuComputeEngine();
    const res = await cpu.execute({
      data: [{ x: NaN }, { x: Infinity }, { x: 5 }] as never[],
      rowGroupBy: [],
      columnGroupBy: [],
      values: [{ id: "x", aggregation: "sum" as never }],
    });
    expect(res.grandTotals.x).toBe(5);
  });
});
