import { execa } from 'execa'

type TailscaleStatus = {
  BackendState?: string
  TailscaleIPs?: string[]
  Self?: { DNSName?: string }
}

export type ConnectedTailscale = {
  ipv4: string
  dnsName?: string
}

export async function getConnectedTailscale(): Promise<ConnectedTailscale> {
  const { stdout } = await execa('tailscale', ['status', '--json'])
  const status = JSON.parse(stdout) as TailscaleStatus

  if (status.BackendState !== 'Running') {
    throw new Error(`Tailscale is ${status.BackendState ?? 'not connected'}`)
  }

  const ipv4 = status.TailscaleIPs?.find((ip) => !ip.includes(':'))
  if (!ipv4) {
    throw new Error('Tailscale has no IPv4 address')
  }

  return {
    ipv4,
    dnsName: status.Self?.DNSName?.replace(/\.$/, ''),
  }
}
