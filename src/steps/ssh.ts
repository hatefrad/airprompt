import { execa } from 'execa'
import { success, info, fail, spinner } from '../ui.js'

export async function checkSSH(): Promise<void> {
  let stdout: string
  try {
    ;({ stdout } = await execa('sudo', ['systemsetup', '-getremotelogin']))
  } catch (err) {
    fail('Could not check SSH status. Run: sudo systemsetup -getremotelogin')
    throw err
  }

  if (stdout.includes('On')) {
    success('SSH (Remote Login) enabled')
    return
  }

  info('SSH is off — enabling Remote Login...')
  const spin = spinner('Enabling SSH...')
  try {
    await execa('sudo', ['systemsetup', '-setremotelogin', 'on'])
    spin.succeed('SSH enabled')
  } catch (err) {
    spin.fail('Failed to enable SSH')
    fail('Run manually: sudo systemsetup -setremotelogin on')
    throw err
  }
}
