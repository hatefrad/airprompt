#!/usr/bin/env tsx

import chalk from 'chalk'
import { readFileSync } from 'fs'
import { checkPlatform } from './steps/platform.js'
import { checkTailscale } from './steps/tailscale.js'
import { checkTmux } from './steps/tmux.js'
import { checkSSH } from './steps/ssh.js'
import { getTailscaleIP } from './steps/ip.js'
import { parseOptions } from './options.js'
import { info, warn, printInstructions, printCleanup } from './ui.js'

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'))

console.log(chalk.bold(`\nairprompt v${version}\n`))

try {
  const { options, unknown } = parseOptions(process.argv.slice(2))

  if (unknown.length > 0) {
    warn(`Unknown option(s): ${unknown.join(', ')}`)
  }

  if (options.dryRun) {
    info('Dry run mode: airprompt will check your system but will not install or enable anything.')
  }

  await checkPlatform()
  await checkTailscale(options)
  await checkTmux(options)
  await checkSSH(options)

  if (options.dryRun) {
    info('Dry run complete. Re-run without --dry-run to apply these changes.')
    try {
      const ip = await getTailscaleIP()
      printInstructions(ip)
    } catch {
      info('(Tailscale not connected — connect to see your IP and final instructions)')
    }
    printCleanup()
    process.exit(0)
  }

  const ip = await getTailscaleIP()
  printInstructions(ip)
  printCleanup()
} catch {
  process.exit(1)
}
