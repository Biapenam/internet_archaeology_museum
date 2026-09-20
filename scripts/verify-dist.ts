import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const dist = join(root, 'dist')
const indexPath = join(dist, 'index.html')

if (!existsSync(indexPath)) throw new Error('dist/index.html is missing; run npm run build first')

const index = readFileSync(indexPath, 'utf8')
const assetsDir = join(dist, 'assets')
const assets = existsSync(assetsDir)
  ? readdirSync(assetsDir).filter((file) => statSync(join(assetsDir, file)).isFile())
  : []

const checks = [
  ['index has a title', /<title>[^<]+<\/title>/.test(index)],
  ['index has a description', /name="description"/.test(index)],
  ['index references a built JavaScript asset', /<script[^>]+src="\.\/assets\/[^"?]+\.js/.test(index)],
  ['index references a built stylesheet', /<link[^>]+href="\.\/assets\/[^"?]+\.css/.test(index)],
  ['assets directory contains JavaScript and CSS', assets.some((file) => file.endsWith('.js')) && assets.some((file) => file.endsWith('.css'))],
  ['favicon is included', existsSync(join(dist, 'favicon.svg'))],
]

const failures = checks.filter(([, passed]) => !passed).map(([label]) => label)
if (failures.length) {
  console.error(`dist verification failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(`dist verification passed (${assets.length} asset files).`)
