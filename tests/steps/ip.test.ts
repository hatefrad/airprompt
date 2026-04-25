import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('execa', () => ({
  execa: vi.fn(),
}))

vi.mock('../../src/ui.js', () => ({
  success: vi.fn(),
  fail: vi.fn(),
}))

describe('getTailscaleIP', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns the IP address', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa).mockResolvedValueOnce({ stdout: '100.111.33.43\n' } as any)

    const { getTailscaleIP } = await import('../../src/steps/ip.js')
    const ip = await getTailscaleIP()
    expect(ip).toBe('100.111.33.43')
  })

  it('rejects when tailscale ip fails', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa).mockRejectedValueOnce(new Error('not connected'))

    const { getTailscaleIP } = await import('../../src/steps/ip.js')
    await expect(getTailscaleIP()).rejects.toThrow('not connected')
  })
})
