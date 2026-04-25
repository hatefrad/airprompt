import { execa } from 'execa'
import type { AirpromptOptions } from '../options.js'
import { success, info, fail } from '../ui.js'

export async function checkSSH(options: AirpromptOptions = { dryRun: false }): Promise<void> {
  let stdout: string
  try {
    ;({ stdout } = await execa('sudo', ['systemsetup', '-getremotelogin'], { stdin: 'inherit', stderr: 'inherit' }))
  } catch (err) {
    fail('Could not check SSH status. Run: sudo systemsetup -getremotelogin')
    throw err
  }

  if (stdout.includes('On')) {
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
  } catch (err) {
    fail('Failed to enable SSH. Run manually: sudo systemsetup -setremotelogin on')
    throw err
  }
}
