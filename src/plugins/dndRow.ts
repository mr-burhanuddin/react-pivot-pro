import type { DragEndEvent, UniqueIdentifier } from '@dnd-kit/core';
import type { PivotTableInstance, PivotTablePlugin, Row, RowData, TableState } from '../types';
import { unique, move, reorderByIds } from '../utils/helpers';

export interface DndRowState {
  rowOrder: string[];
}

export type DndRowTableState = TableState & DndRowState;

export interface DndRowApi<
  TData extends RowData,
  TState extends DndRowTableState = DndRowTableState,
> {
  getRowOrder: () => string[];
  getSortableRowIds: () => string[];
  setRowOrder: (updater: string[] | ((previous: string[]) => string[])) => void;
  reorderRows: (activeId: UniqueIdentifier, overId: UniqueIdentifier) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  resetRowOrder: () => void;
}

export type PivotTableWithDndRow<
  TData extends RowData,
  TState extends DndRowTableState = DndRowTableState,
> = PivotTableInstance<TData, TState> & {
  dndRow: DndRowApi<TData, TState>;
};

export function createDndRowPlugin<
  TData extends RowData,
  TState extends DndRowTableState = DndRowTableState,
>(): PivotTablePlugin<TData, TState> {
  let lastRowsRef: Row<TData>[] | null = null;
  let lastOrderRef: string[] = [];
  let lastResultRef: Row<TData>[] | null = null;

  return {
    name: 'dndRow',
    getInitialState: (state) => ({
      ...state,
      rowOrder: unique(state.rowOrder ?? []),
    }),
    transformRows: (rows, context) => {
      const rowOrder = unique((context.state as TState).rowOrder ?? []);

      if (
        lastRowsRef === rows &&
        lastResultRef &&
        rowOrder.length === lastOrderRef.length &&
        rowOrder.every((id, index) => id === lastOrderRef[index])
      ) {
        return lastResultRef;
      }

      if (rowOrder.length === 0) {
        lastRowsRef = rows;
        lastOrderRef = [];
        lastResultRef = rows;
        return rows;
      }

      const reordered = reorderByIds(rows, rowOrder);
      lastRowsRef = rows;
      lastOrderRef = rowOrder;
      lastResultRef = reordered;
      return reordered;
    },
  };
}

export function createDndRowApi<
  TData extends RowData,
  TState extends DndRowTableState = DndRowTableState,
>(table: PivotTableInstance<TData, TState>): DndRowApi<TData, TState> {
  const getSortableRowIds = (): string[] => table.getCoreRowModel().rows.map((row) => row.id);

  const normalizeOrder = (order: string[]): string[] => {
    const allIds = getSortableRowIds();
    const known = order.filter((id) => allIds.includes(id));
    const remaining = allIds.filter((id) => !known.includes(id));
    return [...known, ...remaining];
  };

  const getRowOrder = (): string[] => {
    const current = table.getState().rowOrder ?? [];
    return normalizeOrder(unique(current));
  };

  const reorderRows = (activeId: UniqueIdentifier, overId: UniqueIdentifier) => {
    const fromId = String(activeId);
    const toId = String(overId);
    if (fromId === toId) {
      return;
    }

    const currentOrder = getRowOrder();
    const fromIndex = currentOrder.indexOf(fromId);
    const toIndex = currentOrder.indexOf(toId);
    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    const nextOrder = move(currentOrder, fromIndex, toIndex);
    table.setState((previous) => ({
      ...previous,
      rowOrder: unique(nextOrder),
    }));
  };

  return {
    getRowOrder,
    getSortableRowIds,
    setRowOrder: (updater) => {
      table.setState((previous) => {
        const previousOrder = previous.rowOrder ?? [];
        const next = typeof updater === 'function' ? updater(previousOrder) : updater;
        return {
          ...previous,
          rowOrder: unique(normalizeOrder(next)),
        };
      });
    },
    reorderRows,
    handleDragEnd: ({ active, over }) => {
      if (!over) {
        return;
      }
      reorderRows(active.id, over.id);
    },
    resetRowOrder: () => {
      table.setState((previous) => ({
        ...previous,
        rowOrder: [],
      }));
    },
  };
}

export function withDndRow<
  TData extends RowData,
  TState extends DndRowTableState = DndRowTableState,
>(table: PivotTableInstance<TData, TState>): PivotTableWithDndRow<TData, TState> {
  return Object.assign(table, {
    dndRow: createDndRowApi(table),
  });
}

export function useDndRow<
  TData extends RowData,
  TState extends DndRowTableState = DndRowTableState,
>(table: PivotTableInstance<TData, TState>): DndRowApi<TData, TState> {
  return createDndRowApi(table);
}
