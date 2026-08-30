# Tech Stack

| Layer | Technology | Version | Evidence |
|---|---|---|---|
| Language | TypeScript | ^6.0.2 | `package.json:113`, `tsconfig.json` |
| Runtime | React (peer) | >=18.0.0 | `package.json:92-93` |
| State | Zustand (vanilla) | ^5.0.12 | `package.json:99`, `src/store/pivotTableStore.ts:1` |
| Virtualization | @tanstack/virtual-core | ^3.13.23 | `package.json:98`, `src/hooks/useVirtualRows.ts:2` |
| Drag & Drop | @dnd-kit/core | ^6.3.1 | `package.json:97`, `src/plugins/dndRow.ts:1` |
| Build | tsup (ESM+CJS+DTS) | ^8.5.1 | `package.json:79`, `tsup.config.ts` |
| Test | Vitest | ^4.1.2 | `package.json:114`, `package.json:83-84` |
| Lint | ESLint (via `npm run lint`) | Not pinned in devDeps (uses project config) | `package.json:82` |
| Types | @types/react ^19.2.14, @types/node ^22.0.0 | — | `package.json:110-111` |
| Docs site | Vite (via `docs-site/vite.config.ts`) | — | `docs-site/package.json`, `package.json:88-90` |
| Deploy | Vercel | — | `vercel.json` |
| Module | ESM (`type:module`), `sideEffects:false` | — | `package.json:27`, `76` |
| TS target | ESNext, `module:ESNext`, `moduleResolution:bundler`, `strict:true`, `jsx:react-jsx` | — | `tsconfig.json:2-14` |
| Node | >=18.0.0 | — | `package.json:117` |
| No backend | No Express/Fastify/Nest/DB | — | `package.json:96-99` (deps list) |

**Peers (consumer must provide):** `react >=18` required, `react-dom >=18` optional — `package.json:92-95` + `peerDependenciesMeta`.

## Evidence Sources

- `package.json`, `tsconfig.json`, `tsup.config.ts`, `src/core/usePivotTable.ts`, `src/hooks/*`, `src/store/pivotTableStore.ts`, `docs-site/package.json`, `vercel.json`
