export type Updater<T> = T | ((previous: T) => T);

export interface SortingRule {
  id: string;
  desc: boolean;
}

export type FilterType = 'text' | 'number' | 'date' | 'enum';

export type TextFilterOperator = 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'notContains';
export type NumberFilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'between';
export type DateFilterOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'between' | 'isEmpty' | 'isNotEmpty';
export type EnumFilterOperator = 'in' | 'notIn';

export interface TextFilterValue {
  operator: TextFilterOperator;
  value: string;
}

export interface NumberFilterValue {
  operator: NumberFilterOperator;
  value: number;
  value2?: number;
}

export interface DateFilterValue {
  operator: DateFilterOperator;
  value: string;
  value2?: string;
}

export interface EnumFilterValue {
  operator: EnumFilterOperator;
  values: string[];
}

export type FilterValue =
  | TextFilterValue
  | NumberFilterValue
  | DateFilterValue
  | EnumFilterValue;

export interface ColumnFilter<TType extends FilterType = FilterType> {
  id: string;
  type: TType;
  value: TType extends 'text' ? TextFilterValue
    : TType extends 'number' ? NumberFilterValue
    : TType extends 'date' ? DateFilterValue
    : EnumFilterValue;
}

export interface LegacyColumnFilter {
  id: string;
  value: unknown;
}

export interface TableState {
  sorting: SortingRule[];
  filters: (ColumnFilter | LegacyColumnFilter)[];
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
