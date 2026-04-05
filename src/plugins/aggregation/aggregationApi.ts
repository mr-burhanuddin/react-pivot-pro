import type { PivotTableInstance, RowData } from '../../types';
import type {
  AggregationFn,
  AggregationFnName,
  AggregationApi,
  AggregationTableState,
} from '../../types/aggregation';
import { aggregationFns } from './aggregators';

export function createAggregationApi<
  TData extends RowData,
  TState extends AggregationTableState = AggregationTableState,
>(table: PivotTableInstance<TData, TState>): AggregationApi<TData, TState> {
  const customFns: Record<string, AggregationFn> = {};

  const getColumnAggregators = (): Record<string, AggregationFnName | 'custom'> => {
    const state = table.getState();
    return state.columnAggregators ?? {};
  };

  const normalizeColumnAggregators = (
    aggregators: Record<string, AggregationFnName | 'custom'>,
  ): Record<string, AggregationFnName | 'custom'> => {
    const allColumnIds = table.columns.map((column) => column.id);
    const normalized: Record<string, AggregationFnName | 'custom'> = {};
    for (const [columnId, fnName] of Object.entries(aggregators)) {
      if (allColumnIds.includes(columnId)) {
        normalized[columnId] = fnName;
      }
    }
    return normalized;
  };

  return {
    getColumnAggregator: (columnId) => {
      const aggregators = getColumnAggregators();
      return aggregators[columnId];
    },
    getColumnAggregators,
    setColumnAggregator: (columnId, updater) => {
      table.setState((previous) => {
        const previousAggregators = previous.columnAggregators ?? {};
        const currentValue = previousAggregators[columnId];
        const nextValue =
          typeof updater === 'function'
            ? updater(currentValue ?? 'sum')
            : updater;

        return {
          ...previous,
          columnAggregators: {
            ...previousAggregators,
            [columnId]: nextValue,
          },
        };
      });
    },
    setColumnAggregators: (updater) => {
      table.setState((previous) => {
        const previousAggregators = previous.columnAggregators ?? {};
        const nextAggregators =
          typeof updater === 'function'
            ? updater(previousAggregators)
            : updater;

        return {
          ...previous,
          columnAggregators: normalizeColumnAggregators(nextAggregators),
        };
      });
    },
    registerFn: (name, fn) => {
      customFns[name] = fn;
    },
    unregisterFn: (name) => {
      delete customFns[name];
    },
    getRegisteredFns: () => ({
      ...aggregationFns,
      ...customFns,
    }),
    resetColumnAggregators: () => {
      table.setState((previous) => ({
        ...previous,
        columnAggregators: {},
      }));
    },
    getAggregatedValue: (columnId) => {
      const rows = table.getRowModel().rows;
      const aggregators = getColumnAggregators();
      const fnName = aggregators[columnId];
      if (!fnName) return null;

      const fn = fnName === 'custom' ? customFns[columnId] : aggregationFns[fnName];
      if (!fn) return null;

      const values = rows.map((row) => row.values[columnId]);
      return fn(values);
    },
    getGrandTotal: (columnId) => {
      const rows = table.getRowModel().rows;
      const aggregators = getColumnAggregators();
      const fnName = aggregators[columnId];
      if (!fnName) return null;

      const fn = fnName === 'custom' ? customFns[columnId] : aggregationFns[fnName];
      if (!fn) return null;

      const values = rows.map((row) => row.values[columnId]);
      let total = 0;
      let hasValue = false;
      for (let i = 0; i < values.length; i++) {
        const n = Number(values[i]);
        if (!Number.isNaN(n) && values[i] != null) {
          total += n;
          hasValue = true;
        }
      }
      return hasValue ? total : null;
    },
  };
}

export function withAggregation<
  TData extends RowData,
  TState extends AggregationTableState = AggregationTableState,
>(table: PivotTableInstance<TData, TState>) {
  return Object.assign(table, {
    aggregation: createAggregationApi(table),
  });
}

export function usePivotAggregation<
  TData extends RowData,
  TState extends AggregationTableState = AggregationTableState,
>(table: PivotTableInstance<TData, TState>): AggregationApi<TData, TState> {
  return createAggregationApi(table);
}
