import { defineNuxtModule, addPlugin, addImportsDir, createResolver, useLogger } from '@nuxt/kit'
import type { MtmPublicRuntimeConfig } from './runtime/types'

export interface ModuleOptions {
  /** Matomo server URL (e.g. 'https://analytics.example.com') */
  matomoUrl: string
  /** Matomo Tag Manager container ID (e.g. 'aBcDeFg1') */
  containerId: string
  /** Enable or disable the module entirely */
  enabled: boolean
  /** Enable Matomo Tag Manager debug mode */
  debug: boolean
  /** Whether to inject the container script into the page */
  loadScript: boolean
  /** Automatically track page views on SPA route changes */
  trackPageView: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-typo3-mtm',
    configKey: 'mtm',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  defaults: {
    matomoUrl: '',
    containerId: '',
    enabled: true,
    debug: false,
    loadScript: true,
    trackPageView: true,
  },
  setup(options, nuxt) {
    const logger = useLogger('nuxt-typo3-mtm')
    const resolver = createResolver(import.meta.url)

    if (!options.enabled) {
      logger.info('Matomo Tag Manager is disabled')
      return
    }

    if (!options.matomoUrl || !options.containerId) {
      logger.warn('Matomo Tag Manager requires both `matomoUrl` and `containerId` to be set')
      return
    }

    // Normalize URL — strip trailing slash
    options.matomoUrl = options.matomoUrl.replace(/\/+$/, '')

    // Pass options to runtime via public runtime config
    const mtmConfig: MtmPublicRuntimeConfig = {
      matomoUrl: options.matomoUrl,
      containerId: options.containerId,
      enabled: options.enabled,
      debug: options.debug,
      loadScript: options.loadScript,
      trackPageView: options.trackPageView,
    }

    nuxt.options.runtimeConfig.public.mtm = mtmConfig

    // Register universal plugin (useHead renders scripts in SSR HTML)
    addPlugin(resolver.resolve('./runtime/plugin'))

    // Register composables for auto-import
    addImportsDir(resolver.resolve('./runtime/composables'))
  },
})
