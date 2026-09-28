import type { Entity } from './types'
import { localizeEntity, type Language } from './i18n'

const aliases: Record<string, string[]> = {
  wechat: ['微信', '微信聊天'],
  baidu: ['百度', '百度搜索'],
  'baidu-company': ['百度', '百度公司'],
  taobao: ['淘宝', '淘宝网'],
  twitter: ['推特', 'X'],
  youtube: ['油管'],
}

export function searchScore(entity: Entity, query: string, language: Language) {
  const term = query.trim().toLocaleLowerCase()
  if (!term) return 3
  const localized = localizeEntity(entity, language)
  const names = [entity.name, entity.shortLabel, localized.name, ...(aliases[entity.id] ?? [])].map((value) => value.toLocaleLowerCase())
  if (names.some((value) => value === term)) return 0
  if (names.some((value) => value.startsWith(term))) return 1
  return [entity.name, entity.shortLabel, entity.category, entity.description,
    localized.name, localized.category, localized.description, ...entity.tags,
    ...(aliases[entity.id] ?? [])].some((value) => value.toLocaleLowerCase().includes(term)) ? 2 : 4
}

export function matchesEntity(entity: Entity, query: string, language: Language) {
  return !query.trim() || searchScore(entity, query, language) < 4
}
