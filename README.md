# Nuxt Matomo Tag Manager (MTM)

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Nuxt module for integrating [Matomo Tag Manager](https://matomo.org/guide/tag-manager/) into your Nuxt 3+ application.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)

## Features

- Injects the Matomo Tag Manager container script with SSR support
- Initializes the `window._mtm` data layer automatically
- Automatic SPA page view tracking on route changes
- `useMtm()` composable and `$mtm` instance for manual event tracking
- Debug mode support
- Fully typed with TypeScript

## Quick Setup

Install the module to your Nuxt application with one command:

```bash
npx nuxt module add @remindgmbh/@remindgmbh/nuxt-typo3-mtm
```

Or install manually:

```bash
npm install @remindgmbh/@remindgmbh/nuxt-typo3-mtm
```

Add the module to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@remindgmbh/@remindgmbh/nuxt-typo3-mtm'],
  mtm: {
    matomoUrl: 'https://analytics.example.com',
    containerId: 'aBcDeFg1',
  },
})
```

That's it! You can now use Matomo Tag Manager in your Nuxt app.

## Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `matomoUrl` | `string` | `''` | **Required.** Your Matomo server URL (e.g. `https://analytics.example.com`) |
| `containerId` | `string` | `''` | **Required.** MTM container ID (e.g. `aBcDeFg1`) |
| `enabled` | `boolean` | `true` | Enable or disable the module entirely |
| `debug` | `boolean` | `false` | Enable Matomo Tag Manager debug mode |
| `loadScript` | `boolean` | `true` | Whether to inject the container script into the page |
| `trackPageView` | `boolean` | `true` | Automatically track page views on SPA route changes |

### Environment Variables

You can also configure the module via `runtimeConfig` in your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@remindgmbh/@remindgmbh/nuxt-typo3-mtm'],
  mtm: {
    matomoUrl: process.env.NUXT_PUBLIC_MTM_MATOMO_URL,
    containerId: process.env.NUXT_PUBLIC_MTM_CONTAINER_ID,
  },
})
```

## Usage

### Automatic Tracking

With `trackPageView: true` (default), page views are automatically tracked on every SPA route change. The initial page load is handled by the MTM container itself.

### Manual Tracking

Use the `useMtm()` composable anywhere in your app:

```vue
<script setup>
const mtm = useMtm()

function trackCustomEvent() {
  mtm.push({
    event: 'customEvent',
    category: 'button',
    action: 'click',
    label: 'signup',
  })
}

function trackPageView() {
  mtm.trackPageView()
}
</script>
```

### Using `$mtm` in Options API

```ts
export default defineComponent({
  methods: {
    trackEvent() {
      this.$mtm.push({ event: 'myEvent', value: 42 })
    },
  },
})
```

### Disabling Script Injection

If you want to manage the MTM container script yourself (e.g. via consent management), set `loadScript: false` and manually push events:

```ts
export default defineNuxtConfig({
  modules: ['@remindgmbh/@remindgmbh/nuxt-typo3-mtm'],
  mtm: {
    matomoUrl: 'https://analytics.example.com',
    containerId: 'aBcDeFg1',
    loadScript: false,
  },
})
```

## Contribution

<details>
  <summary>Local development</summary>

  ```bash
  # Install dependencies
  npm install

  # Generate type stubs
  npm run dev:prepare

  # Develop with the playground
  npm run dev

  # Build the playground
  npm run dev:build

  # Run ESLint
  npm run lint

  # Run Vitest
  npm run test
  npm run test:watch

  # Release new version
  npm run release
  ```

</details>

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@remindgmbh/nuxt-typo3-mtm/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/@remindgmbh/nuxt-typo3-mtm

[npm-downloads-src]: https://img.shields.io/npm/dm/@remindgmbh/nuxt-typo3-mtm.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/@remindgmbh/nuxt-typo3-mtm

[license-src]: https://img.shields.io/npm/l/@remindgmbh/nuxt-typo3-mtm.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/@remindgmbh/nuxt-typo3-mtm

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt
[nuxt-href]: https://nuxt.com
