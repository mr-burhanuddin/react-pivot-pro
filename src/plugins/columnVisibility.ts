import type { PivotTableInstance, PivotTablePlugin, RowData, TableState } from '../types';

export interface ColumnVisibilityState {
  columnVisibility: Record<string, boolean>;
}

export type ColumnVisibilityTableState = TableState & ColumnVisibilityState;

export interface ColumnVisibilityApi<
  TData extends RowData,
  TState extends ColumnVisibilityTableState = ColumnVisibilityTableState,
> {
  getColumnVisibility: () => Record<string, boolean>;
  getIsColumnVisible: (columnId: string) => boolean;
  getVisibleColumnIds: () => string[];
  setColumnVisibility: (
    updater:
      | Record<string, boolean>
      | ((previous: Record<string, boolean>) => Record<string, boolean>),
  ) => void;
  toggleColumnVisibility: (columnId: string, value?: boolean) => void;
  resetColumnVisibility: () => void;
}

export type PivotTableWithColumnVisibility<
  TData extends RowData,
  TState extends ColumnVisibilityTableState = ColumnVisibilityTableState,
> = PivotTableInstance<TData, TState> & {
  columnVisibility: ColumnVisibilityApi<TData, TState>;
};

export function createColumnVisibilityPlugin<
  TData extends RowData,
  TState extends ColumnVisibilityTableState = ColumnVisibilityTableState,
>(): PivotTablePlugin<TData, TState> {
  return {
    name: 'columnVisibility',
    getInitialState: (state) => ({
      ...state,
      columnVisibility: state.columnVisibility ?? {},
    }),
  };
}

export function createColumnVisibilityApi<
  TData extends RowData,
  TState extends ColumnVisibilityTableState = ColumnVisibilityTableState,
>(table: PivotTableInstance<TData, TState>): ColumnVisibilityApi<TData, TState> {
  const getColumnVisibility = (): Record<string, boolean> => {
    const state = table.getState();
    return state.columnVisibility ?? {};
  };

  return {
    getColumnVisibility,
    getIsColumnVisible: (columnId) => getColumnVisibility()[columnId] !== false,
    getVisibleColumnIds: () =>
      table.columns
        .filter((column) => getColumnVisibility()[column.id] !== false)
        .map((column) => column.id),
    setColumnVisibility: (updater) => {
      table.setState((previous) => {
        const previousVisibility = previous.columnVisibility ?? {};
        const nextVisibility =
          typeof updater === 'function'
            ? updater(previousVisibility)
            : updater;

        return {
          ...previous,
          columnVisibility: nextVisibility,
        };
      });
    },
    toggleColumnVisibility: (columnId, value) => {
      table.setState((previous) => {
        const previousValue = previous.columnVisibility?.[columnId] ?? true;
        const nextValue = value ?? !previousValue;

        return {
          ...previous,
          columnVisibility: {
            ...(previous.columnVisibility ?? {}),
            [columnId]: nextValue,
          },
        };
      });
    },
    resetColumnVisibility: () => {
      table.setState((previous) => ({
        ...previous,
        columnVisibility: {},
      }));
    },
  };
}

export function withColumnVisibility<
  TData extends RowData,
  TState extends ColumnVisibilityTableState = ColumnVisibilityTableState,
>(table: PivotTableInstance<TData, TState>): PivotTableWithColumnVisibility<TData, TState> {
  return Object.assign(table, {
    columnVisibility: createColumnVisibilityApi(table),
  });
}
