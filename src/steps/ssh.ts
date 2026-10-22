import { execa } from 'execa'
import { createInterface } from 'readline'
import type { AirpromptOptions } from '../options.js'
import { success, info, warn, fail } from '../ui.js'
import { getConnectedTailscale } from './tailscale-status.js'

async function prompt(question: string): Promise<void> {
  if (process.stdin.isTTY === false) {
    fail(
      'Remote Login needs manual setup. Enable it in System Settings → General → Sharing, then re-run airprompt.',
    )
    throw new Error('interactive terminal required')
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, () => {
      rl.close()
      resolve()
    })
  })
}

async function isSSHOn(): Promise<boolean> {
  const { ipv4 } = await getConnectedTailscale()
  try {
    await execa('nc', ['-z', '-w1', ipv4, '22'])
    return true
  } catch {
    return false
  }
}

export async function checkSSH(
  options: AirpromptOptions = { dryRun: false },
): Promise<void> {
  let on: boolean
  try {
    on = await isSSHOn()
  } catch (err) {
    if (options.dryRun) {
      warn(
        '[dry-run] SSH check skipped: connect Tailscale to check Remote Login.',
      )
      return
    }
    fail(
      'Could not check SSH: make sure Tailscale is connected, then re-run airprompt.',
    )
    throw err
  }

  if (on) {
    success('SSH reachable over Tailscale')
    return
  }

  if (options.dryRun) {
    info(
      '[dry-run] Would enable SSH Remote Login: sudo systemsetup -setremotelogin on',
    )
    return
  }

  info('SSH is not reachable over Tailscale — trying to enable Remote Login...')
  let enabled = false
  try {
    await execa('sudo', ['systemsetup', '-setremotelogin', 'on'], {
      stdio: 'inherit',
    })
    enabled = true
  } catch {
    // systemsetup may fail on macOS Ventura+ due to Full Disk Access restrictions — fall through
  }

  if (enabled) {
    if (!(await isSSHOn())) {
      fail(
        'Remote Login was enabled, but SSH is not reachable over Tailscale. Check Tailscale connectivity and firewall settings.',
      )
      throw new Error('SSH not reachable over Tailscale')
    }
    success('SSH enabled and reachable over Tailscale')
    return
  }

  // Fall back: open System Settings and let the user enable it manually
  warn(
    'Could not enable Remote Login automatically (macOS may require Full Disk Access).',
  )
  warn(
    'Opening System Settings → Sharing — toggle "Remote Login" on, then come back here.',
  )
  await execa('open', [
    'x-apple.systempreferences:com.apple.preferences.sharing',
  ])
  await prompt('Press Enter once Remote Login is enabled in System Settings...')
  const nowOn = await isSSHOn()
  if (!nowOn) {
    fail(
      'SSH is still not reachable over Tailscale. Check Remote Login in System Settings → Sharing, Tailscale connectivity, and firewall settings.',
    )
    throw new Error('SSH not reachable over Tailscale')
  }
  success('SSH reachable over Tailscale')
}
