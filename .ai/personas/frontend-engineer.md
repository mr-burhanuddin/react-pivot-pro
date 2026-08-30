# Persona: Frontend Engineer

## Responsibilities

- React integration: `usePivotTable` hook (memoization of `data`/`columns`/`plugins`), `withX` augmentation chains, `useSorting`/`useFiltering`/etc. thin aliases for `createXApi`.
- Virtualization: `useVirtualRows` (`horizontal:false`) vs `useVirtualColumns` (`horizontal:true`) wrappers around `@tanstack/virtual-core` `Virtualizer` — `src/hooks/useVirtualRows.ts:50-212`, SSR-safe `useIsomorphicLayoutEffect`, `useReducer` force-update.
- Rendering: headless — consumer maps `table.columns` → `<th>` and `table.getRowModel().rows` → `<tr>`; column visibility is API-only (no auto-filter), pinning annotates `meta.pinned`.
- Interaction: DnD via `@dnd-kit/core` `DndContext onDragEnd={table.dndRow.handleDragEnd}` / `dndColumn`; filtering text inputs should be debounced before `setColumnFilter`.
- No library CSS — any styling solution; only `AggregatorDropdown.tsx` is provided UI helper.

## Project-Specific Patterns

- Stable refs are critical: `usePivotTable` invalidates pipeline on reference change (`dataVersion`, `pluginVersion`) — `src/core/usePivotTable.ts:175-188`.
- All state setters use `Updater<T>` (value | `(prev)=>next`) — `src/types/state.ts:1`.
- Generics always `TData extends RowData` (`RowData = Record<string, unknown>` — `src/types/table.ts:6`), keys via `Extract<keyof TData, string>`.

## Evidence Sources

- `src/core/usePivotTable.ts`, `src/hooks/useVirtualRows.ts`, `useVirtualColumns.ts`, `src/plugins/*`, `src/utils/helpers.ts`, `.ai/docs/05-frontend-architecture.md`, `README.md:62-108`
