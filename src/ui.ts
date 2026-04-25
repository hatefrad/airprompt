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
  console.log('\n' + line)
  console.log(chalk.bold('  You\'re all set!\n'))
  console.log('  From your phone:')
  console.log('  1. Install Tailscale (same account as this Mac)')
  console.log('  2. Install Termius')
  console.log(`  3. Add host: ${chalk.cyan(ip)}`)
  console.log('  4. Connect and run: ' + chalk.cyan('tmux new -s work'))
  console.log('\n  SSH keys:')
  console.log('  ' + chalk.cyan('ssh-keygen -t ed25519 -C "airprompt"'))
  console.log('  ' + chalk.cyan(`ssh-copy-id <mac-username>@${ip}`) + chalk.dim('  # if available'))
  console.log(line + '\n')
}

export function printCleanup(): void {
  console.log(chalk.dim('  To undo: sudo systemsetup -setremotelogin off\n'))
}

export function printHelp(version: string): void {
  console.log(`
Usage: airprompt [command] [options]

Commands:
  status       Check whether Tailscale, tmux, and SSH are set up

Options:
  --dry-run    Preview changes without installing or enabling anything
  --help       Show this help message
  `.trim() + '\n')
}
