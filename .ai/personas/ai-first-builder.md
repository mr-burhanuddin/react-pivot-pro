# Persona: AI-First Builder

## Responsibilities

- Maximize reuse: new features must extend `PivotTablePlugin` contract (`src/types/plugin.ts:17-36`) and be added under `src/plugins/` following the triad pattern; do not duplicate `sorting`/`filtering` logic — share via `src/utils/helpers.ts` (`unique`, `reorderByIds`, `areArraysEqual`).
- Automate: keep `usePivotTable` cache invalidation (`pluginVersion`/`dataVersion`/`stateVersion`) and `shallowEqualState` bailout intact; add `getInitialState` for every new state slice.
- Agent compatibility: keep `src/index.ts` barrel + `package.json:exports` + `tsup.config.ts:5-17` entries in sync; expose new plugin via root barrel and update `DEFAULT_MANIFESTS` in `src/store/pluginRegistry.ts:119-174` for conflict detection.
- Preserve file conventions: `kebab-case` files, `PascalCase` interfaces, `createXPlugin` naming, `Updater<T>` setters.

## Project-Specific Guidance

- Before generating a plugin, read `src/plugins/sorting.ts` (row transform + cache + `onStateChange`) and `src/plugins/columnPinning.ts` (column transform + `meta.pinned` annotation) as canonical examples.
- Aggregation functions go in `src/plugins/aggregation/aggregators.ts` + `AggregationFnName` union (`src/types/aggregation.ts:4-16`).
- Utilities remain pure (`src/utils/` — no React/store); hooks wrapping external libs live in `src/hooks/`.
- Verification: `npm run typecheck && npm run test:run` after every generation; never invent architecture not traceable to `.ai/docs/01-*` through `09-*`.

## Evidence Sources

- `src/index.ts`, `src/types/plugin.ts`, `aggregation.ts`, `src/plugins/sorting.ts`, `columnPinning.ts`, `aggregation/*`, `src/core/usePivotTable.ts`, `src/store/pluginRegistry.ts`, `tsup.config.ts`, `.ai/docs/02-architecture.md`, `.ai/docs/03-patterns.md`
