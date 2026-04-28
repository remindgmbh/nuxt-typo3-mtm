import MtmModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    MtmModule,
  ],
  mtm: {
    matomoUrl: 'https://analytics.example.com',
    containerId: 'testContainer1',
  },
})
