#!/usr/bin/env node
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const tsx = join(__dirname, '..', 'node_modules', '.bin', 'tsx')
const script = join(__dirname, '..', 'src', 'index.ts')

spawn(tsx, [script], { stdio: 'inherit' })
