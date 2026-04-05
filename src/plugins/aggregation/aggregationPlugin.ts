import type { Column } from '../../types/column';
import type { PivotTablePlugin } from '../../types/plugin';
import type { Row, RowMeta } from '../../types/row';
import type { RowData } from '../../types/table';
import type {
  AggregationFn,
  AggregationFnName,
  AggregationPluginOptions,
  AggregationTableState,
} from '../../types/aggregation';
import {
  aggregationFns,
  resolveAggregationFn,
} from './aggregators';

interface CacheEntry<TData extends RowData> {
  rows: Row<TData>[] | null;
  result: Row<TData>[] | null;
  columnAggregators: string;
}

function serializeColumnAggregators(
  aggregators: Record<string, AggregationFnName | 'custom'>,
): string {
  return JSON.stringify(aggregators);
}

function computeGrandTotals<TData extends RowData>(
  rows: Row<TData>[],
  columnAggregators: Record<string, AggregationFnName | 'custom'>,
  customFns: Record<string, AggregationFn>,
): Record<string, number | null> {
  const totals: Record<string, number | null> = {};

  for (const columnId of Object.keys(columnAggregators)) {
    const fnName = columnAggregators[columnId];
    const fn = resolveAggregationFn(fnName, customFns, columnId);
    if (!fn) {
      totals[columnId] = null;
      continue;
    }

    const values = rows.map((row) => row.values[columnId]);
    const result = fn(values);
    totals[columnId] = result;
  }

  return totals;
}

function computeSubtotals<TData extends RowData>(
  rows: Row<TData>[],
  columnAggregators: Record<string, AggregationFnName | 'custom'>,
  customFns: Record<string, AggregationFn>,
): Row<TData>[] {
  const result: Row<TData>[] = [];
  const groups = new Map<string, Row<TData>[]>();

  for (const row of rows) {
    const groupKey = row.values._groupKey as string | undefined;
    if (groupKey) {
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(row);
    }
  }

  for (const row of rows) {
    result.push(row);

    const groupKey = row.values._groupKey as string | undefined;
    if (groupKey) {
      const groupRows = groups.get(groupKey);
      if (groupRows && groupRows[groupRows.length - 1] === row) {
        const subtotalValues: Record<string, unknown> = {
          _groupKey: groupKey,
          _isSubtotal: true,
        };

        for (const columnId of Object.keys(columnAggregators)) {
          const fnName = columnAggregators[columnId];
          const fn = resolveAggregationFn(fnName, customFns, columnId);
          if (fn) {
            const values = groupRows.map((r) => r.values[columnId]);
            subtotalValues[columnId] = fn(values);
          }
        }

        const subtotalRow: Row<TData> = {
          id: `subtotal_${groupKey}`,
          index: row.index,
          original: {} as TData,
          values: subtotalValues,
          getValue: <TValue = unknown>(columnId: string): TValue | undefined =>
            subtotalValues[columnId] as TValue | undefined,
          meta: { isSubtotal: true, _isSubtotal: true } as RowMeta,
        };

        result.push(subtotalRow);
      }
    }
  }

  return result;
}

function applyAggregations<TData extends RowData>(
  rows: Row<TData>[],
  columnAggregators: Record<string, AggregationFnName | 'custom'>,
  customFns: Record<string, AggregationFn>,
): Row<TData>[] {
  if (Object.keys(columnAggregators).length === 0) {
    return rows;
  }

  const withSubtotals = computeSubtotals(rows, columnAggregators, customFns);

  const grandTotals = computeGrandTotals(
    withSubtotals.filter((r) => !(r.meta as RowMeta | undefined)?.isSubtotal),
    columnAggregators,
    customFns,
  );

  if (Object.keys(grandTotals).length > 0) {
    const grandTotalValues: Record<string, unknown> = {
      _isGrandTotal: true,
      ...grandTotals,
    };

    const grandTotalRow: Row<TData> = {
      id: 'grandTotal',
      index: withSubtotals.length,
      original: {} as TData,
      values: grandTotalValues,
      getValue: <TValue = unknown>(columnId: string): TValue | undefined =>
        grandTotalValues[columnId] as TValue | undefined,
      meta: { isGrandTotal: true, _isGrandTotal: true } as RowMeta,
    };

    withSubtotals.push(grandTotalRow);
  }

  return withSubtotals;
}

export function createAggregationPlugin<
  TData extends RowData,
  TState extends AggregationTableState = AggregationTableState,
>(options: AggregationPluginOptions = {}): PivotTablePlugin<TData, TState> {
  const { defaultAggregator = 'sum', autoAggregateColumns = [] } = options;

  const customFnsRef: Record<string, AggregationFn> = {};
  let cache: CacheEntry<TData> = {
    rows: null,
    result: null,
    columnAggregators: '',
  };

  return {
    name: 'aggregation',
    getInitialState: (state) => {
      const initialAggregators: Record<string, AggregationFnName | 'custom'> = {};
      for (const col of autoAggregateColumns) {
        initialAggregators[col] = defaultAggregator;
      }

      return {
        ...state,
        columnAggregators: state.columnAggregators ?? initialAggregators,
      };
    },
    transformRows: (rows, context) => {
      const state = context.state as TState;
      const columnAggregators = state.columnAggregators ?? {};
      const aggregatorKey = serializeColumnAggregators(columnAggregators);

      if (
        cache.rows === rows &&
        cache.result &&
        cache.columnAggregators === aggregatorKey
      ) {
        return cache.result;
      }

      if (Object.keys(columnAggregators).length === 0) {
        cache.rows = rows;
        cache.result = rows;
        cache.columnAggregators = aggregatorKey;
        return rows;
      }

      const result = applyAggregations(rows, columnAggregators, customFnsRef);

      cache.rows = rows;
      cache.result = result;
      cache.columnAggregators = aggregatorKey;

      return result;
    },
    transformColumns: (columns, context) => {
      const state = context.state as TState;
      const columnAggregators = state.columnAggregators ?? {};

      return columns.map((col) => {
        const aggName = columnAggregators[col.id];
        let label: string | undefined;
        if (aggName && aggName !== 'custom') {
          label = aggName.charAt(0).toUpperCase() + aggName.slice(1);
        } else if (aggName === 'custom') {
          label = 'Custom';
        }

        return {
          ...col,
          meta: {
            ...col.meta,
            aggregator: aggName,
            aggregatorLabel: label,
          },
        } as Column<TData>;
      });
    },
    onStateChange: (state, previousState) => {
      const prevState = previousState as TState;
      const nextState = state as TState;

      const prevAggs = prevState.columnAggregators ?? {};
      const nextAggs = nextState.columnAggregators ?? {};

      if (serializeColumnAggregators(prevAggs) !== serializeColumnAggregators(nextAggs)) {
        cache.rows = null;
        cache.result = null;
      }
    },
  };
}
