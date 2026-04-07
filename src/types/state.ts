export type Updater<T> = T | ((previous: T) => T);

export interface SortingRule {
  id: string;
  desc: boolean;
}

/**
 * Column filter with operator support
 * @property id - Column ID to filter on
 * @property value - Filter value (format depends on filterType/operator)
 * @property filterType - Type of filter (text, number, date, enum, boolean)
 * @property operator - Filter operator (default varies by filterType)
 */
export interface ColumnFilter {
  id: string;
  value: unknown;
  /** Filter type - determines which operator to use */
  filterType?: 'text' | 'number' | 'date' | 'enum' | 'boolean';
  /** Filter operator - defaults to 'contains' for text, 'eq' for others */
  operator?: 'contains' | 'startsWith' | 'endsWith' | 'equals' | 'notEquals' |
             'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' |
             'in' | 'notIn';
}

export interface TableState {
  sorting: SortingRule[];
  filters: ColumnFilter[];
  columnVisibility: Record<string, boolean>;
  rowSelection: Record<string, boolean>;
  expanded: Record<string, boolean>;
}

export function createDefaultTableState(): TableState {
  return {
    sorting: [],
    filters: [],
    columnVisibility: {},
    rowSelection: {},
    expanded: {},
  };
}
