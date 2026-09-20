import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { pathToFileURL } from 'node:url'
import { transformWithOxc } from 'vite'

const root = decodeURIComponent(new URL('..', import.meta.url).pathname).replace(/^\/(\w):/, '$1:')
const temp = join(tmpdir(), `internet-archaeology-runtime-${process.pid}`)
await mkdir(temp, { recursive: true })

try {
  for (const name of ['types.ts', 'extraEntities.ts', 'data.ts']) {
    const source = await readFile(join(root, 'src', name), 'utf8')
    const output = (await transformWithOxc(source, name, { lang: 'ts', target: 'es2020' })).code
      .replaceAll("from './types'", "from './types.mjs'")
      .replaceAll("from './extraEntities'", "from './extraEntities.mjs'")
      .replaceAll('from "./types"', 'from "./types.mjs"')
      .replaceAll('from "./extraEntities"', 'from "./extraEntities.mjs"')
      .replaceAll("from './types'", "from './types.mjs'")
      .replaceAll("from './extraEntities'", "from './extraEntities.mjs'")
    await writeFile(join(temp, name.replace('.ts', '.mjs')), output)
  }

  const { entities, timelineYears, getEntity, getYear } = await import(`${pathToFileURL(join(temp, 'data.mjs')).href}?fresh=${Date.now()}`)
  const failures = []
  for (const node of timelineYears) {
    for (const id of node.entities) {
      const entity = getEntity(id)
      if (!entity) failures.push(`timeline ${node.year} references missing entity ${id}`)
      else if (entity.activeYears?.start > node.year) failures.push(`${id} starts in ${entity.activeYears.start} but appears in ${node.year}`)
    }
  }
  for (let year = 1990; year <= 2026; year += 1) {
    const selected = getYear(year)
    if (selected.year > year) failures.push(`getYear(${year}) returned future node ${selected.year}`)
  }
  if (failures.length) {
    console.error(`runtime data verification failed:\n- ${failures.join('\n- ')}`)
    process.exitCode = 1
  } else {
    console.log(`runtime data verification passed (${entities.length} entities; ${timelineYears.length} timeline nodes).`)
  }
} finally {
  await rm(temp, { recursive: true, force: true })
}
