import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock3,
  ExternalLink,
  FastForward,
  Globe2,
  History,
  Layers3,
  Menu,
  Moon,
  Network,
  Pause,
  Play,
  Search,
  Shuffle,
  Sparkles,
  Sun,
  X,
} from 'lucide-react'
import { entities, eras, getEntity, getEra, getYear, historicalEvents, timelineYears } from './data'
import type { Entity, HistoricalEvent } from './types'
import { matchesEntity, searchScore } from './search'
import { artifactStories } from './artifactStories'
import { userStatistics, userStatisticNote } from './userStatistics'
import { lifecycleEvidence } from './lifecycleEvidence'
import { localizeEntity, localizeEra, localizeYear, statusLabel, ui, type Language } from './i18n'
import { ModalShell } from './components/ModalShell'
import { Timeline } from './components/Timeline'

const MIN_YEAR = 1990
const MAX_YEAR = 2026
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function archiveDate(date: string, language: Language) {
  if (language === 'en') return date
  const match = date.match(/^(\w+)\s+(?:(\d{1,2}),?\s+)?(\d{4})$/)
  if (!match) return date
  const month = monthNames.indexOf(match[1]) + 1
  return month ? `${match[3]}年${month}月${match[2] ? `${match[2]}日` : ''}` : date
}

function sharedYear() {
  const value = new URLSearchParams(window.location.search).get('year')
  if (!value || !/^\d+$/.test(value)) return 1995
  const parsed = Number(value)
  return Number.isInteger(parsed) ? Math.max(MIN_YEAR, Math.min(MAX_YEAR, parsed)) : 1995
}

function sharedCompareYear(key: string, fallback: number) {
  const value = Number(new URLSearchParams(window.location.search).get(key))
  return timelineYears.some((item) => item.year === value) ? value : fallback
}

function sharedCatalogValue(key: string) { return new URLSearchParams(window.location.search).get(key) ?? '' }

function readStorage(key: string, fallback: string) {
  try { return window.localStorage.getItem(key) ?? fallback } catch { return fallback }
}

