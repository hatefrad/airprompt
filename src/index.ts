#!/usr/bin/env tsx

import chalk from 'chalk'
import { readFileSync } from 'fs'
import { checkPlatform } from './steps/platform.js'
import { checkTailscale } from './steps/tailscale.js'
import { checkTmux } from './steps/tmux.js'
import { checkSSH } from './steps/ssh.js'
import { getTailscaleIP } from './steps/ip.js'
import { printInstructions } from './ui.js'

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'))

console.log(chalk.bold(`\nairprompt v${version}\n`))

try {
  await checkPlatform()
  await checkTailscale()
  await checkTmux()
  await checkSSH()
  const ip = await getTailscaleIP()
  printInstructions(ip)
} catch {
  process.exit(1)
}
