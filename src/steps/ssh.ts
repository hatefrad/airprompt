import { execa } from 'execa'
import { createInterface } from 'readline'
import type { AirpromptOptions } from '../options.js'
import { success, info, warn, fail } from '../ui.js'

async function prompt(question: string): Promise<void> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, () => {
      rl.close()
      resolve()
    })
  })
}

async function isSSHOn(): Promise<boolean> {
  const { stdout } = await execa('sudo', ['systemsetup', '-getremotelogin'], { stdin: 'inherit', stderr: 'inherit' })
  return stdout.includes('On')
}

export async function checkSSH(options: AirpromptOptions = { dryRun: false }): Promise<void> {
  let on: boolean
  try {
    on = await isSSHOn()
  } catch (err) {
    fail('Could not check SSH status. Run: sudo systemsetup -getremotelogin')
    throw err
  }

  if (on) {
    success('SSH (Remote Login) enabled')
    return
  }

  if (options.dryRun) {
    info('[dry-run] Would enable SSH Remote Login: sudo systemsetup -setremotelogin on')
    return
  }

  info('SSH is off — enabling Remote Login...')
  try {
    await execa('sudo', ['systemsetup', '-setremotelogin', 'on'], { stdio: 'inherit' })
    success('SSH enabled')
    return
  } catch {
    // systemsetup may fail on macOS Ventura+ due to Full Disk Access restrictions — fall through
  }

  // Fall back: open System Settings and let the user enable it manually
  warn('Could not enable Remote Login automatically (macOS may require Full Disk Access).')
  warn('Opening System Settings → Sharing — toggle "Remote Login" on, then come back here.')
  await execa('open', ['x-apple.systempreferences:com.apple.preferences.sharing'])
  await prompt('Press Enter once Remote Login is enabled in System Settings...')
  const nowOn = await isSSHOn()
  if (!nowOn) {
    fail('Remote Login still off. Enable it in System Settings → Sharing → Remote Login.')
    throw new Error('SSH not enabled')
  }
  success('SSH enabled')
}
