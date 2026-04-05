import type { RowData } from './table';

export interface ColumnDef<TData extends RowData, TValue = unknown> {
  id?: string;
  accessorKey?: Extract<keyof TData, string>;
  accessorFn?: (originalRow: TData, index: number) => TValue;
  header?: string;
  meta?: Record<string, unknown>;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  cell?: (val: TValue, row: TData) => React.ReactNode;
  width?: number;
  pivot?: { aggregator: 'sum' | 'count' | 'avg' | 'min' | 'max' };
}

export interface Column<TData extends RowData, TValue = unknown>
  extends Omit<ColumnDef<TData, TValue>, 'id'> {
  id: string;
}
