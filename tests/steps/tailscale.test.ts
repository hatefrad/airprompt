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

vi.mock('../../src/steps/tailscale-status.js', () => ({
  getConnectedTailscale: vi.fn(),
}))

describe('checkTailscale', () => {
  let mockSpinner: any

  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()

    mockSpinner = { succeed: vi.fn(), fail: vi.fn() }

    const uiModule = await import('../../src/ui.js')
    vi.mocked(uiModule.spinner).mockReturnValue(mockSpinner)
    const { getConnectedTailscale } =
      await import('../../src/steps/tailscale-status.js')
    vi.mocked(getConnectedTailscale).mockResolvedValue({
      ipv4: '100.111.33.43',
    })
  })

  it('resolves when tailscale is installed and running', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa).mockResolvedValueOnce({
      stdout: '/usr/local/bin/tailscale',
    } as any) // which tailscale

    const { checkTailscale } = await import('../../src/steps/tailscale.js')
    await expect(checkTailscale()).resolves.toBeUndefined()
  })

  it('installs tailscale when missing and waits for user', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockRejectedValueOnce(new Error('not found')) // which tailscale
      .mockResolvedValueOnce({} as any) // brew install --cask tailscale

    const { checkTailscale } = await import('../../src/steps/tailscale.js')
    await expect(checkTailscale()).resolves.toBeUndefined()
    expect(execa).toHaveBeenCalledWith(
      'brew',
      ['install', '--cask', 'tailscale'],
      { stdio: 'inherit' },
    )
  })

  it('does not install tailscale when missing in dry-run mode', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa).mockRejectedValueOnce(new Error('not found')) // which tailscale

    const { checkTailscale } = await import('../../src/steps/tailscale.js')
    await expect(checkTailscale({ dryRun: true })).resolves.toBeUndefined()
    expect(execa).not.toHaveBeenCalledWith('brew', [
      'install',
      '--cask',
      'tailscale',
    ])
    expect(execa).toHaveBeenCalledTimes(1)
  })

  it('rejects when not connected after install (no IP)', async () => {
    const { execa } = await import('execa')
    const { getConnectedTailscale } =
      await import('../../src/steps/tailscale-status.js')
    vi.mocked(getConnectedTailscale).mockRejectedValueOnce(
      new Error('not logged in'),
    )
    vi.mocked(execa)
      .mockRejectedValueOnce(new Error('not found')) // which tailscale
      .mockResolvedValueOnce({} as any) // brew install

    const { checkTailscale } = await import('../../src/steps/tailscale.js')
    await expect(checkTailscale()).rejects.toThrow('not logged in')
  })

  it('does not wait for input outside an interactive terminal', async () => {
    Object.defineProperty(process.stdin, 'isTTY', {
      value: false,
      configurable: true,
    })
    const { execa } = await import('execa')
    const { getConnectedTailscale } =
      await import('../../src/steps/tailscale-status.js')
    vi.mocked(execa).mockResolvedValueOnce({
      stdout: '/usr/local/bin/tailscale',
    } as never)
    vi.mocked(getConnectedTailscale).mockRejectedValueOnce(
      new Error('NeedsLogin'),
    )

    const { checkTailscale } = await import('../../src/steps/tailscale.js')
    await expect(checkTailscale()).rejects.toThrow(
      'interactive terminal required',
    )
    delete (process.stdin as { isTTY?: boolean }).isTTY
  })
})
