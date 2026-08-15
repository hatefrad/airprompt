import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('execa', () => ({ execa: vi.fn() }))

describe('getConnectedTailscale', () => {
  beforeEach(() => vi.resetAllMocks())

  it('returns the IPv4 address and normalized DNS name', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa).mockResolvedValueOnce({
      stdout: JSON.stringify({
        BackendState: 'Running',
        TailscaleIPs: ['100.64.0.1', 'fd7a:115c:a1e0::1'],
        Self: { DNSName: 'my-mac.example.ts.net.' },
      }),
    } as never)

    const { getConnectedTailscale } =
      await import('../../src/steps/tailscale-status.js')
    await expect(getConnectedTailscale()).resolves.toEqual({
      ipv4: '100.64.0.1',
      dnsName: 'my-mac.example.ts.net',
    })
    expect(execa).toHaveBeenCalledWith('tailscale', ['status', '--json'])
  })

  it('describes a backend that is not running', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa).mockResolvedValueOnce({
      stdout: JSON.stringify({ BackendState: 'NeedsLogin' }),
    } as never)

    const { getConnectedTailscale } =
      await import('../../src/steps/tailscale-status.js')
    await expect(getConnectedTailscale()).rejects.toThrow(
      'Tailscale is NeedsLogin',
    )
  })

  it('rejects a running backend without an IPv4 address', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa).mockResolvedValueOnce({
      stdout: JSON.stringify({
        BackendState: 'Running',
        TailscaleIPs: ['fd7a:115c:a1e0::1'],
      }),
    } as never)

    const { getConnectedTailscale } =
      await import('../../src/steps/tailscale-status.js')
    await expect(getConnectedTailscale()).rejects.toThrow(
      'Tailscale has no IPv4 address',
    )
  })
})
