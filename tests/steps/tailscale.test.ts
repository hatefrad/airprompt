import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('execa', () => ({
  execa: vi.fn(),
}))

vi.mock('readline', () => ({
  createInterface: vi.fn(() => ({
    question: vi.fn((_prompt: string, cb: (ans: string) => void) => cb('')),
    close: vi.fn(),
  })),
}))

vi.mock('../../src/ui.js', () => ({
  success: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  fail: vi.fn(),
  spinner: vi.fn(() => ({ succeed: vi.fn(), fail: vi.fn() })),
}))

describe('checkTailscale', () => {
  let mockSpinner: any

  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()

    mockSpinner = { succeed: vi.fn(), fail: vi.fn() }

    const uiModule = await import('../../src/ui.js')
    vi.mocked(uiModule.spinner).mockReturnValue(mockSpinner)
  })

  it('resolves when tailscale is installed and running', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockResolvedValueOnce({ stdout: '/usr/local/bin/tailscale' } as any) // which tailscale
      .mockResolvedValueOnce({ stdout: '100.111.33.43' } as any)            // tailscale ip -4

    const { checkTailscale } = await import('../../src/steps/tailscale.js')
    await expect(checkTailscale()).resolves.toBeUndefined()
  })

  it('installs tailscale when missing and waits for user', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockRejectedValueOnce(new Error('not found'))           // which tailscale
      .mockResolvedValueOnce({} as any)                        // brew install --cask tailscale
      .mockResolvedValueOnce({ stdout: '100.1.2.3' } as any)  // tailscale ip -4 after user confirms

    const { checkTailscale } = await import('../../src/steps/tailscale.js')
    await expect(checkTailscale()).resolves.toBeUndefined()
    expect(execa).toHaveBeenCalledWith('brew', ['install', '--cask', 'tailscale'], { stdio: 'inherit' })
  })

  it('does not install tailscale when missing in dry-run mode', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa).mockRejectedValueOnce(new Error('not found')) // which tailscale

    const { checkTailscale } = await import('../../src/steps/tailscale.js')
    await expect(checkTailscale({ dryRun: true })).resolves.toBeUndefined()
    expect(execa).not.toHaveBeenCalledWith('brew', ['install', '--cask', 'tailscale'])
    expect(execa).toHaveBeenCalledTimes(1)
  })

  it('rejects when not connected after install (no IP)', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockRejectedValueOnce(new Error('not found'))              // which tailscale
      .mockResolvedValueOnce({} as any)                           // brew install
      .mockRejectedValueOnce(new Error('not logged in'))          // tailscale ip -4

    const { checkTailscale } = await import('../../src/steps/tailscale.js')
    await expect(checkTailscale()).rejects.toThrow('not logged in')
  })
})
