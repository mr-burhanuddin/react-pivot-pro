import type { RowData } from '../types';

export type AggregationFn<TData extends RowData = RowData> = (
  values: unknown[],
  rows: TData[],
) => unknown;

function toFiniteNumbers(values: unknown[]): number[] {
  return values
    .map((value) => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    })
    .filter((value): value is number => value !== null);
}

export const aggregationFns: Record<string, AggregationFn> = {
  count: (values) => values.length,
  sum: (values) => {
    const numbers = toFiniteNumbers(values);
    return numbers.reduce((acc, value) => acc + value, 0);
  },
  avg: (values) => {
    const numbers = toFiniteNumbers(values);
    if (numbers.length === 0) {
      return 0;
    }
    return numbers.reduce((acc, value) => acc + value, 0) / numbers.length;
  },
  min: (values) => {
    const numbers = toFiniteNumbers(values);
    if (numbers.length === 0) {
      return undefined;
    }
    return numbers.reduce((min, val) => val < min ? val : min, numbers[0]);
  },
  max: (values) => {
    const numbers = toFiniteNumbers(values);
    if (numbers.length === 0) {
      return undefined;
    }
    return numbers.reduce((max, val) => val > max ? val : max, numbers[0]);
  },
  median: (values) => {
    const numbers = toFiniteNumbers(values).sort((a, b) => a - b);
    if (numbers.length === 0) {
      return undefined;
    }
    const middle = Math.floor(numbers.length / 2);
    if (numbers.length % 2 === 0) {
      return (numbers[middle - 1] + numbers[middle]) / 2;
    }
    return numbers[middle];
  },
  unique: (values) => {
    const seen = new Set<unknown>();
    for (const val of values) {
      if (val != null && typeof val === 'object') {
        seen.add(JSON.stringify(val));
      } else {
        seen.add(val);
      }
    }
    return seen.size;
  },
  first: (values) => values[0],
  last: (values) => values[values.length - 1],
};

export type AggregationInput<TData extends RowData = RowData> =
  | keyof typeof aggregationFns
  | AggregationFn<TData>;

export function resolveAggregationFn<TData extends RowData = RowData>(
  input: AggregationInput<TData> | undefined,
  customAggregationFns?: Record<string, AggregationFn<TData>>,
): AggregationFn<TData> {
  if (!input) {
    return aggregationFns.sum as AggregationFn<TData>;
  }

  if (typeof input === 'function') {
    return input;
  }

  if (customAggregationFns && input in customAggregationFns) {
    return customAggregationFns[input];
  }

  if (input in aggregationFns) {
    return aggregationFns[input] as AggregationFn<TData>;
  }

  return aggregationFns.sum as AggregationFn<TData>;
}
