# Copilot instructions for `nuxt-typo3-mtm`

## Build, test, and lint commands

- Use **Node 20** to match CI workflows.
- Install dependencies: `npm ci`
- Prepare generated stubs/types before playground work or type checks: `npm run dev:prepare`
- Lint: `npm run lint`
- Run all tests: `npm run test`
- Run a single test file: `npm run test -- test/basic.test.ts`
- Run a single test by name: `npm run test -- -t "includes MTM runtime config in the payload"`
- Type checks: `npm run test:types`
- Reproduce CI static analysis exactly:
  - `npm ci`
  - `npx nuxt-module-build build --stub`
  - `npx nuxt-module-build prepare`
  - `npx nuxt prepare playground`
  - `npm run static-analysis`
- Build distributable output: `npm run prepack`
- Playground app:
  - `npm run dev`
  - `npm run dev:build`

## High-level architecture

- This repository is a **Nuxt module package**. `src/module.ts` is the module entrypoint: it validates `mtm` options, normalizes `matomoUrl`, writes `runtimeConfig.public.mtm`, and registers runtime pieces.
- Runtime behavior lives in `src/runtime/plugin.ts`: SSR head injection for MTM bootstrap script, optional container script loading, client `$mtm` implementation, and server-side noop implementation.
- `src/runtime/composables/useMtm.ts` is the public composable wrapper over injected `$mtm`.
- `src/runtime/types.ts` provides type augmentation for `NuxtApp.$mtm`, Vue component `$mtm`, and `PublicRuntimeConfig.mtm`.
- `playground/` is a Nuxt workspace app that consumes the module via `file:..` for local integration testing.
- Tests are **e2e-style** via `@nuxt/test-utils/e2e` in `test/basic.test.ts` and run against fixture app `test/fixtures/basic`.

## Key conventions

- Nuxt config key is `mtm`; `matomoUrl` and `containerId` are required for active behavior.
- Keep module startup behavior as soft-fail/noop (logger info/warn + return) when disabled or misconfigured, instead of throwing.
- Keep `matomoUrl` normalization in `src/module.ts` (strip trailing slashes once before runtime use).
- Preserve SSR safety: plugin always provides `$mtm`, with noop methods on server.
- Keep `useHead` script keys stable (`mtm-init`, `mtm-container`) to avoid duplicate script tags.
- SPA page tracking uses the `page:finish` hook, skips the first page, and resolves final `document.title` before sending page-view data.
- Consent-gated script loading uses reactive `useHead` + Cookiebot events (`CookiebotOnAccept` / `CookiebotOnDecline`) when `mtm.cookie` is set.
- When tracking page views, update `_paq` (`setCustomUrl`, `setDocumentTitle`) before pushing `mtm.PageView`.
