import type { DragEndEvent, UniqueIdentifier } from '@dnd-kit/core';
import type { Column, PivotTableInstance, PivotTablePlugin, RowData, TableState } from '../types';
import { unique, move, reorderByIds } from '../utils/helpers';

export interface DndColumnState {
  columnOrder: string[];
}

export type DndColumnTableState = TableState & DndColumnState;

export interface DndColumnApi<
  TData extends RowData,
  TState extends DndColumnTableState = DndColumnTableState,
> {
  getColumnOrder: () => string[];
  getSortableColumnIds: () => string[];
  setColumnOrder: (updater: string[] | ((previous: string[]) => string[])) => void;
  reorderColumns: (activeId: UniqueIdentifier, overId: UniqueIdentifier) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  resetColumnOrder: () => void;
}

export type PivotTableWithDndColumn<
  TData extends RowData,
  TState extends DndColumnTableState = DndColumnTableState,
> = PivotTableInstance<TData, TState> & {
  dndColumn: DndColumnApi<TData, TState>;
};

export function createDndColumnPlugin<
  TData extends RowData,
  TState extends DndColumnTableState = DndColumnTableState,
>(): PivotTablePlugin<TData, TState> {
  let lastColumnsRef: Column<TData>[] | null = null;
  let lastOrderRef: string[] = [];
  let lastResultRef: Column<TData>[] | null = null;

  return {
    name: 'dndColumn',
    getInitialState: (state) => ({
      ...state,
      columnOrder: unique(state.columnOrder ?? []),
    }),
    transformColumns: (columns, context) => {
      const columnOrder = unique((context.state as TState).columnOrder ?? []);

      if (
        lastColumnsRef === columns &&
        lastResultRef &&
        columnOrder.length === lastOrderRef.length &&
        columnOrder.every((id, index) => id === lastOrderRef[index])
      ) {
        return lastResultRef;
      }

      if (columnOrder.length === 0) {
        lastColumnsRef = columns;
        lastOrderRef = [];
        lastResultRef = columns;
        return columns;
      }

      const reordered = reorderByIds(columns, columnOrder);
      lastColumnsRef = columns;
      lastOrderRef = columnOrder;
      lastResultRef = reordered;
      return reordered;
    },
  };
}

export function createDndColumnApi<
  TData extends RowData,
  TState extends DndColumnTableState = DndColumnTableState,
>(table: PivotTableInstance<TData, TState>): DndColumnApi<TData, TState> {
  const getSortableColumnIds = (): string[] => table.columns.map((column) => column.id);

  const normalizeOrder = (order: string[]): string[] => {
    const allIds = getSortableColumnIds();
    const known = order.filter((id) => allIds.includes(id));
    const remaining = allIds.filter((id) => !known.includes(id));
    return [...known, ...remaining];
  };

  const getColumnOrder = (): string[] => {
    const current = table.getState().columnOrder ?? [];
    return normalizeOrder(unique(current));
  };

  const reorderColumns = (activeId: UniqueIdentifier, overId: UniqueIdentifier) => {
    const fromId = String(activeId);
    const toId = String(overId);
    if (fromId === toId) {
      return;
    }

    const currentOrder = getColumnOrder();
    const fromIndex = currentOrder.indexOf(fromId);
    const toIndex = currentOrder.indexOf(toId);
    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    const nextOrder = move(currentOrder, fromIndex, toIndex);
    table.setState((previous) => ({
      ...previous,
      columnOrder: unique(nextOrder),
    }));
  };

  return {
    getColumnOrder,
    getSortableColumnIds,
    setColumnOrder: (updater) => {
      table.setState((previous) => {
        const previousOrder = previous.columnOrder ?? [];
        const next = typeof updater === 'function' ? updater(previousOrder) : updater;
        return {
          ...previous,
          columnOrder: unique(normalizeOrder(next)),
        };
      });
    },
    reorderColumns,
    handleDragEnd: ({ active, over }) => {
      if (!over) {
        return;
      }
      reorderColumns(active.id, over.id);
    },
    resetColumnOrder: () => {
      table.setState((previous) => ({
        ...previous,
        columnOrder: [],
      }));
    },
  };
}

export function withDndColumn<
  TData extends RowData,
  TState extends DndColumnTableState = DndColumnTableState,
>(table: PivotTableInstance<TData, TState>): PivotTableWithDndColumn<TData, TState> {
  return Object.assign(table, {
    dndColumn: createDndColumnApi(table),
  });
}

export function useDndColumn<
  TData extends RowData,
  TState extends DndColumnTableState = DndColumnTableState,
>(table: PivotTableInstance<TData, TState>): DndColumnApi<TData, TState> {
  return createDndColumnApi(table);
}
