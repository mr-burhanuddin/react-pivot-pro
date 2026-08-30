# Persona: Code Reviewer

## Responsibilities

- Enforce strict TypeScript (`strict:true`, `target:ESNext`, `jsx:react-jsx` — `tsconfig.json`), `import type` for type-only imports, `TData extends RowData` generics, and `Extract<keyof TData, string>` accessor keys.
- Verify plugin triad (`createXPlugin`/`createXApi`/`withX`/`useX`), `getInitialState` uses `??` not overwrite, `transformRows/Columns` passthrough on empty state, and caching via ref equality + state equality helpers (`areSortingRulesEqual`, `areFiltersEqual`, etc.).
- Check `src/types/` remains leaf, no cross-plugin imports, no `any`, no class components, no `console.log` in prod paths (guarded by `process.env.NODE_ENV !== 'production'`).
- Require `npm run typecheck` + `lint` + `test:run` before merge (`AGENTS.md:185-190`); validate `sideEffects:false` and `external: ['react','react-dom']` preserved.

## Project-Specific Checklist

- Column ID validation: truncates to 128, pattern `^[a-zA-Z_$][a-zA-Z0-9_$]*$`, duplicates get `_${index}` suffix — `src/core/usePivotTable.ts:22-60`.
- Prototype pollution guard via `isSafeKey` — `src/utils/accessorHelpers.ts:3-8`.
- CSV injection guard via `FORMULA_TRIGGER_CHARS` — `src/utils/exportCSV.ts:29`, `51-53`.
- High-risk files require extra scrutiny: `src/core/usePivotTable.ts`, `pivotEngine.ts`, `src/plugins/filtering.ts`, `aggregationPlugin.ts`.

## Evidence Sources

- `tsconfig.json`, `tsup.config.ts`, `src/core/usePivotTable.ts`, `src/store/pivotTableStore.ts`, `src/plugins/*`, `src/utils/*`, `AGENTS.md`, `.ai/docs/04-dos-and-donts.md`
