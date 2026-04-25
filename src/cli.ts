import chalk from 'chalk'
import { checkPlatform } from './steps/platform.js'
import { checkTailscale } from './steps/tailscale.js'
import { checkTmux } from './steps/tmux.js'
import { checkSSH } from './steps/ssh.js'
import { getTailscaleIP } from './steps/ip.js'
import { parseOptions } from './options.js'
import { runStatus } from './commands/status.js'
import { info, warn, printHelp, printInstructions, printCleanup } from './ui.js'

export async function runAirprompt(args: string[], version: string): Promise<number> {
  console.log(chalk.bold(`\nairprompt v${version}\n`))

  if (args[0] === 'help' || args.includes('--help')) {
    printHelp()
    return 0
  }

  if (args[0] === 'status') {
    const unknown = args.slice(1)
    if (unknown.length > 0) {
      warn(`Unknown option(s): ${unknown.join(', ')}`)
      return 1
    }

    return runStatus()
  }

  try {
    const { options, unknown } = parseOptions(args)

    if (unknown.length > 0) {
      warn(`Unknown option(s): ${unknown.join(', ')}`)
      return 1
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
        await getTailscaleIP()
      } catch {
        info('(Tailscale not connected — connect to see your IP and final instructions)')
      }
      return 0
    }

    const ip = await getTailscaleIP()
    printInstructions(ip)
    printCleanup()
    return 0
  } catch {
    return 1
  }
}
