import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('nuxt-typo3-mtm', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  })

  it('renders the page without errors', async () => {
    const html = await $fetch('/')
    expect(html).toContain('<div>basic</div>')
  })

  it('includes the MTM container script in SSR HTML via useHead', async () => {
    const html = await $fetch('/')
    expect(html).toContain('container_testContainer1.js')
  })

  it('includes the MTM data layer initialization in SSR HTML', async () => {
    const html = await $fetch('/')
    expect(html).toContain('mtm.Start')
  })

  it('includes MTM runtime config in the payload', async () => {
    const html = await $fetch('/')
    expect(html).toContain('analytics.example.com')
  })
})
