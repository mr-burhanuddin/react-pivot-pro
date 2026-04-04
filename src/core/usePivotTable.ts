import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { createPivotTableStore } from '../store/pivotTableStore';
import type {
  Column,
  ColumnDef,
  PivotTableInstance,
  PivotTableOptions,
  PivotTablePlugin,
  PivotTablePluginContext,
  Row,
  RowData,
  RowModel,
  TableState,
  Updater,
} from '../types';
import { createDefaultTableState } from '../types';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const DANGEROUS_KEY_PATTERN = /^__|constructor|prototype$/;
const MAX_COLUMN_ID_LENGTH = 128;
const VALID_ID_PATTERN = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

function isSafeKey(key: string): boolean {
  return !DANGEROUS_KEYS.has(key) && !DANGEROUS_KEY_PATTERN.test(key);
}

function getValueByAccessorKey<TData extends RowData>(
  row: TData,
  accessorKey: string
): unknown {
  const keys = accessorKey.split('.');
  let value: unknown = row;
  for (const key of keys) {
    if (value == null || typeof value !== 'object') {
      return undefined;
    }
    const obj = value as Record<string, unknown>;
    if (!isSafeKey(key)) {
      return undefined;
    }
    value = obj[key];
  }
  return value;
}

function validateAndNormalizeColumnId(id: unknown, index: number): string {
  if (typeof id !== 'string' || id.length === 0) {
    return `column_${index}`;
  }
  
  const trimmed = id.trim().slice(0, MAX_COLUMN_ID_LENGTH);
  
  if (VALID_ID_PATTERN.test(trimmed)) {
    return trimmed;
  }
  
  return `col_${index}`;
}

function normalizeColumns<TData extends RowData>(
  columns: ColumnDef<TData>[],
  defaultColumn?: Partial<ColumnDef<TData>>,
): Column<TData>[] {
  const seen = new Set<string>();
  const warnings: string[] = [];

  const normalized = columns.map((column, index) => {
    const merged = { ...defaultColumn, ...column };
    
    let id = merged.id ?? merged.accessorKey;
    id = validateAndNormalizeColumnId(id, index);
    
    if (seen.has(id)) {
      warnings.push(`Duplicate column ID: '${id}' at index ${index}`);
      let uniqueId = `${id}_${index}`;
      let suffix = 1;
      while (seen.has(uniqueId)) {
        uniqueId = `${id}_${index}_${suffix++}`;
      }
      id = uniqueId;
    }
    
    seen.add(id);
    
    return { ...merged, id };
  });

  if (warnings.length > 0 && !IS_PRODUCTION) {
    console.warn('[PivotTable] Column normalization warnings:', warnings);
  }

  return normalized;
}

function mergeStates<TState extends TableState>(
  internalState: TState,
  controlledState?: Partial<TState>,
): TState {
  if (!controlledState) {
    return internalState;
  }
  return { ...internalState, ...controlledState };
}

interface CacheEntry<T> {
  key: string;
  value: T;
}

function buildCoreRowModel<TData extends RowData>(
  data: TData[],
  columns: Column<TData>[],
  getRowId?: (originalRow: TData, index: number) => string,
): RowModel<TData> {
  const dataLen = data.length;
  const colLen = columns.length;
  
  const columnAccessors = new Array<{ id: string; accessor: (row: TData) => unknown }>(colLen);
  for (let colIdx = 0; colIdx < colLen; colIdx++) {
    const col = columns[colIdx];
    let accessor: (row: TData) => unknown;
    
    if (col.accessorFn) {
      const fn = col.accessorFn;
      accessor = (row: TData) => fn(row, 0);
    } else if (typeof col.accessorKey === 'string') {
      const key = col.accessorKey;
      accessor = (row: TData) => getValueByAccessorKey(row, key);
    } else {
      accessor = () => undefined;
    }
    
    columnAccessors[colIdx] = { id: col.id, accessor };
  }
  
  const rows = new Array<Row<TData>>(dataLen);
  const rowsById: Record<string, Row<TData>> = {};
  
  for (let index = 0; index < dataLen; index++) {
    const original = data[index];
    const id = getRowId ? getRowId(original, index) : String(index);
    const values: Record<string, unknown> = {};
    
    for (let colIdx = 0; colIdx < colLen; colIdx++) {
      const item = columnAccessors[colIdx];
      values[item.id] = item.accessor(original);
    }
    
    const row: Row<TData> = {
      id,
      index,
      original,
      values,
      getValue: <TValue = unknown>(columnId: string): TValue | undefined => 
        values[columnId] as TValue | undefined,
    };
    
    rows[index] = row;
    rowsById[id] = row;
  }

  return {
    rows,
    flatRows: rows,
    rowsById,
  };
}

