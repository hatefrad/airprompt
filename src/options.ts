export type AirpromptOptions = {
  dryRun: boolean
}

const KNOWN_ARGS = ['--dry-run']

export function parseOptions(args: string[]): { options: AirpromptOptions; unknown: string[] } {
  return {
    options: { dryRun: args.includes('--dry-run') },
    unknown: args.filter(a => !KNOWN_ARGS.includes(a)),
  }
}
