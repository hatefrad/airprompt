import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('execa', () => ({
  execa: vi.fn(),
}))

vi.mock('../../src/ui.js', () => ({
  success: vi.fn(),
  fail: vi.fn(),
}))

vi.mock('../../src/steps/tailscale-status.js', () => ({
  getConnectedTailscale: vi.fn(),
}))

describe('getTailscaleIP', () => {
  beforeEach(async () => {
    vi.resetAllMocks()
    const { getConnectedTailscale } =
      await import('../../src/steps/tailscale-status.js')
    vi.mocked(getConnectedTailscale).mockResolvedValue({
      ipv4: '100.111.33.43',
    })
  })

  it('returns the IP address', async () => {
    const { getTailscaleIP } = await import('../../src/steps/ip.js')
    const ip = await getTailscaleIP()
    expect(ip).toBe('100.111.33.43')
  })

  it('rejects when tailscale ip fails', async () => {
    const { getConnectedTailscale } =
      await import('../../src/steps/tailscale-status.js')
    vi.mocked(getConnectedTailscale).mockRejectedValueOnce(
      new Error('not connected'),
    )

    const { getTailscaleIP } = await import('../../src/steps/ip.js')
    await expect(getTailscaleIP()).rejects.toThrow('not connected')
  })
})
