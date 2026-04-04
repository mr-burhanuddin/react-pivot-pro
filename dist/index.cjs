'use strict';

var react = require('react');
var zustand = require('zustand');
var vanilla = require('zustand/vanilla');
var virtualCore = require('@tanstack/virtual-core');

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
  return vanilla.createStore((set, get) => ({
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
  const ref = react.useRef(null);
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
  const [pluginVersion, setPluginVersion] = react.useState(0);
  const [dataVersion, setDataVersion] = react.useState(0);
  const prevDataRef = react.useRef(void 0);
  const stableDataRef = react.useRef(options.data ?? []);
  const columnsRef = react.useRef([]);
  if (options.data !== prevDataRef.current) {
    prevDataRef.current = options.data;
    stableDataRef.current = options.data ?? [];
    setDataVersion((v) => v + 1);
  }
  const columns = react.useMemo(
    () => normalizeColumns(options.columns, options.defaultColumn),
    [options.columns, options.defaultColumn]
  );
  columnsRef.current = columns;
  const pluginsRef = react.useRef(
    new Map((options.plugins ?? []).map((plugin) => [plugin.name, plugin]))
  );
  const pluginContextRef = react.useRef(null);
  const pluginCacheRef = react.useRef(/* @__PURE__ */ new Map());
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
  const getColumnById = react.useCallback(
    (columnId) => columns.find((column) => column.id === columnId),
    [columns]
  );
  const stableSetState = react.useCallback(
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
  const internalState = zustand.useStore(storeRef.current, (store) => store.state);
  const state = react.useMemo(
    () => mergeStates(internalState, options.state),
    [internalState, options.state]
  );
  react.useEffect(() => {
    pluginContextRef.current = {
      columns: columnsRef.current,
      data: stableDataRef.current,
      state,
      getColumnById,
      setState: stableSetState
    };
  }, [state, getColumnById, stableSetState]);
  const registerPlugin = react.useCallback(
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
  const unregisterPlugin = react.useCallback((pluginName) => {
    const deleted = pluginsRef.current.delete(pluginName);
    if (deleted) {
      pluginCacheRef.current.clear();
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

// src/utils/aggregationFns.ts
function toFiniteNumbers(values) {
  return values.map((value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }).filter((value) => value !== null);
}
var aggregationFns = {
  count: (values) => values.length,
  sum: (values) => {
    const numbers = toFiniteNumbers(values);
    return numbers.reduce((acc, value) => acc + value, 0);
  },
  avg: (values) => {
    const numbers = toFiniteNumbers(values);
    if (numbers.length === 0) {
      return 0;
    }
    return numbers.reduce((acc, value) => acc + value, 0) / numbers.length;
  },
  min: (values) => {
    const numbers = toFiniteNumbers(values);
    if (numbers.length === 0) {
      return void 0;
    }
    return numbers.reduce((min, val) => val < min ? val : min, numbers[0]);
  },
  max: (values) => {
    const numbers = toFiniteNumbers(values);
    if (numbers.length === 0) {
      return void 0;
    }
    return numbers.reduce((max, val) => val > max ? val : max, numbers[0]);
  },
  median: (values) => {
    const numbers = toFiniteNumbers(values).sort((a, b) => a - b);
    if (numbers.length === 0) {
      return void 0;
    }
    const middle = Math.floor(numbers.length / 2);
    if (numbers.length % 2 === 0) {
      return (numbers[middle - 1] + numbers[middle]) / 2;
    }
    return numbers[middle];
  },
  unique: (values) => {
    const seen = /* @__PURE__ */ new Set();
    for (const val of values) {
      if (val != null && typeof val === "object") {
        seen.add(JSON.stringify(val));
      } else {
        seen.add(val);
      }
    }
    return seen.size;
  },
  first: (values) => values[0],
  last: (values) => values[values.length - 1]
};
function resolveAggregationFn(input, customAggregationFns) {
  if (!input) {
    return aggregationFns.sum;
  }
  if (typeof input === "function") {
    return input;
  }
  if (customAggregationFns && input in customAggregationFns) {
    return customAggregationFns[input];
  }
  if (input in aggregationFns) {
    return aggregationFns[input];
  }
  return aggregationFns.sum;
}

// src/core/pivotEngine.ts
var DANGEROUS_KEYS2 = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]);
var DANGEROUS_KEY_PATTERN2 = /^__|constructor|prototype$/;
function isSafeKey2(key) {
  return !DANGEROUS_KEYS2.has(key) && !DANGEROUS_KEY_PATTERN2.test(key);
}
function getValueByAccessorKey2(row, accessorKey) {
  const keys = accessorKey.split(".");
  let value = row;
  for (const key of keys) {
    if (value == null || typeof value !== "object") {
      return void 0;
    }
    const obj = value;
    if (!isSafeKey2(key)) {
      return void 0;
    }
    value = obj[key];
  }
  return value;
}
function toAccessor(id, accessor) {
  if (typeof accessor === "function") {
    return accessor;
  }
  if (typeof accessor === "string") {
    if (!isSafeKey2(accessor)) {
      return () => void 0;
    }
    return (row) => getValueByAccessorKey2(row, accessor);
  }
  if (!isSafeKey2(id)) {
    return () => void 0;
  }
  return (row) => getValueByAccessorKey2(row, id);
}
function toPathValue(value) {
  if (value === null) return "__null__";
  if (value === void 0) return "__undefined__";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
function makePathKey(path) {
  return path.length === 0 ? "__root__" : path.join("||");
}
function createGroups(rows, groupDefs, depth = 0, currentPath = []) {
  if (depth >= groupDefs.length) {
    return [];
  }
  const groupDef = groupDefs[depth];
  const getValue = toAccessor(groupDef.id, groupDef.accessor);
  const grouped = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const value = getValue(row);
    const key = toPathValue(value);
    const existing = grouped.get(key);
    if (existing) {
      existing.rows.push(row);
    } else {
      grouped.set(key, { value, rows: [row] });
    }
  }
  return Array.from(grouped.entries()).map(([key, group]) => {
    const nextPath = [...currentPath, key];
    const children = createGroups(group.rows, groupDefs, depth + 1, nextPath);
    return {
      id: `${depth}:${nextPath.join("|")}`,
      depth,
      path: nextPath,
      value: group.value,
      rowCount: group.rows.length,
      rows: group.rows,
      children
    };
  });
}
function aggregateRows(rows, values, customAggregationFns) {
  const result = {};
  for (const valueDef of values) {
    const accessor = toAccessor(valueDef.id, valueDef.accessor);
    const valueBucket = rows.map((row) => accessor(row));
    const aggregationFn = resolveAggregationFn(valueDef.aggregation, customAggregationFns);
    result[valueDef.id] = aggregationFn(valueBucket, rows);
  }
  return result;
}
function createPivotEngineResult(options) {
  const rowAccessors = options.rowGroupBy.map(
    (groupDef) => toAccessor(groupDef.id, groupDef.accessor)
  );
  const columnAccessors = options.columnGroupBy.map(
    (groupDef) => toAccessor(groupDef.id, groupDef.accessor)
  );
  const rowHeadersMap = /* @__PURE__ */ new Map();
  const columnHeadersMap = /* @__PURE__ */ new Map();
  const bucketMap = /* @__PURE__ */ new Map();
  if (options.rowGroupBy.length === 0) {
    rowHeadersMap.set("__root__", []);
  }
  if (options.columnGroupBy.length === 0) {
    columnHeadersMap.set("__root__", []);
  }
  for (const row of options.data) {
    const rowPath = rowAccessors.map((accessor) => toPathValue(accessor(row)));
    const rowKey = makePathKey(rowPath);
    if (!rowHeadersMap.has(rowKey)) {
      rowHeadersMap.set(rowKey, rowPath);
    }
    const columnPath = columnAccessors.map((accessor) => toPathValue(accessor(row)));
    const columnKey = makePathKey(columnPath);
    if (!columnHeadersMap.has(columnKey)) {
      columnHeadersMap.set(columnKey, columnPath);
    }
    const rowBucketMap = bucketMap.get(rowKey) ?? /* @__PURE__ */ new Map();
    const cellBucket = rowBucketMap.get(columnKey) ?? [];
    cellBucket.push(row);
    rowBucketMap.set(columnKey, cellBucket);
    bucketMap.set(rowKey, rowBucketMap);
  }
  const rowHeaders = Array.from(rowHeadersMap.values());
  const columnHeaderPaths = Array.from(columnHeadersMap.values());
  const rowTree = createGroups(options.data, options.rowGroupBy);
  const columnHeaders = columnHeaderPaths.map((path) => ({
    key: makePathKey(path),
    path
  }));
  const matrix = [];
  const matrixByRowKey = {};
  for (const rowPath of rowHeaders) {
    const rowKey = makePathKey(rowPath);
    matrixByRowKey[rowKey] = {};
    for (const columnPath of columnHeaderPaths.length > 0 ? columnHeaderPaths : [[]]) {
      const columnKey = makePathKey(columnPath);
      const cellRows = bucketMap.get(rowKey)?.get(columnKey) ?? [];
      const values = aggregateRows(cellRows, options.values, options.aggregationFns);
      matrix.push({
        rowKey,
        columnKey,
        values
      });
      matrixByRowKey[rowKey][columnKey] = values;
    }
  }
  const grandTotals = aggregateRows(options.data, options.values, options.aggregationFns);
  return {
    rowTree,
    rowHeaders,
    columnHeaders,
    matrix,
    matrixByRowKey,
    grandTotals
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

// src/utils/exportCSV.ts
var FORMULA_TRIGGER_CHARS = /^[=+\-@\t\r\n]/;
var CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F]/g;
function escapeCsvCell(value, delimiter, quoteAllFields, sanitize) {
  if (value == null) {
    return "";
  }
  let raw;
  if (value instanceof Date) {
    raw = value.toISOString();
  } else {
    raw = String(value);
    if (sanitize) {
      raw = raw.replace(CONTROL_CHARS, "");
      if (raw.length > 0 && FORMULA_TRIGGER_CHARS.test(raw)) {
        raw = `'${raw}`;
      }
    }
  }
  const mustQuote = quoteAllFields || raw.includes('"') || raw.includes(delimiter) || raw.includes("\n") || raw.includes("\r");
  const escaped = raw.replace(/"/g, '""');
  return mustQuote ? `"${escaped}"` : escaped;
}
function inferColumns(rows) {
  const keys = /* @__PURE__ */ new Set();
  for (const row of rows) {
    Object.keys(row).forEach((key) => keys.add(key));
  }
  return Array.from(keys).map((id) => ({ id, header: id }));
}
function serializeCSV(options) {
  const {
    rows,
    includeHeader = true,
    delimiter = ",",
    lineBreak = "\n",
    quoteAllFields = false,
    sanitizeValues = true
  } = options;
  const columns = options.columns ?? inferColumns(rows);
  const lines = [];
  if (includeHeader) {
    const headerLine = columns.map((column) => escapeCsvCell(column.header ?? column.id, delimiter, quoteAllFields, sanitizeValues)).join(delimiter);
    lines.push(headerLine);
  }
  rows.forEach((row, index) => {
    const line = columns.map((column) => {
      const value = column.accessor ? column.accessor(row, index) : row[column.id];
      return escapeCsvCell(value, delimiter, quoteAllFields, sanitizeValues);
    }).join(delimiter);
    lines.push(line);
  });
  return lines.join(lineBreak);
}
function exportCSV(options) {
  const fileName = (options.fileName ?? "export.csv").replace(/[<>:"/\\|?*]/g, "_");
  const csv = serializeCSV(options);
  const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
  const blob = isBrowser ? new Blob([csv], { type: "text/csv;charset=utf-8;" }) : null;
  const download = () => {
    if (!isBrowser || !blob) {
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  return {
    csv,
    fileName,
    blob,
    download
  };
}

// src/utils/clipboard.ts
function isBrowserEnvironment() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}
async function fallbackCopyText(text) {
  if (!isBrowserEnvironment()) {
    return false;
  }
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "absolute";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();
  let success = false;
  try {
    success = document.execCommand("copy");
  } catch {
    success = false;
  } finally {
    document.body.removeChild(textArea);
  }
  return success;
}
async function copyToClipboard(options) {
  if (!isBrowserEnvironment()) {
    return false;
  }
  const { text, fallbackToExecCommand = true } = options;
  const canUseNavigatorClipboard = typeof navigator !== "undefined" && !!navigator.clipboard && typeof navigator.clipboard.writeText === "function";
  if (canUseNavigatorClipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      if (!fallbackToExecCommand) {
        return false;
      }
    }
  }
  return fallbackToExecCommand ? fallbackCopyText(text) : false;
}
function getFullscreenElement() {
  if (!isBrowserEnvironment()) {
    return null;
  }
  const doc = document;
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? doc.mozFullScreenElement ?? doc.msFullscreenElement ?? null;
}
async function requestFullscreen(element) {
  const target = element;
  const requester = target.requestFullscreen ?? target.webkitRequestFullscreen ?? target.mozRequestFullScreen ?? target.msRequestFullscreen;
  if (!requester) {
    return false;
  }
  await Promise.resolve(requester.call(target));
  return true;
}
async function exitFullscreen() {
  if (!isBrowserEnvironment()) {
    return false;
  }
  const doc = document;
  const exiter = document.exitFullscreen ?? doc.webkitExitFullscreen ?? doc.mozCancelFullScreen ?? doc.msExitFullscreen;
  if (!exiter) {
    return false;
  }
  await Promise.resolve(exiter.call(document));
  return true;
}
var fullscreen = {
  isSupported: () => {
    if (!isBrowserEnvironment()) {
      return false;
    }
    const root = document.documentElement;
    return Boolean(
      root.requestFullscreen || root.webkitRequestFullscreen || root.mozRequestFullScreen || root.msRequestFullscreen
    );
  },
  isFullscreen: () => Boolean(getFullscreenElement()),
  getElement: () => getFullscreenElement(),
  request: async (element) => {
    if (!isBrowserEnvironment()) {
      return false;
    }
    return requestFullscreen(element ?? document.documentElement);
  },
  exit: async () => {
    if (!getFullscreenElement()) {
      return true;
    }
    return exitFullscreen();
  },
  toggle: async (element) => {
    if (getFullscreenElement()) {
      return exitFullscreen();
    }
    if (!isBrowserEnvironment()) {
      return false;
    }
    return requestFullscreen(element ?? document.documentElement);
  },
  onChange: (listener) => {
    if (!isBrowserEnvironment()) {
      return () => void 0;
    }
    const handler = () => listener(Boolean(getFullscreenElement()));
    const events = [
      "fullscreenchange",
      "webkitfullscreenchange",
      "mozfullscreenchange",
      "MSFullscreenChange"
    ];
    events.forEach((eventName) => document.addEventListener(eventName, handler));
    return () => {
      events.forEach((eventName) => document.removeEventListener(eventName, handler));
    };
  }
};
function useVirtualRows(options) {
  const useIsomorphicLayoutEffect = typeof window !== "undefined" ? react.useLayoutEffect : react.useEffect;
  const [, forceUpdate] = react.useReducer((value) => value + 1, 0);
  const optionsRef = react.useRef(options);
  optionsRef.current = options;
  const virtualizerRef = react.useRef(null);
  if (!virtualizerRef.current) {
    const seedOptions = optionsRef.current;
    virtualizerRef.current = new virtualCore.Virtualizer({
      count: seedOptions.count,
      getScrollElement: seedOptions.getScrollElement,
      estimateSize: seedOptions.estimateSize,
      horizontal: false,
      observeElementRect: virtualCore.observeElementRect,
      observeElementOffset: virtualCore.observeElementOffset,
      scrollToFn: virtualCore.elementScroll
    });
  }
  const virtualizer = virtualizerRef.current;
  const {
    count,
    getScrollElement,
    estimateSize,
    scrollMode = "element",
    overscan,
    paddingStart,
    paddingEnd,
    scrollPaddingStart,
    scrollPaddingEnd,
    initialOffset,
    enabled,
    debug,
    getItemKey,
    rangeExtractor,
    measureElement,
    onChange,
    observeElementRect: customObserveElementRect,
    observeElementOffset: customObserveElementOffset,
    scrollToFn: customScrollToFn
  } = options;
  const resolvedOptions = react.useMemo(() => {
    const isWindowMode = scrollMode === "window";
    const observeRect = customObserveElementRect ? customObserveElementRect : isWindowMode ? virtualCore.observeWindowRect : virtualCore.observeElementRect;
    const observeOffset = customObserveElementOffset ? customObserveElementOffset : isWindowMode ? virtualCore.observeWindowOffset : virtualCore.observeElementOffset;
    const scrollToFn = customScrollToFn ? customScrollToFn : isWindowMode ? virtualCore.windowScroll : virtualCore.elementScroll;
    const nextOptions = {
      count,
      getScrollElement,
      estimateSize,
      horizontal: false,
      overscan,
      paddingStart,
      paddingEnd,
      scrollPaddingStart,
      scrollPaddingEnd,
      initialOffset,
      enabled,
      debug,
      getItemKey,
      rangeExtractor,
      measureElement,
      observeElementRect: observeRect,
      observeElementOffset: observeOffset,
      scrollToFn,
      onChange: (instance, sync) => {
        forceUpdate();
        onChange?.(instance, sync);
      }
    };
    return nextOptions;
  }, [
    count,
    debug,
    enabled,
    estimateSize,
    getItemKey,
    getScrollElement,
    initialOffset,
    measureElement,
    onChange,
    overscan,
    paddingEnd,
    paddingStart,
    rangeExtractor,
    scrollMode,
    scrollPaddingEnd,
    scrollPaddingStart,
    customObserveElementOffset,
    customObserveElementRect,
    customScrollToFn
  ]);
  useIsomorphicLayoutEffect(() => {
    virtualizer.setOptions(resolvedOptions);
  }, [resolvedOptions, virtualizer]);
  useIsomorphicLayoutEffect(() => {
    if (typeof virtualizer._didMount === "function") {
      return virtualizer._didMount();
    }
    return void 0;
  }, [virtualizer]);
  useIsomorphicLayoutEffect(() => {
    if (typeof virtualizer._willUpdate === "function") {
      virtualizer._willUpdate();
    }
  });
  return {
    virtualizer,
    virtualRows: virtualizer.getVirtualItems(),
    totalSize: virtualizer.getTotalSize()
  };
}
function useVirtualColumns(options) {
  const useIsomorphicLayoutEffect = typeof window !== "undefined" ? react.useLayoutEffect : react.useEffect;
  const [, forceUpdate] = react.useReducer((value) => value + 1, 0);
  const optionsRef = react.useRef(options);
  optionsRef.current = options;
  const virtualizerRef = react.useRef(null);
  if (!virtualizerRef.current) {
    const seedOptions = optionsRef.current;
    virtualizerRef.current = new virtualCore.Virtualizer({
      count: seedOptions.count,
      getScrollElement: seedOptions.getScrollElement,
      estimateSize: seedOptions.estimateSize,
      horizontal: true,
      observeElementRect: virtualCore.observeElementRect,
      observeElementOffset: virtualCore.observeElementOffset,
      scrollToFn: virtualCore.elementScroll
    });
  }
  const virtualizer = virtualizerRef.current;
  const {
    count,
    getScrollElement,
    estimateSize,
    scrollMode = "element",
    overscan,
    paddingStart,
    paddingEnd,
    scrollPaddingStart,
    scrollPaddingEnd,
    initialOffset,
    enabled,
    debug,
    getItemKey,
    rangeExtractor,
    measureElement,
    onChange,
    observeElementRect: customObserveElementRect,
    observeElementOffset: customObserveElementOffset,
    scrollToFn: customScrollToFn
  } = options;
  const resolvedOptions = react.useMemo(() => {
    const isWindowMode = scrollMode === "window";
    const observeRect = customObserveElementRect ? customObserveElementRect : isWindowMode ? virtualCore.observeWindowRect : virtualCore.observeElementRect;
    const observeOffset = customObserveElementOffset ? customObserveElementOffset : isWindowMode ? virtualCore.observeWindowOffset : virtualCore.observeElementOffset;
    const scrollToFn = customScrollToFn ? customScrollToFn : isWindowMode ? virtualCore.windowScroll : virtualCore.elementScroll;
    const nextOptions = {
      count,
      getScrollElement,
      estimateSize,
      horizontal: true,
      overscan,
      paddingStart,
      paddingEnd,
      scrollPaddingStart,
      scrollPaddingEnd,
      initialOffset,
      enabled,
      debug,
      getItemKey,
      rangeExtractor,
      measureElement,
      observeElementRect: observeRect,
      observeElementOffset: observeOffset,
      scrollToFn,
      onChange: (instance, sync) => {
        forceUpdate();
        onChange?.(instance, sync);
      }
    };
    return nextOptions;
  }, [
    count,
    debug,
    enabled,
    estimateSize,
    getItemKey,
    getScrollElement,
    initialOffset,
    measureElement,
    onChange,
    overscan,
    paddingEnd,
    paddingStart,
    rangeExtractor,
    scrollMode,
    scrollPaddingEnd,
    scrollPaddingStart,
    customObserveElementOffset,
    customObserveElementRect,
    customScrollToFn
  ]);
  useIsomorphicLayoutEffect(() => {
    virtualizer.setOptions(resolvedOptions);
  }, [resolvedOptions, virtualizer]);
  useIsomorphicLayoutEffect(() => {
    if (typeof virtualizer._didMount === "function") {
      return virtualizer._didMount();
    }
    return void 0;
  }, [virtualizer]);
  useIsomorphicLayoutEffect(() => {
    if (typeof virtualizer._willUpdate === "function") {
      virtualizer._willUpdate();
    }
  });
  return {
    virtualizer,
    virtualColumns: virtualizer.getVirtualItems(),
    totalSize: virtualizer.getTotalSize()
  };
}

// src/plugins/sorting.ts
function areSortingRulesEqual(next, previous) {
  if (next.length !== previous.length) {
    return false;
  }
  for (let index = 0; index < next.length; index += 1) {
    if (next[index].id !== previous[index].id || next[index].desc !== previous[index].desc) {
      return false;
    }
  }
  return true;
}
function comparePrimitives(left, right) {
  if (left === right) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  if (typeof left === "number" && typeof right === "number") {
    if (Number.isNaN(left) && Number.isNaN(right)) return 0;
    return left - right;
  }
  if (left instanceof Date && right instanceof Date) {
    return left.getTime() - right.getTime();
  }
  if (typeof left === "boolean" && typeof right === "boolean") {
    return Number(left) - Number(right);
  }
  return String(left).localeCompare(String(right), void 0, { sensitivity: "base" });
}
function createSortingPlugin(options = {}) {
  options.isMultiSortEvent ?? ((multi) => Boolean(multi));
  const cache = {
    rows: null,
    sorting: [],
    result: null
  };
  return {
    name: "sorting",
    getInitialState: (state) => ({
      ...state,
      sorting: state.sorting ?? []
    }),
    transformRows: (rows, context) => {
      const sorting = context.state.sorting ?? [];
      if (cache.rows === rows && cache.result && areSortingRulesEqual(sorting, cache.sorting)) {
        return cache.result;
      }
      if (sorting.length === 0) {
        cache.rows = rows;
        cache.sorting = [];
        cache.result = rows;
        return rows;
      }
      const len = rows.length;
      const indices = new Int32Array(len);
      for (let i = 0; i < len; i++) indices[i] = i;
      const sortColumnIds = sorting.map((r) => r.id);
      const sortValues = sorting.map(() => new Array(len));
      for (let rowIdx = 0; rowIdx < len; rowIdx++) {
        const rowValues = rows[rowIdx].values;
        for (let colIdx = 0; colIdx < sorting.length; colIdx++) {
          sortValues[colIdx][rowIdx] = rowValues[sortColumnIds[colIdx]];
        }
      }
      indices.sort((a, b) => {
        for (let colIdx = 0; colIdx < sorting.length; colIdx++) {
          const left = sortValues[colIdx][a];
          const right = sortValues[colIdx][b];
          const cmp = comparePrimitives(left, right);
          if (cmp !== 0) {
            return sorting[colIdx].desc ? -cmp : cmp;
          }
        }
        return 0;
      });
      const result = new Array(len);
      for (let i = 0; i < len; i++) {
        result[i] = rows[indices[i]];
      }
      cache.rows = rows;
      cache.sorting = sorting;
      cache.result = result;
      return result;
    },
    onStateChange: (state, previousState, context) => {
      const nextSorting = state.sorting ?? [];
      const previousSorting = previousState.sorting ?? [];
      if (areSortingRulesEqual(nextSorting, previousSorting)) {
        return;
      }
      const validColumns = new Set(context.columns.map((column) => column.id));
      const filteredSorting = nextSorting.filter((rule) => validColumns.has(rule.id));
      if (filteredSorting.length !== nextSorting.length) {
        context.setState((previous) => ({
          ...previous,
          sorting: filteredSorting
        }));
      }
    }
  };
}
var useSorting = createSortingPlugin;
function createSortingApi(table, options = {}) {
  const isMultiSortEvent = options.isMultiSortEvent ?? ((multi) => Boolean(multi));
  let lastSortingRef = null;
  let lastSortedColumnIdsRef = [];
  const getSorting = () => table.getState().sorting ?? [];
  const getSortedColumnIds = () => {
    const sorting = getSorting();
    if (lastSortingRef === sorting) {
      return lastSortedColumnIdsRef;
    }
    lastSortingRef = sorting;
    lastSortedColumnIdsRef = sorting.map((rule) => rule.id);
    return lastSortedColumnIdsRef;
  };
  return {
    getSorting,
    getSortedColumnIds,
    getIsSorted: (columnId) => {
      const sorting = getSorting();
      const match = sorting.find((rule) => rule.id === columnId);
      if (!match) {
        return false;
      }
      return match.desc ? "desc" : "asc";
    },
    setSorting: (updater) => {
      table.setState((previous) => {
        const previousSorting = previous.sorting ?? [];
        const nextSorting = typeof updater === "function" ? [...updater(previousSorting)] : updater;
        return {
          ...previous,
          sorting: nextSorting
        };
      });
    },
    toggleSorting: (columnId, multi) => {
      table.setState((previous) => {
        const previousSorting = previous.sorting ?? [];
        const current = previousSorting.find((rule) => rule.id === columnId);
        const canMultiSort = isMultiSortEvent(multi);
        if (!current) {
          return {
            ...previous,
            sorting: canMultiSort ? [...previousSorting, { id: columnId, desc: false }] : [{ id: columnId, desc: false }]
          };
        }
        if (!current.desc) {
          return {
            ...previous,
            sorting: previousSorting.map(
              (rule) => rule.id === columnId ? { ...rule, desc: true } : rule
            )
          };
        }
        const cleared = previousSorting.filter((rule) => rule.id !== columnId);
        return {
          ...previous,
          sorting: canMultiSort ? cleared : []
        };
      });
    },
    clearSorting: () => {
      table.setState((previous) => ({
        ...previous,
        sorting: []
      }));
    }
  };
}
function withSorting(table, options = {}) {
  return Object.assign(table, {
    sorting: createSortingApi(table, options)
  });
}

// src/plugins/filtering.ts
function areFiltersEqual(next, previous) {
  if (next.length !== previous.length) {
    return false;
  }
  for (let index = 0; index < next.length; index += 1) {
    if (next[index].id !== previous[index].id || next[index].value !== previous[index].value) {
      return false;
    }
  }
  return true;
}
function normalizeText(value) {
  if (value == null) {
    return "";
  }
  return String(value).toLowerCase().trim();
}
function defaultRowFilterFn(rowValue, filterValue) {
  if (filterValue == null || filterValue === "") {
    return true;
  }
  if (Array.isArray(filterValue)) {
    return filterValue.some((item) => defaultRowFilterFn(rowValue, item));
  }
  const normalizedFilterValue = normalizeText(filterValue);
  const normalizedRowValue = normalizeText(rowValue);
  return normalizedRowValue.includes(normalizedFilterValue);
}
function defaultGlobalFilterFn(row, globalFilter, columnIds) {
  if (globalFilter == null || globalFilter === "") {
    return true;
  }
  return columnIds.some(
    (columnId) => defaultRowFilterFn(row.getValue(columnId), globalFilter)
  );
}
function createFilteringPlugin(options = {}) {
  const rowFilterFn = options.rowFilterFn ?? defaultRowFilterFn;
  const globalFilterFn = options.globalFilterFn ?? defaultGlobalFilterFn;
  const cache = {
    rows: null,
    filterableIds: [],
    filters: [],
    globalFilter: void 0,
    result: null
  };
  return {
    name: "filtering",
    getInitialState: (state) => ({
      ...state,
      filters: state.filters ?? [],
      globalFilter: state.globalFilter ?? void 0
    }),
    transformRows: (rows, context) => {
      const columnFilters = context.state.filters ?? [];
      const globalFilter = context.state.globalFilter;
      const filterableIds = context.columns.filter((column) => column.enableFiltering !== false).map((column) => column.id);
      if (cache.rows === rows && cache.result && filterableIds.length === cache.filterableIds.length && filterableIds.every((id, i) => id === cache.filterableIds[i]) && areFiltersEqual(columnFilters, cache.filters) && globalFilter === cache.globalFilter) {
        return cache.result;
      }
      if (columnFilters.length === 0 && (globalFilter == null || globalFilter === "")) {
        cache.rows = rows;
        cache.filterableIds = filterableIds;
        cache.filters = columnFilters;
        cache.globalFilter = globalFilter;
        cache.result = rows;
        return rows;
      }
      const filterableSet = new Set(filterableIds);
      const activeFilters = columnFilters.filter((f) => filterableSet.has(f.id));
      const len = rows.length;
      const result = [];
      for (let i = 0; i < len; i++) {
        const row = rows[i];
        let passes = true;
        for (let f = 0; f < activeFilters.length; f++) {
          const filter = activeFilters[f];
          if (!rowFilterFn(row.values[filter.id], filter.value, row)) {
            passes = false;
            break;
          }
        }
        if (passes && globalFilter != null && globalFilter !== "") {
          if (!globalFilterFn(row, globalFilter, filterableIds)) {
            passes = false;
          }
        }
        if (passes) {
          result.push(row);
        }
      }
      cache.rows = rows;
      cache.filterableIds = filterableIds;
      cache.filters = columnFilters;
      cache.globalFilter = globalFilter;
      cache.result = result;
      return result;
    },
    onStateChange: (state, previousState, context) => {
      const nextFilters = state.filters ?? [];
      const previousFilters = previousState.filters ?? [];
      if (areFiltersEqual(nextFilters, previousFilters)) {
        return;
      }
      const validColumns = new Set(context.columns.map((column) => column.id));
      const normalizedFilters = nextFilters.filter((filter) => validColumns.has(filter.id));
      const invalidFilters = nextFilters.filter((filter) => !validColumns.has(filter.id));
      if (invalidFilters.length > 0 && process.env.NODE_ENV !== "production") {
        console.warn(
          `[FilteringPlugin] Unknown column filters: ${invalidFilters.map((f) => f.id).join(", ")}`,
          "Valid columns:",
          Array.from(validColumns)
        );
      }
      if (normalizedFilters.length !== nextFilters.length) {
        context.setState((previous) => ({
          ...previous,
          filters: normalizedFilters
        }));
      }
    }
  };
}
var useFiltering = createFilteringPlugin;
function createFilteringApi(table) {
  let lastFiltersRef = null;
  let lastFilteredColumnIdsRef = [];
  const getColumnFilters = () => table.getState().filters ?? [];
  return {
    getColumnFilters,
    getGlobalFilter: () => table.getState().globalFilter,
    setColumnFilters: (updater) => {
      table.setState((previous) => {
        const previousFilters = previous.filters ?? [];
        const nextFilters = typeof updater === "function" ? [...updater(previousFilters)] : updater;
        return {
          ...previous,
          filters: nextFilters
        };
      });
    },
    setGlobalFilter: (value) => {
      table.setState((previous) => ({
        ...previous,
        globalFilter: value
      }));
    },
    setColumnFilter: (columnId, value) => {
      table.setState((previous) => {
        const previousFilters = previous.filters ?? [];
        const nextFilters = previousFilters.filter((filter) => filter.id !== columnId);
        if (value != null && value !== "") {
          nextFilters.push({ id: columnId, value });
        }
        return {
          ...previous,
          filters: nextFilters
        };
      });
    },
    resetColumnFilters: () => {
      table.setState((previous) => ({
        ...previous,
        filters: []
      }));
    },
    resetGlobalFilter: () => {
      table.setState((previous) => ({
        ...previous,
        globalFilter: void 0
      }));
    },
    getFilteredColumnIds: () => {
      const filters = getColumnFilters();
      if (lastFiltersRef === filters) {
        return lastFilteredColumnIdsRef;
      }
      lastFiltersRef = filters;
      lastFilteredColumnIdsRef = filters.map((filter) => filter.id);
      return lastFilteredColumnIdsRef;
    }
  };
}
function withFiltering(table) {
  return Object.assign(table, {
    filtering: createFilteringApi(table)
  });
}

// src/plugins/grouping.ts
function areArraysEqual(left, right) {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}
function areExpandedMapsEqual(left, right) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const key of leftKeys) {
    if (left[key] !== right[key]) {
      return false;
    }
  }
  return true;
}
function buildGroupedTree(rows, grouping, depth = 0, parentPath = "") {
  if (depth >= grouping.length) {
    return [];
  }
  const columnId = grouping[depth];
  const grouped = /* @__PURE__ */ new Map();
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const value = row.values[columnId];
    const key = value == null ? "__null__" : String(value);
    const existing = grouped.get(key);
    if (existing) {
      existing.rows.push(row);
    } else {
      grouped.set(key, { value, rows: [row] });
    }
  }
  const result = [];
  for (const [groupKey, bucket] of grouped.entries()) {
    const path = parentPath ? `${parentPath}|${columnId}:${groupKey}` : `${columnId}:${groupKey}`;
    result.push({
      id: `group::${path}`,
      depth,
      key: groupKey,
      value: bucket.value,
      leafRows: bucket.rows,
      children: buildGroupedTree(bucket.rows, grouping, depth + 1, path)
    });
  }
  return result;
}
function flattenGroupedRows(nodes, grouping, expandedGroups) {
  const output = [];
  function walk(inputNodes) {
    for (let n = 0; n < inputNodes.length; n++) {
      const node = inputNodes[n];
      const groupingColumn = grouping[node.depth];
      const firstRow = node.leafRows[0];
      const groupValues = firstRow ? { ...firstRow.values } : {};
      groupValues.__group = true;
      groupValues.__depth = node.depth;
      groupValues.__groupingColumnId = groupingColumn;
      groupValues.__groupingValue = node.value;
      groupValues.__rowCount = node.leafRows.length;
      const groupRow = {
        id: node.id,
        index: -1,
        original: {},
        values: groupValues,
        getValue: (columnId) => groupValues[columnId]
      };
      output.push(groupRow);
      const isExpanded = expandedGroups[node.id] !== false;
      if (!isExpanded) {
        continue;
      }
      if (node.children.length > 0) {
        walk(node.children);
      } else {
        for (let r = 0; r < node.leafRows.length; r++) {
          output.push(node.leafRows[r]);
        }
      }
    }
  }
  walk(nodes);
  return output;
}
function createGroupingPlugin() {
  const cache = {
    rows: null,
    grouping: [],
    expanded: {},
    result: null
  };
  return {
    name: "grouping",
    getInitialState: (state) => ({
      ...state,
      rowGrouping: state.rowGrouping ?? [],
      columnGrouping: state.columnGrouping ?? [],
      expandedGroups: state.expandedGroups ?? {}
    }),
    transformRows: (rows, context) => {
      const rowGrouping = context.state.rowGrouping ?? [];
      const expandedGroups = context.state.expandedGroups ?? {};
      if (cache.rows === rows && cache.result && areArraysEqual(rowGrouping, cache.grouping) && areExpandedMapsEqual(expandedGroups, cache.expanded)) {
        return cache.result;
      }
      if (rowGrouping.length === 0) {
        cache.rows = rows;
        cache.grouping = [];
        cache.expanded = { ...expandedGroups };
        cache.result = rows;
        return rows;
      }
      const validColumnIds = new Set(context.columns.map((column) => column.id));
      const normalizedGrouping = rowGrouping.filter((columnId) => validColumnIds.has(columnId));
      if (normalizedGrouping.length === 0) {
        cache.rows = rows;
        cache.grouping = [];
        cache.expanded = { ...expandedGroups };
        cache.result = rows;
        return rows;
      }
      const tree = buildGroupedTree(rows, normalizedGrouping);
      const groupedRows = flattenGroupedRows(tree, normalizedGrouping, expandedGroups);
      cache.rows = rows;
      cache.grouping = normalizedGrouping;
      cache.expanded = { ...expandedGroups };
      cache.result = groupedRows;
      return groupedRows;
    },
    onStateChange: (state, previousState, context) => {
      if (areArraysEqual(state.rowGrouping ?? [], previousState.rowGrouping ?? []) && areArraysEqual(state.columnGrouping ?? [], previousState.columnGrouping ?? [])) {
        return;
      }
      const validColumnIds = new Set(context.columns.map((column) => column.id));
      const rowGrouping = (state.rowGrouping ?? []).filter(
        (columnId) => validColumnIds.has(columnId)
      );
      const columnGrouping = (state.columnGrouping ?? []).filter(
        (columnId) => validColumnIds.has(columnId)
      );
      if (!areArraysEqual(rowGrouping, state.rowGrouping ?? []) || !areArraysEqual(columnGrouping, state.columnGrouping ?? [])) {
        context.setState((previous) => ({
          ...previous,
          rowGrouping,
          columnGrouping
        }));
      }
    }
  };
}
function createGroupingApi(table) {
  return {
    getRowGrouping: () => table.getState().rowGrouping ?? [],
    getColumnGrouping: () => table.getState().columnGrouping ?? [],
    setRowGrouping: (updater) => {
      table.setState((previous) => {
        const current = previous.rowGrouping ?? [];
        const next = typeof updater === "function" ? [...updater(current)] : updater;
        return { ...previous, rowGrouping: next };
      });
    },
    setColumnGrouping: (updater) => {
      table.setState((previous) => {
        const current = previous.columnGrouping ?? [];
        const next = typeof updater === "function" ? [...updater(current)] : updater;
        return { ...previous, columnGrouping: next };
      });
    },
    toggleGroupExpanded: (groupId, value) => {
      table.setState((previous) => {
        const current = previous.expandedGroups?.[groupId] !== false;
        const next = value ?? !current;
        return {
          ...previous,
          expandedGroups: {
            ...previous.expandedGroups ?? {},
            [groupId]: next
          }
        };
      });
    },
    getIsGroupExpanded: (groupId) => table.getState().expandedGroups?.[groupId] !== false,
    resetGrouping: () => {
      table.setState((previous) => ({
        ...previous,
        rowGrouping: [],
        columnGrouping: [],
        expandedGroups: {}
      }));
    }
  };
}
function withGrouping(table) {
  return Object.assign(table, {
    grouping: createGroupingApi(table)
  });
}
var useGrouping = createGroupingPlugin;

// src/plugins/pivot.ts
function areArrayEqual(left, right) {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}
function arePivotValueDefsEqual(left, right) {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (left[index].id !== right[index].id || left[index].accessor !== right[index].accessor || left[index].aggregation !== right[index].aggregation) {
      return false;
    }
  }
  return true;
}
function toGroupDefs(grouping) {
  return grouping.map((id) => ({ id }));
}
function createPivotPlugin(options = {}) {
  const clientSide = options.clientSide !== false;
  let lastRowsRef = null;
  let lastRowGroupingRef = [];
  let lastColumnGroupingRef = [];
  let lastPivotValuesRef = [];
  let lastResultRef = null;
  return {
    name: "pivot",
    getInitialState: (state) => ({
      ...state,
      rowGrouping: state.rowGrouping ?? [],
      columnGrouping: state.columnGrouping ?? [],
      pivotValues: state.pivotValues ?? options.defaultValues ?? [],
      pivotEnabled: state.pivotEnabled ?? false
    }),
    transformRows: (rows, context) => {
      const pivotEnabled = context.state.pivotEnabled ?? false;
      const rowGrouping = context.state.rowGrouping ?? [];
      const columnGrouping = context.state.columnGrouping ?? [];
      const pivotValues = context.state.pivotValues ?? options.defaultValues ?? [];
      if (!pivotEnabled || !clientSide || pivotValues.length === 0) {
        lastRowsRef = rows;
        lastRowGroupingRef = rowGrouping.slice();
        lastColumnGroupingRef = columnGrouping.slice();
        lastPivotValuesRef = pivotValues.slice();
        lastResultRef = rows;
        return rows;
      }
      if (lastRowsRef === rows && lastResultRef && areArrayEqual(rowGrouping, lastRowGroupingRef) && areArrayEqual(columnGrouping, lastColumnGroupingRef) && arePivotValueDefsEqual(pivotValues, lastPivotValuesRef)) {
        return lastResultRef;
      }
      const result = createPivotEngineResult({
        data: rows.map((row) => row.original),
        rowGroupBy: toGroupDefs(rowGrouping),
        columnGroupBy: toGroupDefs(columnGrouping),
        values: pivotValues,
        aggregationFns: options.aggregationFns
      });
      const rowKeys = result.rowHeaders.map(
        (path) => path.length === 0 ? "__root__" : path.join("||")
      );
      const pivotRows = rowKeys.map((rowKey, index) => {
        const rowValues = {
          __pivot: true,
          __rowKey: rowKey
        };
        const rowMatrix = result.matrixByRowKey[rowKey] ?? {};
        for (const [columnKey, valueMap] of Object.entries(rowMatrix)) {
          for (const [valueId, value] of Object.entries(valueMap)) {
            rowValues[`${columnKey}::${valueId}`] = value;
          }
        }
        return {
          id: `pivot::${rowKey}`,
          index,
          original: {},
          values: rowValues,
          getValue: (columnId) => rowValues[columnId]
        };
      });
      lastRowsRef = rows;
      lastRowGroupingRef = rowGrouping.slice();
      lastColumnGroupingRef = columnGrouping.slice();
      lastPivotValuesRef = pivotValues.slice();
      lastResultRef = pivotRows;
      return pivotRows;
    }
  };
}
function createPivotApi(table, options = {}) {
  const getRequest = () => {
    const state = table.getState();
    return {
      rowGroupBy: (state.rowGrouping ?? []).map((id) => ({ id })),
      columnGroupBy: (state.columnGrouping ?? []).map((id) => ({ id })),
      values: state.pivotValues ?? options.defaultValues ?? []
    };
  };
  let lastResultCache = null;
  let lastRequestCache = null;
  let lastCoreRowsRef = null;
  const getPivotResult = () => {
    const request = getRequest();
    const coreRows = table.getCoreRowModel().rows;
    if (!table.getState().pivotEnabled || request.values.length === 0) {
      return null;
    }
    if (lastRequestCache && lastCoreRowsRef === coreRows && areArrayEqual(
      request.rowGroupBy.map((value) => value.id),
      lastRequestCache.rowGroupBy.map((value) => value.id)
    ) && areArrayEqual(
      request.columnGroupBy.map((value) => value.id),
      lastRequestCache.columnGroupBy.map((value) => value.id)
    ) && arePivotValueDefsEqual(request.values, lastRequestCache.values)) {
      return lastResultCache;
    }
    const dataRows = coreRows.map((row) => row.original);
    const nextResult = createPivotEngineResult({
      data: dataRows,
      rowGroupBy: request.rowGroupBy,
      columnGroupBy: request.columnGroupBy,
      values: request.values,
      aggregationFns: options.aggregationFns
    });
    lastRequestCache = request;
    lastCoreRowsRef = coreRows;
    lastResultCache = nextResult;
    return nextResult;
  };
  return {
    getPivotResult,
    getPivotColumns: () => getPivotResult()?.columnHeaders ?? [],
    getPivotValues: () => table.getState().pivotValues ?? options.defaultValues ?? [],
    setPivotValues: (updater) => {
      table.setState((previous) => {
        const current = previous.pivotValues ?? options.defaultValues ?? [];
        const next = typeof updater === "function" ? updater(current) : updater;
        return { ...previous, pivotValues: next };
      });
    },
    setPivotEnabled: (enabled) => {
      table.setState((previous) => ({ ...previous, pivotEnabled: enabled }));
    },
    runServerSidePivot: async () => {
      if (!options.serverAdapter) {
        return null;
      }
      const request = getRequest();
      if (request.values.length === 0) {
        return null;
      }
      return options.serverAdapter.execute(request);
    }
  };
}
function withPivot(table, options = {}) {
  return Object.assign(table, {
    pivot: createPivotApi(table, options)
  });
}
var usePivot = createPivotPlugin;

// src/plugins/columnVisibility.ts
function createColumnVisibilityPlugin() {
  return {
    name: "columnVisibility",
    getInitialState: (state) => ({
      ...state,
      columnVisibility: state.columnVisibility ?? {}
    })
  };
}
function createColumnVisibilityApi(table) {
  const getColumnVisibility = () => {
    const state = table.getState();
    return state.columnVisibility ?? {};
  };
  return {
    getColumnVisibility,
    getIsColumnVisible: (columnId) => getColumnVisibility()[columnId] !== false,
    getVisibleColumnIds: () => table.columns.filter((column) => getColumnVisibility()[column.id] !== false).map((column) => column.id),
    setColumnVisibility: (updater) => {
      table.setState((previous) => {
        const previousVisibility = previous.columnVisibility ?? {};
        const nextVisibility = typeof updater === "function" ? updater(previousVisibility) : updater;
        return {
          ...previous,
          columnVisibility: nextVisibility
        };
      });
    },
    toggleColumnVisibility: (columnId, value) => {
      table.setState((previous) => {
        const previousValue = previous.columnVisibility?.[columnId] ?? true;
        const nextValue = value ?? !previousValue;
        return {
          ...previous,
          columnVisibility: {
            ...previous.columnVisibility ?? {},
            [columnId]: nextValue
          }
        };
      });
    },
    resetColumnVisibility: () => {
      table.setState((previous) => ({
        ...previous,
        columnVisibility: {}
      }));
    }
  };
}
function withColumnVisibility(table) {
  return Object.assign(table, {
    columnVisibility: createColumnVisibilityApi(table)
  });
}

// src/plugins/columnOrdering.ts
function unique(items) {
  return Array.from(new Set(items));
}
function createColumnOrderingPlugin() {
  return {
    name: "columnOrdering",
    getInitialState: (state) => ({
      ...state,
      columnOrder: unique(state.columnOrder ?? [])
    })
  };
}
function createColumnOrderingApi(table) {
  const getColumnOrder = () => {
    const state = table.getState();
    return unique(state.columnOrder ?? []);
  };
  const normalizeOrder = (order) => {
    const allColumnIds = table.columns.map((column) => column.id);
    const knownInOrder = order.filter((columnId) => allColumnIds.includes(columnId));
    const remainder = allColumnIds.filter((columnId) => !knownInOrder.includes(columnId));
    return [...knownInOrder, ...remainder];
  };
  return {
    getColumnOrder,
    getOrderedColumnIds: () => normalizeOrder(getColumnOrder()),
    setColumnOrder: (updater) => {
      table.setState((previous) => {
        const previousOrder = previous.columnOrder ?? [];
        const nextOrder = typeof updater === "function" ? updater(previousOrder) : updater;
        return {
          ...previous,
          columnOrder: unique(nextOrder)
        };
      });
    },
    reorderColumn: (columnId, targetIndex) => {
      const currentOrder = normalizeOrder(getColumnOrder());
      const currentIndex = currentOrder.indexOf(columnId);
      if (currentIndex === -1) {
        return;
      }
      const boundedTargetIndex = Math.max(0, Math.min(targetIndex, currentOrder.length - 1));
      if (currentIndex === boundedTargetIndex) {
        return;
      }
      const nextOrder = [...currentOrder];
      nextOrder.splice(currentIndex, 1);
      nextOrder.splice(boundedTargetIndex, 0, columnId);
      table.setState((previous) => ({
        ...previous,
        columnOrder: unique(nextOrder)
      }));
    },
    resetColumnOrder: () => {
      table.setState((previous) => ({
        ...previous,
        columnOrder: []
      }));
    }
  };
}
function withColumnOrdering(table) {
  return Object.assign(table, {
    columnOrdering: createColumnOrderingApi(table)
  });
}

// src/plugins/columnPinning.ts
function unique2(items) {
  return Array.from(new Set(items));
}
function normalizePinning(value) {
  const left = unique2(value?.left ?? []);
  const right = unique2((value?.right ?? []).filter((columnId) => !left.includes(columnId)));
  return { left, right };
}
function createColumnPinningPlugin() {
  return {
    name: "columnPinning",
    getInitialState: (state) => ({
      ...state,
      columnPinning: normalizePinning(state.columnPinning)
    })
  };
}
function createColumnPinningApi(table) {
  const getColumnPinning = () => {
    const state = table.getState();
    return normalizePinning(state.columnPinning);
  };
  return {
    getColumnPinning,
    setColumnPinning: (updater) => {
      table.setState((previous) => {
        const previousPinning = normalizePinning(previous.columnPinning);
        const nextPinning = typeof updater === "function" ? updater(previousPinning) : updater;
        return {
          ...previous,
          columnPinning: normalizePinning(nextPinning)
        };
      });
    },
    pinColumn: (columnId, side) => {
      table.setState((previous) => {
        const pinning = normalizePinning(previous.columnPinning);
        const left = pinning.left.filter((id) => id !== columnId);
        const right = pinning.right.filter((id) => id !== columnId);
        if (side === "left") {
          left.push(columnId);
        } else if (side === "right") {
          right.push(columnId);
        }
        return {
          ...previous,
          columnPinning: normalizePinning({ left, right })
        };
      });
    },
    getPinnedColumns: (side) => getColumnPinning()[side],
    getCenterColumnIds: () => {
      const pinning = getColumnPinning();
      const pinnedIds = /* @__PURE__ */ new Set([...pinning.left, ...pinning.right]);
      return table.columns.map((column) => column.id).filter((columnId) => !pinnedIds.has(columnId));
    },
    resetColumnPinning: () => {
      table.setState((previous) => ({
        ...previous,
        columnPinning: { left: [], right: [] }
      }));
    }
  };
}
function withColumnPinning(table) {
  return Object.assign(table, {
    columnPinning: createColumnPinningApi(table)
  });
}

// src/plugins/dndRow.ts
function unique3(items) {
  return Array.from(new Set(items));
}
function move(items, fromIndex, toIndex) {
  if (fromIndex === toIndex) {
    return items;
  }
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}
function reorderRowsByOrder(rows, rowOrder) {
  if (rowOrder.length === 0) {
    return rows;
  }
  const rank = /* @__PURE__ */ new Map();
  rowOrder.forEach((id, index) => {
    rank.set(id, index);
  });
  const sorted = [...rows].sort((left, right) => {
    const leftRank = rank.get(left.id);
    const rightRank = rank.get(right.id);
    if (leftRank == null && rightRank == null) {
      return 0;
    }
    if (leftRank == null) {
      return 1;
    }
    if (rightRank == null) {
      return -1;
    }
    return leftRank - rightRank;
  });
  return sorted;
}
function createDndRowPlugin() {
  let lastRowsRef = null;
  let lastOrderRef = [];
  let lastResultRef = null;
  return {
    name: "dndRow",
    getInitialState: (state) => ({
      ...state,
      rowOrder: unique3(state.rowOrder ?? [])
    }),
    transformRows: (rows, context) => {
      const rowOrder = unique3(context.state.rowOrder ?? []);
      if (lastRowsRef === rows && lastResultRef && rowOrder.length === lastOrderRef.length && rowOrder.every((id, index) => id === lastOrderRef[index])) {
        return lastResultRef;
      }
      if (rowOrder.length === 0) {
        lastRowsRef = rows;
        lastOrderRef = [];
        lastResultRef = rows;
        return rows;
      }
      const reordered = reorderRowsByOrder(rows, rowOrder);
      lastRowsRef = rows;
      lastOrderRef = rowOrder;
      lastResultRef = reordered;
      return reordered;
    }
  };
}
function createDndRowApi(table) {
  const getSortableRowIds = () => table.getCoreRowModel().rows.map((row) => row.id);
  const normalizeOrder = (order) => {
    const allIds = getSortableRowIds();
    const known = order.filter((id) => allIds.includes(id));
    const remaining = allIds.filter((id) => !known.includes(id));
    return [...known, ...remaining];
  };
  const getRowOrder = () => {
    const current = table.getState().rowOrder ?? [];
    return normalizeOrder(unique3(current));
  };
  const reorderRows = (activeId, overId) => {
    const fromId = String(activeId);
    const toId = String(overId);
    if (fromId === toId) {
      return;
    }
    const currentOrder = getRowOrder();
    const fromIndex = currentOrder.indexOf(fromId);
    const toIndex = currentOrder.indexOf(toId);
    if (fromIndex === -1 || toIndex === -1) {
      return;
    }
    const nextOrder = move(currentOrder, fromIndex, toIndex);
    table.setState((previous) => ({
      ...previous,
      rowOrder: unique3(nextOrder)
    }));
  };
  return {
    getRowOrder,
    getSortableRowIds,
    setRowOrder: (updater) => {
      table.setState((previous) => {
        const previousOrder = previous.rowOrder ?? [];
        const next = typeof updater === "function" ? updater(previousOrder) : updater;
        return {
          ...previous,
          rowOrder: unique3(normalizeOrder(next))
        };
      });
    },
    reorderRows,
    handleDragEnd: ({ active, over }) => {
      if (!over) {
        return;
      }
      reorderRows(active.id, over.id);
    },
    resetRowOrder: () => {
      table.setState((previous) => ({
        ...previous,
        rowOrder: []
      }));
    }
  };
}
function withDndRow(table) {
  return Object.assign(table, {
    dndRow: createDndRowApi(table)
  });
}
var useDndRow = createDndRowPlugin;

// src/plugins/dndColumn.ts
function unique4(items) {
  return Array.from(new Set(items));
}
function move2(items, fromIndex, toIndex) {
  if (fromIndex === toIndex) {
    return items;
  }
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}
function createDndColumnPlugin() {
  return {
    name: "dndColumn",
    getInitialState: (state) => ({
      ...state,
      columnOrder: unique4(state.columnOrder ?? [])
    })
  };
}
function createDndColumnApi(table) {
  const getSortableColumnIds = () => table.columns.map((column) => column.id);
  const normalizeOrder = (order) => {
    const allIds = getSortableColumnIds();
    const known = order.filter((id) => allIds.includes(id));
    const remaining = allIds.filter((id) => !known.includes(id));
    return [...known, ...remaining];
  };
  const getColumnOrder = () => {
    const current = table.getState().columnOrder ?? [];
    return normalizeOrder(unique4(current));
  };
  const reorderColumns = (activeId, overId) => {
    const fromId = String(activeId);
    const toId = String(overId);
    if (fromId === toId) {
      return;
    }
    const currentOrder = getColumnOrder();
    const fromIndex = currentOrder.indexOf(fromId);
    const toIndex = currentOrder.indexOf(toId);
    if (fromIndex === -1 || toIndex === -1) {
      return;
    }
    const nextOrder = move2(currentOrder, fromIndex, toIndex);
    table.setState((previous) => ({
      ...previous,
      columnOrder: unique4(nextOrder)
    }));
  };
  return {
    getColumnOrder,
    getSortableColumnIds,
    setColumnOrder: (updater) => {
      table.setState((previous) => {
        const previousOrder = previous.columnOrder ?? [];
        const next = typeof updater === "function" ? updater(previousOrder) : updater;
        return {
          ...previous,
          columnOrder: unique4(normalizeOrder(next))
        };
      });
    },
    reorderColumns,
    handleDragEnd: ({ active, over }) => {
      if (!over) {
        return;
      }
      reorderColumns(active.id, over.id);
    },
    resetColumnOrder: () => {
      table.setState((previous) => ({
        ...previous,
        columnOrder: []
      }));
    }
  };
}
function withDndColumn(table) {
  return Object.assign(table, {
    dndColumn: createDndColumnApi(table)
  });
}
var useDndColumn = createDndColumnPlugin;

exports.DEFAULT_MANIFESTS = DEFAULT_MANIFESTS;
exports.aggregationFns = aggregationFns;
exports.copyToClipboard = copyToClipboard;
exports.createColumnOrderingPlugin = createColumnOrderingPlugin;
exports.createColumnPinningPlugin = createColumnPinningPlugin;
exports.createColumnVisibilityPlugin = createColumnVisibilityPlugin;
exports.createDefaultTableState = createDefaultTableState;
exports.createDndColumnPlugin = createDndColumnPlugin;
exports.createDndRowPlugin = createDndRowPlugin;
exports.createFilteringPlugin = createFilteringPlugin;
exports.createGroupingPlugin = createGroupingPlugin;
exports.createPivotEngineResult = createPivotEngineResult;
exports.createPivotPlugin = createPivotPlugin;
exports.createPivotTableStore = createPivotTableStore;
exports.createPluginRegistry = createPluginRegistry;
exports.createSortingPlugin = createSortingPlugin;
exports.exportCSV = exportCSV;
exports.fullscreen = fullscreen;
exports.resolveAggregationFn = resolveAggregationFn;
exports.serializeCSV = serializeCSV;
exports.useDndColumn = useDndColumn;
exports.useDndRow = useDndRow;
exports.useFiltering = useFiltering;
exports.useGrouping = useGrouping;
exports.usePivot = usePivot;
exports.usePivotTable = usePivotTable;
exports.useSorting = useSorting;
exports.useVirtualColumns = useVirtualColumns;
exports.useVirtualRows = useVirtualRows;
exports.withColumnOrdering = withColumnOrdering;
exports.withColumnPinning = withColumnPinning;
exports.withColumnVisibility = withColumnVisibility;
exports.withDndColumn = withDndColumn;
exports.withDndRow = withDndRow;
exports.withFiltering = withFiltering;
exports.withGrouping = withGrouping;
exports.withPivot = withPivot;
exports.withSorting = withSorting;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map