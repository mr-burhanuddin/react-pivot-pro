# 04 — Do's and Don'ts

> All rules are derived from observable code. No invented conventions.

## Required Patterns

### 1. Constrain generics with `TData extends RowData`

Every generic data parameter must extend `RowData`.

**Evidence:** `src/types/table.ts:6` defines `RowData = Record<string, unknown>`; every public function uses `TData extends RowData` (`src/core/usePivotTable.ts:171`, `src/plugins/sorting.ts:74`, all plugin factories).

```ts
// Required
export function createSortingPlugin<TData extends RowData, TState extends SortingTableState>(...) { ... }

// Not found in codebase — unconstrained generics are not used
```

### 2. Use `import type` for type-only imports

**Evidence:** `src/core/usePivotTable.ts:4-16`, `src/store/pivotTableStore.ts:2`, all plugin files.

```ts
import type { Column, Row, RowData, PivotTablePlugin } from '../types';
import { createStore, type StoreApi } from 'zustand/vanilla'; // value + type in one line
```

### 3. Implement the plugin triad

Every new feature must provide `createXPlugin` + `createXApi` + `withX` (and optionally `useX`).

**Evidence:** All 10 plugins follow this pattern (`src/plugins/*.ts`, `src/plugins/aggregation/index.ts`).

### 4. Define `getInitialState` to seed defaults

Plugins that own state must seed it with nullish coalescing, not overwrite.

**Evidence:** `src/plugins/sorting.ts:88-91`, `src/plugins/filtering.ts:308-313`, `src/plugins/grouping.ts:176-181`, etc.

```ts
getInitialState: (state) => ({ ...state, sorting: state.sorting ?? [] }),
```

### 5. Memoize `data`, `columns`, and `plugins` in the consumer

**Evidence:** `src/core/usePivotTable.ts:170-196` — pipeline invalidates on reference change (`dataVersion`, `pluginVersion`). README explicitly warns to keep references stable.

```ts
const columns = useMemo(() => [...], []);
const plugins = useMemo(() => [createSortingPlugin()], []);
```

### 6. Use `Updater<T>` for all state setters

**Evidence:** `src/types/state.ts:1`, `src/store/pivotTableStore.ts:11-19`, every `setX` API.

```ts
setSorting: (updater: SortingRule[] | ((prev: SortingRule[]) => SortingRule[])) => void;
```

### 7. Keep `src/types` leaf — no runtime imports

**Evidence:** `src/types/*.ts` only import from sibling type files. No `zustand`, `react`, or `utils` imports.

### 8. Run checks before committing

**Evidence:** `AGENTS.md:185-190`

```bash
npm run typecheck
npm run lint
npm run test:run
```

### 9. Use functional composition, not inheritance

**Evidence:** `src/plugins/sorting.ts:265` — `Object.assign(table, { sorting: ... })`; no class extends.

## Anti-Patterns (Intentionally Avoided)

### 1. No `any`

Strict TypeScript is enabled (`tsconfig.json:9` `strict: true`). No `any` appears in core/plugin/store/types code except documented interop points (`CONTEXT.md` notes `as any` in examples due to generic union).

### 2. No class components

Only functional components and hooks are used. No `class` keyword in `src/`.

### 3. No monolithic table component

No UI component exists in `src/`. The library is headless by design (`src/core/usePivotTable.ts` returns a data instance, not JSX).

### 4. No mixing UI with logic

Core, plugins, store, and utils contain zero JSX or CSS. The only JSX in `src/` is `src/plugins/aggregation/AggregatorDropdown.tsx` (optional UI helper, not core).

### 5. No direct Zustand import by consumers

Store is created inside `usePivotTable` (`src/core/usePivotTable.ts:218-219`). Consumers interact via `table.state` / `table.setState`.

### 6. No cross-plugin imports

No plugin file imports another plugin file. Shared helpers live in `src/utils/helpers.ts`.

### 7. No mutation of input `data` array

`buildCoreRowModel` creates new row objects (`src/core/usePivotTable.ts:117-141`). Plugin transforms return new arrays; original `data` is never mutated.

### 8. No inline aggregation function definitions in plugin options without registration

Custom aggregation functions must be registered via `aggregation.registerFn(name, fn)` before use (`src/plugins/aggregation/aggregationApi.ts` pattern).

