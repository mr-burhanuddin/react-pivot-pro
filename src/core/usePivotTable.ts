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

function normalizeColumns<TData extends RowData>(
  columns: ColumnDef<TData>[],
  defaultColumn?: Partial<ColumnDef<TData>>,
): Column<TData>[] {
  return columns.map((column, index) => {
    const merged = { ...defaultColumn, ...column };
    const id = merged.id ?? merged.accessorKey ?? `column_${index}`;
    return { ...merged, id };
  });
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

function buildCoreRowModel<TData extends RowData>(
  data: TData[],
  columns: Column<TData>[],
  getRowId?: (originalRow: TData, index: number) => string,
): RowModel<TData> {
  const rows = data.map<Row<TData>>((original, index) => {
    const id = getRowId ? getRowId(original, index) : String(index);
    const values: Record<string, unknown> = {};

    for (const column of columns) {
      values[column.id] = column.accessorFn
        ? column.accessorFn(original, index)
        : column.accessorKey
          ? original[column.accessorKey]
          : undefined;
    }

    return {
      id,
      index,
      original,
      values,
      getValue: <TValue = unknown>(columnId: string) =>
        values[columnId] as TValue | undefined,
    };
  });

  const rowsById = rows.reduce<Record<string, Row<TData>>>((accumulator, row) => {
    accumulator[row.id] = row;
    return accumulator;
  }, {});

  return {
    rows,
    flatRows: rows,
    rowsById,
  };
}

export function usePivotTable<
  TData extends RowData,
  TState extends TableState = TableState,
>(options: PivotTableOptions<TData, TState>): PivotTableInstance<TData, TState> {
  const [pluginVersion, setPluginVersion] = useState(0);

  const columns = useMemo(
    () => normalizeColumns(options.columns, options.defaultColumn),
    [options.columns, options.defaultColumn],
  );

  const pluginsRef = useRef<Map<string, PivotTablePlugin<TData, TState>>>(
    new Map((options.plugins ?? []).map((plugin) => [plugin.name, plugin])),
  );

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

  const getColumnById = useCallback(
    (columnId: string) =>
      columns.find((column: Column<TData>) => column.id === columnId),
    [columns],
  );

  const createPluginContext = useCallback(
    (currentState: TState): PivotTablePluginContext<TData, TState> => ({
      columns,
      data: options.data,
      state: currentState,
      getColumnById,
      setState: (updater: Updater<TState>) => {
        const internal = storeRef.current.getState().state;
        const previous = mergeStates(internal, options.state);
        const next =
          typeof updater === 'function'
            ? (updater as (previous: TState) => TState)(previous)
            : updater;

        storeRef.current.getState().setState(next);
        options.onStateChange?.(next, previous);
      },
    }),
    [columns, getColumnById, options.data, options.onStateChange, options.state],
  );

  const setState = useCallback(
    (updater: Updater<TState>) => {
      const internal = storeRef.current.getState().state;
      const previous = mergeStates(internal, options.state);
      const next =
        typeof updater === 'function'
          ? (updater as (previous: TState) => TState)(previous)
          : updater;

      storeRef.current.getState().setState(next);
      options.onStateChange?.(next, previous);

      const pluginContext = createPluginContext(next);
      for (const plugin of pluginsRef.current.values()) {
        plugin.onStateChange?.(next, previous, pluginContext);
      }
    },
    [createPluginContext, options.onStateChange, options.state],
  );

  const registerPlugin = useCallback(
    (plugin: PivotTablePlugin<TData, TState>) => {
      pluginsRef.current.set(plugin.name, plugin);

      const getInitialState = plugin.getInitialState;
      if (getInitialState) {
        setState((previous: TState) => ({ ...previous, ...getInitialState(previous) }));
      }

      setPluginVersion((value: number) => value + 1);
    },
    [setState],
  );

  const unregisterPlugin = useCallback((pluginName: string) => {
    const deleted = pluginsRef.current.delete(pluginName);
    if (deleted) {
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
    () => buildCoreRowModel(options.data, columns, options.getRowId),
    [columns, options.data, options.getRowId],
  );

  const rowModel = useMemo(() => {
    const pluginContext = createPluginContext(state);
    const plugins = Array.from(
      pluginsRef.current.values(),
    ) as PivotTablePlugin<TData, TState>[];
    const transformedRows = plugins.reduce<Row<TData>[]>(
      (rows, plugin: PivotTablePlugin<TData, TState>) => {
        if (!plugin.transformRows) {
          return rows;
        }
        return plugin.transformRows(rows, pluginContext);
      },
      coreRowModel.rows,
    );

    const rowsById = transformedRows.reduce<Record<string, Row<TData>>>(
      (accumulator, row) => {
        accumulator[row.id] = row;
        return accumulator;
      },
      {},
    );

    return {
      rows: transformedRows,
      flatRows: transformedRows,
      rowsById,
    } satisfies RowModel<TData>;
  }, [coreRowModel.rows, createPluginContext, pluginVersion, state]);

  return {
    state,
    setState,
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
