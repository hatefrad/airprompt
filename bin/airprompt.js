#!/usr/bin/env node
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const script = join(__dirname, '..', 'dist', 'src', 'index.js')

const child = spawn(process.execPath, [script, ...process.argv.slice(2)], { stdio: 'inherit' })

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})
