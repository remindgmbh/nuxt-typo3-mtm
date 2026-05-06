import { defineNuxtPlugin, nextTick, ref, useHead, useNuxtApp, useRuntimeConfig } from '#imports'
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
    // it will be injected client-side reactively once consent is granted.
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
      const isCookieAccepted = () =>
        config.cookie === 'none' || !!window.Cookiebot?.consent[config.cookie as string]

      const consentGranted = ref(isCookieAccepted())

      // Reactive useHead: unhead watches consentGranted and adds/removes the
      // script tag automatically whenever consent changes without a page reload.
      useHead(() => ({
        script: consentGranted.value
          ? [{
              key: 'mtm-container',
              src: `${config.matomoUrl}/js/container_${config.containerId}.js`,
              async: true,
            }]
          : [],
      }))

      window.addEventListener('CookiebotOnAccept', () => {
        consentGranted.value = isCookieAccepted()
      })
      window.addEventListener('CookiebotOnDecline', () => {
        consentGranted.value = isCookieAccepted()
      })
    }

    // Automatic SPA page view tracking.
    // page:finish fires after the full page lifecycle (mount + unhead flush),
    // ensuring document.title reflects the new route before we read it.
    if (config.trackPageView) {
      const nuxtApp = useNuxtApp()
      let isFirstPage = true

      nuxtApp.hook('page:finish', () => {
        if (isFirstPage) {
          isFirstPage = false
          return
        }
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
