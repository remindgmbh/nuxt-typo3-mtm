import {
  defineNuxtPlugin,
  nextTick,
  ref,
  useHead,
  useRouter,
  useRuntimeConfig,
} from '#imports'

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
          innerHTML: initScript,
          key: 'mtm-init',
        },
        ...(config.loadScript && !config.cookie
          ? [
              {
                async: true,
                key: 'mtm-container',
                src: `${config.matomoUrl}/js/container_${config.containerId}.js`,
              },
            ]
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
          window._paq.push(['trackPageView', resolvedTitle])
        }
        window._mtm.push({
          'event': 'mtm.PageView',
          'mtm.newTitle': resolvedTitle,
          'mtm.newUrl': url,
        })
      },
    }

    // Consent-gated container script loading
    if (config.loadScript && config.cookie) {
      const isCookieAccepted = () =>
        config.cookie === 'none' || !!window.Cookiebot?.consent?.[config.cookie as string]

      const consentGranted = ref(isCookieAccepted())

      // Reactive useHead: unhead watches consentGranted and adds/removes the
      // script tag automatically whenever consent changes without a page reload.
      useHead(() => ({
        script: consentGranted.value
          ? [
              {
                async: true,
                key: 'mtm-container',
                src: `${config.matomoUrl}/js/container_${config.containerId}.js`,
              },
            ]
          : [],
      }))

      window.addEventListener('CookiebotOnAccept', () => {
        consentGranted.value = isCookieAccepted()
      })
      window.addEventListener('CookiebotOnDecline', () => {
        consentGranted.value = isCookieAccepted()
      })
    }

    const router = useRouter()

    router.afterEach(async (to, from, failure) => {
      if (failure || to.fullPath === from.fullPath) {
        return
      }

      await nextTick()
      mtm.trackPageView()
    })

    return {
      provide: {
        mtm,
      },
    }
  },
})
