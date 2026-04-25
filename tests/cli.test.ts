import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/steps/platform.js', () => ({
  checkPlatform: vi.fn(),
}))

vi.mock('../src/steps/tailscale.js', () => ({
  checkTailscale: vi.fn(),
}))

vi.mock('../src/steps/tmux.js', () => ({
  checkTmux: vi.fn(),
}))

vi.mock('../src/steps/ssh.js', () => ({
  checkSSH: vi.fn(),
}))

vi.mock('../src/steps/ip.js', () => ({
  getTailscaleIP: vi.fn(),
}))

vi.mock('../src/commands/status.js', () => ({
  runStatus: vi.fn(),
}))

vi.mock('../src/ui.js', () => ({
  info: vi.fn(),
  warn: vi.fn(),
  printInstructions: vi.fn(),
  printCleanup: vi.fn(),
}))

describe('runAirprompt', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('exits before setup when unknown options are provided', async () => {
    const { checkPlatform } = await import('../src/steps/platform.js')
    const { warn } = await import('../src/ui.js')
    const { runAirprompt } = await import('../src/cli.js')

    await expect(runAirprompt(['--dryrun'], '0.0.5')).resolves.toBe(1)
    expect(warn).toHaveBeenCalledWith('Unknown option(s): --dryrun')
    expect(checkPlatform).not.toHaveBeenCalled()
  })

  it('exits before status when unknown status options are provided', async () => {
    const { runStatus } = await import('../src/commands/status.js')
    const { warn } = await import('../src/ui.js')
    const { runAirprompt } = await import('../src/cli.js')

    await expect(runAirprompt(['status', '--bogus'], '0.0.5')).resolves.toBe(1)
    expect(warn).toHaveBeenCalledWith('Unknown option(s): --bogus')
    expect(runStatus).not.toHaveBeenCalled()
  })

  it('runs status when no status options are provided', async () => {
    const { runStatus } = await import('../src/commands/status.js')
    vi.mocked(runStatus).mockResolvedValueOnce(0)

    const { runAirprompt } = await import('../src/cli.js')

    await expect(runAirprompt(['status'], '0.0.5')).resolves.toBe(0)
    expect(runStatus).toHaveBeenCalled()
  })

  it('does not print the normal success instructions in dry-run mode', async () => {
    const { getTailscaleIP } = await import('../src/steps/ip.js')
    const { printInstructions, printCleanup } = await import('../src/ui.js')
    vi.mocked(getTailscaleIP).mockResolvedValueOnce('100.64.0.1')

    const { runAirprompt } = await import('../src/cli.js')

    await expect(runAirprompt(['--dry-run'], '0.0.5')).resolves.toBe(0)
    expect(getTailscaleIP).toHaveBeenCalled()
    expect(printInstructions).not.toHaveBeenCalled()
    expect(printCleanup).not.toHaveBeenCalled()
  })
})
