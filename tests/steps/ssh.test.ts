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

  it('resolves when remote login is already on', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa).mockResolvedValueOnce({ stdout: 'Remote Login: On' } as any)

    const { checkSSH } = await import('../../src/steps/ssh.js')
    await expect(checkSSH()).resolves.toBeUndefined()
    expect(execa).toHaveBeenCalledWith('sudo', ['systemsetup', '-getremotelogin'], { stdin: 'inherit', stderr: 'inherit' })
    expect(execa).toHaveBeenCalledTimes(1)
  })

  it('enables SSH when remote login is off', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockResolvedValueOnce({ stdout: 'Remote Login: Off' } as any) // getremotelogin
      .mockResolvedValueOnce({} as any)                               // setremotelogin on

    const { checkSSH } = await import('../../src/steps/ssh.js')
    await expect(checkSSH()).resolves.toBeUndefined()
    expect(execa).toHaveBeenCalledWith('sudo', ['systemsetup', '-setremotelogin', 'on'], { stdio: 'inherit' })
  })

  it('does not enable SSH when remote login is off in dry-run mode', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa).mockResolvedValueOnce({ stdout: 'Remote Login: Off' } as any)

    const { checkSSH } = await import('../../src/steps/ssh.js')
    await expect(checkSSH({ dryRun: true })).resolves.toBeUndefined()
    expect(execa).not.toHaveBeenCalledWith('sudo', ['systemsetup', '-setremotelogin', 'on'], { stdio: 'inherit' })
    expect(execa).toHaveBeenCalledTimes(1)
  })

  it('falls back to System Settings when enable fails and succeeds if user enables it', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockResolvedValueOnce({ stdout: 'Remote Login: Off' } as any) // getremotelogin
      .mockRejectedValueOnce(new Error('Full Disk Access'))            // setremotelogin fails
      .mockResolvedValueOnce({} as any)                               // open System Settings
      .mockResolvedValueOnce({ stdout: 'Remote Login: On' } as any)  // getremotelogin after user

    const { checkSSH } = await import('../../src/steps/ssh.js')
    await expect(checkSSH()).resolves.toBeUndefined()
    expect(execa).toHaveBeenCalledWith('open', ['x-apple.systempreferences:com.apple.preferences.sharing'])
  })

  it('rejects when enable fails and user does not enable SSH in System Settings', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockResolvedValueOnce({ stdout: 'Remote Login: Off' } as any) // getremotelogin
      .mockRejectedValueOnce(new Error('Full Disk Access'))            // setremotelogin fails
      .mockResolvedValueOnce({} as any)                               // open System Settings
      .mockResolvedValueOnce({ stdout: 'Remote Login: Off' } as any) // getremotelogin still off

    const { checkSSH } = await import('../../src/steps/ssh.js')
    await expect(checkSSH()).rejects.toThrow('SSH not enabled')
  })

  it('rejects when SSH status check fails', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa).mockRejectedValueOnce(new Error('sudo failed'))

    const { checkSSH } = await import('../../src/steps/ssh.js')
    await expect(checkSSH()).rejects.toThrow('sudo failed')
  })
})
