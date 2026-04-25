import { describe, expect, it } from 'vitest'

import { parseOptions } from '../src/options.js'

describe('parseOptions', () => {
  it('enables dry-run mode from --dry-run', () => {
    expect(parseOptions(['--dry-run'])).toEqual({ options: { dryRun: true }, unknown: [] })
  })

  it('leaves dry-run mode off by default', () => {
    expect(parseOptions([])).toEqual({ options: { dryRun: false }, unknown: [] })
  })

  it('collects unknown args', () => {
    expect(parseOptions(['--foo', '--dry-run', '--bar'])).toEqual({
      options: { dryRun: true },
      unknown: ['--foo', '--bar'],
    })
  })
})
