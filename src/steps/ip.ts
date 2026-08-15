import { success, fail } from '../ui.js'
import { getConnectedTailscale } from './tailscale-status.js'

export async function getTailscaleIP(): Promise<string> {
  try {
    const { ipv4: ip } = await getConnectedTailscale()
    success(`Tailscale IP: ${ip}`)
    return ip
  } catch (err) {
    fail('Could not get Tailscale IP. Is Tailscale connected?')
    throw err
  }
}
