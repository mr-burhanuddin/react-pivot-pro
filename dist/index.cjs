'use strict';

var react = require('react');
var zustand = require('zustand');
var vanilla = require('zustand/vanilla');

// src/core/usePivotTable.ts
function resolveUpdater(updater, previousState) {
  if (typeof updater === "function") {
    return updater(previousState);
  }
  return updater;
}
function createPivotTableStore(initialState) {
  return vanilla.createStore((set, get) => ({
    state: initialState,
    setState: (updater) => {
      set((previousStore) => ({
        ...previousStore,
        state: resolveUpdater(updater, get().state)
      }));
    },
    resetState: (nextState) => {
      set((previousStore) => ({ ...previousStore, state: nextState }));
    }
  }));
}

// src/types/state.ts
function createDefaultTableState() {
  return {
    sorting: [],
    filters: [],
    columnVisibility: {},
    rowSelection: {},
    expanded: {}
  };
}

// src/core/usePivotTable.ts
function normalizeColumns(columns, defaultColumn) {
  return columns.map((column, index) => {
    const merged = { ...defaultColumn, ...column };
    const id = merged.id ?? merged.accessorKey ?? `column_${index}`;
    return { ...merged, id };
  });
}
function mergeStates(internalState, controlledState) {
  if (!controlledState) {
    return internalState;
  }
  return { ...internalState, ...controlledState };
}
function buildCoreRowModel(data, columns, getRowId) {
  const rows = data.map((original, index) => {
    const id = getRowId ? getRowId(original, index) : String(index);
    const values = {};
    for (const column of columns) {
      values[column.id] = column.accessorFn ? column.accessorFn(original, index) : column.accessorKey ? original[column.accessorKey] : void 0;
    }
    return {
      id,
      index,
      original,
      values,
      getValue: (columnId) => values[columnId]
    };
  });
  const rowsById = rows.reduce((accumulator, row) => {
    accumulator[row.id] = row;
    return accumulator;
  }, {});
  return {
    rows,
    flatRows: rows,
    rowsById
  };
}
function usePivotTable(options) {
  const [pluginVersion, setPluginVersion] = react.useState(0);
  const columns = react.useMemo(
    () => normalizeColumns(options.columns, options.defaultColumn),
    [options.columns, options.defaultColumn]
  );
  const pluginsRef = react.useRef(
    new Map((options.plugins ?? []).map((plugin) => [plugin.name, plugin]))
  );
  const initialStateRef = react.useRef(null);
  if (!initialStateRef.current) {
    let nextState = {
      ...createDefaultTableState(),
      ...options.initialState ?? {}
    };
    for (const plugin of pluginsRef.current.values()) {
      if (plugin.getInitialState) {
        nextState = { ...nextState, ...plugin.getInitialState(nextState) };
      }
    }
    initialStateRef.current = nextState;
  }
  const storeRef = react.useRef(
    createPivotTableStore(initialStateRef.current)
  );
  react.useEffect(() => {
    const previousPlugins = pluginsRef.current;
    const nextPlugins = new Map(
      (options.plugins ?? []).map((plugin) => [plugin.name, plugin])
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
      (plugin) => !previousPlugins.has(plugin.name)
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
    setPluginVersion((value) => value + 1);
  }, [options.plugins, options.onStateChange]);
  const internalState = zustand.useStore(storeRef.current, (store) => store.state);
  const state = react.useMemo(
    () => mergeStates(internalState, options.state),
    [internalState, options.state]
  );
  const getColumnById = react.useCallback(
    (columnId) => columns.find((column) => column.id === columnId),
    [columns]
  );
  const createPluginContext = react.useCallback(
    (currentState) => ({
      columns,
      data: options.data,
      state: currentState,
      getColumnById,
      setState: (updater) => {
        const internal = storeRef.current.getState().state;
        const previous = mergeStates(internal, options.state);
        const next = typeof updater === "function" ? updater(previous) : updater;
        storeRef.current.getState().setState(next);
        options.onStateChange?.(next, previous);
      }
    }),
    [columns, getColumnById, options.data, options.onStateChange, options.state]
  );
  const setState = react.useCallback(
    (updater) => {
      const internal = storeRef.current.getState().state;
      const previous = mergeStates(internal, options.state);
      const next = typeof updater === "function" ? updater(previous) : updater;
      storeRef.current.getState().setState(next);
      options.onStateChange?.(next, previous);
      const pluginContext = createPluginContext(next);
      for (const plugin of pluginsRef.current.values()) {
        plugin.onStateChange?.(next, previous, pluginContext);
      }
    },
    [createPluginContext, options.onStateChange, options.state]
  );
  const registerPlugin = react.useCallback(
    (plugin) => {
      pluginsRef.current.set(plugin.name, plugin);
      const getInitialState = plugin.getInitialState;
      if (getInitialState) {
        setState((previous) => ({ ...previous, ...getInitialState(previous) }));
      }
      setPluginVersion((value) => value + 1);
    },
    [setState]
  );
  const unregisterPlugin = react.useCallback((pluginName) => {
    const deleted = pluginsRef.current.delete(pluginName);
    if (deleted) {
      setPluginVersion((value) => value + 1);
    }
    return deleted;
  }, []);
  const getPlugin = react.useCallback((pluginName) => {
    return pluginsRef.current.get(pluginName);
  }, []);
  const getAllPlugins = react.useCallback(() => {
    return Array.from(pluginsRef.current.values());
  }, []);
  const coreRowModel = react.useMemo(
    () => buildCoreRowModel(options.data, columns, options.getRowId),
    [columns, options.data, options.getRowId]
  );
  const rowModel = react.useMemo(() => {
    const pluginContext = createPluginContext(state);
    const plugins = Array.from(
      pluginsRef.current.values()
    );
    const transformedRows = plugins.reduce(
      (rows, plugin) => {
        if (!plugin.transformRows) {
          return rows;
        }
        return plugin.transformRows(rows, pluginContext);
      },
      coreRowModel.rows
    );
    const rowsById = transformedRows.reduce(
      (accumulator, row) => {
        accumulator[row.id] = row;
        return accumulator;
      },
      {}
    );
    return {
      rows: transformedRows,
      flatRows: transformedRows,
      rowsById
    };
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
    getAllPlugins
  };
}

exports.createDefaultTableState = createDefaultTableState;
exports.createPivotTableStore = createPivotTableStore;
exports.usePivotTable = usePivotTable;
