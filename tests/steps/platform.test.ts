import { describe, it, expect, vi, beforeEach } from 'vitest'

// We mock process.platform by overriding the property
describe('checkPlatform', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('resolves on darwin', async () => {
    vi.stubGlobal('process', { ...process, platform: 'darwin' })
    const { checkPlatform } = await import('../../src/steps/platform.js')
    await expect(checkPlatform()).resolves.toBeUndefined()
  })

  it('rejects on non-darwin', async () => {
    vi.stubGlobal('process', { ...process, platform: 'linux' })
    const { checkPlatform } = await import('../../src/steps/platform.js')
    await expect(checkPlatform()).rejects.toThrow('macOS only')
  })
})
