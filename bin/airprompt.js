#!/usr/bin/env node
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createRequire } from 'module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const script = join(__dirname, '..', 'src', 'index.ts')

// Resolve tsx binary from this package's own dependencies
const tsxPkg = require.resolve('tsx/package.json')
const tsx = join(dirname(tsxPkg), 'dist', 'cli.mjs')
spawn(process.execPath, [tsx, script], { stdio: 'inherit' })
