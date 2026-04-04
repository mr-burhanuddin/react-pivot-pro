import type {
  ColumnFilter,
  PivotTableInstance,
  PivotTablePlugin,
  Row,
  RowData,
  TableState,
} from '../types';

export interface FilteringTableState extends TableState {
  filters: ColumnFilter[];
  globalFilter?: unknown;
}

export interface FilteringApi<
  TData extends RowData,
  TState extends FilteringTableState = FilteringTableState,
> {
  getColumnFilters: () => ColumnFilter[];
  getGlobalFilter: () => unknown;
  setColumnFilters: (
    updater: ColumnFilter[] | ((previous: ColumnFilter[]) => ColumnFilter[]),
  ) => void;
  setGlobalFilter: (value: unknown) => void;
  setColumnFilter: (columnId: string, value: unknown) => void;
  resetColumnFilters: () => void;
  resetGlobalFilter: () => void;
  getFilteredColumnIds: () => string[];
}

export type PivotTableWithFiltering<
  TData extends RowData,
  TState extends FilteringTableState = FilteringTableState,
> = PivotTableInstance<TData, TState> & {
  filtering: FilteringApi<TData, TState>;
};

type RowFilterFn = (rowValue: unknown, filterValue: unknown, row: Row<RowData>) => boolean;
type GlobalFilterFn = (
  row: Row<RowData>,
  globalFilter: unknown,
  columnIds: string[],
) => boolean;

export interface FilteringPluginOptions {
  rowFilterFn?: RowFilterFn;
  globalFilterFn?: GlobalFilterFn;
}

function areFiltersEqual(next: ColumnFilter[], previous: ColumnFilter[]): boolean {
  if (next.length !== previous.length) {
    return false;
  }

  for (let index = 0; index < next.length; index += 1) {
    if (next[index].id !== previous[index].id || next[index].value !== previous[index].value) {
      return false;
    }
  }

  return true;
}

function normalizeText(value: unknown): string {
  if (value == null) {
    return '';
  }
  return String(value).toLowerCase().trim();
}

function defaultRowFilterFn(rowValue: unknown, filterValue: unknown): boolean {
  if (filterValue == null || filterValue === '') {
    return true;
  }

  if (Array.isArray(filterValue)) {
    return filterValue.some((item) => defaultRowFilterFn(rowValue, item));
  }

  const normalizedFilterValue = normalizeText(filterValue);
  const normalizedRowValue = normalizeText(rowValue);
  return normalizedRowValue.includes(normalizedFilterValue);
}

function defaultGlobalFilterFn(
  row: Row<RowData>,
  globalFilter: unknown,
  columnIds: string[],
): boolean {
  if (globalFilter == null || globalFilter === '') {
    return true;
  }

  return columnIds.some((columnId) =>
    defaultRowFilterFn(row.getValue(columnId), globalFilter),
  );
}

export function createFilteringPlugin<
  TData extends RowData,
  TState extends FilteringTableState = FilteringTableState,
