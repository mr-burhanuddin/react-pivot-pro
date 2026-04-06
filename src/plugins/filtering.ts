import { useMemo } from 'react';
import type {
  FilterType,
  TextFilterOperator,
  NumberFilterOperator,
  DateFilterOperator,
  EnumFilterOperator,
  TextFilterValue,
  NumberFilterValue,
  DateFilterValue,
  EnumFilterValue,
  ColumnFilter,
  LegacyColumnFilter,
} from '../types/state';

export type {
  FilterType,
  TextFilterOperator,
  NumberFilterOperator,
  DateFilterOperator,
  EnumFilterOperator,
  TextFilterValue,
  NumberFilterValue,
  DateFilterValue,
  EnumFilterValue,
  ColumnFilter,
  LegacyColumnFilter,
};

import type {
  PivotTableInstance,
  PivotTablePlugin,
  Row,
  RowData,
  TableState,
} from '../types';

export interface FilteringTableState extends TableState {
  filters: (ColumnFilter | LegacyColumnFilter)[];
  globalFilter?: unknown;
}

export interface FilteringApi<
  TData extends RowData,
  TState extends FilteringTableState = FilteringTableState,
> {
  getColumnFilters: () => (ColumnFilter | LegacyColumnFilter)[];
  getGlobalFilter: () => unknown;
  setColumnFilters: (
    updater: (ColumnFilter | LegacyColumnFilter)[] | ((previous: (ColumnFilter | LegacyColumnFilter)[]) => (ColumnFilter | LegacyColumnFilter)[]),
  ) => void;
  setGlobalFilter: (value: unknown) => void;
  setColumnFilter: (columnId: string, filter: ColumnFilter | LegacyColumnFilter | null) => void;
  setTextFilter: (columnId: string, operator: TextFilterOperator, value: string) => void;
  setNumberFilter: (columnId: string, operator: NumberFilterOperator, value: number, value2?: number) => void;
  setDateFilter: (columnId: string, operator: DateFilterOperator, value: string, value2?: string) => void;
  setEnumFilter: (columnId: string, operator: EnumFilterOperator, values: string[]) => void;
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

type RowFilterFn<TType extends FilterType = FilterType> = (
  rowValue: unknown,
  filter: ColumnFilter<TType> | LegacyColumnFilter,
  row: Row<RowData>
) => boolean;
type GlobalFilterFn = (
  row: Row<RowData>,
  globalFilter: unknown,
  columnIds: string[],
) => boolean;

export interface FilteringPluginOptions {
  rowFilterFn?: RowFilterFn;
  globalFilterFn?: GlobalFilterFn;
  enableLegacyFilter?: boolean;
}

function normalizeText(value: unknown): string {
  if (value == null) {
    return '';
  }
  return String(value).toLowerCase().trim();
}

function normalizeNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

function isEmptyValue(value: unknown): boolean {
  return value == null || value === '' || (Array.isArray(value) && value.length === 0);
}

function applyTextFilter(rowValue: unknown, filter: TextFilterValue): boolean {
  const text = normalizeText(rowValue);
  const searchValue = normalizeText(filter.value);

  switch (filter.operator) {
    case 'contains':
      return text.includes(searchValue);
    case 'equals':
      return text === searchValue;
    case 'startsWith':
      return text.startsWith(searchValue);
    case 'endsWith':
      return text.endsWith(searchValue);
    case 'notContains':
      return !text.includes(searchValue);
    default:
      return true;
  }
}

function applyNumberFilter(rowValue: unknown, filter: NumberFilterValue): boolean {
  const num = normalizeNumber(rowValue);
  if (num === null) return false;

  switch (filter.operator) {
    case 'eq':
      return num === filter.value;
    case 'neq':
      return num !== filter.value;
    case 'gt':
      return num > filter.value;
    case 'gte':
      return num >= filter.value;
    case 'lt':
      return num < filter.value;
    case 'lte':
      return num <= filter.value;
    case 'between':
      return num >= filter.value && num <= (filter.value2 ?? filter.value);
    default:
      return true;
  }
}

function applyDateFilter(rowValue: unknown, filter: DateFilterValue): boolean {
  if (filter.operator === 'isEmpty') {
    return isEmptyValue(rowValue);
  }

  if (filter.operator === 'isNotEmpty') {
    return !isEmptyValue(rowValue);
  }

  if (isEmptyValue(rowValue)) {
    return false;
  }

  const rowDate = new Date(String(rowValue)).getTime();
  if (isNaN(rowDate)) return false;

  const filterDate = new Date(filter.value).getTime();
  if (isNaN(filterDate)) return false;

  switch (filter.operator) {
    case 'eq':
      return rowDate === filterDate;
    case 'neq':
      return rowDate !== filterDate;
    case 'gt':
      return rowDate > filterDate;
    case 'lt':
      return rowDate < filterDate;
    case 'between':
      const endDate = filter.value2 ? new Date(filter.value2).getTime() : filterDate;
      return rowDate >= filterDate && rowDate <= endDate;
    default:
      return true;
  }
}

function applyEnumFilter(rowValue: unknown, filter: EnumFilterValue): boolean {
  const text = normalizeText(rowValue);
  const values = filter.values.map(normalizeText);

  switch (filter.operator) {
    case 'in':
      return values.includes(text);
    case 'notIn':
      return !values.includes(text);
    default:
      return true;
  }
}

function applyFilter(
  rowValue: unknown,
  filter: ColumnFilter | LegacyColumnFilter,
  row: Row<RowData>,
): boolean {
  if (!('type' in filter)) {
    if (filter.value == null || filter.value === '') {
      return true;
    }
    if (Array.isArray(filter.value)) {
      return (filter.value as unknown[]).some((item) => {
        const normalizedFilter = normalizeText(item);
        const normalizedRow = normalizeText(rowValue);
        return normalizedRow.includes(normalizedFilter);
      });
    }
    const normalizedFilter = normalizeText(filter.value);
    const normalizedRow = normalizeText(rowValue);
    return normalizedRow.includes(normalizedFilter);
  }

  switch (filter.type) {
    case 'text':
      return applyTextFilter(rowValue, filter.value as TextFilterValue);
    case 'number':
      return applyNumberFilter(rowValue, filter.value as NumberFilterValue);
    case 'date':
      return applyDateFilter(rowValue, filter.value as DateFilterValue);
    case 'enum':
      return applyEnumFilter(rowValue, filter.value as EnumFilterValue);
    default:
      return true;
  }
}

function areFiltersEqual(
  next: (ColumnFilter | LegacyColumnFilter)[],
  previous: (ColumnFilter | LegacyColumnFilter)[],
): boolean {
  if (next.length !== previous.length) {
    return false;
  }

  for (let index = 0; index < next.length; index += 1) {
    const nextFilter = next[index];
    const prevFilter = previous[index];
    
    if (nextFilter.id !== prevFilter.id) {
      return false;
    }

    const nextVal = 'value' in nextFilter && !('type' in nextFilter) ? nextFilter.value : nextFilter;
    const prevVal = 'value' in prevFilter && !('type' in prevFilter) ? prevFilter.value : prevFilter;
    
    if (JSON.stringify(nextVal) !== JSON.stringify(prevVal)) {
      return false;
    }
  }

  return true;
}

function defaultGlobalFilterFn(
  row: Row<RowData>,
  globalFilter: unknown,
  columnIds: string[],
): boolean {
  if (globalFilter == null || globalFilter === '') {
    return true;
  }

  return columnIds.some((columnId) => {
    const val = row.getValue(columnId);
    const normalizedFilter = normalizeText(globalFilter);
    const normalizedRow = normalizeText(val);
    return normalizedRow.includes(normalizedFilter);
  });
}

export function createFilteringPlugin<
  TData extends RowData,
  TState extends FilteringTableState = FilteringTableState,
>(options: FilteringPluginOptions = {}): PivotTablePlugin<TData, TState> {
  const { enableLegacyFilter = true } = options;
  const globalFilterFn = options.globalFilterFn ?? defaultGlobalFilterFn;

  const cache = {
    rows: null as Row<TData>[] | null,
    filterableIds: [] as string[],
    filters: [] as (ColumnFilter | LegacyColumnFilter)[],
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
      const activeFilters = columnFilters.filter((f) => filterableSet.has(f.id));
      const len = rows.length;
      const result: Row<TData>[] = [];

      for (let i = 0; i < len; i++) {
        const row = rows[i];
        let passes = true;

        for (let f = 0; f < activeFilters.length; f += 1) {
          const filter = activeFilters[f];
          if (!applyFilter(row.values[filter.id], filter, row as Row<RowData>)) {
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
          `[FilteringPlugin] Unknown column filters: ${invalidFilters.map((f) => f.id).join(', ')}`,
          'Valid columns:',
          Array.from(validColumns),
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
  return useMemo(() => createFilteringApi(table), [table]);
}

export function createFilteringApi<
  TData extends RowData,
  TState extends FilteringTableState = FilteringTableState,
>(table: PivotTableInstance<TData, TState>): FilteringApi<TData, TState> {
  let lastFiltersRef: (ColumnFilter | LegacyColumnFilter)[] | null = null;
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
    setColumnFilter: (columnId, filter) => {
      table.setState((previous) => {
        const previousFilters = previous.filters ?? [];
        const nextFilters = previousFilters.filter((f) => f.id !== columnId);

        if (filter != null) {
          nextFilters.push(filter);
        }

        return {
          ...previous,
          filters: nextFilters,
        };
      });
    },
    setTextFilter: (columnId, operator, value) => {
      table.setState((previous) => {
        const previousFilters = previous.filters ?? [];
        const nextFilters = previousFilters.filter((f) => f.id !== columnId);

        nextFilters.push({
          id: columnId,
          type: 'text' as const,
          value: { operator, value },
        });

        return {
          ...previous,
          filters: nextFilters,
        };
      });
    },
    setNumberFilter: (columnId, operator, value, value2) => {
      table.setState((previous) => {
        const previousFilters = previous.filters ?? [];
        const nextFilters = previousFilters.filter((f) => f.id !== columnId);

        nextFilters.push({
          id: columnId,
          type: 'number' as const,
          value: { operator, value, value2 },
        });

        return {
          ...previous,
          filters: nextFilters,
        };
      });
    },
    setDateFilter: (columnId, operator, value, value2) => {
      table.setState((previous) => {
        const previousFilters = previous.filters ?? [];
        const nextFilters = previousFilters.filter((f) => f.id !== columnId);

        nextFilters.push({
          id: columnId,
          type: 'date' as const,
          value: { operator, value, value2 },
        });

        return {
          ...previous,
          filters: nextFilters,
        };
      });
    },
    setEnumFilter: (columnId, operator, values) => {
      table.setState((previous) => {
        const previousFilters = previous.filters ?? [];
        const nextFilters = previousFilters.filter((f) => f.id !== columnId);

        nextFilters.push({
          id: columnId,
          type: 'enum' as const,
          value: { operator, values },
        });

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
