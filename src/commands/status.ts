import { execa } from 'execa'
import { success, fail } from '../ui.js'
import { getConnectedTailscale } from '../steps/tailscale-status.js'

export async function runStatus(): Promise<number> {
  let exitCode = 0
  let tailscaleIP: string | undefined

  // Tailscale
  try {
    await execa('which', ['tailscale'])
    try {
      const tailscale = await getConnectedTailscale()
      tailscaleIP = tailscale.ipv4
      const name = tailscale.dnsName ? `, ${tailscale.dnsName}` : ''
      success(`Tailscale connected (${tailscale.ipv4}${name})`)
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

  // Verify the route users will actually connect through.
  try {
    if (!tailscaleIP) throw new Error('Tailscale unavailable')
    await execa('nc', ['-z', '-w1', tailscaleIP, '22'])
    success('SSH reachable over Tailscale')
  } catch {
    fail(
      tailscaleIP
        ? 'SSH not reachable over Tailscale'
        : 'SSH check skipped (Tailscale unavailable)',
    )
    exitCode = 1
  }

  return exitCode
}
