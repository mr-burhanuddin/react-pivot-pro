# 06 — Backend Architecture

> No backend exists in this repository. This document records the negative finding with evidence and documents the two server-adjacent utilities that could be mistaken for backend code.

## Verdict

**No backend detected.** This is a frontend library (`react-pivot-pro` — headless pivot table engine). There are:

- No HTTP servers, controllers, routes, or middleware.
- No database, ORM, migration, or repository layer.
- No authentication, session, or auth middleware.
- No server-side framework (Express, Fastify, NestJS, Hono, etc.) in `package.json`.
- No `src/server/`, `src/api/`, `src/controllers/`, `src/services/`, or `src/entities/` directories.

**Evidence:**

- `package.json:96-99` dependencies are `zustand`, `@dnd-kit/core`, `@tanstack/virtual-core` only.
- `package.json:109-114` devDependencies are `tsup`, `typescript`, `vitest`, `@types/...` only.
- `src/` contains `core/`, `hooks/`, `plugins/`, `store/`, `types/`, `utils/` — none is a backend layer.
- `tsup.config.ts` builds a library (ESM + CJS), not a server.
- `vercel.json` deploys `docs-site/`, not an API.

## Server-Adjacent Components (Not Backends)

Two components enable server-side data processing but are not backends themselves:

### 1. Pivot Server Adapter Interface

**File:** `src/core/pivotEngine.ts:56-58`

```ts
export interface PivotServerAdapter<TData extends RowData> {
  execute(request: PivotEngineRequest<TData>): Promise<PivotEngineResult<TData>>;
}
```

**Usage:** `src/plugins/pivot.ts:52-53`, `271-280` — consumers pass a `serverAdapter` to `createPivotPlugin({ serverAdapter, clientSide: false })` and call `table.pivot.runServerSidePivot()`.

This is a **consumer-provided adapter** for offloading pivot computation to the consumer's own server. The library does not implement the server.

```ts
// Consumer implements the server
const adapter: PivotServerAdapter<Sale> = {
  execute: async (request) => {
    const res = await fetch('/api/pivot', { method: 'POST', body: JSON.stringify(request) });
    return res.json();
  }
};
const table = withPivot(usePivotTable({ data, columns, plugins: [createPivotPlugin({ serverAdapter, clientSide: false })] }));
```

### 2. Pivot Engine (Pure Function)

**File:** `src/core/pivotEngine.ts:160-242`

```ts
export function createPivotEngineResult<TData extends RowData>(options: PivotEngineOptions<TData>): PivotEngineResult<TData>
```

A stateless, framework-free data transformation that could run on either client or server. No HTTP, no I/O, no side effects.

## What Is NOT Present

| Layer | Expected Evidence | Finding |
|---|---|---|
| Controllers | `src/controllers/` or route handlers | Not found |
| Services | `src/services/` | Not found |
| Repositories | `src/repositories/` or DB query code | Not found |
| Entities / Models | ORM entities, schemas | Not found |
| Middleware | `auth`, `cors`, `logging` middleware | Not found |
| Auth flow | JWT, session, OAuth code | Not found |
| Request lifecycle | `req`/`res` handling, validation pipe | Not found |
| Database | `pg`, `prisma`, `drizzle`, `mongoose`, etc. | Not found |
| API server | `express`, `fastify`, `hono`, `nestjs` | Not found |
| Environment / Secrets | `.env` values exposed | No evidence — `.env` excluded per security rule |

## Request Lifecycle

Not applicable — no HTTP request lifecycle exists.

## If a Backend Is Added Later

Recommended placement (consistent with current layering):

- Server adapter implementations should live outside `src/` or in `src/server/` if in-repo.
- Keep `src/core/pivotEngine.ts` as the shared engine — server should import and call `createPivotEngineResult` directly rather than duplicating logic.
- No changes to the plugin contract are needed to support server-side execution — the `PivotServerAdapter` interface already decouples the two.

## Evidence Sources

- `package.json`
- `src/core/pivotEngine.ts:56-58`, `160-242`
- `src/plugins/pivot.ts:49-54`, `271-280`
- `tsup.config.ts`
- `vercel.json`
- `src/` directory listing
- `.gitignore`
