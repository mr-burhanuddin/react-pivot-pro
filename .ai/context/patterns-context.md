# Patterns Context

- **Plugin triad:** `createXPlugin` → `PivotTablePlugin`, `createXApi(table)` → `XApi`, `withX(table)` → `Object.assign(table,{x:api})`, optional `useX(table)` alias — all 10 plugins: `src/plugins/*.ts` (` table).
- **Updater pattern:** `type Updater<T> = T | ((prev:T)=>T)` — `src/types/state.ts:1`; resolved via `resolveUpdater` in `src/store/pivotTableStore.ts:11-19` and `src/core/usePivotTable.ts:228-242`; every `setX` uses it.
- **Zustand vanilla store:** `createStore` + `useStore(store, selector)` — `src/store/pivotTableStore.ts:31`, `src/core/usePivotTable.ts:218,291`.
- **Controlled/uncontrolled merge:** `mergeStates(internal, options.state)` with controlled precedence — `src/core/usePivotTable.ts:74-82`.
- **Caching:** input ref equality + state equality (`areSortingRulesEqual`, `areFiltersEqual`, `areArraysEqual`, `JSON.stringify` for aggregators) — `src/plugins/sorting.ts:39-97` etc., plus pipeline `Map` in `src/core/usePivotTable.ts:84-89,364-376`.
- **Generics:** always `TData extends RowData` (`RowData=Record<string,unknown>` — `src/types/table.ts:6`); keys via `Extract<keyof TData, string>` — `src/types/column.ts:5`.
- **Imports:** `import type` for types — `src/core/usePivotTable.ts:4-16` etc.; external first, internal second; relative paths; barrel re-exports via `src/index.ts` + `package.json:exports` + `tsup.config.ts:5-17`.
- **Barrels:** `src/types/index.ts`, `src/hooks/index.ts`, `src/store/index.ts`, `src/utils/index.ts`, `src/plugins/aggregation/index.ts`.
- **Virtualization adapter:** `useVirtualRows` (`horizontal:false`) vs `useVirtualColumns` (`horizontal:true`) wrapping `@tanstack/virtual-core` `Virtualizer`, `useIsomorphicLayoutEffect`, `useReducer` force-update — `src/hooks/useVirtualRows.ts:50-212`.
- **Wrapping:** `Object.assign` augmentation — e.g., `src/plugins/sorting.ts:265`.
- **Safety nets:** `isSafeKey` (`src/utils/accessorHelpers.ts:3-8`), `VALID_ID_PATTERN` (`src/core/usePivotTable.ts:23`), CSV `FORMULA_TRIGGER_CHARS` (`src/utils/exportCSV.ts:29`).

## Evidence Sources

- `src/index.ts`, `src/types/*`, `src/core/usePivotTable.ts`, `src/store/pivotTableStore.ts`, `src/plugins/*`, `src/hooks/*`, `src/utils/*`, `tsconfig.json:9-10`
