import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

// src/core/usePivotTable.ts
var DEFAULT_VALIDATORS = [
  {
    name: "sorting",
    validate: (state) => {
      const sorting = state.sorting;
      if (sorting !== void 0) {
        if (!Array.isArray(sorting)) {
          return { valid: false, message: "sorting must be an array" };
        }
        for (const rule of sorting) {
          if (!rule || typeof rule.id !== "string" || typeof rule.desc !== "boolean") {
            return { valid: false, message: "Invalid sorting rule" };
          }
        }
      }
      return { valid: true };
    }
  },
  {
    name: "filters",
    validate: (state) => {
      const filters = state.filters;
      if (filters !== void 0) {
        if (!Array.isArray(filters)) {
          return { valid: false, message: "filters must be an array" };
        }
        for (const filter of filters) {
          if (!filter || typeof filter.id !== "string") {
            return { valid: false, message: "Invalid filter" };
          }
        }
      }
      return { valid: true };
    }
  },
  {
    name: "columnVisibility",
    validate: (state) => {
      const visibility = state.columnVisibility;
      if (visibility !== void 0) {
        if (typeof visibility !== "object" || visibility === null || Array.isArray(visibility)) {
          return { valid: false, message: "columnVisibility must be a record" };
        }
      }
      return { valid: true };
    }
  },
  {
    name: "rowSelection",
    validate: (state) => {
      const selection = state.rowSelection;
      if (selection !== void 0) {
        if (typeof selection !== "object" || selection === null || Array.isArray(selection)) {
          return { valid: false, message: "rowSelection must be a record" };
        }
        for (const key of Object.keys(selection)) {
          if (typeof selection[key] !== "boolean") {
            return { valid: false, message: "rowSelection values must be booleans" };
          }
        }
      }
      return { valid: true };
    }
  },
  {
    name: "expanded",
    validate: (state) => {
      const expanded = state.expanded;
      if (expanded !== void 0) {
        if (typeof expanded !== "object" || expanded === null || Array.isArray(expanded)) {
          return { valid: false, message: "expanded must be a record" };
        }
      }
      return { valid: true };
    }
  }
];
function resolveUpdater(updater, previousState) {
  if (typeof updater === "function") {
    return updater(previousState);
  }
  return updater;
}
function validateState(state, validators) {
  for (const validator of validators) {
    const result = validator.validate(state);
    if (!result.valid) {
      if (process.env.NODE_ENV !== "production") {
        console.error(`[PivotTableStore] Validation failed (${validator.name}):`, result.message);
      }
      return { valid: false };
    }
  }
  return { valid: true };
}
function createPivotTableStore(initialState) {
  const validators = new Set(DEFAULT_VALIDATORS);
  const validatedInitial = validateState(initialState, Array.from(validators));
  const safeInitial = validatedInitial.valid ? initialState : Object.assign({}, createDefaultState(), initialState);
  return createStore((set, get) => ({
    state: safeInitial,
    setState: (updater) => {
      const currentState = get().state;
      const nextState = resolveUpdater(updater, currentState);
      const validation = validateState(nextState, Array.from(validators));
      if (!validation.valid) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[PivotTableStore] Invalid state rejected:", nextState);
        }
        return;
      }
      set((previousStore) => ({
        ...previousStore,
        state: nextState
      }));
    },
    resetState: (nextState) => {
      const validation = validateState(nextState, Array.from(validators));
      if (!validation.valid) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[PivotTableStore] Invalid resetState rejected");
        }
        return;
      }
      set((previousStore) => ({ ...previousStore, state: nextState }));
    },
    addValidator: (validator) => {
      validators.add(validator);
    },
    removeValidator: (name) => {
      for (const v of validators) {
        if (v.name === name) {
          validators.delete(v);
          break;
        }
      }
    }
  }));
}
function createDefaultState() {
  return {
    sorting: [],
    filters: [],
    columnVisibility: {},
    rowSelection: {},
    expanded: {}
  };
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
var IS_PRODUCTION = process.env.NODE_ENV === "production";
var DANGEROUS_KEYS = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]);
var DANGEROUS_KEY_PATTERN = /^__|constructor|prototype$/;
var MAX_COLUMN_ID_LENGTH = 128;
var VALID_ID_PATTERN = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
function isSafeKey(key) {
  return !DANGEROUS_KEYS.has(key) && !DANGEROUS_KEY_PATTERN.test(key);
}
function getValueByAccessorKey(row, accessorKey) {
  const keys = accessorKey.split(".");
  let value = row;
  for (const key of keys) {
    if (value == null || typeof value !== "object") {
      return void 0;
    }
    const obj = value;
    if (!isSafeKey(key)) {
      return void 0;
    }
    value = obj[key];
  }
  return value;
}
function validateAndNormalizeColumnId(id, index) {
  if (typeof id !== "string" || id.length === 0) {
    return `column_${index}`;
  }
  const trimmed = id.trim().slice(0, MAX_COLUMN_ID_LENGTH);
  if (VALID_ID_PATTERN.test(trimmed)) {
    return trimmed;
  }
  return `col_${index}`;
}
function normalizeColumns(columns, defaultColumn) {
  const seen = /* @__PURE__ */ new Set();
  const warnings = [];
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
    console.warn("[PivotTable] Column normalization warnings:", warnings);
  }
  return normalized;
}
function mergeStates(internalState, controlledState) {
  if (!controlledState) {
    return internalState;
  }
  return { ...internalState, ...controlledState };
}
function buildCoreRowModel(data, columns, getRowId) {
  const dataLen = data.length;
  const colLen = columns.length;
  const columnAccessors = new Array(colLen);
  for (let colIdx = 0; colIdx < colLen; colIdx++) {
    const col = columns[colIdx];
    let accessor;
    if (col.accessorFn) {
      const fn = col.accessorFn;
      accessor = (row) => fn(row, 0);
    } else if (typeof col.accessorKey === "string") {
      const key = col.accessorKey;
      accessor = (row) => getValueByAccessorKey(row, key);
    } else {
      accessor = () => void 0;
    }
    columnAccessors[colIdx] = { id: col.id, accessor };
  }
  const rows = new Array(dataLen);
  const rowsById = {};
  for (let index = 0; index < dataLen; index++) {
    const original = data[index];
    const id = getRowId ? getRowId(original, index) : String(index);
    const values = {};
    for (let colIdx = 0; colIdx < colLen; colIdx++) {
      const item = columnAccessors[colIdx];
      values[item.id] = item.accessor(original);
    }
    const row = {
      id,
      index,
      original,
      values,
      getValue: (columnId) => values[columnId]
    };
    rows[index] = row;
    rowsById[id] = row;
  }
  return {
    rows,
    flatRows: rows,
    rowsById
  };
}
function useDeepCompareMemo(factory, deps) {
  const ref = useRef(null);
  const newDeps = deps.map((d) => {
    if (d === null) return "null";
    if (d === void 0) return "undefined";
    if (typeof d === "object") return JSON.stringify(d);
    if (typeof d === "function") return d.toString();
    return d;
  });
  const depsChanged = !ref.current || newDeps.length !== ref.current.deps.length || newDeps.some((d, i) => d !== ref.current.deps[i]);
  if (depsChanged) {
    ref.current = { deps: newDeps, value: factory() };
  }
  return ref.current.value;
}
function usePivotTable(options) {
  const [pluginVersion, setPluginVersion] = useState(0);
  const [dataVersion, setDataVersion] = useState(0);
  const prevDataRef = useRef(void 0);
  const stableDataRef = useRef(options.data ?? []);
  const columnsRef = useRef([]);
  if (options.data !== prevDataRef.current) {
    prevDataRef.current = options.data;
    stableDataRef.current = options.data ?? [];
    setDataVersion((v) => v + 1);
  }
  const columns = useMemo(
    () => normalizeColumns(options.columns, options.defaultColumn),
    [options.columns, options.defaultColumn]
  );
  columnsRef.current = columns;
  const pluginsRef = useRef(
    new Map((options.plugins ?? []).map((plugin) => [plugin.name, plugin]))
  );
  const pluginContextRef = useRef(null);
  const pluginCacheRef = useRef(/* @__PURE__ */ new Map());
  const initialStateRef = useRef(null);
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
  const storeRef = useRef(
    createPivotTableStore(initialStateRef.current)
  );
  const getColumnById = useCallback(
    (columnId) => columns.find((column) => column.id === columnId),
    [columns]
  );
  const stableSetState = useCallback(
    (updater) => {
      const internal = storeRef.current.getState().state;
      const previous = mergeStates(internal, options.state);
      const next = typeof updater === "function" ? updater(previous) : updater;
      storeRef.current.getState().setState(next);
      options.onStateChange?.(next, previous);
      pluginCacheRef.current.clear();
    },
    [options.state, options.onStateChange]
  );
  useEffect(() => {
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
    pluginCacheRef.current.clear();
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
  const internalState = useStore(storeRef.current, (store) => store.state);
  const state = useMemo(
    () => mergeStates(internalState, options.state),
    [internalState, options.state]
  );
  useEffect(() => {
    pluginContextRef.current = {
      columns: columnsRef.current,
      data: stableDataRef.current,
      state,
      getColumnById,
      setState: stableSetState
    };
  }, [state, getColumnById, stableSetState]);
  const registerPlugin = useCallback(
    (plugin) => {
      const existing = pluginsRef.current.get(plugin.name);
      if (existing) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[PivotTable] Plugin '${plugin.name}' already registered. Replacing.`);
        }
      }
      pluginsRef.current.set(plugin.name, plugin);
      pluginCacheRef.current.clear();
      const getInitialState = plugin.getInitialState;
      if (getInitialState) {
        stableSetState((previous) => ({ ...previous, ...getInitialState(previous) }));
      }
      setPluginVersion((value) => value + 1);
    },
    [stableSetState]
  );
  const unregisterPlugin = useCallback((pluginName) => {
    const deleted = pluginsRef.current.delete(pluginName);
    if (deleted) {
      pluginCacheRef.current.clear();
      setPluginVersion((value) => value + 1);
    }
    return deleted;
  }, []);
  const getPlugin = useCallback((pluginName) => {
    return pluginsRef.current.get(pluginName);
  }, []);
  const getAllPlugins = useCallback(() => {
    return Array.from(pluginsRef.current.values());
  }, []);
  const coreRowModel = useMemo(
    () => buildCoreRowModel(stableDataRef.current, columns, options.getRowId),
    [stableDataRef.current, columns, options.getRowId, dataVersion]
  );
  const rowModel = useDeepCompareMemo(() => {
    const context = pluginContextRef.current;
    if (!context) {
      return coreRowModel;
    }
    const plugins = Array.from(pluginsRef.current.values());
    let transformedRows = coreRowModel.rows;
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
    const rowsById = {};
    for (let i = 0; i < transformedRows.length; i++) {
      const row = transformedRows[i];
      rowsById[row.id] = row;
    }
    return {
      rows: transformedRows,
      flatRows: transformedRows,
      rowsById
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
    getAllPlugins
  };
}

// src/store/pluginRegistry.ts
function createPluginRegistry() {
  const plugins = /* @__PURE__ */ new Map();
  function detectConflicts(newManifest) {
    const conflicts = [];
    for (const [name, { manifest }] of plugins.entries()) {
      if (manifest.conflictsWith.includes(newManifest.name)) {
        conflicts.push(name);
        continue;
      }
      if (newManifest.conflictsWith.includes(manifest.name)) {
        conflicts.push(name);
        continue;
      }
      const sharedStateKeys = manifest.stateKeys.filter(
        (key) => newManifest.stateKeys.includes(key)
      );
      if (sharedStateKeys.length > 0 && newManifest.name !== manifest.name) {
        conflicts.push(name);
      }
    }
    return {
      hasConflict: conflicts.length > 0,
      conflictsWith: conflicts
    };
  }
  return {
    register(plugin, manifest) {
      if (plugins.has(manifest.name)) {
        const existing = plugins.get(manifest.name);
        const newManifest = { ...existing.manifest, ...manifest };
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[PluginRegistry] Plugin '${manifest.name}' already registered. Manifest has been updated.`
          );
        }
        plugins.set(manifest.name, { plugin, manifest: newManifest });
        return;
      }
      const conflictCheck = detectConflicts(manifest);
      if (conflictCheck.hasConflict) {
        if (process.env.NODE_ENV !== "production") {
          console.error(
            `[PluginRegistry] Cannot register plugin '${manifest.name}'. Conflicts with: ${conflictCheck.conflictsWith.join(", ")}`
          );
        }
        throw new Error(
          `Plugin '${manifest.name}' conflicts with existing plugins: ${conflictCheck.conflictsWith.join(", ")}. Shared state keys or explicit conflicts detected. Unregister conflicting plugins first or choose different plugin names.`
        );
      }
      plugins.set(manifest.name, { plugin, manifest });
    },
    unregister(pluginName) {
      return plugins.delete(pluginName);
    },
    getPlugin(name) {
      return plugins.get(name)?.plugin;
    },
    getManifest(name) {
      return plugins.get(name)?.manifest;
    },
    getAll() {
      return Array.from(plugins.values()).map((p) => p.plugin);
    },
    getAllManifests() {
      return Array.from(plugins.values()).map((p) => p.manifest);
    },
    hasConflict(name) {
      const manifest = plugins.get(name)?.manifest;
      if (!manifest) {
        return { hasConflict: false, conflictsWith: [] };
      }
      return detectConflicts(manifest);
    }
  };
}
var DEFAULT_MANIFESTS = {
  sorting: {
    name: "sorting",
    stateKeys: ["sorting"],
    conflictsWith: [],
    description: "Multi-column sorting plugin"
  },
  filtering: {
    name: "filtering",
    stateKeys: ["filters", "globalFilter"],
    conflictsWith: [],
    description: "Column and global filtering plugin"
  },
  grouping: {
    name: "grouping",
    stateKeys: ["rowGrouping", "columnGrouping", "expandedGroups"],
    conflictsWith: [],
    description: "Hierarchical row grouping plugin"
  },
  pivot: {
    name: "pivot",
    stateKeys: ["rowGrouping", "columnGrouping", "pivotValues", "pivotEnabled"],
    conflictsWith: ["grouping"],
    description: "Pivot matrix generation plugin"
  },
  columnVisibility: {
    name: "columnVisibility",
    stateKeys: ["columnVisibility"],
    conflictsWith: [],
    description: "Column visibility state plugin"
  },
  columnOrdering: {
    name: "columnOrdering",
    stateKeys: ["columnOrder"],
    conflictsWith: ["dndColumn"],
    description: "Explicit column ordering plugin"
  },
  columnPinning: {
    name: "columnPinning",
    stateKeys: ["columnPinning"],
    conflictsWith: [],
    description: "Left/right column pinning plugin"
  },
  dndRow: {
    name: "dndRow",
    stateKeys: ["rowOrder"],
    conflictsWith: [],
    description: "Row drag-and-drop plugin"
  },
  dndColumn: {
    name: "dndColumn",
    stateKeys: ["columnOrder"],
    conflictsWith: ["columnOrdering"],
    description: "Column drag-and-drop plugin"
  }
};

export { DEFAULT_MANIFESTS, createDefaultTableState, createPivotTableStore, createPluginRegistry, usePivotTable };
