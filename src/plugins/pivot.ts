import type { PivotTableInstance, PivotTablePlugin, Row, RowData, TableState } from '../types';
import {
  createPivotEngineResult,
  type PivotColumnHeader,
  type PivotEngineRequest,
  type PivotEngineResult,
  type PivotGroupByDef,
  type PivotServerAdapter,
  type PivotValueDef,
} from '../core/pivotEngine';
import type { LegacyAggregationFn as AggregationFn } from '../utils/aggregationFns';

export interface PivotTableState extends TableState {
  rowGrouping: string[];
  columnGrouping: string[];
  pivotValues: PivotValueDef[];
  pivotEnabled: boolean;
}

export interface PivotApi<TData extends RowData, TState extends PivotTableState = PivotTableState> {
  getPivotResult: () => PivotEngineResult<TData> | null;
  getPivotColumns: () => PivotColumnHeader[];
  getPivotValues: () => PivotValueDef<TData>[];
  setPivotValues: (
    updater:
      | PivotValueDef<TData>[]
      | ((previous: PivotValueDef<TData>[]) => PivotValueDef<TData>[]),
  ) => void;
  setPivotEnabled: (enabled: boolean) => void;
  runServerSidePivot: () => Promise<PivotEngineResult<TData> | null>;
}

export type PivotTableWithPivot<
  TData extends RowData,
  TState extends PivotTableState = PivotTableState,
> = PivotTableInstance<TData, TState> & {
  pivot: PivotApi<TData, TState>;
};

export interface PivotPluginOptions<TData extends RowData = RowData> {
  aggregationFns?: Record<string, AggregationFn<TData>>;
  defaultValues?: PivotValueDef<TData>[];
  serverAdapter?: PivotServerAdapter<TData>;
  clientSide?: boolean;
}

function areArrayEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}

function arePivotValueDefsEqual<TData extends RowData>(
  left: PivotValueDef<TData>[],
  right: PivotValueDef<TData>[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (
      left[index].id !== right[index].id ||
      left[index].accessor !== right[index].accessor ||
      left[index].aggregation !== right[index].aggregation
    ) {
      return false;
    }
  }

  return true;
}

function toGroupDefs<TData extends RowData>(grouping: string[]): PivotGroupByDef<TData>[] {
  return grouping.map((id) => ({ id }));
}

export function createPivotPlugin<
  TData extends RowData,
  TState extends PivotTableState = PivotTableState,
>(options: PivotPluginOptions<TData> = {}): PivotTablePlugin<TData, TState> {
  const clientSide = options.clientSide !== false;
  let lastRowsRef: Row<TData>[] | null = null;
  let lastRowGroupingRef: string[] = [];
  let lastColumnGroupingRef: string[] = [];
  let lastPivotValuesRef: PivotValueDef<TData>[] = [];
  let lastResultRef: Row<TData>[] | null = null;

  return {
    name: 'pivot',
    getInitialState: (state) => ({
      ...state,
      rowGrouping: state.rowGrouping ?? [],
      columnGrouping: state.columnGrouping ?? [],
      pivotValues: (state.pivotValues as PivotValueDef<TData>[]) ?? options.defaultValues ?? [],
      pivotEnabled: state.pivotEnabled ?? false,
    }),
    transformRows: (rows, context) => {
      const pivotEnabled = context.state.pivotEnabled ?? false;
      const rowGrouping = context.state.rowGrouping ?? [];
      const columnGrouping = context.state.columnGrouping ?? [];
      const pivotValues =
        (context.state.pivotValues as PivotValueDef<TData>[]) ?? options.defaultValues ?? [];

      if (!pivotEnabled || !clientSide || pivotValues.length === 0) {
        lastRowsRef = rows;
        lastRowGroupingRef = rowGrouping.slice();
        lastColumnGroupingRef = columnGrouping.slice();
        lastPivotValuesRef = pivotValues.slice();
        lastResultRef = rows;
        return rows;
      }

      if (
        lastRowsRef === rows &&
        lastResultRef &&
        areArrayEqual(rowGrouping, lastRowGroupingRef) &&
        areArrayEqual(columnGrouping, lastColumnGroupingRef) &&
        arePivotValueDefsEqual(pivotValues, lastPivotValuesRef)
      ) {
        return lastResultRef;
      }

      const result = createPivotEngineResult({
        data: rows.map((row) => row.original),
        rowGroupBy: toGroupDefs<TData>(rowGrouping),
        columnGroupBy: toGroupDefs<TData>(columnGrouping),
        values: pivotValues,
        aggregationFns: options.aggregationFns,
      });

      const rowKeys: string[] = result.rowHeaders.map((path) =>
        path.length === 0 ? '__root__' : path.join('||'),
      );

      const pivotRows: Row<TData>[] = rowKeys.map((rowKey, index) => {
        const rowValues: Record<string, unknown> = {
          __pivot: true,
          __rowKey: rowKey,
        };

        const rowMatrix = result.matrixByRowKey[rowKey] ?? {};
        for (const [columnKey, valueMap] of Object.entries(rowMatrix)) {
          for (const [valueId, value] of Object.entries(valueMap)) {
            rowValues[`${columnKey}::${valueId}`] = value;
          }
        }

        return {
          id: `pivot::${rowKey}`,
          index,
          original: {} as TData,
          values: rowValues,
          getValue: <TValue = unknown>(columnId: string) => rowValues[columnId] as TValue,
        };
      });

      lastRowsRef = rows;
      lastRowGroupingRef = rowGrouping.slice();
      lastColumnGroupingRef = columnGrouping.slice();
      lastPivotValuesRef = pivotValues.slice();
      lastResultRef = pivotRows;
      return pivotRows;
    },
  };
}

