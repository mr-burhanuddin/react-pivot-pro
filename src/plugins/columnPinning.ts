import type { Column } from "../types/column";
import type {
  PivotTableInstance,
  PivotTablePlugin,
  RowData,
  TableState,
} from "../types";
import { unique } from "../utils/helpers";

export interface ColumnPinningPosition {
  left: string[];
  right: string[];
}

export interface ColumnPinningState {
  columnPinning: ColumnPinningPosition;
}

export type ColumnPinningTableState = TableState & ColumnPinningState;

export type PinSide = "left" | "right" | false;

export interface ColumnPinningApi<
  TData extends RowData,
  TState extends ColumnPinningTableState = ColumnPinningTableState,
> {
  getColumnPinning: () => ColumnPinningPosition;
  setColumnPinning: (
    updater:
      | ColumnPinningPosition
      | ((previous: ColumnPinningPosition) => ColumnPinningPosition),
  ) => void;
  pinColumn: (columnId: string, side: PinSide) => void;
  getPinnedColumns: (side: Exclude<PinSide, false>) => string[];
  getCenterColumnIds: () => string[];
  resetColumnPinning: () => void;
}

export type PivotTableWithColumnPinning<
  TData extends RowData,
  TState extends ColumnPinningTableState = ColumnPinningTableState,
> = PivotTableInstance<TData, TState> & {
  columnPinning: ColumnPinningApi<TData, TState>;
};

function normalizePinning(
  value?: ColumnPinningPosition,
): ColumnPinningPosition {
  const left = unique(value?.left ?? []);
  const right = unique(
    (value?.right ?? []).filter((columnId) => !left.includes(columnId)),
  );
  return { left, right };
}

export function createColumnPinningPlugin<
  TData extends RowData,
  TState extends ColumnPinningTableState = ColumnPinningTableState,
>(): PivotTablePlugin<TData, TState> {
  return {
    name: "columnPinning",
    getInitialState: (state) => ({
      ...state,
      columnPinning: normalizePinning(state.columnPinning),
    }),
    transformColumns: (columns, context) => {
      const state = context.state as TState;
      const pinning = normalizePinning(state.columnPinning);

      if (pinning.left.length === 0 && pinning.right.length === 0) {
        return columns;
      }

      const leftSet = new Set(pinning.left);
      const rightSet = new Set(pinning.right);

      const leftColumns: Column<TData>[] = [];
      const centerColumns: Column<TData>[] = [];
      const rightColumns: Column<TData>[] = [];

      for (const col of columns) {
        if (leftSet.has(col.id)) {
          leftColumns.push({
            ...col,
            meta: { ...col.meta, pinned: "left" } as Column<TData>["meta"],
          });
        } else if (rightSet.has(col.id)) {
          rightColumns.push({
            ...col,
            meta: { ...col.meta, pinned: "right" } as Column<TData>["meta"],
          });
        } else {
          centerColumns.push(col);
        }
      }

      return [...leftColumns, ...centerColumns, ...rightColumns];
    },
  };
}

export function createColumnPinningApi<
  TData extends RowData,
  TState extends ColumnPinningTableState = ColumnPinningTableState,
>(table: PivotTableInstance<TData, TState>): ColumnPinningApi<TData, TState> {
  const getColumnPinning = (): ColumnPinningPosition => {
    const state = table.getState();
    return normalizePinning(state.columnPinning);
  };

  return {
    getColumnPinning,
    setColumnPinning: (updater) => {
      table.setState((previous) => {
        const previousPinning = normalizePinning(previous.columnPinning);
        const nextPinning =
          typeof updater === "function" ? updater(previousPinning) : updater;

        return {
          ...previous,
          columnPinning: normalizePinning(nextPinning),
        };
      });
    },
    pinColumn: (columnId, side) => {
      table.setState((previous) => {
        const pinning = normalizePinning(previous.columnPinning);
        const left = pinning.left.filter((id) => id !== columnId);
        const right = pinning.right.filter((id) => id !== columnId);

        if (side === "left") {
          left.push(columnId);
        } else if (side === "right") {
          right.push(columnId);
        }

        return {
          ...previous,
          columnPinning: normalizePinning({ left, right }),
        };
      });
    },
    getPinnedColumns: (side) => getColumnPinning()[side],
    getCenterColumnIds: () => {
      const pinning = getColumnPinning();
      const pinnedIds = new Set([...pinning.left, ...pinning.right]);
      return table.columns
        .map((column) => column.id)
        .filter((columnId) => !pinnedIds.has(columnId));
    },
    resetColumnPinning: () => {
      table.setState((previous) => ({
        ...previous,
        columnPinning: { left: [], right: [] },
      }));
    },
  };
}

export function withColumnPinning<
  TData extends RowData,
  TState extends ColumnPinningTableState = ColumnPinningTableState,
>(
  table: PivotTableInstance<TData, TState>,
): PivotTableWithColumnPinning<TData, TState> {
  return Object.assign(table, {
    columnPinning: createColumnPinningApi(table),
  });
}
