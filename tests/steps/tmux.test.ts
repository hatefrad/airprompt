import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('execa')
vi.mock('../../src/ui.js')

describe('checkTmux', () => {
  let mockSpinner: any
  let mockExeca: any

  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()

    // Set up spinner mock
    mockSpinner = {
      succeed: vi.fn(),
      fail: vi.fn(),
    }

    // Mock execa
    const { execa } = await import('execa')
    mockExeca = vi.mocked(execa)

    // Mock UI module
    const uiModule = await import('../../src/ui.js')
    vi.mocked(uiModule.spinner).mockReturnValue(mockSpinner)
  })

  it('resolves when tmux is already installed', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa).mockResolvedValueOnce({
      stdout: '/usr/local/bin/tmux',
    } as any)

    const { checkTmux } = await import('../../src/steps/tmux.js')
    await expect(checkTmux()).resolves.toBeUndefined()
    expect(execa).toHaveBeenCalledWith('which', ['tmux'])
  })

  it('installs tmux via brew when missing', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockRejectedValueOnce(new Error('not found')) // which tmux fails
      .mockResolvedValueOnce({} as any) // which brew succeeds
      .mockResolvedValueOnce({} as any) // brew install succeeds

    const { checkTmux } = await import('../../src/steps/tmux.js')
    await expect(checkTmux()).resolves.toBeUndefined()
    expect(execa).toHaveBeenCalledWith('brew', ['install', 'tmux'], {
      stdio: 'inherit',
    })
  })

  it('does not install tmux when missing in dry-run mode', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa).mockRejectedValueOnce(new Error('not found')) // which tmux

    const { checkTmux } = await import('../../src/steps/tmux.js')
    await expect(checkTmux({ dryRun: true })).resolves.toBeUndefined()
    expect(execa).not.toHaveBeenCalledWith('brew', ['install', 'tmux'])
    expect(execa).toHaveBeenCalledTimes(1)
  })

  it('rejects when brew itself is not installed', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockRejectedValueOnce(new Error('not found')) // which tmux
      .mockRejectedValueOnce(new Error('not found')) // which brew

    const { checkTmux } = await import('../../src/steps/tmux.js')
    await expect(checkTmux()).rejects.toThrow('brew not found')
  })

  it('rejects when brew install fails', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockRejectedValueOnce(new Error('not found')) // which tmux
      .mockResolvedValueOnce({} as any) // which brew succeeds
      .mockRejectedValueOnce(new Error('brew unavailable')) // brew install

    const { checkTmux } = await import('../../src/steps/tmux.js')
    await expect(checkTmux()).rejects.toThrow('brew unavailable')
  })
})
