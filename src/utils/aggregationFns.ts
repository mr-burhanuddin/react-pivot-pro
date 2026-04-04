import type { RowData } from '../types';

export type AggregationFn<TData extends RowData = RowData> = (
  values: unknown[],
  rows: TData[],
) => unknown;

function toFiniteNumbers(values: unknown[]): number[] {
  return values
    .map((value) => {
      if (typeof value === 'number') {
        return value;
      }
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    })
    .filter((value): value is number => value !== null);
}

export const aggregationFns: Record<string, AggregationFn> = {
  count: (values) => values.length,
  sum: (values) => toFiniteNumbers(values).reduce((acc, value) => acc + value, 0),
  avg: (values) => {
    const numbers = toFiniteNumbers(values);
    if (numbers.length === 0) {
      return 0;
    }
    return numbers.reduce((acc, value) => acc + value, 0) / numbers.length;
  },
  min: (values) => {
    const numbers = toFiniteNumbers(values);
    return numbers.length === 0 ? undefined : Math.min(...numbers);
  },
  max: (values) => {
    const numbers = toFiniteNumbers(values);
    return numbers.length === 0 ? undefined : Math.max(...numbers);
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
  unique: (values) => Array.from(new Set(values)).length,
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
