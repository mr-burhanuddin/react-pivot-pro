# AGENTS.md - react-pivot-pro

This file provides guidance for AI coding agents operating in this repository.

## Project Overview

`react-pivot-pro` is a headless, plugin-driven pivot table engine for React + TypeScript. The library manages state and data transformation while consumers own the UI rendering.

## Build Commands

```bash
# Build the library (outputs to dist/)
npm run build

# Watch mode for development
npm run dev

# Build types only
npm run build:types

# TypeScript type checking (no emit)
npm run typecheck

# Lint
npm run lint

# Run all tests
npm run test

# Run tests once (CI/pre-commit)
npm run test:run

# Clean dist folder
npm run clean
```

### Running a Single Test

Vitest supports filtering by file name or test name:

```bash
# Run tests in a specific file
npm run test -- src/core/pivotEngine.test.ts

# Run tests matching a pattern
npm run test -- -t "pivot"

# Run tests matching a grep pattern
npm run test -- --grep "sorting"
```

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** - All TypeScript strict checks are on
- **Target**: ESNext, **Module**: ESNext, **ModuleResolution**: bundler
- Use `import type` for type-only imports
- Use `Extract<keyof TData, string>` for key extraction in generics
- Always define generic constraints (e.g., `TData extends RowData`)

```typescript
// Good
export interface ColumnDef<TData extends RowData, TValue = unknown> {
  id?: string;
  accessorKey?: Extract<keyof TData, string>;
  accessorFn?: (originalRow: TData, index: number) => TValue;
}

// Avoid
interface ColumnDef<TData, TValue> { ... }
```

### Naming Conventions

- **Interfaces**: PascalCase, descriptive (e.g., `ColumnDef`, `PivotEngineResult`)
- **Types**: PascalCase (e.g., `AggregationFn`, `RowModel`)
- **Functions/variables**: camelCase
- **Files**: kebab-case (e.g., `pivotEngine.ts`, `useVirtualRows.ts`)
- **Constants**: UPPER_SNAKE_CASE for true constants, camelCase for config objects
- **IDs**: Use descriptive IDs, avoid generic names like "id" or "data"

### React & JSX

- Use `react-jsx` transform (React 19 style, no React import needed)
- Functional components with hooks
- Avoid class components
- Use `React.ReactNode` for renderable content
- Use `React.FC` only when necessary (prefer plain functions)

### Imports & Exports

- Use ES modules (`import`/`export`)
- Group imports: external first, then internal
- Use barrel exports (`index.ts`) for public API
- Export types alongside functions when they're part of the public API
- Use path aliases if configured (`@pivot/*` in docs-site)

```typescript
// From index.ts - public API
export { usePivotTable } from "./core/usePivotTable";
export * from "./types";
export { createSortingPlugin, withSorting } from "./plugins/sorting";
```

### Plugin Architecture

Follow the standard plugin pattern:

1. **Plugin Factory**: `createXPlugin()` - Creates plugin instance
2. **API Factory**: `createXApi()` - Creates feature API
3. **Wrapper**: `withX()` - Augments table instance with API

Plugins can implement:

- `getInitialState()` - Initialize plugin state
- `transformRows()` - Transform row data
- `transformColumns()` - Transform column definitions
- `onStateChange()` - React to state changes

```typescript
// Example structure
export function createSortingPlugin<TData extends RowData>(options?: Options) {
  return {
    /* plugin implementation */
  };
}

export function withSorting<TData extends RowData>(
  table: TableInstance<TData>,
  options?: Options,
) {
  // Augment table with sorting API
}

export function useSorting<TData extends RowData>(table: TableInstance<TData>) {
  // Hook for accessing sorting API
}
```

### Error Handling

- Use `try/catch` for async operations
- Return meaningful error messages
- Consider `Result<T, E>` patterns for fallible operations
- Log errors appropriately (avoid console.log in production)

### State Management

- Use Zustand for internal state (see `src/store/pivotTableStore.ts`)
- Support controlled and uncontrolled state patterns
- Use `Updater<T>` type for functional state updates

```typescript
type Updater<T> = T | ((prev: T) => T);
```

### Testing

- Tests use Vitest
- Place tests alongside source files or in `__tests__` directory
- Test plugin behavior, not implementation details
- Mock external dependencies

### File Organization

```
src/
├── core/           # Core engine (pivotEngine, usePivotTable)
├── hooks/          # React hooks (useVirtualRows, useVirtualColumns)
├── plugins/        # Feature plugins (sorting, filtering, grouping, etc.)
├── store/          # Zustand store
├── types/          # TypeScript types
├── utils/          # Utility functions
└── index.ts        # Public exports
```

### Common Patterns

- **Caching**: Cache plugin output keyed by input rows and state
- **Virtualization**: Use `@tanstack/virtual-core` for row/column virtualization
- **Drag & Drop**: Use `@dnd-kit/core` for DnD features
- **Controlled/Uncontrolled**: State can be controlled via `options.state` or managed internally

### Before Committing

1. Run `npm run typecheck` - ensure no TS errors
2. Run `npm run lint` - ensure no lint errors
3. Run `npm run test:run` - ensure all tests pass
4. Review changes for unintended modifications

## Dependencies

- **React**: >=18.0.0 (peer dependency)
- **@dnd-kit/core**: DnD functionality
- **@tanstack/virtual-core**: Virtualization
- **zustand**: State management

## Documentation

- Run `npm run docs:dev` for local docs development
- Docs site uses Vite in `docs-site/` directory