## Naming Rules (Observed)

| Category | Convention | Example | Evidence |
|---|---|---|---|
| Interfaces | PascalCase, descriptive | `ColumnDef`, `PivotEngineResult` | `src/types/*.ts` |
| Types | PascalCase | `RowData`, `Updater`, `AggregationFn` | `src/types/*.ts` |
| Plugin factories | `createXPlugin` | `createSortingPlugin` | `src/plugins/*.ts` |
| API factories | `createXApi` | `createSortingApi` | `src/plugins/*.ts` |
| Wrappers | `withX` | `withSorting` | `src/plugins/*.ts` |
| Hooks | `useX` / `useVirtualY` | `useSorting`, `useVirtualRows` | `src/plugins/*.ts`, `src/hooks/*.ts` |
| Files | kebab-case | `pivotEngine.ts`, `useVirtualRows.ts` | `src/core/`, `src/hooks/` |
| State keys | camelCase | `columnOrder`, `rowGrouping`, `pivotValues` | `src/types/state.ts`, plugins |
| Plugin `name` | camelCase, matches state domain | `sorting`, `columnVisibility` | `src/plugins/*.ts` `name: 'sorting'` |
| Constants | UPPER_SNAKE_CASE (true constants) | `VALID_ID_PATTERN`, `MAX_COLUMN_ID_LENGTH` | `src/core/usePivotTable.ts:22-23` |
| Type generics | `TData`, `TState`, `TValue` | `TData extends RowData` | All generic signatures |

## File Organization Rules (Observed)

```
src/
├── core/           # Orchestration (hook + engine) — 2 files
├── hooks/          # React bindings (virtualization) — 2 files + index
├── plugins/        # One file per feature (10 features)
│   └── aggregation/ # Subfolder for multi-file feature (plugin + api + aggregators + UI)
├── store/          # Zustand store + plugin registry — 2 files + index
├── types/          # Type contracts — 6 files + barrel
├── utils/          # Stateless helpers — 5 files + barrel
└── index.ts        # Public barrel (only public API)
```

- Tests co-located with source (`src/plugins/aggregation/__tests__/` — `src/plugins/aggregation/__tests__/aggregators.test.ts`).
- No `__tests__` folders elsewhere — not found.
- No `ui/` folder despite `AGENT.md` mentioning it — not present in repo.
- Docs site isolated in `docs-site/` (separate `package.json`, `vite.config.ts`).

## Import Rules (Observed)

1. **External first, internal second** — `src/core/usePivotTable.ts:1-3` imports `react`/`zustand` before local `../types`/`../utils`.
2. **Relative paths only** — no path alias in `src/` (only docs-site uses `@pivot/*` via Vite).
3. **Barrel imports for public API** — consumers import from `react-pivot-pro` or `react-pivot-pro/plugins/sorting`, not deep paths.
4. **Types via `import type`** — as noted above.
5. **Side-effect free** — `package.json:76` `sideEffects: false`.

## TypeScript Rules (Observed)

| Rule | Value | Evidence |
|---|---|---|
| `strict` | `true` | `tsconfig.json:9` |
| `target` | `ESNext` | `tsconfig.json:3` |
| `module` | `ESNext` | `tsconfig.json:4` |
| `moduleResolution` | `bundler` | `tsconfig.json:5` |
| `jsx` | `react-jsx` | `tsconfig.json:10` |
| `declaration` | `true` | `tsconfig.json:6` |
| `esModuleInterop` | `true` | `tsconfig.json:11` |
| `skipLibCheck` | `true` | `tsconfig.json:12` |
| `Key extraction` | `Extract<keyof TData, string>` | `src/types/column.ts:5` |
| `Generic constraint` | `TData extends RowData` | All generics |
| `Type-only imports` | `import type` | All plugin/type files |

## Evidence Sources

- `tsconfig.json`
- `tsup.config.ts`
- `package.json`
- `src/types/*.ts`
- `src/core/usePivotTable.ts`
- `src/store/pivotTableStore.ts`
- `src/plugins/*.ts` (all 10)
- `src/plugins/aggregation/*`
- `src/hooks/*.ts`
- `src/utils/*.ts`
- `AGENTS.md`
- `AGENT.md`
- `.gitignore`
