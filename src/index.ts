#!/usr/bin/env tsx

import { readFileSync } from 'fs'
import { runAirprompt } from './cli.js'

const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf-8'),
)

process.exitCode = await runAirprompt(process.argv.slice(2), version)
