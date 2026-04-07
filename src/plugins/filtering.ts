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
  setColumnFilter: (
    columnId: string,
    value: unknown,
    filterType?: ColumnFilter['filterType'],
    operator?: ColumnFilter['operator']
  ) => void;
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
    if (next[index].id !== previous[index].id ||
        next[index].value !== previous[index].value ||
        next[index].filterType !== previous[index].filterType ||
        next[index].operator !== previous[index].operator) {
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

// ─── Filter Functions by Type ─────────────────────────────────────────────────

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function toDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

// Text filter operations
function applyTextFilter(
  rowValue: unknown,
  filterValue: unknown,
  operator: 'contains' | 'startsWith' | 'endsWith' | 'equals' | 'notEquals' = 'contains'
): boolean {
  if (filterValue == null || filterValue === '') {
    return true;
  }

  const normalizedRow = normalizeText(rowValue);
  const normalizedFilter = normalizeText(filterValue);

  switch (operator) {
    case 'startsWith':
      return normalizedRow.startsWith(normalizedFilter);
    case 'endsWith':
      return normalizedRow.endsWith(normalizedFilter);
    case 'equals':
      return normalizedRow === normalizedFilter;
    case 'notEquals':
      return normalizedRow !== normalizedFilter;
    case 'contains':
    default:
      return normalizedRow.includes(normalizedFilter);
  }
}

// Number filter operations
function applyNumberFilter(
  rowValue: unknown,
  filterValue: unknown,
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' = 'eq'
): boolean {
  const rowNum = toNumber(rowValue);

  if (rowNum === null) return false;

  // Handle array value for 'between' operator
  if (operator === 'between') {
    if (Array.isArray(filterValue)) {
      const [min, max] = filterValue;
      const minNum = toNumber(min);
      const maxNum = toNumber(max);
      if (minNum !== null && rowNum < minNum) return false;
      if (maxNum !== null && rowNum > maxNum) return false;
      return true;
    }
    return false;
  }

  const filterNum = toNumber(filterValue);
  if (filterNum === null && operator !== 'eq') return false;

  switch (operator) {
    case 'eq':
      return rowNum === filterNum;
    case 'neq':
      return rowNum !== filterNum;
    case 'gt':
      return rowNum > filterNum!;
    case 'gte':
      return rowNum >= filterNum!;
    case 'lt':
      return rowNum < filterNum!;
    case 'lte':
      return rowNum <= filterNum!;
    default:
      return true;
  }
}

// Date filter operations
function applyDateFilter(
  rowValue: unknown,
  filterValue: unknown,
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' = 'eq'
): boolean {
  const rowDate = toDate(rowValue);

  if (rowDate === null) return false;

  // Handle array value for 'between' operator
  if (operator === 'between') {
    if (Array.isArray(filterValue)) {
      const [min, max] = filterValue;
      const minDate = toDate(min);
      const maxDate = toDate(max);
      if (minDate !== null && rowDate < minDate) return false;
      if (maxDate !== null && rowDate > maxDate) return false;
      return true;
    }
    return false;
  }

  const filterDate = toDate(filterValue);
  if (filterDate === null && operator !== 'eq') return false;

  const rowTime = rowDate.getTime();
  const filterTime = filterDate!.getTime();

  switch (operator) {
    case 'eq':
      return rowTime === filterTime;
    case 'neq':
      return rowTime !== filterTime;
    case 'gt':
      return rowTime > filterTime;
    case 'gte':
      return rowTime >= filterTime;
    case 'lt':
      return rowTime < filterTime;
    case 'lte':
      return rowTime <= filterTime;
    default:
      return true;
  }
}

// Enum filter operations (multi-select)
function applyEnumFilter(
  rowValue: unknown,
  filterValue: unknown,
  operator: 'in' | 'notIn' = 'in'
): boolean {
  if (filterValue == null || (Array.isArray(filterValue) && filterValue.length === 0)) {
    return true;
  }

  const rowStr = String(rowValue ?? '');
  const filterValues = Array.isArray(filterValue) ? filterValue.map(String) : [String(filterValue)];

  switch (operator) {
    case 'in':
      return filterValues.includes(rowStr);
    case 'notIn':
      return !filterValues.includes(rowStr);
    default:
      return true;
  }
}

// Boolean filter
function applyBooleanFilter(rowValue: unknown, filterValue: unknown): boolean {
  const rowBool = Boolean(rowValue);
  const filterBool = Boolean(filterValue);
  return rowBool === filterBool;
}

// Main filter application dispatcher
function applyColumnFilter(rowValue: unknown, filter: ColumnFilter): boolean {
  const { filterType = 'text', operator = 'contains', value } = filter;

  switch (filterType) {
    case 'number':
      return applyNumberFilter(rowValue, value, operator as 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'between');
    case 'date':
      return applyDateFilter(rowValue, value, operator as 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'between');
    case 'enum':
      return applyEnumFilter(rowValue, value, operator as 'in' | 'notIn');
    case 'boolean':
      return applyBooleanFilter(rowValue, value);
    case 'text':
    default:
      return applyTextFilter(rowValue, value, operator as 'contains' | 'startsWith' | 'endsWith' | 'equals' | 'notEquals');
  }
}

// ─── Legacy default filter functions (for backward compatibility) ─────────────

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

  const cache = {
    rows: null as Row<TData>[] | null,
    filterableIds: [] as string[],
    filters: [] as ColumnFilter[],
    globalFilter: undefined as unknown,
    result: null as Row<TData>[] | null,
  };

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
      
      const filterableIds = context.columns
        .filter((column) => column.enableFiltering !== false)
        .map((column) => column.id);

      if (
        cache.rows === rows &&
        cache.result &&
        filterableIds.length === cache.filterableIds.length &&
        filterableIds.every((id, i) => id === cache.filterableIds[i]) &&
        areFiltersEqual(columnFilters, cache.filters) &&
        globalFilter === cache.globalFilter
      ) {
        return cache.result;
      }

      if (columnFilters.length === 0 && (globalFilter == null || globalFilter === '')) {
        cache.rows = rows;
        cache.filterableIds = filterableIds;
        cache.filters = columnFilters;
        cache.globalFilter = globalFilter;
        cache.result = rows;
        return rows;
      }

      const filterableSet = new Set(filterableIds);
      const activeFilters = columnFilters.filter(f => filterableSet.has(f.id));
      const len = rows.length;
      const result: Row<TData>[] = [];

      for (let i = 0; i < len; i++) {
        const row = rows[i];
        let passes = true;

        for (let f = 0; f < activeFilters.length; f++) {
          const filter = activeFilters[f];
          if (!applyColumnFilter(row.values[filter.id], filter)) {
            passes = false;
            break;
          }
        }

        if (passes && globalFilter != null && globalFilter !== '') {
          if (!globalFilterFn(row as Row<RowData>, globalFilter, filterableIds)) {
            passes = false;
          }
        }

        if (passes) {
          result.push(row);
        }
      }

      cache.rows = rows;
      cache.filterableIds = filterableIds;
      cache.filters = columnFilters;
      cache.globalFilter = globalFilter;
      cache.result = result;
      return result;
    },
    onStateChange: (state, previousState, context) => {
      const nextFilters = state.filters ?? [];
      const previousFilters = previousState.filters ?? [];
      if (areFiltersEqual(nextFilters, previousFilters)) {
        return;
      }

      const validColumns = new Set(context.columns.map((column) => column.id));
      const normalizedFilters = nextFilters.filter((filter) => validColumns.has(filter.id));

      const invalidFilters = nextFilters.filter((filter) => !validColumns.has(filter.id));
      if (invalidFilters.length > 0 && process.env.NODE_ENV !== 'production') {
        console.warn(
          `[FilteringPlugin] Unknown column filters: ${invalidFilters.map(f => f.id).join(', ')}`,
          'Valid columns:', Array.from(validColumns)
        );
      }

      if (normalizedFilters.length !== nextFilters.length) {
        context.setState((previous) => ({
          ...previous,
          filters: normalizedFilters,
        }));
      }
    },
  };
}

export function useFiltering<
  TData extends RowData,
  TState extends FilteringTableState = FilteringTableState,
>(table: PivotTableInstance<TData, TState>): FilteringApi<TData, TState> {
  return createFilteringApi(table);
}

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
            ? [...updater(previousFilters)]
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
    setColumnFilter: (columnId, value, filterType, operator) => {
      table.setState((previous) => {
        const previousFilters = previous.filters ?? [];
        const nextFilters = previousFilters.filter((filter) => filter.id !== columnId);

        if (value != null && value !== '') {
          nextFilters.push({ id: columnId, value, filterType, operator });
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
