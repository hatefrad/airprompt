# agentreach

Set up remote terminal access for AI agent workflows in minutes.

Run this on your Mac and you'll be able to SSH into your terminal from your phone — so when Claude or another AI agent needs your input, you can respond from anywhere.

## Usage

```bash
npx agentreach
```

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

```bash
# Start a named session
tmux new -s work

# Detach (session keeps running)
Ctrl+B, D

# Reattach from your phone
tmux attach -t work
```

## Requirements

- macOS
- [Homebrew](https://brew.sh) (for auto-installing Tailscale and tmux)

## Why

When an AI agent is running a long task and needs confirmation, you shouldn't have to be at your desk. This tool sets up the infrastructure so you can respond from your phone.
