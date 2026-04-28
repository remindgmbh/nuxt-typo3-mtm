export default defineNuxtConfig({
  modules: ['@remindgmbh/nuxt-typo3-mtm'],
  devtools: { enabled: true },
  compatibilityDate: 'latest',
  mtm: {
    matomoUrl: 'https://analytics.example.com',
    containerId: 'aBcDeFg1',
    debug: true,
  },
})
