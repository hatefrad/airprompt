import { execa } from 'execa'
import { createInterface } from 'readline'
import { success, info, warn, fail, spinner } from '../ui.js'

async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function waitForTailscaleConnection(): Promise<void> {
  try {
    await execa('tailscale', ['ip', '-4'])
  } catch (err) {
    fail('Tailscale not connected. Open the Tailscale app and sign in, then re-run airprompt.')
    throw err
  }
}

export async function checkTailscale(): Promise<void> {
  // Check if installed
  try {
    await execa('which', ['tailscale'])
  } catch {
    info('Tailscale not found — installing via Homebrew...')
    const spin = spinner('Installing Tailscale...')
    try {
      await execa('brew', ['install', '--cask', 'tailscale'])
      spin.succeed('Tailscale installed')
    } catch (err) {
      spin.fail('Failed to install Tailscale')
      fail('Install manually: https://tailscale.com/download')
      throw err
    }
    warn('Open the Tailscale app from your Applications folder and sign in.')
    await prompt('Press Enter once you have signed in to Tailscale...')
    await waitForTailscaleConnection()
    success('Tailscale installed and running')
    return
  }

  // Already installed — check if connected
  try {
    await execa('tailscale', ['ip', '-4'])
    success('Tailscale installed and running')
  } catch {
    warn('Tailscale is installed but not connected. Open the Tailscale app and sign in.')
    await prompt('Press Enter once Tailscale is connected...')
    await waitForTailscaleConnection()
    success('Tailscale running')
  }
}
