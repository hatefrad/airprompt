import { fail } from '../ui.js'

export async function checkPlatform(): Promise<void> {
  if (process.platform !== 'darwin') {
    fail('agentreach currently supports macOS only.')
    throw new Error('macOS only')
  }
}
