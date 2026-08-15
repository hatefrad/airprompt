import { execa } from 'execa'
import { createInterface } from 'readline'
import type { AirpromptOptions } from '../options.js'
import { success, info, warn, fail } from '../ui.js'
import { getConnectedTailscale } from './tailscale-status.js'

async function prompt(question: string): Promise<string> {
  if (process.stdin.isTTY === false) {
    fail(
      'Tailscale needs your input. Open the app and sign in, then re-run airprompt in an interactive terminal.',
    )
    throw new Error('interactive terminal required')
  }

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
    await getConnectedTailscale()
  } catch (err) {
    fail(
      'Tailscale not connected. Open the Tailscale app and sign in, then re-run airprompt.',
    )
    throw err
  }
}

export async function checkTailscale(
  options: AirpromptOptions = { dryRun: false },
): Promise<void> {
  // Check if installed
  try {
    await execa('which', ['tailscale'])
  } catch {
    if (options.dryRun) {
      info('[dry-run] Would install Tailscale: brew install --cask tailscale')
      warn('[dry-run] Would ask you to open Tailscale and sign in.')
      return
    }

    info(
      'Tailscale not found — installing via Homebrew (this may take a few minutes)...',
    )
    try {
      await execa('brew', ['install', '--cask', 'tailscale'], {
        stdio: 'inherit',
      })
      success('Tailscale installed')
    } catch (err) {
      fail(
        'Failed to install Tailscale. Install manually: https://tailscale.com/download',
      )
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
    await getConnectedTailscale()
    success('Tailscale installed and running')
  } catch {
    if (options.dryRun) {
      warn('[dry-run] Tailscale is installed but not connected.')
      return
    }

    warn(
      'Tailscale is installed but not connected. Open the Tailscale app and sign in.',
    )
    await prompt('Press Enter once Tailscale is connected...')
    await waitForTailscaleConnection()
    success('Tailscale running')
  }
}
