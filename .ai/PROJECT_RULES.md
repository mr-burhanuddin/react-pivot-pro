# PROJECT_RULES

> Delegates to evidence-backed docs under `.ai/docs/`. This file satisfies `AGENTS.md:26` required reading.

## Scope

Rules for `react-pivot-pro` — headless, plugin-driven pivot table engine for React + TypeScript (`package.json:4`, `src/index.ts:1`).

## Technical Constraints

- TypeScript `strict:true`, `target:ESNext`, `module:ESNext`, `moduleResolution:bundler`, `jsx:react-jsx`, `declaration:true` — `tsconfig.json:2-12`
- Build `tsup` → `dist/` (`format:esm,cjs`, `dts:true`, `treeshake:true`, `minify:true`, `external:['react','react-dom','react/jsx-runtime']`) — `tsup.config.ts:18-25`
- Peers `react>=18.0.0` required; `react-dom>=18` optional — `package.json:92-95`
- Runtime deps only `zustand`, `@dnd-kit/core`, `@tanstack/virtual-core` — `package.json:96-99`; no backend, no DB — `.ai/docs/06-backend-architecture.md`
- `sideEffects:false`, `type:module` — `package.json:27,76`
- Node `>=18` — `package.json:117`

## Coding Standards

- Generics must be `TData extends RowData` (`RowData=Record<string,unknown>` — `src/types/table.ts:6`); key extraction via `Extract<keyof TData, string>` — `src/types/column.ts:5`, `AGENTS.md` precedent
- Type-only imports via `import type` — `src/core/usePivotTable.ts:4-16`, all plugins
- Files `kebab-case` (`pivotEngine.ts`, `useVirtualRows.ts`), interfaces `PascalCase` (`ColumnDef`, `PivotEngineResult`), plugin factories `createXPlugin` / `createXApi` / `withX` / `useX` — `src/plugins/*.ts`
- Relative imports only in `src/`; external first, internal second; barrel via `src/index.ts` — `src/types/index.ts`
- No `any`, no class components, no UI/CSS in `src/` (only `src/plugins/aggregation/AggregatorDropdown.tsx` exception) — headless principle `src/index.ts`
- Zustand via `zustand/vanilla` only; no consumer `zustand` imports — `src/store/pivotTableStore.ts:1`

## Implementation Expectations

- Follow plugin triad for every feature: `createXPlugin()->PivotTablePlugin`, `createXApi(table)->XApi`, `withX(table)->PivotTableWithX`, optional `useX(table)` — all 10 plugins `src/plugins/*.ts` — `.ai/docs/03-patterns.md:5-48`
- Implement `PivotTablePlugin` subset: `name`, `getInitialState?`, `transformRows?`, `transformColumns?`, `onStateChange?` — `src/types/plugin.ts:17-36`
- `getInitialState` must use `??` defaults, never overwrite — e.g. `sorting: state.sorting ?? []` — `src/plugins/sorting.ts:88-91`
- `transformRows/Columns` must passthrough when state slice empty; cache via input ref + state equality (`areSortingRulesEqual` etc.) — `src/plugins/sorting.ts:80-97`
- State setters must use `Updater<T> = T | ((prev:T)=>T)` — `src/types/state.ts:1`, `src/store/pivotTableStore.ts:11-19`
- Keep `src/types/` leaf (no runtime imports); plugins never import each other — `.ai/docs/02-architecture.md:60-68`
- Memoize `data`/`columns`/`plugins` in consumers — pipeline invalidates on ref change (`dataVersion`/`pluginVersion`) — `src/core/usePivotTable.ts:175-188`
- Before commit: `npm run typecheck`, `npm run lint`, `npm run test:run` — precedent `AGENTS.md` (pre-move) and `.ai/AI_GUIDE.md`

## Approved Patterns

- Headless: `usePivotTable` returns `{ state, columns, rowModel, getState, setState, getCoreRowModel, getRowModel, registerPlugin, ... }` — `src/types/table.ts:22-37`
- Controlled/uncontrolled via `mergeStates(internal, options.state)` with controlled precedence — `src/core/usePivotTable.ts:74-82`
- Caching: pipeline `Map` + per-plugin closures; invalidated by `pluginVersion`/`dataVersion`/`stateVersion` — `src/core/usePivotTable.ts:84-89,358-425`
- `Object.assign` augmentation for `withX` — `src/plugins/sorting.ts:265`
- Virtualization adapter wrapping `@tanstack/virtual-core` (`horizontal:false` for rows, `true` for cols) — `src/hooks/useVirtualRows.ts:50`
- Defensive guards: `isSafeKey` (`src/utils/accessorHelpers.ts:3`), `VALID_ID_PATTERN` (`src/core/usePivotTable.ts:23`), CSV `FORMULA_TRIGGER_CHARS` (`src/utils/exportCSV.ts:29`)

## Prohibited

- Cross-plugin imports, plugin→store imports, `any`, class components, mixing UI with core, mutating input `data`
- Explicit conflicts: `pivot`↔`grouping` (shared `rowGrouping`/`columnGrouping`), `columnOrdering`↔`dndColumn` (shared `columnOrder`) — `src/store/pluginRegistry.ts:119-174`

## Detailed Reference

- Do's and Don'ts: `.ai/docs/04-dos-and-donts.md`
- Patterns: `.ai/.ai/docs/03-patterns.md`
- Frontend: `.ai/docs/05-frontend-architecture.md`
- State: `.ai/docs/08-state-management.md`

## Evidence Sources

- `package.json`, `tsconfig.json`, `tsup.config.ts`
- `src/types/*`, `src/core/usePivotTable.ts`, `src/store/*`, `src/plugins/*`, `src/hooks/*`, `src/utils/*`
- `.ai/.ai/docs/02-architecture.md` through `09-component-catalog.md`
