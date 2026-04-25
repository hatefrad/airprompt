import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('execa')
vi.mock('../../src/ui.js')

describe('checkSSH', () => {
  let mockSpinner: any

  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()

    // Set up spinner mock
    mockSpinner = {
      succeed: vi.fn(),
      fail: vi.fn(),
    }

    // Mock UI module
    const uiModule = await import('../../src/ui.js')
    vi.mocked(uiModule.spinner).mockReturnValue(mockSpinner)
  })

  it('resolves when remote login is already on', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa).mockResolvedValueOnce({ stdout: 'Remote Login: On' } as any)

    const { checkSSH } = await import('../../src/steps/ssh.js')
    await expect(checkSSH()).resolves.toBeUndefined()
    expect(execa).toHaveBeenCalledWith('sudo', ['systemsetup', '-getremotelogin'])
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

  it('rejects when enabling SSH fails', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockResolvedValueOnce({ stdout: 'Remote Login: Off' } as any)
      .mockRejectedValueOnce(new Error('permission denied'))

    const { checkSSH } = await import('../../src/steps/ssh.js')
    await expect(checkSSH()).rejects.toThrow('permission denied')
  })
})
