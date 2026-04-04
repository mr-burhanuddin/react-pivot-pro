export type Updater<T> = T | ((previous: T) => T);

export interface SortingRule {
  id: string;
  desc: boolean;
}

export interface ColumnFilter {
  id: string;
  value: unknown;
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
