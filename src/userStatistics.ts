import type { Source } from './types'

type UserStatistic = {
  en: string
  zh: string
  observationYear: number
  method: 'itu-historical' | 'world-bank-derived' | 'itu-latest' | 'unavailable'
  sources: Source[]
  verifiedOn: string
}

const historical: Source = { title: 'ITU · World telecommunication indicators, 1993–2001', url: 'https://search.itu.int/history/HistoryDigitalCollectionDocLibrary/4.314.51.en.705.pdf' }
const users: Source = { title: 'World Bank / ITU · Individuals using the Internet (%)', url: 'https://data.worldbank.org/indicator/IT.NET.USER.ZS?locations=1W' }
const population: Source = { title: 'World Bank · World population', url: 'https://data.worldbank.org/indicator/SP.POP.TOTL?locations=1W' }
const latest: Source = { title: 'ITU · Facts and Figures 2025', url: 'https://www.itu.int/itu-d/reports/statistics/2025/10/15/ff25-internet-use/' }
const verifiedOn = '2026-09-28'

function historicalEstimate(year: number, en: string, zh: string): UserStatistic {
  return { en, zh, observationYear: year, method: 'itu-historical', sources: [historical], verifiedOn }
}

function derived(year: number, en: string, zh: string): UserStatistic {
  return { en, zh, observationYear: year, method: 'world-bank-derived', sources: [users, population], verifiedOn }
}

export const userStatistics: Record<number, UserStatistic> = {
  1990: { en: 'Not recorded', zh: '未记录', observationYear: 1990, method: 'unavailable', sources: [], verifiedOn },
  1993: historicalEstimate(1993, '≈ 10M', '约 1000 万'),
  1995: historicalEstimate(1995, '≈ 30M', '约 3000 万'),
  1997: historicalEstimate(1997, '≈ 90M', '约 9000 万'),
  1999: historicalEstimate(1999, '≈ 250M', '约 2.5 亿'),
  2001: historicalEstimate(2001, '≈ 510M', '约 5.1 亿'),
  2003: { en: '≈ 739M', zh: '约 7.39 亿', observationYear: 2003, method: 'itu-historical', sources: [{ title: 'ITU · ICT users worldwide, 2003', url: 'https://search.itu.int/history/HistoryDigitalCollectionDocLibrary/4.317.51.m7.702.pdf' }], verifiedOn },
  2005: derived(2005, '≈ 1.03B', '约 10.3 亿'),
  2007: derived(2007, '≈ 1.36B', '约 13.6 亿'),
  2010: derived(2010, '≈ 1.99B', '约 19.9 亿'),
  2012: derived(2012, '≈ 2.39B', '约 23.9 亿'),
  2015: derived(2015, '≈ 2.97B', '约 29.7 亿'),
  2018: derived(2018, '≈ 3.80B', '约 38.0 亿'),
  2020: derived(2020, '≈ 4.72B', '约 47.2 亿'),
  2023: derived(2023, '≈ 5.58B', '约 55.8 亿'),
  2026: { en: '≈ 6.0B (2025)', zh: '约 60 亿（2025）', observationYear: 2025, method: 'itu-latest', sources: [latest], verifiedOn },
}

export function userStatisticNote(statistic: UserStatistic, language: 'zh' | 'en') {
  if (statistic.method === 'unavailable') return language === 'zh' ? '尚无可核验的全球人数记录。' : 'No verified global count is recorded here.'
  if (statistic.method === 'world-bank-derived') return language === 'zh'
    ? `${statistic.observationYear} 年世界互联网使用率 × 同年世界人口，四舍五入；不是独立调查人数。`
    : `${statistic.observationYear} world internet-use percentage × world population, rounded; not a separate headcount survey.`
  if (statistic.method === 'itu-latest') return language === 'zh'
    ? '2026 年策展节点引用 ITU 最新可用的 2025 年全球估算。'
    : 'The 2026 curatorial node uses ITU’s latest available global estimate, for 2025.'
  return language === 'zh'
    ? `${statistic.observationYear} 年 ITU 历史估算；早期资料的定义和调查方法可能与当前不同。`
    : `ITU historical estimate for ${statistic.observationYear}; early definitions and methods may differ from current ones.`
}
