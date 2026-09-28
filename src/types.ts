export type EntityStatus = 'active' | 'historical' | 'discontinued' | 'acquired' | 'merged'

export type Entity = {
  id: string
  name: string
  category: string
  shortLabel: string
  symbol: string
  founded?: string
  ended?: string
  status: EntityStatus
  description: string
  whyItMattered: string
  activeYears: { start: number; end?: number }
  tags: string[]
  color: string
  region?: string
  sources?: Source[]
  relatedIds?: string[]
  milestones?: HistoricalMilestone[]
  competitors?: string[]
  links?: { website?: string; wikipedia?: string }
}

export type Source = { title: string; url: string }
export type HistoricalMilestone = { year: number; title: string; detail: string; source?: Source }

export type HistoricalEvent = {
  id: string
  year: number
  date: string
  title: string
  description: string
  whyItMattered: string
  entities: string[]
  importance: 'high' | 'medium' | 'low'
  sources: Source[]
  primaryEntityId?: string
}

export type TimelineYear = {
  year: number
  title: string
  description: string
  popularBrowser: string
  majorPlatform: string
  majorTrend: string
  entities: string[]
  events: { date: string; title: string; detail: string }[]
}

export type Era = {
  id: string
  label: string
  range: string
  start: number
  end: number
  description: string
  accent?: string
  majorEntities?: string[]
  majorEvents?: string[]
}
