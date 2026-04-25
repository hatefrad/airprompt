# agentreach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single `npx agentreach` CLI command that automates Tailscale + tmux + SSH setup so developers can SSH into their Mac from their phone while AI agents run tasks.

**Architecture:** Sequential steps each implemented as a focused module in `src/steps/`. The entry point `src/index.ts` imports and runs them in order, stopping on first failure. UI helpers (chalk/ora) are centralized in `src/ui.ts`.

**Tech Stack:** TypeScript, tsx, execa, chalk, ora, vitest

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/index.ts` | Orchestrates steps in order, prints final instructions |
| `src/ui.ts` | Shared chalk/ora helpers: `success()`, `fail()`, `info()`, `spinner()` |
| `src/steps/platform.ts` | Check `process.platform === 'darwin'`, exit if not |
| `src/steps/tailscale.ts` | Detect tailscale, install via brew, check running |
| `src/steps/tmux.ts` | Detect tmux, install via brew |
| `src/steps/ssh.ts` | Check + enable Remote Login via `systemsetup` |
| `src/steps/ip.ts` | Run `tailscale ip -4`, return IP string |
| `tests/steps/platform.test.ts` | Unit tests for platform step |
| `tests/steps/tailscale.test.ts` | Unit tests for tailscale step |
| `tests/steps/tmux.test.ts` | Unit tests for tmux step |
| `tests/steps/ssh.test.ts` | Unit tests for ssh step |
| `tests/steps/ip.test.ts` | Unit tests for ip step |

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "agentreach",
  "version": "1.0.0",
  "description": "Set up remote terminal access for AI agent workflows in minutes",
  "type": "module",
  "bin": {
    "agentreach": "./src/index.ts"
  },
  "scripts": {
    "start": "tsx src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "chalk": "^5.3.0",
    "execa": "^8.0.1",
    "ora": "^8.0.1",
    "tsx": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

- [ ] **Step 3: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
  },
})
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
```

- [ ] **Step 5: Install dependencies**

```bash
cd /Users/hatef/Sites/agentreach
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/hatef/Sites/agentreach
git add package.json tsconfig.json vitest.config.ts .gitignore package-lock.json
git commit -m "chore: project scaffold"
```

---

## Task 2: UI helpers

**Files:**
- Create: `src/ui.ts`

- [ ] **Step 1: Create src/ui.ts**

```typescript
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
  console.log(line + '\n')
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/hatef/Sites/agentreach
git add src/ui.ts
git commit -m "feat: add ui helpers"
```

---

## Task 3: Platform step

**Files:**
- Create: `src/steps/platform.ts`
- Create: `tests/steps/platform.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/steps/platform.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// We mock process.platform by overriding the property
describe('checkPlatform', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('resolves on darwin', async () => {
    vi.stubGlobal('process', { ...process, platform: 'darwin' })
    const { checkPlatform } = await import('../../src/steps/platform.js')
    await expect(checkPlatform()).resolves.toBeUndefined()
  })

  it('rejects on non-darwin', async () => {
    vi.stubGlobal('process', { ...process, platform: 'linux' })
    const { checkPlatform } = await import('../../src/steps/platform.js')
    await expect(checkPlatform()).rejects.toThrow('macOS only')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/hatef/Sites/agentreach
npm test -- tests/steps/platform.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create src/steps/platform.ts**

```typescript
import { fail } from '../ui.js'