export function createPivotApi<
  TData extends RowData,
  TState extends PivotTableState = PivotTableState,
>(table: PivotTableInstance<TData, TState>, options: PivotPluginOptions<TData> = {}): PivotApi<TData, TState> {
  const getRequest = (): PivotEngineRequest<TData> => {
    const state = table.getState();
    return {
      rowGroupBy: (state.rowGrouping ?? []).map((id) => ({ id })),
      columnGroupBy: (state.columnGrouping ?? []).map((id) => ({ id })),
      values:
        ((state.pivotValues as PivotValueDef<TData>[]) ?? options.defaultValues) ?? [],
    };
  };

  let lastResultCache: PivotEngineResult<TData> | null = null;
  let lastRequestCache: PivotEngineRequest<TData> | null = null;
  let lastCoreRowsRef: Row<TData>[] | null = null;

  const getPivotResult = (): PivotEngineResult<TData> | null => {
    const request = getRequest();
    const coreRows = table.getCoreRowModel().rows;
    if (!table.getState().pivotEnabled || request.values.length === 0) {
      return null;
    }

    if (
      lastRequestCache &&
      lastCoreRowsRef === coreRows &&
      areArrayEqual(
        request.rowGroupBy.map((value) => value.id),
        lastRequestCache.rowGroupBy.map((value) => value.id),
      ) &&
      areArrayEqual(
        request.columnGroupBy.map((value) => value.id),
        lastRequestCache.columnGroupBy.map((value) => value.id),
      ) &&
      arePivotValueDefsEqual(request.values, lastRequestCache.values)
    ) {
      return lastResultCache;
    }

    const dataRows = coreRows.map((row) => row.original);
    const nextResult = createPivotEngineResult({
      data: dataRows,
      rowGroupBy: request.rowGroupBy,
      columnGroupBy: request.columnGroupBy,
      values: request.values,
      aggregationFns: options.aggregationFns,
    });
    lastRequestCache = request;
    lastCoreRowsRef = coreRows;
    lastResultCache = nextResult;
    return nextResult;
  };

  return {
    getPivotResult,
    getPivotColumns: () => getPivotResult()?.columnHeaders ?? [],
    getPivotValues: () =>
      ((table.getState().pivotValues as PivotValueDef<TData>[]) ?? options.defaultValues) ?? [],
    setPivotValues: (updater) => {
      table.setState((previous) => {
        const current =
          ((previous.pivotValues as PivotValueDef<TData>[]) ?? options.defaultValues) ?? [];
        const next = typeof updater === 'function' ? updater(current) : updater;
        return { ...previous, pivotValues: next };
      });
    },
    setPivotEnabled: (enabled) => {
      table.setState((previous) => ({ ...previous, pivotEnabled: enabled }));
    },
    runServerSidePivot: async () => {
      if (!options.serverAdapter) {
        return null;
      }
      const request = getRequest();
      if (request.values.length === 0) {
        return null;
      }
      return options.serverAdapter.execute(request);
    },
  };
}

export function withPivot<
  TData extends RowData,
  TState extends PivotTableState = PivotTableState,
>(
  table: PivotTableInstance<TData, TState>,
  options: PivotPluginOptions<TData> = {},
): PivotTableWithPivot<TData, TState> {
  return Object.assign(table, {
    pivot: createPivotApi(table, options),
  });
}

export function usePivot<
  TData extends RowData,
  TState extends PivotTableState = PivotTableState,
>(table: PivotTableInstance<TData, TState>): PivotApi<TData, TState> {
  return createPivotApi(table);
}
