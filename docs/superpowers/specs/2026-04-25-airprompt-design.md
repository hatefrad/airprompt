# airprompt — Design Spec

**Date:** 2026-04-25  
**Version:** v1 (macOS only)

## Overview

A single-command CLI (`npx airprompt`) that automates the Tailscale + tmux + SSH setup so developers can access their terminal remotely from their phone while AI agents (Claude, etc.) are running tasks.

## Problem

When an AI agent runs a long task and needs user confirmation, the developer may not be at their machine. There's no simple, automated way to set up remote terminal access targeted at this use case.

## Solution

`npx airprompt` walks through all setup steps automatically, prints the Tailscale IP, and gives copy-paste Termius instructions so the developer can SSH in from their phone within minutes.

## Architecture

Single entry point: `src/index.ts`  
Steps run sequentially. Each step prints a status line (✔ success / ✖ error).

### Steps

1. **Platform check** — exit early with friendly message if not macOS
2. **Tailscale check** — detect via `which tailscale`
   - If missing: `brew install --cask tailscale`, prompt user to open app and sign in, wait for confirmation
   - If installed but not running: prompt user to open the Tailscale app
3. **tmux check** — detect via `which tmux`
   - If missing: `brew install tmux`
4. **SSH check** — run `sudo systemsetup -getremotelogin`
   - If off: `sudo systemsetup -setremotelogin on`
5. **Get Tailscale IP** — `tailscale ip -4`
6. **Print instructions** — Termius setup steps with the IP pre-filled

### Output example

```
airprompt v1.0.0

✔ macOS detected
✔ Tailscale installed and running
✔ tmux installed
✔ SSH enabled
✔ Tailscale IP: 100.111.33.43

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  You're all set!

  From your phone:
  1. Install Tailscale (same account)
  2. Install Termius
  3. Add host: 100.111.33.43
  4. Connect and run: tmux new -s work
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Stack

| Tool | Purpose |
|------|---------|
| TypeScript | Language |
| `tsx` | Run TS directly in development |
| `tsc` | Compile the published CLI runtime |
| `execa` | Shell command execution |
| `chalk` | Colored terminal output |
| `ora` | Spinners for long steps (brew installs) |

## File Structure

```
airprompt/
├── src/
│   ├── index.ts          # Entry point, orchestrates steps
│   ├── steps/
│   │   ├── platform.ts   # Platform check
│   │   ├── tailscale.ts  # Tailscale check/install
│   │   ├── tmux.ts       # tmux check/install
│   │   ├── ssh.ts        # SSH enable
│   │   └── ip.ts         # Get Tailscale IP
│   └── ui.ts             # chalk/ora helpers
├── package.json
├── tsconfig.json
└── README.md
```

## Error Handling

- Each step catches its own errors and prints a clear message
- On failure, print what to do manually and exit with code 1
- Brew not installed: print install URL and exit

## Out of Scope (v1)

- Linux support
- ntfy / push notification hooks
- `airprompt status` / `airprompt session` subcommands
- Windows
