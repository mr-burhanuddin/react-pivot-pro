import { describe, it, expect } from "vitest";
import {
  sum,
  count,
  avg,
  min,
  max,
  median,
  stddev,
  variance,
  pctOfTotal,
  pctOfColumn,
  runningTotal,
  countDistinct,
} from "../aggregators";

describe("aggregation functions", () => {
  describe("sum", () => {
    it("sums an array of numbers", () => {
      expect(sum([1, 2, 3, 4, 5])).toBe(15);
    });

    it("returns null for empty array", () => {
      expect(sum([])).toBeNull();
    });

    it("handles null and undefined values", () => {
      expect(sum([1, null, 3, undefined, 5])).toBe(9);
    });

    it("handles NaN values", () => {
      expect(sum([1, NaN, 3])).toBe(4);
    });
  });

  describe("count", () => {
    it("counts all elements", () => {
      expect(count([1, 2, 3])).toBe(3);
    });

    it("counts empty array as 0", () => {
      expect(count([])).toBe(0);
    });
  });

  describe("avg", () => {
    it("calculates average", () => {
      expect(avg([2, 4, 6])).toBe(4);
    });

    it("returns null for empty array", () => {
      expect(avg([])).toBeNull();
    });

    it("ignores null values", () => {
      expect(avg([2, null, 6])).toBe(4);
    });
  });

  describe("min", () => {
    it("finds minimum value", () => {
      expect(min([5, 2, 8, 1, 9])).toBe(1);
    });

    it("returns null for empty array", () => {
      expect(min([])).toBeNull();
    });
  });

  describe("max", () => {
    it("finds maximum value", () => {
      expect(max([5, 2, 8, 1, 9])).toBe(9);
    });

    it("returns null for empty array", () => {
      expect(max([])).toBeNull();
    });
  });

  describe("median", () => {
    it("calculates median for odd length", () => {
      expect(median([3, 1, 2])).toBe(2);
    });

    it("calculates median for even length", () => {
      expect(median([1, 2, 3, 4])).toBe(2.5);
    });

    it("returns null for empty array", () => {
      expect(median([])).toBeNull();
    });
  });

  describe("variance", () => {
    it("calculates sample variance", () => {
      const result = variance([2, 4, 4, 4, 5, 5, 7, 9]);
      expect(result).toBeCloseTo(4.571, 2);
    });

    it("returns null for n=1", () => {
      expect(variance([5])).toBeNull();
    });

    it("returns null for n=0", () => {
      expect(variance([])).toBeNull();
    });
  });

  describe("stddev", () => {
    it("calculates standard deviation", () => {
      const result = stddev([2, 4, 4, 4, 5, 5, 7, 9]);
      expect(result).toBeCloseTo(Math.sqrt(4.571), 2);
    });

    it("returns null for n=1", () => {
      expect(stddev([5])).toBeNull();
    });

    it("returns null for n=0", () => {
      expect(stddev([])).toBeNull();
    });
  });

  describe("pctOfTotal", () => {
    it("returns grand total when total is non-zero", () => {
      expect(pctOfTotal([10, 20, 30])).toBe(60);
    });

    it("returns null when grand total is 0", () => {
      expect(pctOfTotal([0, 0, 0])).toBeNull();
    });

    it("returns null for empty array", () => {
      expect(pctOfTotal([])).toBeNull();
    });
  });

  describe("pctOfColumn", () => {
    it("returns 100 for non-zero values", () => {
      expect(pctOfColumn([10, 20, 30])).toBe(100);
    });

    it("returns null for empty array", () => {
      expect(pctOfColumn([])).toBeNull();
    });

    it("returns null when total is 0", () => {
      expect(pctOfColumn([0, 0, 0])).toBeNull();
    });
  });

  describe("runningTotal", () => {
    it("calculates running total", () => {
      expect(runningTotal([1, 2, 3, 4])).toBe(10);
    });

    it("returns null for empty array", () => {
      expect(runningTotal([])).toBeNull();
    });

    it("respects row sort order", () => {
      expect(runningTotal([5, 3, 1])).toBe(9);
      expect(runningTotal([1, 3, 5])).toBe(9);
    });
  });

  describe("countDistinct", () => {
    it("counts distinct values", () => {
      expect(countDistinct([1, 2, 2, 3, 3, 3])).toBe(3);
    });

    it("returns 0 for empty array", () => {
      expect(countDistinct([])).toBe(0);
    });

    it("ignores null and undefined", () => {
      expect(countDistinct([1, null, 2, undefined, 1])).toBe(2);
    });
  });
});
