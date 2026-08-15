import { userInfo } from 'os'
import chalk from 'chalk'
import ora, { type Ora } from 'ora'

export function success(msg: string): void {
  console.log(chalk.green('✔') + ' ' + msg)
}

export function fail(msg: string): void {
  console.log(chalk.red('✖') + ' ' + msg)
}

export function info(msg: string): void {
  console.log(chalk.cyan('ℹ') + ' ' + msg)
}

export function warn(msg: string): void {
  console.log(chalk.yellow('⚠') + ' ' + msg)
}

export function spinner(msg: string): Ora {
  return ora(msg).start()
}

export function printInstructions(ip: string): void {
  const line = '━'.repeat(40)
  const user = userInfo().username
  console.log('\n' + line)
  console.log(chalk.bold("  You're all set!\n"))
  console.log(
    '  1. Start a tmux session ' + chalk.dim('(run this on your Mac first):'),
  )
  console.log('     ' + chalk.cyan('tmux new -s work'))
  console.log()
  console.log('  2. Install on your phone:')
  console.log(
    '     • Tailscale ' +
      chalk.dim('(sign in with the same account as this Mac)'),
  )
  console.log('     • Termius ' + chalk.dim('(SSH client)'))
  console.log()
  console.log('  3. Add host in Termius:')
  console.log('     Host:  ' + chalk.cyan(ip))
  console.log('     Login: ' + chalk.cyan(user))
  console.log()
  console.log('  4. Connect from your phone and attach:')
  console.log('     ' + chalk.cyan('tmux attach -t work'))
  console.log(line + '\n')
}

export function printCleanup(): void {
  console.log(chalk.dim('  To undo: sudo systemsetup -setremotelogin off\n'))
}

export function printHelp(): void {
  console.log(
    `
Usage: airprompt [command] [options]

Commands:
  status       Check whether Tailscale, tmux, and SSH are set up

Options:
  --dry-run    Preview changes without installing or enabling anything
  --version    Show the installed version
  --help       Show this help message
  `.trim() + '\n',
  )
}