>(options: FilteringPluginOptions = {}): PivotTablePlugin<TData, TState> {
  const rowFilterFn = options.rowFilterFn ?? defaultRowFilterFn;
  const globalFilterFn = options.globalFilterFn ?? defaultGlobalFilterFn;

  let lastRowsRef: Row<TData>[] | null = null;
  let lastColumnsRef: string[] = [];
  let lastFiltersRef: ColumnFilter[] = [];
  let lastGlobalFilterRef: unknown = undefined;
  let lastResultRef: Row<TData>[] | null = null;

  return {
    name: 'filtering',
    getInitialState: (state) => ({
      ...state,
      filters: state.filters ?? [],
      globalFilter: state.globalFilter ?? undefined,
    }),
    transformRows: (rows, context) => {
      const columnFilters = context.state.filters ?? [];
      const globalFilter = context.state.globalFilter;
      const filterableColumnIds = context.columns
        .filter((column) => column.enableFiltering !== false)
        .map((column) => column.id);

      if (
        lastRowsRef === rows &&
        lastResultRef &&
        filterableColumnIds.length === lastColumnsRef.length &&
        filterableColumnIds.every((columnId, index) => columnId === lastColumnsRef[index]) &&
        areFiltersEqual(columnFilters, lastFiltersRef) &&
        globalFilter === lastGlobalFilterRef
      ) {
        return lastResultRef;
      }

      if (columnFilters.length === 0 && (globalFilter == null || globalFilter === '')) {
        lastRowsRef = rows;
        lastColumnsRef = filterableColumnIds.slice();
        lastFiltersRef = columnFilters.slice();
        lastGlobalFilterRef = globalFilter;
        lastResultRef = rows;
        return rows;
      }

      const filteredRows = rows.filter((row) => {
        for (const filter of columnFilters) {
          if (!filterableColumnIds.includes(filter.id)) {
            continue;
          }

          if (!rowFilterFn(row.getValue(filter.id), filter.value, row as Row<RowData>)) {
            return false;
          }
        }

        if (!globalFilterFn(row as Row<RowData>, globalFilter, filterableColumnIds)) {
          return false;
        }

        return true;
      });

      lastRowsRef = rows;
      lastColumnsRef = filterableColumnIds.slice();
      lastFiltersRef = columnFilters.slice();
      lastGlobalFilterRef = globalFilter;
      lastResultRef = filteredRows;
      return filteredRows;
    },
    onStateChange: (state, previousState, context) => {
      const nextFilters = state.filters ?? [];
      const previousFilters = previousState.filters ?? [];
      if (areFiltersEqual(nextFilters, previousFilters)) {
        return;
      }

      const validColumns = new Set(context.columns.map((column) => column.id));
      const normalizedFilters = nextFilters.filter((filter) => validColumns.has(filter.id));

      if (normalizedFilters.length !== nextFilters.length) {
        context.setState((previous) => ({
          ...previous,
          filters: normalizedFilters,
        }));
      }
    },
  };
}

export const useFiltering = createFilteringPlugin;

export function createFilteringApi<
  TData extends RowData,
  TState extends FilteringTableState = FilteringTableState,
>(table: PivotTableInstance<TData, TState>): FilteringApi<TData, TState> {
  let lastFiltersRef: ColumnFilter[] | null = null;
  let lastFilteredColumnIdsRef: string[] = [];

  const getColumnFilters = () => table.getState().filters ?? [];

  return {
    getColumnFilters,
    getGlobalFilter: () => table.getState().globalFilter,
    setColumnFilters: (updater) => {
      table.setState((previous) => {
        const previousFilters = previous.filters ?? [];
        const nextFilters =
          typeof updater === 'function'
            ? updater(previousFilters)
            : updater;

        return {
          ...previous,
          filters: nextFilters,
        };
      });
    },
    setGlobalFilter: (value) => {
      table.setState((previous) => ({
        ...previous,
        globalFilter: value,
      }));
    },
    setColumnFilter: (columnId, value) => {
      table.setState((previous) => {
        const previousFilters = previous.filters ?? [];
        const nextFilters = previousFilters.filter((filter) => filter.id !== columnId);

        if (value != null && value !== '') {
          nextFilters.push({ id: columnId, value });
        }

        return {
          ...previous,
          filters: nextFilters,
        };
      });
    },
    resetColumnFilters: () => {
      table.setState((previous) => ({
        ...previous,
        filters: [],
      }));
    },
    resetGlobalFilter: () => {
      table.setState((previous) => ({
        ...previous,
        globalFilter: undefined,
      }));
    },
    getFilteredColumnIds: () => {
      const filters = getColumnFilters();
      if (lastFiltersRef === filters) {
        return lastFilteredColumnIdsRef;
      }

      lastFiltersRef = filters;
      lastFilteredColumnIdsRef = filters.map((filter) => filter.id);
      return lastFilteredColumnIdsRef;
    },
  };
}

export function withFiltering<
  TData extends RowData,
  TState extends FilteringTableState = FilteringTableState,
>(table: PivotTableInstance<TData, TState>): PivotTableWithFiltering<TData, TState> {
  return Object.assign(table, {
    filtering: createFilteringApi(table),
  });
}
