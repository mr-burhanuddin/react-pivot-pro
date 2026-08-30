# Project Context

- **Package:** `react-pivot-pro` v1.1.4 — `package.json:2-4`
- **Description:** Headless, plugin-driven pivot table engine for React + TypeScript — `package.json:4`
- **License:** MIT — `package.json:18`
- **Repo:** `https://github.com/mr-burhanuddin/react-pivot-pro.git` — `package.json:22`
- **Homepage:** `https://react-pivot-pro.vercel.app` — `package.json:19`
- **Type:** ESM library (`type:module`, `sideEffects:false`) — `package.json:27`, `76`
- **Engines:** Node >=18 — `package.json:117`
- **Entry:** `src/index.ts` → `dist/index.{js,cjs,d.ts}` + subpath entries via `package.json:31-71` + `tsup.config.ts:5-17`
- **Build:** `tsup` (`format:esm,cjs`, `dts:true`, `treeshake:true`, `minify:true`) — `tsup.config.ts:18-25`; scripts `build/dev/build:types/typecheck/lint/test/test:run/clean/docs:*` — `package.json:77-90`
- **TS Config:** `target:ESNext`, `module:ESNext`, `moduleResolution:bundler`, `strict:true`, `jsx:react-jsx`, `declaration:true`, `rootDir:src` — `tsconfig.json:2-14`
- **Deploy:** Vercel — `vercel.json`; docs site in `docs-site/` (Vite) with `docs:dev/build/preview`.
- **Not a backend:** No HTTP server, DB, ORM, auth — `package.json:96-99` deps are `zustand`, `@dnd-kit/core`, `@tanstack/virtual-core`.

## Evidence Sources

- `package.json`, `tsconfig.json`, `tsup.config.ts`, `src/index.ts`, `vercel.json`, `docs-site/package.json`