function useDeepCompareMemo<T>(factory: () => T, deps: unknown[]): T {
  const ref = useRef<{ deps: unknown[]; value: T } | null>(null);
  
  const newDeps = deps.map(d => {
    if (d === null) return 'null';
    if (d === undefined) return 'undefined';
    if (typeof d === 'object') return JSON.stringify(d);
    if (typeof d === 'function') return d.toString();
    return d;
  });
  
  const depsChanged = !ref.current || 
    newDeps.length !== ref.current.deps.length ||
    newDeps.some((d, i) => d !== ref.current!.deps[i]);
  
  if (depsChanged) {
    ref.current = { deps: newDeps, value: factory() };
  }
  
  return ref.current!.value;
}

export function usePivotTable<
  TData extends RowData,
  TState extends TableState = TableState,
>(options: PivotTableOptions<TData, TState>): PivotTableInstance<TData, TState> {
  const [pluginVersion, setPluginVersion] = useState(0);
  const [dataVersion, setDataVersion] = useState(0);
  
  const prevDataRef = useRef<TData[] | undefined>(undefined);
  const stableDataRef = useRef<TData[]>(options.data ?? []);
  const columnsRef = useRef<Column<TData>[]>([]);
  
  if (options.data !== prevDataRef.current) {
    prevDataRef.current = options.data;
    stableDataRef.current = options.data ?? [];
    setDataVersion(v => v + 1);
  }
  
  const columns = useMemo(
    () => normalizeColumns(options.columns, options.defaultColumn),
    [options.columns, options.defaultColumn],
  );
  columnsRef.current = columns;

  const pluginsRef = useRef<Map<string, PivotTablePlugin<TData, TState>>>(
    new Map((options.plugins ?? []).map((plugin) => [plugin.name, plugin])),
  );

  const pluginContextRef = useRef<PivotTablePluginContext<TData, TState> | null>(null);
  const pluginCacheRef = useRef<Map<string, { rows: Row<TData>[]; result: Row<TData>[] }>>(new Map());

  const initialStateRef = useRef<TState | null>(null);
  if (!initialStateRef.current) {
    let nextState = {
      ...createDefaultTableState(),
      ...(options.initialState ?? {}),
    } as TState;

    for (const plugin of pluginsRef.current.values()) {
      if (plugin.getInitialState) {
        nextState = { ...nextState, ...plugin.getInitialState(nextState) };
      }
    }

    initialStateRef.current = nextState;
  }

  const storeRef = useRef(
    createPivotTableStore<TState>(initialStateRef.current as TState),
  );

  const getColumnById = useCallback(
    (columnId: string) => columns.find((column) => column.id === columnId),
    [columns],
  );

  const stableSetState = useCallback(
    (updater: Updater<TState>) => {
      const internal = storeRef.current.getState().state;
      const previous = mergeStates(internal, options.state);
      const next =
        typeof updater === 'function'
          ? (updater as (previous: TState) => TState)(previous)
          : updater;

      storeRef.current.getState().setState(next);
      options.onStateChange?.(next, previous);
      
      pluginCacheRef.current.clear();
    },
    [options.state, options.onStateChange],
  );

  useEffect(() => {
    const previousPlugins = pluginsRef.current;
    const nextPlugins = new Map(
      (options.plugins ?? []).map((plugin) => [plugin.name, plugin] as const),
    );

    let hasPluginChanges = previousPlugins.size !== nextPlugins.size;
    if (!hasPluginChanges) {
      for (const [name, plugin] of nextPlugins.entries()) {
        if (previousPlugins.get(name) !== plugin) {
          hasPluginChanges = true;
          break;
        }
      }
    }

    if (!hasPluginChanges) {
      return;
    }

    pluginsRef.current = nextPlugins;
    pluginCacheRef.current.clear();

    const addedPlugins = Array.from(nextPlugins.values()).filter(
      (plugin) => !previousPlugins.has(plugin.name),
    );

    if (addedPlugins.length > 0) {
      const currentState = mergeStates(storeRef.current.getState().state, options.state);
      let nextState = currentState;

      for (const plugin of addedPlugins) {
        if (plugin.getInitialState) {
          nextState = { ...nextState, ...plugin.getInitialState(nextState) };
        }
      }

      if (nextState !== currentState) {
        storeRef.current.getState().setState(nextState);
        options.onStateChange?.(nextState, currentState);
      }
    }

    setPluginVersion((value: number) => value + 1);
  }, [options.plugins, options.onStateChange]);

  const internalState = useStore(storeRef.current, (store) => store.state);
  const state = useMemo(
    () => mergeStates(internalState, options.state),
    [internalState, options.state],
  );

  useEffect(() => {
    pluginContextRef.current = {
      columns: columnsRef.current,
      data: stableDataRef.current,
      state,
      getColumnById,
      setState: stableSetState,
    };
  }, [state, getColumnById, stableSetState]);

  const registerPlugin = useCallback(
    (plugin: PivotTablePlugin<TData, TState>) => {
      const existing = pluginsRef.current.get(plugin.name);
      if (existing) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[PivotTable] Plugin '${plugin.name}' already registered. Replacing.`);
        }
      }
      
      pluginsRef.current.set(plugin.name, plugin);
      pluginCacheRef.current.clear();

      const getInitialState = plugin.getInitialState;
      if (getInitialState) {
        stableSetState((previous: TState) => ({ ...previous, ...getInitialState(previous) }));
      }

      setPluginVersion((value: number) => value + 1);
    },
    [stableSetState],
  );

  const unregisterPlugin = useCallback((pluginName: string) => {
    const deleted = pluginsRef.current.delete(pluginName);
    if (deleted) {
      pluginCacheRef.current.clear();
      setPluginVersion((value: number) => value + 1);
    }
    return deleted;
  }, []);

  const getPlugin = useCallback((pluginName: string) => {
    return pluginsRef.current.get(pluginName);
  }, []);

  const getAllPlugins = useCallback(() => {
    return Array.from(pluginsRef.current.values());
  }, []);

  const coreRowModel = useMemo(
    () => buildCoreRowModel(stableDataRef.current, columns, options.getRowId),
    [stableDataRef.current, columns, options.getRowId, dataVersion],
  );

  const rowModel = useDeepCompareMemo((): RowModel<TData> => {
    const context = pluginContextRef.current;
    if (!context) {
      return coreRowModel;
    }
    
    const plugins = Array.from(pluginsRef.current.values());
    
    let transformedRows: Row<TData>[] = coreRowModel.rows;
    let rowsChanged = false;
    
    for (const plugin of plugins) {
      if (!plugin.transformRows) continue;
      
      const cacheKey = `plugin_${plugin.name}_v${pluginVersion}`;
      const cached = pluginCacheRef.current.get(cacheKey);
      
      if (cached && cached.rows === transformedRows) {
        transformedRows = cached.result;
        continue;
      }
      
      transformedRows = plugin.transformRows(transformedRows, context);
      rowsChanged = true;
      
      pluginCacheRef.current.set(cacheKey, { rows: transformedRows, result: transformedRows });
    }

    if (!rowsChanged) {
      return coreRowModel;
    }

    const rowsById: Record<string, Row<TData>> = {};
    for (let i = 0; i < transformedRows.length; i++) {
      const row = transformedRows[i];
      rowsById[row.id] = row;
    }

    return {
      rows: transformedRows,
      flatRows: transformedRows,
      rowsById,
    };
  }, [coreRowModel.rows, pluginVersion, dataVersion]);

  return {
    state,
    setState: stableSetState,
    columns,
    rowModel,
    getState: () => state,
    getCoreRowModel: () => coreRowModel,
    getRowModel: () => rowModel,
    registerPlugin,
    unregisterPlugin,
    getPlugin,
    getAllPlugins,
  };
}
