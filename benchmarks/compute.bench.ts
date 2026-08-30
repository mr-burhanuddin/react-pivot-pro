import { bench, describe } from "vitest";
import { createPivotEngineResult } from "../src/core/pivotEngine";
import { CpuComputeEngine } from "../src/compute/cpuEngine";
import { createComputeController } from "../src/compute/computeController";
import type { RowData } from "../src/types/table";

function makeData(n: number): RowData[] {
  const out: RowData[] = new Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = {
      country: ["India", "USA", "Germany"][i % 3],
      department: ["Eng", "Sales"][i % 2],
      revenue: (i % 1000) * 1.5,
    };
  }
  return out;
}

const sizes = [1_000, 10_000, 100_000];
const cpu = new CpuComputeEngine();

for (const n of sizes) {
  const data = makeData(n);
  describe(`compute n=${n}`, () => {
    bench(`CpuComputeEngine pivot`, () => {
      cpu.execute({
        data,
        rowGroupBy: [{ id: "country" }],
        columnGroupBy: [{ id: "department" }],
        values: [{ id: "revenue", aggregation: "sum" }],
      });
    });
    bench(`createPivotEngineResult direct`, () => {
      createPivotEngineResult({
        data,
        rowGroupBy: [{ id: "country" }],
        columnGroupBy: [{ id: "department" }],
        values: [{ id: "revenue", aggregation: "sum" }],
      });
    });
    bench(`ComputeController auto`, async () => {
      const ctrl = createComputeController({ mode: "auto" });
      await ctrl.execute({
        data,
        rowGroupBy: [{ id: "country" }],
        columnGroupBy: [{ id: "department" }],
        values: [{ id: "revenue", aggregation: "sum" }],
      });
      ctrl.destroy();
    });
  });
}
