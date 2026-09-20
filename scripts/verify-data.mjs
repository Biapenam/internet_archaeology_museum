import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const data = readFileSync(join(root, 'src', 'data.ts'), 'utf8')
const extra = readFileSync(join(root, 'src', 'extraEntities.ts'), 'utf8')
const copy = readFileSync(join(root, 'src', 'extraEntityCopy.ts'), 'utf8')

const baseIds = [...data.matchAll(/e\(\{ id: '([^']+)'/g)].map((match) => match[1])
const extraIds = [...extra.matchAll(/x\('([^']+)'/g)].map((match) => match[1])
const ids = [...baseIds, ...extraIds]
const failures = []
const addFailure = (message) => failures.push(message)

if (ids.length !== 155) addFailure(`expected 155 catalog entities, found ${ids.length}`)
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index)
if (duplicateIds.length) addFailure(`duplicate catalog IDs: ${[...new Set(duplicateIds)].join(', ')}`)

const years = [...data.matchAll(/founded: '(\d{4})'/g), ...extra.matchAll(/x\('[^']+', '[^']+', '[^']+', (\d{4}),/g)]
  .map((match) => Number(match[1]))
if (years.some((year) => year < 1800 || year > 2026)) addFailure('catalog contains a founding year outside 1800–2026')

const timelineRefs = [...data.matchAll(/entities: \[([^\]]+)\]/g)]
  .flatMap((match) => match[1].split(',').map((id) => id.trim().replaceAll("'", '')).filter(Boolean))
const relationRefs = [...data.matchAll(/(?:relatedIds|competitors): \[([^\]]+)\]/g)]
  .flatMap((match) => match[1].split(',').map((id) => id.trim().replaceAll("'", '')).filter(Boolean))
for (const id of [...timelineRefs, ...relationRefs]) {
  if (!ids.includes(id)) addFailure(`unresolved entity reference: ${id}`)
}

const copyIds = [...copy.matchAll(/^\s*'([^']+)': \{/gm)].map((match) => match[1])
for (const id of extraIds) if (!copyIds.includes(id)) addFailure(`missing Chinese copy for extra entity: ${id}`)
const genericCopyPatterns = [
  '具体历史展品，留下了这一领域的独特技术或文化形态',
  '它帮助我们理解社交网络如何改变人们访问、表达、交流或使用互联网的方式',
  '它帮助我们理解即时通讯如何改变人们访问、表达、交流或使用互联网的方式',
]
for (const phrase of genericCopyPatterns) if (copy.includes(phrase)) addFailure(`generic Chinese copy template remains: ${phrase}`)

if (failures.length) {
  console.error(`data verification failed:\n- ${[...new Set(failures)].join('\n- ')}`)
  process.exit(1)
}

console.log(`data verification passed (${ids.length} unique entities; ${timelineRefs.length} timeline and ${relationRefs.length} relationship references).`)
