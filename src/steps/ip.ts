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
