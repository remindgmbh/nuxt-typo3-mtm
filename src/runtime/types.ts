export interface MtmPublicRuntimeConfig {
  matomoUrl: string
  containerId: string
  enabled: boolean
  debug: boolean
  loadScript: boolean
  trackPageView: boolean
  /** Cookiebot consent category required before loading the MTM container (e.g. 'statistics') */
  cookie?: string
}

export interface MtmInstance {
  push: (data: Record<string, unknown> | unknown[]) => void
  trackPageView: () => void
}

declare global {
  interface Window {
    _mtm: Array<Record<string, unknown> | unknown[]>
    _paq?: Array<unknown[]>
    Cookiebot?: {
      consent: Record<string, boolean>
    }
  }
}

declare module '#app' {
  interface NuxtApp {
    $mtm: MtmInstance
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $mtm: MtmInstance
  }
}

declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    mtm: MtmPublicRuntimeConfig
  }
}
