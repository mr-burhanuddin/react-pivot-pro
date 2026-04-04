import type { Column } from './column';
import type { Row } from './row';
import type { TableState, Updater } from './state';
import type { RowData } from './table';

export interface PivotTablePluginContext<
  TData extends RowData,
  TState extends TableState = TableState,
> {
  columns: Column<TData>[];
  data: TData[];
  state: TState;
  setState: (updater: Updater<TState>) => void;
  getColumnById: (columnId: string) => Column<TData> | undefined;
}

export interface PivotTablePlugin<
  TData extends RowData,
  TState extends TableState = TableState,
> {
  name: string;
  getInitialState?: (state: TState) => Partial<TState>;
  transformRows?: (
    rows: Row<TData>[],
    context: PivotTablePluginContext<TData, TState>,
  ) => Row<TData>[];
  onStateChange?: (
    state: TState,
    previousState: TState,
    context: PivotTablePluginContext<TData, TState>,
  ) => void;
}
