import type { DragEndEvent, UniqueIdentifier } from '@dnd-kit/core';
import type { PivotTableInstance, PivotTablePlugin, Row, RowData, TableState } from '../types';

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

function reorderRowsByOrder<TData extends RowData>(
  rows: Row<TData>[],
  rowOrder: string[],
): Row<TData>[] {
  if (rowOrder.length === 0) {
    return rows;
  }

  const rank = new Map<string, number>();
  rowOrder.forEach((id, index) => {
    rank.set(id, index);
  });

  const sorted = [...rows].sort((left, right) => {
    const leftRank = rank.get(left.id);
    const rightRank = rank.get(right.id);
    if (leftRank == null && rightRank == null) {
      return 0;
    }
    if (leftRank == null) {
      return 1;
    }
    if (rightRank == null) {
      return -1;
    }
    return leftRank - rightRank;
  });

  return sorted;
}

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
      const rowOrder = unique(context.state.rowOrder ?? []);

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

      const reordered = reorderRowsByOrder(rows, rowOrder);
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

export const useDndRow = createDndRowPlugin;
