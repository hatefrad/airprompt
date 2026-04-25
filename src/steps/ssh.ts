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
  } catch (err: any) {
    const needsFDA = (err.stderr ?? err.message ?? '').includes('Full Disk Access')
    if (needsFDA) {
      warn('macOS requires Full Disk Access to enable Remote Login programmatically.')
      warn('Opening System Settings → Sharing — toggle "Remote Login" on, then come back.')
      await execa('open', ['x-apple.systempreferences:com.apple.preferences.sharing'])
      await prompt('Press Enter once Remote Login is enabled in System Settings...')
      const nowOn = await isSSHOn()
      if (!nowOn) {
        fail('Remote Login still off. Enable it in System Settings → Sharing → Remote Login.')
        throw new Error('SSH not enabled')
      }
      success('SSH enabled')
    } else {
      fail('Failed to enable SSH. Run manually: sudo systemsetup -setremotelogin on')
      throw err
    }
  }
}