export async function checkPlatform(): Promise<void> {
  if (process.platform !== 'darwin') {
    fail('agentreach currently supports macOS only.')
    throw new Error('macOS only')
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/hatef/Sites/agentreach
npm test -- tests/steps/platform.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/hatef/Sites/agentreach
git add src/steps/platform.ts tests/steps/platform.test.ts
git commit -m "feat: add platform check step"
```

---

## Task 4: tmux step

**Files:**
- Create: `src/steps/tmux.ts`
- Create: `tests/steps/tmux.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/steps/tmux.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('execa', () => ({
  execa: vi.fn(),
}))

vi.mock('../../src/ui.js', () => ({
  success: vi.fn(),
  info: vi.fn(),
  spinner: vi.fn(() => ({ succeed: vi.fn(), fail: vi.fn() })),
}))

describe('checkTmux', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('resolves when tmux is already installed', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa).mockResolvedValueOnce({ stdout: '/usr/local/bin/tmux' } as any)

    const { checkTmux } = await import('../../src/steps/tmux.js')
    await expect(checkTmux()).resolves.toBeUndefined()
    expect(execa).toHaveBeenCalledWith('which', ['tmux'])
  })

  it('installs tmux via brew when missing', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockRejectedValueOnce(new Error('not found')) // which tmux fails
      .mockResolvedValueOnce({} as any)              // which brew succeeds
      .mockResolvedValueOnce({} as any)              // brew install succeeds

    const { checkTmux } = await import('../../src/steps/tmux.js')
    await expect(checkTmux()).resolves.toBeUndefined()
    expect(execa).toHaveBeenCalledWith('brew', ['install', 'tmux'])
  })

  it('rejects when brew itself is not installed', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockRejectedValueOnce(new Error('not found'))  // which tmux
      .mockRejectedValueOnce(new Error('not found'))  // which brew

    const { checkTmux } = await import('../../src/steps/tmux.js')
    await expect(checkTmux()).rejects.toThrow('brew not found')
  })

  it('rejects when brew install fails', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockRejectedValueOnce(new Error('not found'))         // which tmux
      .mockResolvedValueOnce({} as any)                      // which brew succeeds
      .mockRejectedValueOnce(new Error('brew unavailable'))  // brew install

    const { checkTmux } = await import('../../src/steps/tmux.js')
    await expect(checkTmux()).rejects.toThrow('brew unavailable')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/hatef/Sites/agentreach
npm test -- tests/steps/tmux.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create src/steps/tmux.ts**

```typescript
import { execa } from 'execa'
import { success, info, fail, spinner } from '../ui.js'

export async function checkTmux(): Promise<void> {
  try {
    await execa('which', ['tmux'])
    success('tmux installed')
    return
  } catch {
    info('tmux not found — installing via Homebrew...')
  }

  // Check brew is available
  try {
    await execa('which', ['brew'])
  } catch {
    fail('Homebrew not found. Install it from https://brew.sh then re-run agentreach.')
    throw new Error('brew not found')
  }

  const spin = spinner('Installing tmux...')
  try {
    await execa('brew', ['install', 'tmux'])
    spin.succeed('tmux installed')
  } catch (err) {
    spin.fail('Failed to install tmux')
    throw err
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/hatef/Sites/agentreach
npm test -- tests/steps/tmux.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/hatef/Sites/agentreach
git add src/steps/tmux.ts tests/steps/tmux.test.ts
git commit -m "feat: add tmux check/install step"
```

---

## Task 5: SSH step

**Files:**
- Create: `src/steps/ssh.ts`
- Create: `tests/steps/ssh.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/steps/ssh.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('execa', () => ({
  execa: vi.fn(),
}))

vi.mock('../../src/ui.js', () => ({
  success: vi.fn(),
  info: vi.fn(),
  fail: vi.fn(),
  spinner: vi.fn(() => ({ succeed: vi.fn(), fail: vi.fn() })),
}))

describe('checkSSH', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('resolves when remote login is already on', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa).mockResolvedValueOnce({ stdout: 'Remote Login: On' } as any)

    const { checkSSH } = await import('../../src/steps/ssh.js')
    await expect(checkSSH()).resolves.toBeUndefined()
    expect(execa).toHaveBeenCalledWith('sudo', ['systemsetup', '-getremotelogin'])
  })

  it('enables SSH when remote login is off', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockResolvedValueOnce({ stdout: 'Remote Login: Off' } as any) // getremotelogin
      .mockResolvedValueOnce({} as any)                               // setremotelogin on

    const { checkSSH } = await import('../../src/steps/ssh.js')
    await expect(checkSSH()).resolves.toBeUndefined()
    expect(execa).toHaveBeenCalledWith('sudo', ['systemsetup', '-setremotelogin', 'on'])
  })

  it('rejects when enabling SSH fails', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockResolvedValueOnce({ stdout: 'Remote Login: Off' } as any)
      .mockRejectedValueOnce(new Error('permission denied'))

    const { checkSSH } = await import('../../src/steps/ssh.js')
    await expect(checkSSH()).rejects.toThrow('permission denied')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/hatef/Sites/agentreach
npm test -- tests/steps/ssh.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create src/steps/ssh.ts**

```typescript
import { execa } from 'execa'
import { success, info, fail, spinner } from '../ui.js'

export async function checkSSH(): Promise<void> {
  const { stdout } = await execa('sudo', ['systemsetup', '-getremotelogin'])

  if (stdout.includes('On')) {
    success('SSH (Remote Login) enabled')
    return
  }

  info('SSH is off — enabling Remote Login...')
  const spin = spinner('Enabling SSH...')
  try {
    await execa('sudo', ['systemsetup', '-setremotelogin', 'on'])
    spin.succeed('SSH enabled')
  } catch (err) {
    spin.fail('Failed to enable SSH')
    fail('Run manually: sudo systemsetup -setremotelogin on')
    throw err
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/hatef/Sites/agentreach
npm test -- tests/steps/ssh.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/hatef/Sites/agentreach
git add src/steps/ssh.ts tests/steps/ssh.test.ts
git commit -m "feat: add SSH check/enable step"
```

---

## Task 6: Tailscale step

**Files:**
- Create: `src/steps/tailscale.ts`
- Create: `tests/steps/tailscale.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/steps/tailscale.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('execa', () => ({
  execa: vi.fn(),
}))

vi.mock('readline', () => ({
  createInterface: vi.fn(() => ({
    question: vi.fn((_prompt: string, cb: (ans: string) => void) => cb('')),
    close: vi.fn(),
  })),
}))

vi.mock('../../src/ui.js', () => ({
  success: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  fail: vi.fn(),
  spinner: vi.fn(() => ({ succeed: vi.fn(), fail: vi.fn() })),
}))

describe('checkTailscale', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('resolves when tailscale is installed and running', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockResolvedValueOnce({ stdout: '/usr/local/bin/tailscale' } as any) // which tailscale
      .mockResolvedValueOnce({ stdout: '100.111.33.43' } as any)            // tailscale ip -4

    const { checkTailscale } = await import('../../src/steps/tailscale.js')
    await expect(checkTailscale()).resolves.toBeUndefined()
  })

  it('installs tailscale when missing and waits for user', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockRejectedValueOnce(new Error('not found'))           // which tailscale
      .mockResolvedValueOnce({} as any)                        // brew install --cask tailscale
      .mockResolvedValueOnce({ stdout: '100.1.2.3' } as any)  // tailscale ip -4 after user confirms

    const { checkTailscale } = await import('../../src/steps/tailscale.js')
    await expect(checkTailscale()).resolves.toBeUndefined()
    expect(execa).toHaveBeenCalledWith('brew', ['install', '--cask', 'tailscale'])
  })

  it('rejects when not connected after install (no IP)', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa)
      .mockRejectedValueOnce(new Error('not found'))              // which tailscale
      .mockResolvedValueOnce({} as any)                           // brew install
      .mockRejectedValueOnce(new Error('not logged in'))          // tailscale ip -4

    const { checkTailscale } = await import('../../src/steps/tailscale.js')
    await expect(checkTailscale()).rejects.toThrow('not logged in')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/hatef/Sites/agentreach
npm test -- tests/steps/tailscale.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create src/steps/tailscale.ts**

```typescript
import { execa } from 'execa'
import { createInterface } from 'readline'
import { success, info, warn, fail, spinner } from '../ui.js'

async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function waitForTailscaleConnection(): Promise<void> {
  try {
    await execa('tailscale', ['ip', '-4'])
  } catch (err) {
    fail('Tailscale not connected. Open the Tailscale app and sign in, then re-run agentreach.')
    throw err
  }
}

export async function checkTailscale(): Promise<void> {
  // Check if installed
  try {
    await execa('which', ['tailscale'])
  } catch {
    info('Tailscale not found — installing via Homebrew...')
    const spin = spinner('Installing Tailscale...')
    try {
      await execa('brew', ['install', '--cask', 'tailscale'])
      spin.succeed('Tailscale installed')
    } catch (err) {
      spin.fail('Failed to install Tailscale')
      fail('Install manually: https://tailscale.com/download')
      throw err
    }
    warn('Open the Tailscale app from your Applications folder and sign in.')
    await prompt('Press Enter once you have signed in to Tailscale...')
    await waitForTailscaleConnection()
    success('Tailscale installed and running')
    return
  }

  // Already installed — check if connected
  try {
    await execa('tailscale', ['ip', '-4'])
    success('Tailscale installed and running')
  } catch {
    warn('Tailscale is installed but not connected. Open the Tailscale app and sign in.')
    await prompt('Press Enter once Tailscale is connected...')
    await waitForTailscaleConnection()
    success('Tailscale running')
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/hatef/Sites/agentreach
npm test -- tests/steps/tailscale.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/hatef/Sites/agentreach
git add src/steps/tailscale.ts tests/steps/tailscale.test.ts
git commit -m "feat: add tailscale check/install step"
```

---

## Task 7: IP step

**Files:**
- Create: `src/steps/ip.ts`
- Create: `tests/steps/ip.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/steps/ip.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('execa', () => ({
  execa: vi.fn(),
}))

vi.mock('../../src/ui.js', () => ({
  success: vi.fn(),
  fail: vi.fn(),
}))

describe('getTailscaleIP', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns the IP address', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa).mockResolvedValueOnce({ stdout: '100.111.33.43\n' } as any)

    const { getTailscaleIP } = await import('../../src/steps/ip.js')
    const ip = await getTailscaleIP()
    expect(ip).toBe('100.111.33.43')
  })

  it('rejects when tailscale ip fails', async () => {
    const { execa } = await import('execa')
    vi.mocked(execa).mockRejectedValueOnce(new Error('not connected'))

    const { getTailscaleIP } = await import('../../src/steps/ip.js')
    await expect(getTailscaleIP()).rejects.toThrow('not connected')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/hatef/Sites/agentreach
npm test -- tests/steps/ip.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create src/steps/ip.ts**

```typescript
import { execa } from 'execa'
import { success, fail } from '../ui.js'

export async function getTailscaleIP(): Promise<string> {
  try {
    const { stdout } = await execa('tailscale', ['ip', '-4'])
    const ip = stdout.trim()
    success(`Tailscale IP: ${ip}`)
    return ip
  } catch (err) {
    fail('Could not get Tailscale IP. Is Tailscale connected?')
    throw err
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/hatef/Sites/agentreach
npm test -- tests/steps/ip.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/hatef/Sites/agentreach
git add src/steps/ip.ts tests/steps/ip.test.ts
git commit -m "feat: add tailscale IP step"
```

---

## Task 8: Entry point

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: Create src/index.ts**

```typescript
#!/usr/bin/env tsx

import chalk from 'chalk'
import { checkPlatform } from './steps/platform.js'
import { checkTailscale } from './steps/tailscale.js'
import { checkTmux } from './steps/tmux.js'
import { checkSSH } from './steps/ssh.js'
import { getTailscaleIP } from './steps/ip.js'
import { printInstructions } from './ui.js'

const { version } = JSON.parse(
  await import('fs').then(fs => fs.promises.readFile(new URL('../package.json', import.meta.url), 'utf-8'))
)

console.log(chalk.bold(`\nagentreach v${version}\n`))

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
```

- [ ] **Step 2: Make it executable**

```bash
chmod +x /Users/hatef/Sites/agentreach/src/index.ts
```

- [ ] **Step 3: Test it runs**

```bash
cd /Users/hatef/Sites/agentreach
npm start
```

Expected: Runs all checks, prints your Tailscale IP and Termius instructions.

- [ ] **Step 4: Commit**

```bash
cd /Users/hatef/Sites/agentreach
git add src/index.ts
git commit -m "feat: add entry point, wire up all steps"
```

---

## Task 9: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README.md**

```markdown
# agentreach

Set up remote terminal access for AI agent workflows in minutes.

Run this on your Mac and you'll be able to SSH into your terminal from your phone — so when Claude or another AI agent needs your input, you can respond from anywhere.

## Usage

\`\`\`bash
npx agentreach
\`\`\`

That's it. The CLI will:

1. Check you're on macOS
2. Install and connect Tailscale (if needed)
3. Install tmux (if needed)
4. Enable SSH Remote Login (if needed)
5. Print your Tailscale IP and Termius setup instructions

## What you need on your phone

- [Tailscale](https://tailscale.com/download) — sign in with the same account
- [Termius](https://termius.com) — SSH client, add host with the IP printed by this CLI

## Keeping sessions alive with tmux

\`\`\`bash
# Start a named session
tmux new -s work

# Detach (session keeps running)
Ctrl+B, D

# Reattach from your phone
tmux attach -t work
\`\`\`

## Requirements

- macOS
- [Homebrew](https://brew.sh) (for auto-installing Tailscale and tmux)

## Why

When an AI agent is running a long task and needs confirmation, you shouldn't have to be at your desk. This tool sets up the infrastructure so you can respond from your phone.
```

- [ ] **Step 2: Commit**

```bash
cd /Users/hatef/Sites/agentreach
git add README.md
git commit -m "docs: add README"
```

---

## Task 10: Run full test suite

- [ ] **Step 1: Run all tests**

```bash
cd /Users/hatef/Sites/agentreach
npm test
```

Expected: All tests pass (14 tests across 5 files).

- [ ] **Step 2: Final smoke test**

```bash
cd /Users/hatef/Sites/agentreach
npm start
```

Expected: All steps succeed, prints your IP and Termius instructions.
