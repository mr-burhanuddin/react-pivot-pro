import { StoreApi } from 'zustand/vanilla';

interface Row<TData extends RowData> {
    id: string;
    index: number;
    original: TData;
    values: Record<string, unknown>;
    getValue: <TValue = unknown>(columnId: string) => TValue | undefined;
}
interface RowModel<TData extends RowData> {
    rows: Row<TData>[];
    flatRows: Row<TData>[];
    rowsById: Record<string, Row<TData>>;
}

type Updater<T> = T | ((previous: T) => T);
interface SortingRule {
    id: string;
    desc: boolean;
}
interface ColumnFilter {
    id: string;
    value: unknown;
}
interface TableState {
    sorting: SortingRule[];
    filters: ColumnFilter[];
    columnVisibility: Record<string, boolean>;
    rowSelection: Record<string, boolean>;
    expanded: Record<string, boolean>;
}
declare function createDefaultTableState(): TableState;

interface PivotTablePluginContext<TData extends RowData, TState extends TableState = TableState> {
    columns: Column<TData>[];
    data: TData[];
    state: TState;
    setState: (updater: Updater<TState>) => void;
    getColumnById: (columnId: string) => Column<TData> | undefined;
}
interface PivotTablePlugin<TData extends RowData, TState extends TableState = TableState> {
    name: string;
    getInitialState?: (state: TState) => Partial<TState>;
    transformRows?: (rows: Row<TData>[], context: PivotTablePluginContext<TData, TState>) => Row<TData>[];
    onStateChange?: (state: TState, previousState: TState, context: PivotTablePluginContext<TData, TState>) => void;
}

type RowData = Record<string, unknown>;
interface PivotTableOptions<TData extends RowData, TState extends TableState = TableState> {
    data: TData[];
    columns: ColumnDef<TData>[];
    state?: Partial<TState>;
    initialState?: Partial<TState>;
    onStateChange?: (nextState: TState, previousState: TState) => void;
    plugins?: PivotTablePlugin<TData, TState>[];
    getRowId?: (originalRow: TData, index: number) => string;
    defaultColumn?: Partial<ColumnDef<TData>>;
}
interface PivotTableInstance<TData extends RowData, TState extends TableState = TableState> {
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

interface ColumnDef<TData extends RowData, TValue = unknown> {
    id?: string;
    accessorKey?: Extract<keyof TData, string>;
    accessorFn?: (originalRow: TData, index: number) => TValue;
    header?: string;
    meta?: Record<string, unknown>;
    enableSorting?: boolean;
    enableFiltering?: boolean;
    cell?: (val: any, row: any) => React.ReactNode;
    width?: number;
    pivot?: {
        aggregator: 'sum' | 'count' | 'avg' | 'min' | 'max';
    };
}
interface Column<TData extends RowData, TValue = unknown> extends Omit<ColumnDef<TData, TValue>, 'id'> {
    id: string;
}

declare function usePivotTable<TData extends RowData, TState extends TableState = TableState>(options: PivotTableOptions<TData, TState>): PivotTableInstance<TData, TState>;

interface StateValidator<TState extends TableState = TableState> {
    name: string;
    validate: (state: Partial<TState>) => {
        valid: boolean;
        message?: string;
    };
}
interface PivotTableStore<TState extends TableState> {
    state: TState;
    setState: (updater: Updater<TState>) => void;
    resetState: (nextState: TState) => void;
    addValidator: (validator: StateValidator<TState>) => void;
    removeValidator: (name: string) => void;
}
declare function createPivotTableStore<TState extends TableState>(initialState: TState): StoreApi<PivotTableStore<TState>>;

interface PluginManifest {
    name: string;
    stateKeys: string[];
    conflictsWith: string[];
    description?: string;
}
interface PluginRegistry<TState extends TableState = TableState> {
    register: (plugin: PivotTablePlugin<any, TState>, manifest: PluginManifest) => void;
    unregister: (pluginName: string) => boolean;
    getPlugin: (name: string) => PivotTablePlugin<any, TState> | undefined;
    getManifest: (name: string) => PluginManifest | undefined;
    getAll: () => PivotTablePlugin<any, TState>[];
    getAllManifests: () => PluginManifest[];
    hasConflict: (name: string) => {
        hasConflict: boolean;
        conflictsWith: string[];
    };
}
declare function createPluginRegistry<TState extends TableState = TableState>(): PluginRegistry<TState>;
declare const DEFAULT_MANIFESTS: Record<string, PluginManifest>;

export { type Column, type ColumnDef, type ColumnFilter, DEFAULT_MANIFESTS, type PivotTableInstance, type PivotTableOptions, type PivotTablePlugin, type PivotTablePluginContext, type PivotTableStore, type PluginManifest, type PluginRegistry, type Row, type RowData, type RowModel, type SortingRule, type StateValidator, type TableState, type Updater, createDefaultTableState, createPivotTableStore, createPluginRegistry, usePivotTable };