function readFavorites(): string[] {
  try { const value = JSON.parse(readStorage('museum-favorites', '[]')); return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string' && Boolean(getEntity(id))) : [] } catch { return [] }
}

function initialLanguage(): Language {
  const stored = readStorage('museum-language', '')
  if (stored === 'en' || stored === 'zh') return stored
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}
function sharedEntity(language: Language): Entity | null {
  const id = new URLSearchParams(window.location.search).get('exhibit')
  const entity = id ? getEntity(id) : undefined
  return entity ? localizeEntity(entity, language) : null
}

function App() {
  const [language, setLanguage] = useState<Language>(initialLanguage)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => { const value = readStorage('museum-theme', ''); return value === 'light' || value === 'dark' ? value : (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark') })
  const [mobileNav, setMobileNav] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState(() => sharedCatalogValue('category') || 'All')
  const [regionFilter, setRegionFilter] = useState(() => sharedCatalogValue('region') || 'All')
  const [decadeFilter, setDecadeFilter] = useState(() => sharedCatalogValue('decade') || 'All')
  const [catalogQuery, setCatalogQuery] = useState(() => sharedCatalogValue('catalog'))
  const [catalogLimit, setCatalogLimit] = useState(24)
  const [compareA, setCompareA] = useState(() => sharedCompareYear('compareA', 2005))
  const [compareB, setCompareB] = useState(() => sharedCompareYear('compareB', 2026))
  const [compareCopied, setCompareCopied] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<string[]>(readFavorites)
  const [year, setYear] = useState(sharedYear)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [dockCollapsed, setDockCollapsed] = useState(false)
  const [query, setQuery] = useState('')
  const [mobileSearch, setMobileSearch] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchIndex, setSearchIndex] = useState(0)
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(() => sharedEntity(initialLanguage()))
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(null)
  const [surpriseEntity, setSurpriseEntity] = useState<Entity | null>(null)
  const [showOnThisDay, setShowOnThisDay] = useState(false)
  const rangeRef = useRef<HTMLInputElement>(null)
  const current = getYear(year)
  const era = localizeEra(getEra(year), language)
  const localizedCurrent = localizeYear(current, language)
  const userStatistic = userStatistics[current.year]
  const copy = ui[language]

  const visibleEntities = useMemo(() => {
    return current.entities.map(getEntity).filter((entity): entity is Entity => Boolean(entity)).map((entity) => localizeEntity(entity, language))
  }, [current.entities, language])

  const searchResults = useMemo(() => {
    const clean = query.trim().toLowerCase()
    if (!clean) return []
    return entities.filter((entity) => matchesEntity(entity, clean, language)).sort((a, b) => searchScore(a, clean, language) - searchScore(b, clean, language)).map((entity) => localizeEntity(entity, language))
  }, [query, language])

  useEffect(() => {
    try { window.localStorage.setItem('museum-language', language) } catch { /* private browsing */ }
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
  }, [language])

  useEffect(() => {
    try { window.localStorage.setItem('museum-theme', theme) } catch { /* private browsing */ }
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => { try { window.localStorage.setItem('museum-favorites', JSON.stringify(favoriteIds)) } catch { /* private browsing */ } }, [favoriteIds])

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setYear((value) => {
        const next = timelineYears.find((item) => item.year > value)
        if (!next) {
          setPlaying(false)
          return MAX_YEAR
        }
        return next.year
      })
    }, 4000 / speed)
    return () => window.clearInterval(timer)
  }, [playing, speed])

  useEffect(() => {
    const onPop = () => {
      setYear(sharedYear())
      setCompareA(sharedCompareYear('compareA', 2005))
      setCompareB(sharedCompareYear('compareB', 2026))
      setCategoryFilter(sharedCatalogValue('category') || 'All')
      setRegionFilter(sharedCatalogValue('region') || 'All')
      setDecadeFilter(sharedCatalogValue('decade') || 'All')
      setCatalogQuery(sharedCatalogValue('catalog'))
      const id = new URLSearchParams(window.location.search).get('exhibit')
      setSelectedEntity(id && getEntity(id) ? localizeEntity(getEntity(id)!, language) : null)
      setSelectedEvent(null)
    }
    window.addEventListener('popstate', onPop)
    const id = new URLSearchParams(window.location.search).get('exhibit')
    if (id && getEntity(id)) setSelectedEntity(localizeEntity(getEntity(id)!, language))
    return () => window.removeEventListener('popstate', onPop)
  }, [language])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.set('year', String(year))
    window.history.replaceState(window.history.state, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`)
  }, [year])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.set('compareA', String(compareA))
    params.set('compareB', String(compareB))
    window.history.replaceState(window.history.state, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`)
    setCompareCopied(false)
  }, [compareA, compareB])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    for (const [key, value] of [['category', categoryFilter === 'All' ? '' : categoryFilter], ['region', regionFilter === 'All' ? '' : regionFilter], ['decade', decadeFilter === 'All' ? '' : decadeFilter], ['catalog', catalogQuery.trim()]]) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    window.history.replaceState(window.history.state, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`)
  }, [categoryFilter, regionFilter, decadeFilter, catalogQuery])

  useEffect(() => { if (selectedEntity || selectedEvent || surpriseEntity || showOnThisDay) setPlaying(false) }, [selectedEntity, selectedEvent, surpriseEntity, showOnThisDay])

  useEffect(() => {
    if (selectedEntity) {
      const currentEntity = getEntity(selectedEntity.id)
      if (currentEntity) setSelectedEntity(localizeEntity(currentEntity, language))
    }
  }, [language])

  useEffect(() => {
    document.title = selectedEntity ? `${selectedEntity.name} · Internet Archaeology Museum` : language === 'zh' ? '互联网考古博物馆' : 'Internet Archaeology Museum'
  }, [selectedEntity, language])

  useEffect(() => {
    const input = rangeRef.current
    if (!input) return
    const percentage = ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100
    input.style.setProperty('--range-progress', `${percentage}%`)
  }, [year])

  const goTo = (nextYear: number) => { setPlaying(false); setYear(Math.max(MIN_YEAR, Math.min(MAX_YEAR, Math.round(nextYear)))) }
  const enterRoom = (nextYear: number) => {
    goTo(nextYear)
    window.requestAnimationFrame(() => {
      document.getElementById('timeline')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      document.getElementById('hero-title')?.focus({ preventScroll: true })
    })
  }
  const openEntity = (entity: Entity) => {
    const params = new URLSearchParams(window.location.search)
    params.set('exhibit', entity.id)
    window.history.pushState({ museumExhibit: true }, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`)
    setSelectedEvent(null)
    setSelectedEntity(entity)
    setSearchOpen(false)
  }
  const closeEntity = () => {
    if (window.history.state?.museumExhibit) { window.history.back(); return }
    const params = new URLSearchParams(window.location.search)
    params.delete('exhibit')
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`)
    setSelectedEntity(null)
  }
  const toggleFavorite = (id: string) => setFavoriteIds((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])

  const surprise = () => {
    const pool = entities
    const choice = pool[Math.floor(Math.random() * pool.length)]
    setSurpriseEntity(localizeEntity(choice, language))
  }
  const surpriseCurrent = () => {
    const choice = visibleEntities[Math.floor(Math.random() * visibleEntities.length)]
    if (choice) setSurpriseEntity(choice)
  }

  const categories = ['All', ...Array.from(new Set(entities.map((entity) => entity.category)))]
  const regions = ['All', ...Array.from(new Set(entities.map((entity) => entity.region ?? 'Unknown'))).sort()]
  const decades = ['All', ...Array.from(new Set(entities.map((entity) => `${Math.floor(entity.activeYears.start / 10) * 10}s`))).sort()]
  const catalogEntities = useMemo(() => {
    const scoped = entities.filter((entity) => (categoryFilter === 'All' || entity.category === categoryFilter) && (regionFilter === 'All' || (entity.region ?? 'Unknown') === regionFilter) && (decadeFilter === 'All' || `${Math.floor(entity.activeYears.start / 10) * 10}s` === decadeFilter))
    return scoped.map((entity) => localizeEntity(entity, language))
  }, [categoryFilter, regionFilter, decadeFilter, language])
  const catalogMatches = useMemo(() => {
    const clean = catalogQuery.trim().toLowerCase()
    return catalogEntities.filter((entity) => !clean || matchesEntity(entities.find((item) => item.id === entity.id) ?? entity, clean, language))
  }, [catalogEntities, catalogQuery, language])
  const filteredEntities = visibleEntities
  const stackEntry = (category: string, fallback: string) => {
    const entity = entities.filter((item) => item.category === category && item.activeYears.start <= year && (!item.activeYears.end || item.activeYears.end >= year)).sort((a, b) => b.activeYears.start - a.activeYears.start)[0]
    return { value: entity ? localizeEntity(entity, language).name : fallback, reason: entity ? (language === 'zh' ? `本馆记录中此类最近开始展示的条目（${entity.activeYears.start} 年起）` : `Most recently started catalog entry in this category (from ${entity.activeYears.start})`) : (language === 'zh' ? '此年份暂无符合条件的馆藏记录' : 'No eligible catalog entry for this year') }
  }
  const stackItems = [
    { label: language === 'zh' ? '硬件' : 'Hardware', icon: '▯', ...stackEntry('Hardware', language === 'zh' ? '尚未记录' : 'Not recorded yet') },
    { label: language === 'zh' ? '操作系统' : 'Operating system', icon: '⊞', ...stackEntry('Operating System', language === 'zh' ? '尚未记录' : 'Not recorded yet') },
    { label: language === 'zh' ? '浏览器' : 'Browser', icon: '◌', ...stackEntry('Browser', language === 'zh' ? '尚未收录' : 'Not yet catalogued') },
    { label: language === 'zh' ? '搜索' : 'Search', icon: '⌕', ...stackEntry('Search Engine', language === 'zh' ? '尚未收录' : 'Not yet catalogued') },
    { label: language === 'zh' ? '沟通' : 'Communication', icon: '#', ...stackEntry('Messaging', language === 'zh' ? '尚未记录' : 'Not recorded yet') },
    { label: language === 'zh' ? '社交' : 'Social', icon: '✦', ...stackEntry('Social Network', language === 'zh' ? '尚未记录' : 'Not recorded yet') },
    { label: language === 'zh' ? '娱乐' : 'Entertainment', icon: '▶', ...stackEntry('Video', language === 'zh' ? '尚未记录' : 'Not recorded yet') },
    { label: 'AI', icon: '✺', ...stackEntry('AI', language === 'zh' ? '尚未收录' : 'Not yet catalogued') },
  ]

  return (
    <div className={`museum-app era-${era.id} ${year === 1999 ? 'y2k-mode' : ''}`}>
      <a className="skip-link" href="#timeline">{language === 'zh' ? '跳到时间轴' : 'Skip to timeline'}</a>
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true"><History size={19} strokeWidth={1.8} /></span>
          <div>
            <div className="brand-name">Internet Archaeology</div>
            <div className="brand-subtitle">{copy.brandSubtitle}</div>
          </div>
        </div>
        <nav id="main-navigation" className={`main-nav ${mobileNav ? 'open' : ''}`} aria-label={copy.explore}>
          <a href="#timeline" onClick={() => setMobileNav(false)}>{copy.timeline}</a>
          <a href="#categories" onClick={() => setMobileNav(false)}>{copy.categories}</a>
          <a href="#favorites" onClick={() => setMobileNav(false)}>{language === 'zh' ? '收藏' : 'Saved'}</a>
          <a href="#events" onClick={() => setMobileNav(false)}>{language === 'zh' ? '事件' : 'Events'}</a>
          <a href="#rooms" onClick={() => setMobileNav(false)}>{copy.rooms}</a>
          <a href="#compare" onClick={() => setMobileNav(false)}>{language === 'zh' ? '比较' : 'Compare'}</a>
          <a href="#about" onClick={() => setMobileNav(false)}>{copy.about}</a>
        </nav>
        <div className="top-actions">
          <button className="text-button" onClick={() => setShowOnThisDay(true)}><CalendarDays size={15} /> {copy.onThisDay}</button>
          <button className="text-button" onClick={surprise} aria-label={language === 'zh' ? '全馆随机展品' : 'Random artifact from the whole museum'}><Shuffle size={15} /> {language === 'zh' ? '全馆随机' : 'Random museum artifact'}</button>
          <button className="language-toggle" onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} aria-label={copy.languageLabel}>{copy.language}</button>
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? (language === 'zh' ? '切换到浅色模式' : 'Switch to light mode') : (language === 'zh' ? '切换到深色模式' : 'Switch to dark mode')}>{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</button>
          <button className="mobile-menu" onClick={() => setMobileNav((value) => !value)} aria-label={copy.explore} aria-expanded={mobileNav} aria-controls="main-navigation"><Menu size={18} /></button>
          <div className={`search-wrap ${mobileSearch || query ? 'search-open' : ''}`}>
            <button className="search-toggle" onClick={() => { setMobileSearch((value) => !value); setSearchOpen((value) => !value) }} aria-label={copy.searchLabel} aria-expanded={searchOpen} aria-controls="museum-search-results"><Search size={16} aria-hidden="true" /></button>
            <input value={query} onFocus={() => setSearchOpen(true)} onChange={(event) => { setQuery(event.target.value); setSearchIndex(0); setSearchOpen(true) }} onKeyDown={(event) => {
              if (event.key === 'ArrowDown') { event.preventDefault(); setSearchIndex((value) => Math.min(value + 1, Math.min(searchResults.length, 6) - 1)) }
              if (event.key === 'ArrowUp') { event.preventDefault(); setSearchIndex((value) => Math.max(0, value - 1)) }
              if (event.key === 'Enter' && searchResults.length) { event.preventDefault(); openEntity(searchResults[searchIndex] ?? searchResults[0]); setQuery('') }
              if (event.key === 'Escape') { event.stopPropagation(); setSearchOpen(false) }
            }} placeholder={copy.searchPlaceholder} aria-label={copy.searchLabel} role="combobox" aria-expanded={Boolean(searchOpen && query.trim())} aria-controls="museum-search-results" aria-activedescendant={searchOpen && searchResults.length ? `search-option-${searchResults[searchIndex]?.id ?? searchResults[0].id}` : undefined} tabIndex={mobileSearch || query ? 0 : undefined} />
            {query && <button className="clear-search" onClick={() => { setQuery(''); setSearchOpen(false) }} aria-label={language === 'zh' ? '清空搜索' : 'Clear search'}><X size={14} /></button>}
            {searchOpen && query.trim() && searchResults.length > 0 && (
              <div className="search-results" id="museum-search-results" role="listbox" aria-label={language === 'zh' ? '全馆搜索结果' : 'Museum search results'}>
                <div className="search-result-count">{language === 'zh' ? `全馆找到 ${searchResults.length} 件展品` : `${searchResults.length} artifacts in the museum`}</div>
                {searchResults.slice(0, 6).map((entity, index) => (
                  <button key={entity.id} id={`search-option-${entity.id}`} role="option" aria-selected={index === searchIndex} className="search-result" onClick={() => { openEntity(entity); setQuery('') }}>
                    <span className="mini-symbol" style={{ color: entity.color }}>{entity.symbol}</span>
                    <span><strong>{entity.name}</strong><small>{entity.category} · {entity.activeYears.start}–{entity.activeYears.end ?? copy.now}</small></span>
                    <ArrowRight size={14} />
                  </button>
                ))}
                {searchResults.length > 6 && <button className="search-all" onClick={() => { setCategoryFilter('All'); setRegionFilter('All'); setDecadeFilter('All'); setCatalogQuery(query.trim()); setCatalogLimit(24); setQuery(''); setSearchOpen(false); document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' }) }}>{language === 'zh' ? `查看全部 ${searchResults.length} 条` : `View all ${searchResults.length} results`}</button>}
              </div>
            )}
            {searchOpen && query.trim() && searchResults.length === 0 && <div className="search-404" id="museum-search-results" role="status"><strong>{query.trim() === '404' ? '404 / ' : ''}{copy.exhibitNotFound}</strong><small>{copy.trySearch}</small><div className="search-empty-actions"><button onClick={() => { setQuery(''); setSearchOpen(false) }}>{language === 'zh' ? '清空搜索' : 'Clear search'}</button><a href="#categories" onClick={() => { setSearchOpen(false); setQuery('') }}>{language === 'zh' ? '浏览全部展品' : 'Browse all artifacts'}</a></div><small>{language === 'zh' ? '试试：微信、浏览器、YouTube' : 'Try: WeChat, browser, YouTube'}</small></div>}
          </div>
        </div>
      </header>

      <main>
        <section className="museum-entrance" aria-labelledby="entrance-title">
          <div className="entrance-gridline" aria-hidden="true" />
          <div className="entrance-copy">
            <div className="hero-kicker"><span className="status-dot" /> {language === 'zh' ? '独立数字档案馆' : 'Independent digital archive'}</div>
            <h1 id="entrance-title">{language === 'zh' ? <>互联网<br /><em>考古</em><br />博物馆</> : <>Internet<br /><em>Archaeology</em><br />Museum</>}</h1>
            <p>{language === 'zh' ? '像走进博物馆一样，探索互联网的历史。' : 'Explore the history of the internet.'}</p>
            <div className="entrance-actions"><a className="enter-button" href="#timeline"><BookOpen size={16} /> {copy.enterMuseum} <ArrowRight size={16} /></a><a className="secondary-button" href="#categories">{language === 'zh' ? `探索全馆 · ${entities.length} 件` : `Explore all · ${entities.length} artifacts`}</a></div>
            <button className="entrance-sample" onClick={() => openEntity(localizeEntity(getEntity('win95')!, language))}>{language === 'zh' ? '从一件熟悉的展品开始：Windows 95' : 'Start with a familiar artifact: Windows 95'} <ArrowRight size={14} /></button>
          </div>
          <div className="entrance-mark" aria-hidden="true"><span>1990</span><div className="mark-orbit orbit-one" /><div className="mark-orbit orbit-two" /><strong>→</strong><span>2026</span></div>
        </section>
        <section className="hero-section" id="timeline" aria-labelledby="hero-title">
          <div className="hero-kicker"><span className="status-dot" /> {copy.liveArchive} / {era.label}</div>
          <div className="hero-heading-row">
            <div>
              <div className="year-label">{copy.internetIn}</div>
            <h2 id="hero-title" className="hero-year" key={year} aria-live="polite" tabIndex={-1}>{year}</h2>
            {current.year !== year && <p className="archive-disclaimer">{language === 'zh' ? `${year} 年未单独建档，以下参考最近的 ${current.year} 年档案。` : `No separate ${year} archive; showing the nearest earlier archive from ${current.year}.`}</p>}
            </div>
            <div className="hero-note" key={current.year}><span className="eyebrow">{era.range}</span><span>{localizedCurrent.title}</span><p>{localizedCurrent.description}</p><a href="#rooms">{language === 'zh' ? '返回展厅目录' : 'Back to room directory'} →</a></div>
          </div>
          <Timeline year={year} setYear={goTo} rangeRef={rangeRef} goTo={goTo} copy={copy} />
        </section>

        <section className="era-strip" aria-label={copy.eras}>
          <div className="section-eyebrow">{copy.walkThrough}</div>
          <div className="era-list">
            {eras.map((item) => (
              <button key={item.id} className={`era-chip ${item.id === era.id ? 'active' : ''}`} aria-pressed={item.id === era.id} onClick={() => enterRoom(item.start)}>
                <span>{item.range}</span><strong>{localizeEra(item, language).label}</strong>
              </button>
            ))}
          </div>
        </section>

        <section className="snapshot-section" aria-labelledby="snapshot-heading">
          <div className="section-header"><div><div className="section-eyebrow">{copy.snapshot} · {language === 'zh' ? `基于 ${current.year} 年档案` : `Based on the ${current.year} archive`}</div><h2 id="snapshot-heading">{copy.whatWebFelt}</h2></div><div className="keyboard-hint"><kbd>←</kbd><kbd>→</kbd> {copy.timelineKeyboard}</div></div>
          <div className="stats-grid" key={current.year}>
            <Stat label={copy.estimatedUsers} value={userStatistic[language]} />
            <Stat label={copy.popularBrowser} value={localizedCurrent.popularBrowser} />
            <Stat label={copy.majorPlatform} value={localizedCurrent.majorPlatform} />
            <Stat label={copy.majorTrend} value={localizedCurrent.majorTrend} />
          </div>
          <p className="section-note">{userStatisticNote(userStatistic, language)} {userStatistic.sources.map((source, index) => <span key={source.url}>{index > 0 && ' · '}<a href={source.url} target="_blank" rel="noreferrer">{source.title} <ExternalLink size={11} /></a></span>)} {language === 'zh' ? `核验：${userStatistic.verifiedOn}。其余馆藏概况为策展概括。` : `Verified: ${userStatistic.verifiedOn}. Other snapshot labels are curatorial summaries.`}</p>
        </section>

        <section className="exhibits-section" aria-labelledby="exhibits-heading">
          <div className="section-header exhibits-header"><div><div className="section-eyebrow">{copy.exhibits} / {filteredEntities.length.toString().padStart(2, '0')}</div><h2 id="exhibits-heading">{copy.artifactsFrom} {current.year}{current.year !== year && (language === 'zh' ? `（供 ${year} 年参考）` : ` (reference for ${year})`)}</h2></div><button className="section-random" onClick={surpriseCurrent}><Shuffle size={14} /> {language === 'zh' ? '当前档案随机' : 'Random from this archive'}</button></div>
          <div className="exhibits-grid" key={`${current.year}-${categoryFilter}`}>
            {filteredEntities.map((entity, index) => <EntityCard key={entity.id} entity={entity} index={index} onClick={() => openEntity(entity)} language={language} />)}
          </div>
        </section>

        <section className="event-section" aria-labelledby="event-heading">
          <div className="event-intro"><div className="section-eyebrow">{copy.fromLogbook}</div><h2 id="event-heading">{copy.moment}</h2><p>{copy.logbookIntro}</p></div>
          <div className="event-card" key={current.year}><div className="event-date"><Clock3 size={15} /> {archiveDate(localizedCurrent.events[0]?.date ?? '', language)}</div><h3>{localizedCurrent.events[0]?.title}</h3><p>{localizedCurrent.events[0]?.detail}</p><span className="event-index">{String(timelineYears.findIndex((item) => item.year === current.year) + 1).padStart(2, '0')} / {timelineYears.length}</span></div>
        </section>
        <EventsSection events={historicalEvents} language={language} copy={copy} year={year} onOpen={setSelectedEvent} />

        <CategorySection categories={categories} categoryFilter={categoryFilter} setCategoryFilter={(value) => { setCategoryFilter(value); setCatalogLimit(24) }} regions={regions} regionFilter={regionFilter} setRegionFilter={(value) => { setRegionFilter(value); setCatalogLimit(24) }} decades={decades} decadeFilter={decadeFilter} setDecadeFilter={(value) => { setDecadeFilter(value); setCatalogLimit(24) }} language={language} copy={copy} entities={catalogMatches} totalEntities={entities} catalogQuery={catalogQuery} setCatalogQuery={setCatalogQuery} catalogLimit={catalogLimit} setCatalogLimit={setCatalogLimit} onOpen={openEntity} />
        <section className="favorites-section" id="favorites" aria-labelledby="favorites-heading"><div className="section-header"><div><div className="section-eyebrow">{language === 'zh' ? '复访' : 'Return visits'}</div><h2 id="favorites-heading">{language === 'zh' ? '我的收藏' : 'Saved artifacts'}</h2></div><span className="section-aside">{favoriteIds.length} {language === 'zh' ? '件展品，仅保存在此浏览器' : 'saved in this browser'}</span></div>{favoriteIds.length ? <div className="catalog-grid">{favoriteIds.map(getEntity).filter((item): item is Entity => Boolean(item)).map((item, index) => <EntityCard key={item.id} entity={localizeEntity(item, language)} index={index} language={language} onClick={() => openEntity(localizeEntity(item, language))} />)}</div> : <p className="catalog-empty">{language === 'zh' ? '打开展品详情后，可收藏喜欢的展品，稍后从这里继续浏览。' : 'Save an artifact from its detail page to revisit it here.'}</p>}</section>
        <RoomsSection language={language} copy={copy} goTo={enterRoom} />
        <GraphSection entities={visibleEntities} current={localizedCurrent} onOpen={openEntity} language={language} copy={copy} />
        <CompareSection compareA={compareA} compareB={compareB} setCompareA={setCompareA} setCompareB={setCompareB} language={language} copy={copy} />
        <button className="compare-share" onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); setCompareCopied(true) } catch { setCompareCopied(false) } }}>{compareCopied ? (language === 'zh' ? '比较链接已复制' : 'Comparison link copied') : (language === 'zh' ? '复制当前比较链接' : 'Copy this comparison link')}</button>
        <StackSection items={stackItems} copy={copy} />
        <AboutSection language={language} copy={copy} />
      </main>

      <footer className="footer"><span>Internet Archaeology Museum</span><span>{copy.staticArchive}</span><span>MIT License</span></footer>

      {dockCollapsed ? <button className="dock-restore" onClick={() => setDockCollapsed(false)}>{language === 'zh' ? '展开时间轴播放' : 'Show timeline playback'} <Play size={15} /></button> : <div className="play-dock" aria-label={language === 'zh' ? '时间轴播放控制' : 'Timeline playback controls'}>
        <button className="dock-play" onClick={() => { if (!playing && year >= MAX_YEAR) setYear(MIN_YEAR); setPlaying((value) => !value) }} aria-label={playing ? (language === 'zh' ? '暂停时间轴' : 'Pause timeline') : (language === 'zh' ? '播放时间轴' : 'Play timeline')}>{playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button>
        <div className="dock-copy"><span>{playing ? copy.travelling : copy.playArchive} · {language === 'zh' ? '逐档案节点' : 'Archive nodes'}</span><strong>{year} <span>→</span> {MAX_YEAR}</strong></div>
        <div className="speed-picker" role="group" aria-label={language === 'zh' ? '播放速度' : 'Playback speed'}>
          {[0.5, 1, 2, 5].map((item) => <button key={item} onClick={() => setSpeed(item)} className={speed === item ? 'active' : ''} aria-pressed={speed === item}>{item}×</button>)}
        </div>
        <FastForward size={16} className="dock-icon" />
        <button className="dock-minimize" onClick={() => { setPlaying(false); setDockCollapsed(true) }} aria-label={language === 'zh' ? '收起播放条' : 'Collapse playback controls'}><X size={16} /></button>
      </div>}

      {(selectedEntity || selectedEvent || surpriseEntity || showOnThisDay) && (
        <ModalShell label={selectedEntity?.name ?? (selectedEvent ? (language === 'zh' ? localizeYear(getYear(selectedEvent.year), language).events[0]?.title : selectedEvent.title) : showOnThisDay ? copy.onThisDayTitle : copy.discovered) ?? copy.discovered} onDismiss={() => { if (selectedEntity) closeEntity(); setSelectedEvent(null); setSurpriseEntity(null); setShowOnThisDay(false) }}>
          {selectedEntity && <EntityDetail key={selectedEntity.id} entity={selectedEntity} onClose={closeEntity} onRelated={openEntity} copy={copy} language={language} favorite={favoriteIds.includes(selectedEntity.id)} onToggleFavorite={() => toggleFavorite(selectedEntity.id)} />}
          {selectedEvent && <EventDetail event={selectedEvent} language={language} onClose={() => setSelectedEvent(null)} onEntity={openEntity} />}
          {surpriseEntity && <SurpriseDetail entity={surpriseEntity} onClose={() => setSurpriseEntity(null)} onOpen={() => { openEntity(surpriseEntity); setSurpriseEntity(null) }} copy={copy} />}
          {showOnThisDay && <OnThisDay onClose={() => setShowOnThisDay(false)} copy={copy} language={language} />}
        </ModalShell>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="stat"><span>{label}</span><strong>{value}</strong></div> }

function CategorySection({ categories, categoryFilter, setCategoryFilter, regions, regionFilter, setRegionFilter, decades, decadeFilter, setDecadeFilter, language, copy, entities: catalog, totalEntities, catalogQuery, setCatalogQuery, catalogLimit, setCatalogLimit, onOpen }: { categories: string[]; categoryFilter: string; setCategoryFilter: (value: string) => void; regions: string[]; regionFilter: string; setRegionFilter: (value: string) => void; decades: string[]; decadeFilter: string; setDecadeFilter: (value: string) => void; language: Language; copy: typeof ui.en; entities: Entity[]; totalEntities: Entity[]; catalogQuery: string; setCatalogQuery: (value: string) => void; catalogLimit: number; setCatalogLimit: (value: number) => void; onOpen: (entity: Entity) => void }) {
  const allCount = totalEntities.length
  const shown = catalog.slice(0, catalogLimit)
  return <section className="category-section" id="categories" aria-labelledby="categories-heading">
    <div className="section-header"><div><div className="section-eyebrow">{copy.explore}</div><h2 id="categories-heading">{copy.categories}</h2></div><span className="section-aside">{copy.categoryHint}</span></div>
    <div className="category-grid">{categories.map((category, index) => {
      const sample = category === 'All' ? null : totalEntities.find((entity) => entity.category === category)
      const label = category === 'All' ? copy.all : sample ? localizeEntity(sample, language).category : category
      const count = category === 'All' ? allCount : totalEntities.filter((entity) => entity.category === category).length
      return <button key={category} className={`category-tile ${categoryFilter === category ? 'active' : ''}`} aria-pressed={categoryFilter === category} onClick={() => setCategoryFilter(category === categoryFilter ? 'All' : category)}><span className="category-tile-index">{String(index + 1).padStart(2, '0')}</span><span className="category-tile-icon">{['◌', '⌕', '✦', '#', '▶', '⊞', '▯', '⌘', '✺', '◎', '●'][index % 11]}</span><strong>{label}</strong><small>{count} {language === 'zh' ? '件展品' : count === 1 ? 'artifact' : 'artifacts'}</small></button>
    })}</div>
    <div className="catalog-heading"><span className="section-eyebrow">{language === 'zh' ? '目录筛选' : 'Catalog filters'} / {catalog.length}</span><label className="catalog-search"><Search size={14} /><input value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} placeholder={language === 'zh' ? '筛选当前目录' : 'Filter the current catalog'} aria-label={language === 'zh' ? '筛选当前目录' : 'Filter the current catalog'} /></label></div>
    <div className="catalog-filters"><label>{language === 'zh' ? '地区标签' : 'Catalog region'} <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)}>{regions.map((region) => <option key={region} value={region}>{region === 'All' ? (language === 'zh' ? '全部地区' : 'All regions') : region === 'Unknown' ? (language === 'zh' ? '未记录' : 'Not recorded') : region}</option>)}</select></label><label>{language === 'zh' ? '开始展示年代' : 'Featured start decade'} <select value={decadeFilter} onChange={(event) => setDecadeFilter(event.target.value)}>{decades.map((decade) => <option key={decade} value={decade}>{decade === 'All' ? (language === 'zh' ? '全部年代' : 'All decades') : decade}</option>)}</select></label></div>
    <div className="catalog-grid">{shown.map((entity, index) => <EntityCard key={entity.id} entity={entity} index={index} onClick={() => onOpen(entity)} language={language} />)}</div>
    {catalog.length === 0 && <p className="catalog-empty">{language === 'zh' ? '没有符合条件的展品。' : 'No artifacts match this search.'}</p>}
    {shown.length < catalog.length && <button className="load-more" onClick={() => setCatalogLimit(catalogLimit + 24)}>{language === 'zh' ? `加载更多（剩余 ${catalog.length - shown.length} 件）` : `Load more (${catalog.length - shown.length} remaining)`}</button>}
  </section>
}

function RoomsSection({ language, copy, goTo }: { language: Language; copy: typeof ui.en; goTo: (year: number) => void }) {
  return <section className="rooms-section" id="rooms" aria-labelledby="rooms-heading"><div className="section-header"><div><div className="section-eyebrow">{copy.explore}</div><h2 id="rooms-heading">{copy.rooms}</h2></div><span className="section-aside"><Globe2 size={15} /> {eras.length} {language === 'zh' ? '个时代展厅' : 'chapters'}</span></div><div className="rooms-grid">{eras.map((item, index) => { const room = localizeEra(item, language); return <button key={item.id} className={`room-card room-${index + 1}`} onClick={() => goTo(item.start)}><span className="room-number">Room {String(index + 1).padStart(2, '0')}</span><span className="room-range">{room.range}</span><strong>{room.label}</strong><p>{room.description}</p><span className="room-enter">{copy.enterRoom} <ArrowRight size={14} /></span></button> })}</div></section>
}

function GraphSection({ entities: graphEntities, current, onOpen, language, copy }: { entities: Entity[]; current: ReturnType<typeof getYear>; onOpen: (entity: Entity) => void; language: Language; copy: typeof ui.en }) {
  const [centerId, setCenterId] = useState(graphEntities[0]?.id ?? '')
  useEffect(() => { setCenterId(graphEntities[0]?.id ?? '') }, [current.year])
  const center = localizeEntity(getEntity(centerId) ?? graphEntities[0], language)
  const relationIds = [...(center?.relatedIds ?? []), ...(center?.competitors ?? [])].filter((id, index, list) => list.indexOf(id) === index && id !== center.id)
  const connected = relationIds.map(getEntity).filter((entity): entity is Entity => Boolean(entity)).map((entity) => localizeEntity(entity, language)).slice(0, 7)
  const relationReason = (entity: Entity) => {
    const common = center.tags.filter((tag) => entity.tags.includes(tag) && tag !== center.category.toLowerCase())
    if (center.competitors?.includes(entity.id)) return language === 'zh' ? '馆藏标记为竞争；具体竞争史料待补。' : 'Cataloged as competitors; specific historical evidence is pending.'
    if (common.length) return language === 'zh' ? `共同馆藏标签：${common.slice(0, 2).join('、')}。` : `Shared catalog tags: ${common.slice(0, 2).join(', ')}.`
    return language === 'zh' ? '馆藏策展关联；具体缘由待补。' : 'Cataloged curatorial link; specific reason is pending.'
  }
  return <section className="graph-section" id="explore" aria-labelledby="graph-heading"><div className="section-header"><div><div className="section-eyebrow"><Network size={13} /> {copy.explore}</div><h2 id="graph-heading">{copy.graph}</h2></div><label className="graph-picker">{language === 'zh' ? '选择中心展品' : 'Choose a central artifact'} <select value={centerId} onChange={(event) => setCenterId(event.target.value)}>{graphEntities.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select></label></div><p className="section-note">{language === 'zh' ? '连线表示本馆整理的“策展关联”或“竞争关系”，不代表收购、继承或因果。点击节点可继续以它为中心探索。' : 'Links show cataloged curatorial associations or competitors, not acquisition, succession, or causation. Select a node to explore from it.'}</p><div className="graph-stage"><div className="graph-gridlines" aria-hidden="true" /><button className="graph-center" onClick={() => onOpen(center)} aria-label={language === 'zh' ? `查看${center.name}详情` : `View ${center.name} details`}><span style={{ color: center?.color }}>{center?.symbol}</span><strong>{center?.name ?? current.majorPlatform}</strong></button>{connected.length ? <><div className="graph-lines" aria-hidden="true">{connected.map((_, index) => <i key={index} style={{ transform: `rotate(${index * (360 / Math.max(connected.length, 1))}deg)` }} />)}</div><div className="graph-nodes">{connected.map((entity, index) => <button key={entity.id} className={`graph-node node-${index + 1}`} onClick={() => setCenterId(entity.id)}><span style={{ color: entity.color }}>{entity.symbol}</span>{entity.name}<small>{center.relatedIds?.includes(entity.id) ? (language === 'zh' ? '策展关联' : 'Related') : (language === 'zh' ? '竞争' : 'Competitor')}</small></button>)}</div></> : <p className="graph-empty">{language === 'zh' ? '此展品尚无显式关系记录。可选择其他中心展品。' : 'No explicit relationships recorded. Choose another central artifact.'}</p>}</div>{connected.length > 0 && <div className="graph-explanations">{connected.map((entity) => <button key={entity.id} onClick={() => setCenterId(entity.id)}><strong>{center.name} → {entity.name}</strong><span>{relationReason(entity)}</span></button>)}</div>}</section>
}

function CompareSection({ compareA, compareB, setCompareA, setCompareB, language, copy }: { compareA: number; compareB: number; setCompareA: (value: number) => void; setCompareB: (value: number) => void; language: Language; copy: typeof ui.en }) {
  const left = getYear(compareA)
  const right = getYear(compareB)
  const categories = ['Browser', 'Search Engine', 'Social Network', 'Messaging', 'Video', 'Hardware']
  const insights: Record<string, { zh: string; en: string }> = {
    Browser: { zh: '观察点：浏览器与桌面、手机系统的结合如何变化？', en: 'Look for changes in how browsers connect with desktop and mobile systems.' },
    'Search Engine': { zh: '观察点：搜索入口如何从网页扩展到日常设备？', en: 'Look for how search moved from web pages into everyday devices.' },
    'Social Network': { zh: '观察点：个人身份与内容如何通过关系网络传播？', en: 'Look for how identity and content travel through social connections.' },
    Messaging: { zh: '观察点：在线状态、移动通知如何改变交流节奏？', en: 'Look for how presence and mobile notifications changed the pace of conversation.' },
    Video: { zh: '观察点：带宽与终端如何改变观看和发布方式？', en: 'Look for how bandwidth and devices changed watching and publishing.' },
    Hardware: { zh: '观察点：随身设备如何改变人们联网的地点？', en: 'Look for how portable devices changed where people connected.' },
  }
  const display = (yearData: ReturnType<typeof getYear>, category: string) => { const entity = yearData.entities.map(getEntity).find((item) => item?.category === category); return entity ? localizeEntity(entity, language).name : (language === 'zh' ? '本快照未记录' : 'Not recorded in this snapshot') }
  return <section className="compare-section" id="compare" aria-labelledby="compare-heading"><div className="section-header"><div><div className="section-eyebrow">{copy.explore}</div><h2 id="compare-heading">{copy.compare}</h2></div><span className="section-aside">{copy.compareHint}</span></div><div className="compare-controls"><label><span>{language === 'zh' ? '时刻 A' : 'Moment A'}</span><select value={compareA} onChange={(event) => setCompareA(Number(event.target.value))}>{timelineYears.map((item) => <option key={item.year} value={item.year}>{item.year}</option>)}</select></label><div className="compare-arrow">→</div><label><span>{language === 'zh' ? '时刻 B' : 'Moment B'}</span><select value={compareB} onChange={(event) => setCompareB(Number(event.target.value))}>{timelineYears.map((item) => <option key={item.year} value={item.year}>{item.year}</option>)}</select></label></div><div className="compare-table"><div className="compare-table-head"><span>{language === 'zh' ? '层' : 'Layer'}</span><strong>{left.year}</strong><strong>{right.year}</strong></div>{categories.map((category) => <div className="compare-row" key={category}><span>{language === 'zh' ? localizeEntity(entities.find((entity) => entity.category === category) ?? entities[0], language).category : category}</span><strong>{display(left, category)}</strong><strong>{display(right, category)}</strong><small className="compare-insight">{insights[category][language]}</small></div>)}</div><p className="section-note">{language === 'zh' ? '策展解读：这些是各年快照中的抽样展品，不是市场排名。“未记录”不代表当年不存在。' : 'Curatorial interpretation: These are sampled artifacts, not market rankings. “Not recorded” does not mean absent that year.'}</p></section>
}

function StackSection({ items, copy }: { items: { label: string; icon: string; value: string; reason: string }[]; copy: typeof ui.en }) {
  return <section className="stack-section" aria-labelledby="stack-heading"><div className="section-header"><div><div className="section-eyebrow"><Layers3 size={13} /> {copy.explore}</div><h2 id="stack-heading">{copy.stack}</h2></div><span className="section-aside">{copy.stackHint}</span></div><p className="section-note">{copy === ui.zh ? '这一年的一种技术组合。每类选择本馆记录中当年已出现、仍处重点展示时期且起始年份最近的一件；并非使用率排名。' : 'One possible technology combination for this year. Each category uses the most recently started catalog entry still in its featured period; this is not a usage ranking.'}</p><div className="stack-list">{items.map((item, index) => <div className="stack-row" key={item.label}><span className="stack-number">0{index + 1}</span><span className="stack-icon">{item.icon}</span><span className="stack-label">{item.label}</span><div className="stack-entry"><strong>{item.value}</strong><small>{item.reason}</small></div><span className="stack-arrow">{index < items.length - 1 ? '↓' : '✺'}</span></div>)}</div></section>
}

function AboutSection({ language, copy }: { language: Language; copy: typeof ui.en }) {
  return <section className="about-section" id="about" aria-labelledby="about-heading"><div className="about-stamp"><BookOpen size={20} /><span>IAM / 2.0</span></div><div className="about-copy"><div className="section-eyebrow">{copy.about}</div><h2 id="about-heading">{copy.aboutQuote}</h2><p>{copy.aboutBody}</p><div className="region-row"><span><Globe2 size={14} /> {language === 'zh' ? '全球互联网' : 'Global internet'}</span><span>{language === 'zh' ? '独立教育项目' : 'Independent educational project'}</span><span>{language === 'zh' ? '开放档案' : 'Open archive'}</span></div></div></section>
}

function EventsSection({ events, language, copy, year, onOpen }: { events: typeof historicalEvents; language: Language; copy: typeof ui.en; year: number; onOpen: (event: HistoricalEvent) => void }) {
  const [showAll, setShowAll] = useState(false)
  const era = getEra(year)
  const eraEvents = events.filter((event) => event.year >= era.start && event.year <= era.end)
  const shown = showAll ? events : eraEvents
  return <section className="events-section" id="events" aria-labelledby="events-heading">
    <div className="section-header"><div><div className="section-eyebrow">{copy.explore}</div><h2 id="events-heading">{language === 'zh' ? '历史事件' : 'Historical events'}</h2></div><span className="section-aside">{showAll ? (language === 'zh' ? `全部 ${events.length} 个节点` : `All ${events.length} milestones`) : (language === 'zh' ? `当前时代 · ${localizeEra(era, language).label}` : `Current era · ${era.label}`)}</span></div>
    <div className="events-grid">{shown.map((event) => { const localized = localizeYear(getYear(event.year), language).events[0]; return <button className={`event-tile importance-${event.importance}`} key={event.id} onClick={() => onOpen(event)}><span className="event-tile-date">{archiveDate(localized?.date ?? event.date, language)}</span><strong>{localized?.title ?? event.title}</strong><p>{localized?.detail ?? event.description}</p><span className="event-tile-link">{language === 'zh' ? '查看事件与来源' : 'View event and sources'} <ArrowRight size={13} /></span></button> })}</div>
    <button className="load-more" onClick={() => setShowAll((value) => !value)}>{showAll ? (language === 'zh' ? '仅看当前时代' : 'Show current era') : (language === 'zh' ? `查看全部 ${events.length} 个事件` : `View all ${events.length} events`)}</button>
  </section>
}

function EventDetail({ event, language, onClose, onEntity }: { event: HistoricalEvent; language: Language; onClose: () => void; onEntity: (entity: Entity) => void }) {
  const localized = localizeYear(getYear(event.year), language).events[0]
  const subject = event.primaryEntityId ? getEntity(event.primaryEntityId) : undefined
  return <div className="day-panel event-detail" onClick={(interaction) => interaction.stopPropagation()}>
    <button className="close-button" onClick={onClose} aria-label={ui[language].close}><X size={19} /></button>
    <div className="section-eyebrow">{language === 'zh' ? '历史事件档案' : 'Historical event record'} · {archiveDate(localized?.date ?? event.date, language)}</div>
    <h2 tabIndex={-1}>{localized?.title ?? event.title}</h2>
    <p>{localized?.detail ?? event.description}</p>
    {language === 'en' && <p>{event.whyItMattered}</p>}
    <div className="detail-links">{event.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} <ExternalLink size={13} /></a>)}</div>
    {subject && <button className="primary-button" onClick={() => onEntity(localizeEntity(subject, language))}>{language === 'zh' ? `查看相关展品：${localizeEntity(subject, language).name}` : `View related artifact: ${subject.name}`} <ArrowRight size={15} /></button>}
  </div>
}

function EntityCard({ entity, index, onClick, language }: { entity: Entity; index: number; onClick: () => void; language: Language }) {
  const copy = ui[language]
  return <button className="entity-card" onClick={onClick} style={{ '--card-accent': entity.color, '--delay': `${Math.min(index, 8) * 35}ms` } as React.CSSProperties}><div className="card-top"><span className="card-symbol">{entity.symbol}</span><span className="card-index">{String(index + 1).padStart(2, '0')}</span></div><div className="card-body"><span className="card-category">{entity.category}</span><h3>{entity.name}</h3><p>{entity.shortLabel === entity.name ? entity.description : entity.shortLabel}</p></div><div className="card-footer"><span>{language === 'zh' ? '本馆重点展示' : 'Featured period'} {entity.activeYears.start}–{entity.activeYears.end ?? copy.now}</span><ArrowRight size={16} /></div></button>
}

function EntityDetail({ entity, onClose, onRelated, copy, language, favorite, onToggleFavorite }: { entity: Entity; onClose: () => void; onRelated: (entity: Entity) => void; copy: typeof ui.en; language: Language; favorite: boolean; onToggleFavorite: () => void }) {
  const [copied, setCopied] = useState(false)
  const relatedIds = [...(entity.relatedIds ?? []), ...entities.filter((item) => item.id !== entity.id && item.tags.some((tag) => entity.tags.includes(tag))).map((item) => item.id)]
  const related = [...new Set(relatedIds)].slice(0, 3).map(getEntity).filter((item): item is Entity => Boolean(item)).map((item) => localizeEntity(item, language))
  const milestones = entity.milestones ?? []
  const website = entity.links?.website
  const wikipedia = entity.links?.wikipedia
  const sourceLinks = (entity.sources ?? []).filter((source) => source.url !== website && source.url !== wikipedia)
  const story = artifactStories[entity.id]
  const lifecycle = lifecycleEvidence[entity.id]
  const correctionUrl = `https://github.com/Biapenam/internet-archaeology-museum/issues/new?${new URLSearchParams({ title: `Correction: ${entity.name} (${entity.id})`, body: `Exhibit ID: ${entity.id}\nWhat needs correction:\nSupporting source:` })}`
  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true) }
    catch { setCopied(false) }
  }
  return <div className="detail-panel" onClick={(event) => event.stopPropagation()}>
    <div className="detail-rail" style={{ background: entity.color }}><span className="detail-symbol">{entity.symbol}</span><span className="detail-rail-label">{copy.fieldNote} / {entity.category}</span></div>
    <div className="detail-content">
      <button className="close-button" onClick={onClose} aria-label={copy.close}><X size={19} /></button>
      <div className="detail-kicker">{entity.category} · {statusLabel(entity.status, language)}</div>
      <h2 tabIndex={-1}>{entity.name}</h2><p className="detail-lede">{entity.description}</p>
      <div className="detail-facts">
        <div><span>{language === 'zh' ? '本馆重点展示时期' : 'Featured period'}</span><strong>{entity.activeYears.start}–{entity.activeYears.end ?? copy.present}</strong></div>
        <div><span>{language === 'zh' ? '推出 / 始于' : 'Launched / began'}</span><strong>{entity.founded ?? (language === 'zh' ? '未记录' : 'Not recorded')}</strong></div>
        <div><span>{language === 'zh' ? '结束记录' : 'Recorded end'}</span><strong>{entity.ended ?? (language === 'zh' ? '未记录' : 'Not recorded')}</strong></div>
        <div><span>{copy.origin}</span><strong>{entity.region ?? (language === 'zh' ? '未记录' : 'Not recorded')}</strong></div>
      </div>
      <p className="detail-caveat">{lifecycle ? <>{lifecycle[language]} <a href={lifecycle.source.url} target="_blank" rel="noreferrer">{lifecycle.source.title} <ExternalLink size={11} /></a> {language === 'zh' ? `核验：${lifecycle.verifiedOn}。` : `Verified: ${lifecycle.verifiedOn}.`}</> : (language === 'zh' ? '状态与结束日期仍为馆藏原始记录，具体产品、地区及终止范围尚未逐条核验；不能据此推断全部服务已停止。' : 'Status and end date are original catalog records; product, regional, and termination scope have not been individually verified. Do not infer that all services stopped.')} {language === 'zh' ? '地区标签不代表流行地区；具体发源地与流行范围仍待逐项整理。' : 'Catalog region does not indicate popularity; precise origin and areas of use remain under review.'}</p>
      <div className="why-mattered"><span className="section-eyebrow">{copy.whyMattered} · {language === 'zh' ? '策展解读' : 'Curatorial interpretation'}</span><p>{entity.whyItMattered}</p></div>
      {story && <div className="artifact-story"><span className="section-eyebrow">{language === 'zh' ? '操作细节 · 文字叙述，非界面复原' : 'Interaction detail · Text account, not a screen reconstruction'}</span><h3>{story[language].title}</h3><p>{story[language].detail}</p><a href={story.source.url} target="_blank" rel="noreferrer">{story.source.title} <ExternalLink size={12} /></a></div>}
      <div className="entity-timeline"><span className="section-eyebrow">{copy.timelineOf} {entity.name}</span>{milestones.length ? milestones.map((item) => <div key={`${item.year}-${item.title}`}><strong>{item.year}</strong><span><b>{item.title}</b><small>{item.detail}</small>{item.source ? <a href={item.source.url} target="_blank" rel="noreferrer">{item.source.title} <ExternalLink size={11} /></a> : <small>{language === 'zh' ? '此节点来源待核验' : 'Source pending verification'}</small>}</span></div>) : <p className="detail-caveat">{language === 'zh' ? '关键节点与出处待补充。' : 'Verified milestones and sources are pending.'}</p>}</div>
      <div className="related"><span className="section-eyebrow">{copy.related}</span><div>{related.map((item) => <button key={item.id} onClick={() => onRelated(item)}><span style={{ color: item.color }}>{item.symbol}</span>{item.name}<ArrowRight size={13} /></button>)}</div></div>
      {entity.competitors && <div className="related competitors"><span className="section-eyebrow">{copy.competitors}</span><div>{entity.competitors.map((id) => { const competitor = getEntity(id); return competitor ? <button key={id} onClick={() => onRelated(localizeEntity(competitor, language))}>{localizeEntity(competitor, language).name}<ArrowRight size={13} /></button> : null })}</div></div>}
      <div className="detail-links"><button onClick={onToggleFavorite} aria-pressed={favorite}>{favorite ? (language === 'zh' ? '★ 已收藏' : '★ Saved') : (language === 'zh' ? '☆ 收藏展品' : '☆ Save artifact')}</button><button onClick={share}>{copied ? (language === 'zh' ? '已复制链接' : 'Link copied') : (language === 'zh' ? '复制展品链接' : 'Copy exhibit link')}</button><a href={correctionUrl} target="_blank" rel="noreferrer">{language === 'zh' ? '纠正此展品' : 'Suggest a correction'} <ExternalLink size={13} /></a>{website && <a href={website} target="_blank" rel="noreferrer">{copy.visitOfficial} <ExternalLink size={13} /></a>}{website && <a href={`https://web.archive.org/web/*/${website}`} target="_blank" rel="noreferrer">{copy.wayback} <ExternalLink size={13} /></a>}{wikipedia && <a href={wikipedia} target="_blank" rel="noreferrer">Wikipedia / {copy.source} <ExternalLink size={13} /></a>}{sourceLinks.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} <ExternalLink size={13} /></a>)}</div>
    </div>
  </div>
}

