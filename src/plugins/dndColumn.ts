import type { DragEndEvent, UniqueIdentifier } from '@dnd-kit/core';
import type { PivotTableInstance, PivotTablePlugin, RowData, TableState } from '../types';

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

function unique(items: string[]): string[] {
  return Array.from(new Set(items));
}

function move<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function createDndColumnPlugin<
  TData extends RowData,
  TState extends DndColumnTableState = DndColumnTableState,
>(): PivotTablePlugin<TData, TState> {
  return {
    name: 'dndColumn',
    getInitialState: (state) => ({
      ...state,
      columnOrder: unique(state.columnOrder ?? []),
    }),
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

export const useDndColumn = createDndColumnPlugin;
