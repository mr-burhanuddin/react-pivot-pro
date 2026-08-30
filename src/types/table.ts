import type { Column, ColumnDef } from './column';
import type { PivotTablePlugin } from './plugin';
import type { RowModel } from './row';
import type { RowData } from './rowData';
import type { TableState, Updater } from './state';
import type { ComputeConfig } from '../compute/types';

export type { RowData } from './rowData';

export interface PivotTableOptions<
  TData extends RowData,
  TState extends TableState = TableState,
> {
  data: TData[];
  columns: ColumnDef<TData>[];
  state?: Partial<TState>;
  initialState?: Partial<TState>;
  onStateChange?: (nextState: TState, previousState: TState) => void;
  plugins?: PivotTablePlugin<TData, TState>[];
  getRowId?: (originalRow: TData, index: number) => string;
  defaultColumn?: Partial<ColumnDef<TData>>;
  /**
   * Optional compute configuration for pivot/aggregation offload.
   * When omitted, behaves as today (synchronous CPU). When provided with mode 'auto' | 'cpu' | 'webgpu',
   * pivot engine may use ComputeController (CPU baseline, WebGPU optional, Worker optional).
   * SSR-safe: undefined → CPU.
   */
  compute?: ComputeConfig;
}

export interface PivotTableInstance<
  TData extends RowData,
  TState extends TableState = TableState,
> {
  state: TState;
  columns: Column<TData>[];
  rowModel: RowModel<TData>;
  getState: () => TState;
  setState: (updater: Updater<TState>) => void;
  getCoreRowModel: () => RowModel<TData>;
  getRowModel: () => RowModel<TData>;
  registerPlugin: (plugin: PivotTablePlugin<TData, TState>) => void;
  unregisterPlugin: (pluginName: string) => boolean;
  getPlugin: (pluginName: string) => PivotTablePlugin<TData, TState> | undefined;
  getAllPlugins: () => PivotTablePlugin<TData, TState>[];
}