function SurpriseDetail({ entity, onClose, onOpen, copy }: { entity: Entity; onClose: () => void; onOpen: () => void; copy: typeof ui.en }) { return <div className="surprise-panel" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={onClose} aria-label={copy.close}><X size={19} /></button><div className="surprise-orbit"><Sparkles size={20} /><span style={{ color: entity.color }}>{entity.symbol}</span></div><div className="section-eyebrow">{copy.discovered}</div><h2>{entity.name}</h2><p>{entity.whyItMattered}</p><button className="primary-button" onClick={onOpen}>{copy.openFieldNotes} <ArrowRight size={15} /></button></div> }

function OnThisDay({ onClose, copy, language }: { onClose: () => void; copy: typeof ui.en; language: Language }) {
  const today = new Date()
  const locale = language === 'zh' ? 'zh-CN' : 'en-US'
  const month = today.toLocaleString(locale, { month: 'long' })
  const day = today.getDate()
  const marker = monthNames[today.getMonth()]
  const exactDate = new RegExp(`\\b${marker}\\s+${day}(?:,|\\s|$)`, 'i')
  const matched = historicalEvents.filter((event) => exactDate.test(event.date))
  const sameMonth = historicalEvents.filter((event) => event.date.startsWith(marker))
  const offset = today.getDate() % historicalEvents.length
  const recommendations = sameMonth.length ? sameMonth : [...historicalEvents.slice(offset), ...historicalEvents.slice(0, offset)]
  const items = matched.length ? matched : recommendations.slice(0, 3)
  return <div className="day-panel" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={onClose} aria-label={copy.close}><X size={19} /></button><div className="day-date"><CalendarDays size={18} /> {language === 'zh' ? `${month}${day}日` : `${month} ${day}`}</div><h2 tabIndex={-1}>{copy.onThisDayTitle}</h2>{!matched.length && <p className="day-note">{language === 'zh' ? '档案中没有这一天的确切记录，以下为同月或轮换推荐，并非当天事件。' : 'No exact date is recorded for today. These are same-month or rotating recommendations, not events from this day.'}</p>}<div className="day-items">{items.map((item) => { const localized = localizeYear(getYear(item.year), language).events[0]; return <div key={item.id}><span>{archiveDate(item.date, language)}</span><strong>{localized?.title ?? item.title}</strong><p>{localized?.detail ?? item.description}</p><div className="day-sources">{item.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} <ExternalLink size={12} /></a>)}</div></div> })}</div></div>
}

export default App
