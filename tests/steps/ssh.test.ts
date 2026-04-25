import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('execa', () => ({ execa: vi.fn() }))

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
}))

describe('checkSSH', () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('resolves when SSH is already listening on port 22', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa).mockResolvedValueOnce({} as any) // nc -z -w1 localhost 22

    const { checkSSH } = await import('../../src/steps/ssh.js')
    await expect(checkSSH()).resolves.toBeUndefined()
    expect(execa).toHaveBeenCalledWith('nc', ['-z', '-w1', 'localhost', '22'])
    expect(execa).toHaveBeenCalledTimes(1)
  })

  it('enables SSH when port 22 is not listening', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockRejectedValueOnce(new Error('connection refused')) // nc check — SSH off
      .mockResolvedValueOnce({} as any)                       // setremotelogin on

    const { checkSSH } = await import('../../src/steps/ssh.js')
    await expect(checkSSH()).resolves.toBeUndefined()
    expect(execa).toHaveBeenCalledWith('sudo', ['systemsetup', '-setremotelogin', 'on'], { stdio: 'inherit' })
  })

  it('does not enable SSH in dry-run mode', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa).mockRejectedValueOnce(new Error('connection refused')) // nc check

    const { checkSSH } = await import('../../src/steps/ssh.js')
    await expect(checkSSH({ dryRun: true })).resolves.toBeUndefined()
    expect(execa).not.toHaveBeenCalledWith('sudo', ['systemsetup', '-setremotelogin', 'on'], { stdio: 'inherit' })
    expect(execa).toHaveBeenCalledTimes(1)
  })

  it('falls back to System Settings when enable fails and succeeds if user enables it', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockRejectedValueOnce(new Error('connection refused')) // nc — SSH off
      .mockRejectedValueOnce(new Error('Full Disk Access'))   // setremotelogin fails
      .mockResolvedValueOnce({} as any)                       // open System Settings
      .mockResolvedValueOnce({} as any)                       // nc — SSH now on

    const { checkSSH } = await import('../../src/steps/ssh.js')
    await expect(checkSSH()).resolves.toBeUndefined()
    expect(execa).toHaveBeenCalledWith('open', ['x-apple.systempreferences:com.apple.preferences.sharing'])
  })

  it('rejects when user does not enable SSH in System Settings', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockRejectedValueOnce(new Error('connection refused')) // nc — SSH off
      .mockRejectedValueOnce(new Error('Full Disk Access'))   // setremotelogin fails
      .mockResolvedValueOnce({} as any)                       // open System Settings
      .mockRejectedValueOnce(new Error('connection refused')) // nc — still off

    const { checkSSH } = await import('../../src/steps/ssh.js')
    await expect(checkSSH()).rejects.toThrow('SSH not enabled')
  })
})
