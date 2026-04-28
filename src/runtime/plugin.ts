import { defineNuxtPlugin, useHead, useRuntimeConfig, useRouter } from '#imports'
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

    // Inject scripts via useHead — they render in SSR HTML so the browser
    // starts downloading the container script immediately, without waiting
    // for Nuxt hydration (unlike DOM manipulation).
    useHead({
      script: [
        {
          key: 'mtm-init',
          innerHTML: initScript,
        },
        ...(config.loadScript
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
        window._mtm.push({ event: 'mtm.PageView' })
      },
    }

    // Automatic SPA page view tracking
    if (config.trackPageView) {
      const router = useRouter()

      // Skip the first navigation (initial page load) since the MTM
      // container handles it. Only track subsequent SPA navigations.
      let isFirstRoute = true
      router.afterEach(() => {
        if (isFirstRoute) {
          isFirstRoute = false
          return
        }
        mtm.trackPageView()
      })
    }

    return {
      provide: {
        mtm,
      },
    }
  },
})
