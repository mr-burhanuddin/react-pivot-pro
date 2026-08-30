# Persona: Backend Engineer

## Responsibilities

- Recognize there is **no backend** in this repo — no HTTP server, DB, ORM, auth, or request lifecycle (`package.json:96-99` deps are client-only).
- Own the two server-adjacent surfaces: `createPivotEngineResult` pure function (`src/core/pivotEngine.ts:160-242`) and `PivotServerAdapter` interface (`src/core/pivotEngine.ts:56-58`) consumed by `pivot.runServerSidePivot()` (`src/plugins/pivot.ts:271-280`).
- If a backend is introduced, reuse `pivotEngine.ts` on the server rather than duplicating; keep `src/types/` leaf and maintain `PivotTablePlugin` contract.

## Project-Specific Constraints

- Do not add Express/Fastify/NestJS to the library without a `src/server/` boundary; docs-site (`docs-site/`) remains Vite-only.
- No persistence layer exists — state is in-memory Zustand; serialization is consumer-owned via `table.getState()` → `initialState`/`state`.

## Evidence Sources

- `package.json`, `src/core/pivotEngine.ts`, `src/plugins/pivot.ts:49-54,271-280`, `src/store/pluginRegistry.ts`, `.ai/docs/06-backend-architecture.md`
