import { defineNuxtPlugin, ref, useHead, useNuxtApp, useRuntimeConfig } from '#imports'
import type { MtmInstance, MtmPublicRuntimeConfig } from './types'

const noopMtm: MtmInstance = {
  push: () => {},
  trackPageView: () => {},
}

// page:finish fires inside onMounted; unhead's watchEffect (a post-flush
// effect) runs after onMounted and is what actually writes document.title.
// The MutationObserver fires the instant that write happens. The setTimeout(0)
// fallback handles the case where the title is identical between routes
// (no mutation occurs) — it fires after all pending microtasks, by which
// point document.title is already the correct value.
function resolveTitle(): Promise<string> {
  return new Promise((resolve) => {
    const titleEl = document.querySelector('title')
    if (!titleEl) {
      resolve(document.title)
      return
    }

    const observer = new MutationObserver(() => {
      observer.disconnect()
      clearTimeout(fallback)
      resolve(document.title)
    })

    observer.observe(titleEl, { childList: true, characterData: true, subtree: true })

    const fallback = setTimeout(() => {
      observer.disconnect()
      resolve(document.title)
    }, 0)
  })
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
      trackPageView: (title?: string) => {
        window._mtm = window._mtm || []
        const url = window.location.href
        const resolvedTitle = title ?? document.title
        // setCustomUrl must be called before the MTM tag fires trackPageView,
        // otherwise Matomo Analytics reuses its internally cached initial URL
        // for every subsequent SPA navigation.
        if (window._paq) {
          window._paq.push(['setCustomUrl', url])
          window._paq.push(['setDocumentTitle', resolvedTitle])
        }
        window._mtm.push({ 'event': 'mtm.PageView', 'mtm.newUrl': url, 'mtm.newTitle': resolvedTitle })
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

    // Automatic SPA page view tracking
    if (config.trackPageView) {
      const nuxtApp = useNuxtApp()
      let isFirstPage = true

      nuxtApp.hook('page:finish', async () => {
        if (isFirstPage) {
          isFirstPage = false
          return
        }
        const title = await resolveTitle()
        mtm.trackPageView(title)
      })
    }

    return {
      provide: {
        mtm,
      },
    }
  },
})
