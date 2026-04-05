import type { AggregationFn, AggregationFnName } from '../../types/aggregation';

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export const sum: AggregationFn = (values: unknown[]): number | null => {
  let total = 0;
  let hasValue = false;
  for (let i = 0; i < values.length; i++) {
    const n = toNumber(values[i]);
    if (n !== null) {
      total += n;
      hasValue = true;
    }
  }
  return hasValue ? total : null;
};

export const count: AggregationFn = (values: unknown[]): number => values.length;

export const avg: AggregationFn = (values: unknown[]): number | null => {
  let total = 0;
  let countVal = 0;
  for (let i = 0; i < values.length; i++) {
    const n = toNumber(values[i]);
    if (n !== null) {
      total += n;
      countVal++;
    }
  }
  return countVal > 0 ? total / countVal : null;
};

export const min: AggregationFn = (values: unknown[]): number | null => {
  let result: number | null = null;
  for (let i = 0; i < values.length; i++) {
    const n = toNumber(values[i]);
    if (n !== null && (result === null || n < result)) {
      result = n;
    }
  }
  return result;
};

export const max: AggregationFn = (values: unknown[]): number | null => {
  let result: number | null = null;
  for (let i = 0; i < values.length; i++) {
    const n = toNumber(values[i]);
    if (n !== null && (result === null || n > result)) {
      result = n;
    }
  }
  return result;
};

export const median: AggregationFn = (values: unknown[]): number | null => {
  const nums: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const n = toNumber(values[i]);
    if (n !== null) nums.push(n);
  }
  if (nums.length === 0) return null;
  nums.sort((a, b) => a - b);
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};

export const variance: AggregationFn = (values: unknown[]): number | null => {
  const nums: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const n = toNumber(values[i]);
    if (n !== null) nums.push(n);
  }
  if (nums.length <= 1) return null;
  const mean = nums.reduce((acc, v) => acc + v, 0) / nums.length;
  const sqDiffs = nums.reduce((acc, v) => acc + (v - mean) ** 2, 0);
  return sqDiffs / (nums.length - 1);
};

export const stddev: AggregationFn = (values: unknown[]): number | null => {
  const varResult = variance(values);
  return varResult !== null ? Math.sqrt(varResult) : null;
};

export const pctOfTotal: AggregationFn = (values: unknown[]): number | null => {
  let grandTotal = 0;
  for (let i = 0; i < values.length; i++) {
    const n = toNumber(values[i]);
    if (n !== null) grandTotal += n;
  }
  if (grandTotal === 0) return null;
  return grandTotal;
};

export const runningTotal: AggregationFn = (values: unknown[]): number | null => {
  let total = 0;
  for (let i = 0; i < values.length; i++) {
    const n = toNumber(values[i]);
    if (n !== null) total += n;
  }
  return values.length > 0 ? total : null;
};

export const countDistinct: AggregationFn = (values: unknown[]): number => {
  const seen = new Set<string>();
  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    if (val !== null && val !== undefined) {
      seen.add(String(val));
    }
  }
  return seen.size;
};

export const aggregationFns: Record<AggregationFnName, AggregationFn> = {
  sum,
  count,
  avg,
  min,
  max,
  median,
  stddev,
  variance,
  pctOfTotal,
  runningTotal,
  countDistinct,
};

export const AGGREGATOR_LABELS: Record<AggregationFnName, string> = {
  sum: 'Sum',
  count: 'Count',
  avg: 'Average',
  min: 'Minimum',
  max: 'Maximum',
  median: 'Median',
  stddev: 'Std Deviation',
  variance: 'Variance',
  pctOfTotal: '% of Total',
  runningTotal: 'Running Total',
  countDistinct: 'Count Distinct',
};

export function resolveAggregationFn(
  name: AggregationFnName | 'custom',
  customFns: Record<string, AggregationFn>,
  columnId: string,
): AggregationFn | null {
  if (name === 'custom') {
    return customFns[columnId] ?? null;
  }
  return aggregationFns[name] ?? null;
}
