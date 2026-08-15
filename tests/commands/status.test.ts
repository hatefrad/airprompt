import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('execa', () => ({ execa: vi.fn() }))
vi.mock('../../src/ui.js', () => ({
  success: vi.fn(),
  fail: vi.fn(),
}))
vi.mock('../../src/steps/tailscale-status.js', () => ({
  getConnectedTailscale: vi.fn(),
}))

describe('runStatus', () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.resetAllMocks()
    const { getConnectedTailscale } =
      await import('../../src/steps/tailscale-status.js')
    vi.mocked(getConnectedTailscale).mockResolvedValue({ ipv4: '100.64.0.1' })
  })

  it('returns 0 and prints success for all components when everything is set up', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockResolvedValueOnce({ stdout: '/usr/local/bin/tailscale' } as any) // which tailscale
      .mockResolvedValueOnce({ stdout: '/usr/local/bin/tmux' } as any) // which tmux
      .mockResolvedValueOnce({} as any) // nc localhost 22

    const { runStatus } = await import('../../src/commands/status.js')
    const code = await runStatus()

    const { success } = await import('../../src/ui.js')
    expect(code).toBe(0)
    expect(execa).toHaveBeenCalledWith('nc', ['-z', '-w1', '100.64.0.1', '22'])
    expect(vi.mocked(success)).toHaveBeenCalledTimes(3)
  })

  it('returns 1 when Tailscale is not installed', async () => {
    const { execa } = await import('execa')
    const { getConnectedTailscale } =
      await import('../../src/steps/tailscale-status.js')
    vi.mocked(getConnectedTailscale).mockRejectedValueOnce(
      new Error('not found'),
    )
    vi.mocked(execa)
      .mockRejectedValueOnce(new Error('not found')) // which tailscale
      .mockResolvedValueOnce({ stdout: '/usr/local/bin/tmux' } as any) // which tmux
      .mockResolvedValueOnce({} as any) // nc localhost 22

    const { runStatus } = await import('../../src/commands/status.js')
    const code = await runStatus()

    const { fail } = await import('../../src/ui.js')
    expect(code).toBe(1)
    expect(vi.mocked(fail)).toHaveBeenCalledWith('Tailscale not installed')
  })

  it('returns 1 when Tailscale is installed but not connected', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockResolvedValueOnce({ stdout: '/usr/local/bin/tailscale' } as any) // which tailscale
      .mockResolvedValueOnce({ stdout: '/usr/local/bin/tmux' } as any) // which tmux
      .mockResolvedValueOnce({} as any) // nc localhost 22

    const { getConnectedTailscale } =
      await import('../../src/steps/tailscale-status.js')
    vi.mocked(getConnectedTailscale).mockRejectedValueOnce(new Error('no IP'))

    const { runStatus } = await import('../../src/commands/status.js')
    const code = await runStatus()

    const { fail } = await import('../../src/ui.js')
    expect(code).toBe(1)
    expect(vi.mocked(fail)).toHaveBeenCalledWith(
      'Tailscale installed but not connected',
    )
  })

  it('returns 1 when tmux is not installed', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockResolvedValueOnce({ stdout: '/usr/local/bin/tailscale' } as any) // which tailscale
      .mockRejectedValueOnce(new Error('not found')) // which tmux
      .mockResolvedValueOnce({} as any) // nc localhost 22

    const { runStatus } = await import('../../src/commands/status.js')
    const code = await runStatus()

    const { fail } = await import('../../src/ui.js')
    expect(code).toBe(1)
    expect(vi.mocked(fail)).toHaveBeenCalledWith('tmux not installed')
  })

  it('returns 1 when SSH Remote Login is disabled', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockResolvedValueOnce({ stdout: '/usr/local/bin/tailscale' } as any) // which tailscale
      .mockResolvedValueOnce({ stdout: '/usr/local/bin/tmux' } as any) // which tmux
      .mockRejectedValueOnce(new Error('connection refused')) // nc localhost 22

    const { runStatus } = await import('../../src/commands/status.js')
    const code = await runStatus()

    const { fail } = await import('../../src/ui.js')
    expect(code).toBe(1)
    expect(vi.mocked(fail)).toHaveBeenCalledWith(
      'SSH not reachable over Tailscale',
    )
  })
})
