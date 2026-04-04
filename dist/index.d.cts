import { R as RowData, T as TableState, c as PivotTableOptions, a as PivotTableInstance } from './column-BnhUd1tF.cjs';
export { d as Column, e as ColumnDef, C as ColumnFilter, P as PivotTablePlugin, f as PivotTablePluginContext, b as Row, g as RowModel, S as SortingRule, U as Updater, h as createDefaultTableState } from './column-BnhUd1tF.cjs';
export { A as AggregationFn, a as AggregationInput, b as aggregationFns, c as createPivotEngineResult, d as createPivotPlugin, r as resolveAggregationFn, u as usePivot, w as withPivot } from './pivot-t7B_evGK.cjs';
export { DEFAULT_MANIFESTS, PivotTableStore, PluginManifest, PluginRegistry, StateValidator, createPivotTableStore, createPluginRegistry } from './store/index.cjs';
export { useVirtualRows } from './hooks/index.cjs';
import { VirtualizerOptions, Virtualizer, VirtualItem } from '@tanstack/virtual-core';
export { createSortingPlugin, useSorting, withSorting } from './plugins/sorting.cjs';
export { createFilteringPlugin, useFiltering, withFiltering } from './plugins/filtering.cjs';
export { createGroupingPlugin, useGrouping, withGrouping } from './plugins/grouping.cjs';
export { createColumnVisibilityPlugin, withColumnVisibility } from './plugins/columnVisibility.cjs';
export { createColumnOrderingPlugin, withColumnOrdering } from './plugins/columnOrdering.cjs';
export { createColumnPinningPlugin, withColumnPinning } from './plugins/columnPinning.cjs';
export { createDndRowPlugin, useDndRow, withDndRow } from './plugins/dndRow.cjs';
export { createDndColumnPlugin, useDndColumn, withDndColumn } from './plugins/dndColumn.cjs';
import 'zustand/vanilla';
import '@dnd-kit/core';

declare function usePivotTable<TData extends RowData, TState extends TableState = TableState>(options: PivotTableOptions<TData, TState>): PivotTableInstance<TData, TState>;

type CsvPrimitive = string | number | boolean | null | undefined | Date;
interface CsvColumn<TRecord extends Record<string, unknown> = Record<string, unknown>> {
    id: string;
    header?: string;
    accessor?: (record: TRecord, index: number) => CsvPrimitive;
}
interface ExportCsvOptions<TRecord extends Record<string, unknown> = Record<string, unknown>> {
    rows: TRecord[];
    columns?: CsvColumn<TRecord>[];
    includeHeader?: boolean;
    delimiter?: string;
    lineBreak?: '\n' | '\r\n';
    fileName?: string;
    quoteAllFields?: boolean;
    sanitizeValues?: boolean;
}
interface ExportCsvResult {
    csv: string;
    fileName: string;
    blob: Blob | null;
    download: () => void;
}
declare function serializeCSV<TRecord extends Record<string, unknown>>(options: ExportCsvOptions<TRecord>): string;
declare function exportCSV<TRecord extends Record<string, unknown>>(options: ExportCsvOptions<TRecord>): ExportCsvResult;

interface CopyToClipboardOptions {
    text: string;
    fallbackToExecCommand?: boolean;
}
interface FullscreenApi {
    isSupported: () => boolean;
    isFullscreen: () => boolean;
    getElement: () => Element | null;
    request: (element?: Element) => Promise<boolean>;
    exit: () => Promise<boolean>;
    toggle: (element?: Element) => Promise<boolean>;
    onChange: (listener: (isFullscreen: boolean) => void) => () => void;
}
declare function copyToClipboard(options: CopyToClipboardOptions): Promise<boolean>;
declare const fullscreen: FullscreenApi;

type ScrollMode = 'element' | 'window';
interface UseVirtualColumnsOptions<TScrollElement extends Element | Window = Element, TItemElement extends Element = Element> {
    count: number;
    getScrollElement: () => TScrollElement | null;
    estimateSize: (index: number) => number;
    scrollMode?: ScrollMode;
    overscan?: number;
    paddingStart?: number;
    paddingEnd?: number;
    scrollPaddingStart?: number;
    scrollPaddingEnd?: number;
    initialOffset?: number | (() => number);
    enabled?: boolean;
    debug?: boolean;
    getItemKey?: VirtualizerOptions<TScrollElement, TItemElement>['getItemKey'];
    rangeExtractor?: VirtualizerOptions<TScrollElement, TItemElement>['rangeExtractor'];
    observeElementRect?: VirtualizerOptions<TScrollElement, TItemElement>['observeElementRect'];
    observeElementOffset?: VirtualizerOptions<TScrollElement, TItemElement>['observeElementOffset'];
    scrollToFn?: VirtualizerOptions<TScrollElement, TItemElement>['scrollToFn'];
    measureElement?: VirtualizerOptions<TScrollElement, TItemElement>['measureElement'];
    onChange?: (instance: Virtualizer<TScrollElement, TItemElement>, sync: boolean) => void;
}
interface UseVirtualColumnsResult<TScrollElement extends Element | Window = Element, TItemElement extends Element = Element> {
    virtualizer: Virtualizer<TScrollElement, TItemElement>;
    virtualColumns: VirtualItem[];
    totalSize: number;
}
declare function useVirtualColumns<TScrollElement extends Element | Window = Element, TItemElement extends Element = Element>(options: UseVirtualColumnsOptions<TScrollElement, TItemElement>): UseVirtualColumnsResult<TScrollElement, TItemElement>;

export { PivotTableInstance, PivotTableOptions, RowData, TableState, copyToClipboard, exportCSV, fullscreen, serializeCSV, usePivotTable, useVirtualColumns };
