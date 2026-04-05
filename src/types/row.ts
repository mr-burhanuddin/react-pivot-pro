import type { RowData } from './table';

export interface RowMeta {
  isSubtotal?: boolean;
  isGrandTotal?: boolean;
  [key: string]: unknown;
}

export interface Row<TData extends RowData> {
  id: string;
  index: number;
  original: TData;
  values: Record<string, unknown>;
  getValue: <TValue = unknown>(columnId: string) => TValue | undefined;
  meta?: RowMeta;
}

export interface RowModel<TData extends RowData> {
  rows: Row<TData>[];
  flatRows: Row<TData>[];
  rowsById: Record<string, Row<TData>>;
}
