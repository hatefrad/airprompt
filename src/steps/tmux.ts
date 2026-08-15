import { execa } from 'execa'
import type { AirpromptOptions } from '../options.js'
import { success, info, fail } from '../ui.js'

export async function checkTmux(
  options: AirpromptOptions = { dryRun: false },
): Promise<void> {
  try {
    await execa('which', ['tmux'])
    success('tmux installed')
    return
  } catch {
    if (options.dryRun) {
      info('[dry-run] Would install tmux: brew install tmux')
      return
    }

    info('tmux not found — installing via Homebrew...')
  }

  // Check brew is available
  try {
    await execa('which', ['brew'])
  } catch {
    fail(
      'Homebrew not found. Install it from https://brew.sh then re-run airprompt.',
    )
    throw new Error('brew not found')
  }

  info('Installing tmux (this may take a moment)...')
  try {
    await execa('brew', ['install', 'tmux'], { stdio: 'inherit' })
    success('tmux installed')
  } catch (err) {
    fail('Failed to install tmux')
    throw err
  }
}
