import { execa } from 'execa'
import { success, info, fail, spinner } from '../ui.js'

export async function checkSSH(): Promise<void> {
  const { stdout } = await execa('sudo', ['systemsetup', '-getremotelogin'])

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
