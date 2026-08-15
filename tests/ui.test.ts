import { beforeEach, describe, expect, it, vi } from 'vitest'

const start = vi.fn(() => ({ stop: vi.fn() }))
vi.mock('ora', () => ({ default: vi.fn(() => ({ start })) }))

describe('UI output', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
  })

  it('prints each message type', async () => {
    const { success, fail, info, warn } = await import('../src/ui.js')
    success('done')
    fail('broken')
    info('note')
    warn('careful')

    expect(console.log).toHaveBeenCalledTimes(4)
  })

  it('starts spinners', async () => {
    const { spinner } = await import('../src/ui.js')
    spinner('working')
    expect(start).toHaveBeenCalledOnce()
  })

  it('prints setup, cleanup, and help instructions', async () => {
    const { printInstructions, printCleanup, printHelp } =
      await import('../src/ui.js')
    printInstructions('100.64.0.1')
    printCleanup()
    printHelp()

    const output = vi.mocked(console.log).mock.calls.flat().join('\n')
    expect(output).toContain('100.64.0.1')
    expect(output).toContain('setremotelogin off')
    expect(output).toContain('--version')
  })
})
