# Architecture Context

- **Core flow:** `Consumer → usePivotTable (normalizeColumns, buildCoreRowModel, Zustand store, plugin pipeline) → {columns, rowModel, state, setState} → render` — `src/core/usePivotTable.ts:171-440`
- **Layering:** `types` leaf → `utils` pure → `store` isolated (`zustand/vanilla`) → `core` orchestration → `plugins` independent → `hooks` external adapters — `src/index.ts`, `src/types/*`, `src/utils/*`, `src/store/*`, `src/core/*`, `src/plugins/*`, `src/hooks/*`
- **No circular deps observed.**
- **Plugin contract:** `PivotTablePlugin { name, getInitialState?, transformRows?, transformColumns?, onStateChange? }`, context `PivotTablePluginContext { columns, data, state, setState, getColumnById }` — `src/types/plugin.ts:6-36`
- **Pipeline:** plugins run in `options.plugins` order; row pipeline `transformRows` and column pipeline `transformColumns` each cached (`Map` keyed `plugin_${name}_v${version}` + per-plugin closures) — `src/core/usePivotTable.ts:84-89,358-425`, `src/plugins/sorting.ts:80-84` etc.
- **State:** Zustand store `PivotTableStore { state, setState(Updater<T>), resetState }` with `shallowEqualState` bailout — `src/store/pivotTableStore.ts:5-52`; `mergeStates(internal, controlled)` for controlled/uncontrolled — `src/core/usePivotTable.ts:74-82,292-294`; base `TableState { sorting, filters, columnVisibility, rowSelection, expanded }` plus plugin slices — `src/types/state.ts:26-32` + each plugin.
- **Conflicts:** `pivot↔grouping` (`rowGrouping,columnGrouping`), `columnOrdering↔dndColumn` (`columnOrder`) via `DEFAULT_MANIFESTS` + shared `stateKeys` — `src/store/pluginRegistry.ts:119-174`
- **Engine:** `createPivotEngineResult` stateless (`src/core/pivotEngine.ts:160-242`) + adapter `PivotServerAdapter` (`src/core/pivotEngine.ts:56-58`)
- **Headless:** no UI/CSS/HTML in `src/` except optional `AggregatorDropdown.tsx`.

## Evidence Sources

- `src/core/usePivotTable.ts`, `pivotEngine.ts`, `src/types/*`, `src/store/*`, `src/plugins/*`, `src/hooks/*`, `src/utils/*`, `tsup.config.ts`
