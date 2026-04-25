import { execa } from 'execa'
import { success, fail } from '../ui.js'

export async function runStatus(): Promise<number> {
  let exitCode = 0

  // Tailscale
  try {
    await execa('which', ['tailscale'])
    try {
      const { stdout } = await execa('tailscale', ['ip', '-4'])
      success(`Tailscale connected (${stdout.trim()})`)
    } catch {
      fail('Tailscale installed but not connected')
      exitCode = 1
    }
  } catch {
    fail('Tailscale not installed')
    exitCode = 1
  }

  // tmux
  try {
    await execa('which', ['tmux'])
    success('tmux installed')
  } catch {
    fail('tmux not installed')
    exitCode = 1
  }

  // SSH Remote Login
  try {
    const { stdout } = await execa('sudo', ['systemsetup', '-getremotelogin'])
    if (stdout.includes('On')) {
      success('SSH Remote Login enabled')
    } else {
      fail('SSH Remote Login disabled')
      exitCode = 1
    }
  } catch {
    fail('Could not check SSH status')
    exitCode = 1
  }

  return exitCode
}
