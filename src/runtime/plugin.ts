import { defineNuxtPlugin, nextTick, useHead, useRuntimeConfig, useRouter } from '#imports'
import type { MtmInstance, MtmPublicRuntimeConfig } from './types'

const noopMtm: MtmInstance = {
  push: () => {},
  trackPageView: () => {},
}

export default defineNuxtPlugin({
  name: 'nuxt-typo3-mtm',
  setup() {
    const config = useRuntimeConfig().public.mtm as MtmPublicRuntimeConfig

    // Build the inline data layer initialization script
    let initScript = `window._mtm=window._mtm||[];window._mtm.push({'mtm.startTime':(new Date().getTime()),'event':'mtm.Start'});`

    if (config.debug) {
      initScript += `window._mtm.push(['enableDebugMode']);`
    }

    // Container script is omitted from SSR when cookie consent is required;
    // it will be injected client-side once consent is granted.
    useHead({
      script: [
        {
          key: 'mtm-init',
          innerHTML: initScript,
        },
        ...(config.loadScript && !config.cookie
          ? [{
              key: 'mtm-container',
              src: `${config.matomoUrl}/js/container_${config.containerId}.js`,
              async: true,
            }]
          : []),
      ],
    })

    // Server-side: provide no-op instance
    if (import.meta.server) {
      return {
        provide: {
          mtm: noopMtm,
        },
      }
    }

    // Client-side: ensure data layer exists (already initialized by inline script above)
    window._mtm = window._mtm || []

    const mtm: MtmInstance = {
      push: (data) => {
        window._mtm = window._mtm || []
        window._mtm.push(data)
      },
      trackPageView: () => {
        window._mtm = window._mtm || []
        const url = window.location.href
        const title = document.title
        // setCustomUrl must be called before the MTM tag fires trackPageView,
        // otherwise Matomo Analytics reuses its internally cached initial URL
        // for every subsequent SPA navigation.
        if (window._paq) {
          window._paq.push(['setCustomUrl', url])
          window._paq.push(['setDocumentTitle', title])
        }
        window._mtm.push({ 'event': 'mtm.PageView', 'mtm.newUrl': url, 'mtm.newTitle': title })
      },
    }

    // Consent-gated container script loading
    if (config.loadScript && config.cookie) {
      const containerScript = {
        key: 'mtm-container',
        src: `${config.matomoUrl}/js/container_${config.containerId}.js`,
        async: true,
      }

      const isCookieAccepted = () =>
        config.cookie === 'none' || !!window.Cookiebot?.consent[config.cookie as string]

      const loadContainerScript = () => useHead({ script: [containerScript] })

      if (isCookieAccepted()) {
        loadContainerScript()
      }
      else {
        window.addEventListener('CookiebotOnAccept', () => {
          if (isCookieAccepted()) {
            loadContainerScript()
          }
        })
      }
    }

    // Automatic SPA page view tracking
    if (config.trackPageView) {
      const router = useRouter()

      // from.matched is empty only on the very first navigation (Vue Router's
      // START_LOCATION) to avoid double tracking.
      router.afterEach((_to, from) => {
        if (from.matched.length === 0) return
        nextTick(() => mtm.trackPageView())
      })
    }

    return {
      provide: {
        mtm,
      },
    }
  },
})
