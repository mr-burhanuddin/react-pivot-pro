import type {
  PivotTableInstance,
  PivotTablePlugin,
  Row,
  RowData,
  SortingRule,
  TableState,
} from '../types';

export interface SortingTableState extends TableState {
  sorting: SortingRule[];
}

export interface SortingApi<
  TData extends RowData,
  TState extends SortingTableState = SortingTableState,
> {
  getSorting: () => SortingRule[];
  getSortedColumnIds: () => string[];
  getIsSorted: (columnId: string) => 'asc' | 'desc' | false;
  setSorting: (
    updater: SortingRule[] | ((previous: SortingRule[]) => SortingRule[]),
  ) => void;
  toggleSorting: (columnId: string, multi?: boolean) => void;
  clearSorting: () => void;
}

export type PivotTableWithSorting<
  TData extends RowData,
  TState extends SortingTableState = SortingTableState,
> = PivotTableInstance<TData, TState> & {
  sorting: SortingApi<TData, TState>;
};

export interface SortingPluginOptions {
  isMultiSortEvent?: (multi: boolean | undefined) => boolean;
}

function areSortingRulesEqual(next: SortingRule[], previous: SortingRule[]): boolean {
  if (next.length !== previous.length) {
    return false;
  }

  for (let index = 0; index < next.length; index += 1) {
    if (next[index].id !== previous[index].id || next[index].desc !== previous[index].desc) {
      return false;
    }
  }

  return true;
}

function compareValues(left: unknown, right: unknown): number {
  if (left === right) {
    return 0;
  }

  if (left == null) {
    return 1;
  }

  if (right == null) {
    return -1;
  }

  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  if (left instanceof Date && right instanceof Date) {
    return left.getTime() - right.getTime();
  }

  if (typeof left === 'boolean' && typeof right === 'boolean') {
    return Number(left) - Number(right);
  }

  return String(left).localeCompare(String(right));
}

export function createSortingPlugin<
  TData extends RowData,
  TState extends SortingTableState = SortingTableState,
>(options: SortingPluginOptions = {}): PivotTablePlugin<TData, TState> {
  const isMultiSortEvent = options.isMultiSortEvent ?? ((multi) => Boolean(multi));
  let lastRowsRef: Row<TData>[] | null = null;
  let lastSortingRef: SortingRule[] = [];
  let lastResultRef: Row<TData>[] | null = null;

  return {
    name: 'sorting',
    getInitialState: (state) => ({
      ...state,
      sorting: state.sorting ?? [],
    }),
    transformRows: (rows, context) => {
      const sorting = context.state.sorting ?? [];

      if (
        lastRowsRef === rows &&
        lastResultRef &&
        areSortingRulesEqual(sorting, lastSortingRef)
      ) {
        return lastResultRef;
      }

      if (sorting.length === 0) {
        lastRowsRef = rows;
        lastSortingRef = sorting.slice();
        lastResultRef = rows;
        return rows;
      }

      const sortedRows = [...rows];
      sortedRows.sort((leftRow, rightRow) => {
        for (const rule of sorting) {
          const comparison = compareValues(
            leftRow.getValue(rule.id),
            rightRow.getValue(rule.id),
          );

          if (comparison !== 0) {
            return rule.desc ? comparison * -1 : comparison;
          }
        }

        return 0;
      });

      lastRowsRef = rows;
      lastSortingRef = sorting.slice();
      lastResultRef = sortedRows;
      return sortedRows;
    },
    onStateChange: (state, previousState, context) => {
      const nextSorting = state.sorting ?? [];
      const previousSorting = previousState.sorting ?? [];
      if (areSortingRulesEqual(nextSorting, previousSorting)) {
        return;
      }

      const validColumns = new Set(context.columns.map((column) => column.id));
      const filteredSorting = nextSorting.filter((rule) => validColumns.has(rule.id));
      if (filteredSorting.length !== nextSorting.length) {
        context.setState((previous) => ({
          ...previous,
          sorting: filteredSorting,
        }));
      }
    },
  };
}

export const useSorting = createSortingPlugin;

export function createSortingApi<
  TData extends RowData,
  TState extends SortingTableState = SortingTableState,
>(
  table: PivotTableInstance<TData, TState>,
  options: SortingPluginOptions = {},
): SortingApi<TData, TState> {
  const isMultiSortEvent = options.isMultiSortEvent ?? ((multi) => Boolean(multi));

  let lastSortingRef: SortingRule[] | null = null;
  let lastSortedColumnIdsRef: string[] = [];

  const getSorting = () => table.getState().sorting ?? [];

  const getSortedColumnIds = () => {
    const sorting = getSorting();
    if (lastSortingRef === sorting) {
      return lastSortedColumnIdsRef;
    }

    lastSortingRef = sorting;
    lastSortedColumnIdsRef = sorting.map((rule) => rule.id);
    return lastSortedColumnIdsRef;
  };

  return {
    getSorting,
    getSortedColumnIds,
    getIsSorted: (columnId) => {
      const sorting = getSorting();
      const match = sorting.find((rule) => rule.id === columnId);
      if (!match) {
        return false;
      }
      return match.desc ? 'desc' : 'asc';
    },
    setSorting: (updater) => {
      table.setState((previous) => {
        const previousSorting = previous.sorting ?? [];
        const nextSorting =
          typeof updater === 'function'
            ? updater(previousSorting)
            : updater;

        return {
          ...previous,
          sorting: nextSorting,
        };
      });
    },
    toggleSorting: (columnId, multi) => {
      table.setState((previous) => {
        const previousSorting = previous.sorting ?? [];
        const current = previousSorting.find((rule) => rule.id === columnId);
        const canMultiSort = isMultiSortEvent(multi);

        if (!current) {
          return {
            ...previous,
            sorting: canMultiSort
              ? [...previousSorting, { id: columnId, desc: false }]
              : [{ id: columnId, desc: false }],
          };
        }

        if (!current.desc) {
          return {
            ...previous,
            sorting: previousSorting.map((rule) =>
              rule.id === columnId ? { ...rule, desc: true } : rule,
            ),
          };
        }

        const cleared = previousSorting.filter((rule) => rule.id !== columnId);
        return {
          ...previous,
          sorting: canMultiSort ? cleared : [],
        };
      });
    },
    clearSorting: () => {
      table.setState((previous) => ({
        ...previous,
        sorting: [],
      }));
    },
  };
}

export function withSorting<
  TData extends RowData,
  TState extends SortingTableState = SortingTableState,
>(
  table: PivotTableInstance<TData, TState>,
  options: SortingPluginOptions = {},
): PivotTableWithSorting<TData, TState> {
  return Object.assign(table, {
    sorting: createSortingApi(table, options),
  });
}
