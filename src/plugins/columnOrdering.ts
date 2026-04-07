import type { Column } from "../types/column";
import type {
  PivotTableInstance,
  PivotTablePlugin,
  RowData,
  TableState,
} from "../types";
import { unique } from "../utils/helpers";

export interface ColumnOrderingState {
  columnOrder: string[];
}

export type ColumnOrderingTableState = TableState & ColumnOrderingState;

export interface ColumnOrderingApi<
  TData extends RowData,
  TState extends ColumnOrderingTableState = ColumnOrderingTableState,
> {
  getColumnOrder: () => string[];
  getOrderedColumnIds: () => string[];
  setColumnOrder: (
    updater: string[] | ((previous: string[]) => string[]),
  ) => void;
  reorderColumn: (columnId: string, targetIndex: number) => void;
  resetColumnOrder: () => void;
}

export type PivotTableWithColumnOrdering<
  TData extends RowData,
  TState extends ColumnOrderingTableState = ColumnOrderingTableState,
> = PivotTableInstance<TData, TState> & {
  columnOrdering: ColumnOrderingApi<TData, TState>;
};

export function createColumnOrderingPlugin<
  TData extends RowData,
  TState extends ColumnOrderingTableState = ColumnOrderingTableState,
>(): PivotTablePlugin<TData, TState> {
  return {
    name: "columnOrdering",
    getInitialState: (state) => ({
      ...state,
      columnOrder: unique(state.columnOrder ?? []),
    }),
    transformColumns: (columns, context) => {
      const state = context.state as TState;
      const columnOrder = unique(state.columnOrder ?? []);

      if (columnOrder.length === 0) {
        return columns;
      }

      const columnMap = new Map<string, Column<TData>>();
      for (const col of columns) {
        columnMap.set(col.id, col);
      }

      const orderedColumns: Column<TData>[] = [];
      const remaining: Column<TData>[] = [];

      for (const id of columnOrder) {
        const col = columnMap.get(id);
        if (col) {
          orderedColumns.push(col);
          columnMap.delete(id);
        }
      }

      for (const col of columns) {
        if (columnMap.has(col.id)) {
          remaining.push(col);
        }
      }

      return [...orderedColumns, ...remaining];
    },
  };
}

export function createColumnOrderingApi<
  TData extends RowData,
  TState extends ColumnOrderingTableState = ColumnOrderingTableState,
>(table: PivotTableInstance<TData, TState>): ColumnOrderingApi<TData, TState> {
  const getColumnOrder = (): string[] => {
    const state = table.getState();
    return unique(state.columnOrder ?? []);
  };

  const normalizeOrder = (order: string[]): string[] => {
    const allColumnIds = table.columns.map((column) => column.id);
    const knownInOrder = order.filter((columnId) =>
      allColumnIds.includes(columnId),
    );
    const remainder = allColumnIds.filter(
      (columnId) => !knownInOrder.includes(columnId),
    );
    return [...knownInOrder, ...remainder];
  };

  return {
    getColumnOrder,
    getOrderedColumnIds: () => normalizeOrder(getColumnOrder()),
    setColumnOrder: (updater) => {
      table.setState((previous) => {
        const previousOrder = previous.columnOrder ?? [];
        const nextOrder =
          typeof updater === "function" ? updater(previousOrder) : updater;

        return {
          ...previous,
          columnOrder: unique(nextOrder),
        };
      });
    },
    reorderColumn: (columnId, targetIndex) => {
      const currentOrder = normalizeOrder(getColumnOrder());
      const currentIndex = currentOrder.indexOf(columnId);

      if (currentIndex === -1) {
        return;
      }

      const boundedTargetIndex = Math.max(
        0,
        Math.min(targetIndex, currentOrder.length - 1),
      );
      if (currentIndex === boundedTargetIndex) {
        return;
      }

      const nextOrder = [...currentOrder];
      nextOrder.splice(currentIndex, 1);
      nextOrder.splice(boundedTargetIndex, 0, columnId);

      table.setState((previous) => ({
        ...previous,
        columnOrder: unique(nextOrder),
      }));
    },
    resetColumnOrder: () => {
      table.setState((previous) => ({
        ...previous,
        columnOrder: [],
      }));
    },
  };
}

export function withColumnOrdering<
  TData extends RowData,
  TState extends ColumnOrderingTableState = ColumnOrderingTableState,
>(
  table: PivotTableInstance<TData, TState>,
): PivotTableWithColumnOrdering<TData, TState> {
  return Object.assign(table, {
    columnOrdering: createColumnOrderingApi(table),
  });
}
