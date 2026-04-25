import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('execa')
vi.mock('../../src/ui.js')

describe('checkSSH', () => {
  let mockSpinner: any

  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()

    mockSpinner = { succeed: vi.fn(), fail: vi.fn() }

    const uiModule = await import('../../src/ui.js')
    vi.mocked(uiModule.spinner).mockReturnValue(mockSpinner)
  })

  it('resolves when remote login is already on', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa).mockResolvedValueOnce({ stdout: 'Remote Login: On' } as any)

    const { checkSSH } = await import('../../src/steps/ssh.js')
    await expect(checkSSH()).resolves.toBeUndefined()
    expect(execa).toHaveBeenCalledWith('sudo', ['systemsetup', '-getremotelogin'])
    expect(execa).toHaveBeenCalledTimes(1)
  })

  it('enables SSH when remote login is off', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockResolvedValueOnce({ stdout: 'Remote Login: Off' } as any) // getremotelogin
      .mockResolvedValueOnce({} as any)                               // setremotelogin on

    const { checkSSH } = await import('../../src/steps/ssh.js')
    await expect(checkSSH()).resolves.toBeUndefined()
    expect(execa).toHaveBeenCalledWith('sudo', ['systemsetup', '-setremotelogin', 'on'])
  })

  it('does not enable SSH when remote login is off in dry-run mode', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa).mockResolvedValueOnce({ stdout: 'Remote Login: Off' } as any)

    const { checkSSH } = await import('../../src/steps/ssh.js')
    await expect(checkSSH({ dryRun: true })).resolves.toBeUndefined()
    expect(execa).not.toHaveBeenCalledWith('sudo', ['systemsetup', '-setremotelogin', 'on'])
    expect(execa).toHaveBeenCalledTimes(1)
  })

  it('rejects when enabling SSH fails', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockResolvedValueOnce({ stdout: 'Remote Login: Off' } as any) // getremotelogin
      .mockRejectedValueOnce(new Error('permission denied'))           // setremotelogin on

    const { checkSSH } = await import('../../src/steps/ssh.js')
    await expect(checkSSH()).rejects.toThrow('permission denied')
  })

  it('rejects when SSH status check fails', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa).mockRejectedValueOnce(new Error('sudo failed'))

    const { checkSSH } = await import('../../src/steps/ssh.js')
    await expect(checkSSH()).rejects.toThrow('sudo failed')
  })
})
