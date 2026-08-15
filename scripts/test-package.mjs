import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const installDir = mkdtempSync(join(tmpdir(), 'airprompt-package-test-'))

try {
  const packResult = JSON.parse(
    execFileSync('npm', ['pack', '--json'], {
      cwd: projectDir,
      encoding: 'utf8',
    }),
  )
  const tarball = join(projectDir, packResult[0].filename)

  execFileSync(
    'npm',
    ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball],
    {
      cwd: installDir,
      stdio: 'inherit',
    },
  )
  execFileSync(
    join(installDir, 'node_modules', '.bin', 'airprompt'),
    ['--help'],
    {
      cwd: installDir,
      stdio: 'inherit',
    },
  )

  rmSync(tarball)
} finally {
  rmSync(installDir, { recursive: true, force: true })
}
