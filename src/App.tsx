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
import type { Entity } from './types'
import { localizeEntity, localizeEra, localizeYear, statusLabel, ui, type Language } from './i18n'
import { ModalShell } from './components/ModalShell'
import { Timeline } from './components/Timeline'

const MIN_YEAR = 1990
const MAX_YEAR = 2026

function sharedYear() {
  const value = new URLSearchParams(window.location.search).get('year')
  if (!value || !/^\d+$/.test(value)) return 1995
  const parsed = Number(value)
  return Number.isInteger(parsed) ? Math.max(MIN_YEAR, Math.min(MAX_YEAR, parsed)) : 1995
}

function readStorage(key: string, fallback: string) {
  try { return window.localStorage.getItem(key) ?? fallback } catch { return fallback }
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
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [catalogQuery, setCatalogQuery] = useState('')
  const [catalogLimit, setCatalogLimit] = useState(24)
  const [compareA, setCompareA] = useState(2005)
  const [compareB, setCompareB] = useState(2026)
  const [year, setYear] = useState(sharedYear)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [query, setQuery] = useState('')
  const [mobileSearch, setMobileSearch] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(() => sharedEntity(initialLanguage()))
  const [surpriseEntity, setSurpriseEntity] = useState<Entity | null>(null)
  const [showOnThisDay, setShowOnThisDay] = useState(false)
  const rangeRef = useRef<HTMLInputElement>(null)
  const current = getYear(year)
  const era = localizeEra(getEra(year), language)
  const localizedCurrent = localizeYear(current, language)
  const copy = ui[language]

  const visibleEntities = useMemo(() => {
    return current.entities.map(getEntity).filter((entity): entity is Entity => Boolean(entity)).map((entity) => localizeEntity(entity, language))
  }, [current.entities, language])

  const searchResults = useMemo(() => {
    const clean = query.trim().toLowerCase()
    if (!clean) return []
    return entities.filter((entity) => {
      const localized = localizeEntity(entity, language)
      const haystack = [entity.name, entity.category, entity.description, localized.name, localized.category, localized.description, ...entity.tags].join(' ').toLowerCase()
      return haystack.includes(clean)
    }).map((entity) => localizeEntity(entity, language))
  }, [query, language])

  useEffect(() => {
    try { window.localStorage.setItem('museum-language', language) } catch { /* private browsing */ }
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
  }, [language])

  useEffect(() => {
    try { window.localStorage.setItem('museum-theme', theme) } catch { /* private browsing */ }
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setYear((value) => {
        if (value >= MAX_YEAR) {
          setPlaying(false)
          return MAX_YEAR
        }
        return value + 1
      })
    }, 1000 / speed)
    return () => window.clearInterval(timer)
  }, [playing, speed])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedEntity(null)
        setSurpriseEntity(null)
        setShowOnThisDay(false)
        return
      }
      if (event.target instanceof HTMLElement && (event.target.matches('input, textarea, select, button, a, [contenteditable="true"]') || event.target.closest('[role="dialog"]'))) return
      if (event.key === 'ArrowLeft') setYear((value) => Math.max(MIN_YEAR, value - 1))
      if (event.key === 'ArrowRight') setYear((value) => Math.min(MAX_YEAR, value + 1))
      if (event.key === 'Home') setYear(MIN_YEAR)
      if (event.key === 'End') setYear(MAX_YEAR)
      if (event.key === ' ') {
        event.preventDefault()
        setPlaying((value) => !value)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onPop = () => {
      setYear(sharedYear())
      const id = new URLSearchParams(window.location.search).get('exhibit')
      setSelectedEntity(id && getEntity(id) ? localizeEntity(getEntity(id)!, language) : null)
    }
    window.addEventListener('popstate', onPop)
    const id = new URLSearchParams(window.location.search).get('exhibit')
    if (id && getEntity(id)) setSelectedEntity(localizeEntity(getEntity(id)!, language))
    return () => window.removeEventListener('popstate', onPop)
  }, [language])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.set('year', String(year))
    if (selectedEntity) params.set('exhibit', selectedEntity.id)
    else params.delete('exhibit')
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`)
  }, [year, selectedEntity])

  useEffect(() => { if (selectedEntity || surpriseEntity || showOnThisDay) setPlaying(false) }, [selectedEntity, surpriseEntity, showOnThisDay])

  useEffect(() => {
    if (selectedEntity) {
      const currentEntity = getEntity(selectedEntity.id)
      if (currentEntity) setSelectedEntity(localizeEntity(currentEntity, language))
    }
  }, [language])

  useEffect(() => {
    const input = rangeRef.current
    if (!input) return
    const percentage = ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100
    input.style.setProperty('--range-progress', `${percentage}%`)
  }, [year])

  const goTo = (nextYear: number) => setYear(Math.max(MIN_YEAR, Math.min(MAX_YEAR, Math.round(nextYear))))

  const surprise = () => {
    const pool = visibleEntities.length ? visibleEntities : entities
    const choice = pool[Math.floor(Math.random() * pool.length)]
    setSurpriseEntity(choice)
  }

  const categories = ['All', ...Array.from(new Set(entities.map((entity) => entity.category)))]
  const catalogEntities = useMemo(() => {
    const scoped = categoryFilter === 'All' ? entities : entities.filter((entity) => entity.category === categoryFilter)
    return scoped.map((entity) => localizeEntity(entity, language))
  }, [categoryFilter, language])
  const catalogMatches = useMemo(() => {
    const clean = catalogQuery.trim().toLowerCase()
    return catalogEntities.filter((entity) => !clean || [entity.name, entity.category, entity.description, ...entity.tags].join(' ').toLowerCase().includes(clean))
  }, [catalogEntities, catalogQuery])
  const filteredEntities = visibleEntities
  const stackValue = (category: string, fallback: string) => {
    const entity = entities.filter((item) => item.category === category && item.activeYears.start <= year && (!item.activeYears.end || item.activeYears.end >= year)).sort((a, b) => b.activeYears.start - a.activeYears.start)[0]
    return entity ? localizeEntity(entity, language).name : fallback
  }
  const stackItems = [
    { label: language === 'zh' ? '硬件' : 'Hardware', icon: '▯', value: stackValue('Hardware', language === 'zh' ? '尚未记录' : 'Not recorded yet') },
    { label: language === 'zh' ? '操作系统' : 'Operating system', icon: '⊞', value: stackValue('Operating System', language === 'zh' ? '尚未记录' : 'Not recorded yet') },
    { label: language === 'zh' ? '浏览器' : 'Browser', icon: '◌', value: stackValue('Browser', language === 'zh' ? '尚未收录' : 'Not yet catalogued') },
    { label: language === 'zh' ? '搜索' : 'Search', icon: '⌕', value: stackValue('Search Engine', language === 'zh' ? '尚未收录' : 'Not yet catalogued') },
    { label: language === 'zh' ? '沟通' : 'Communication', icon: '#', value: stackValue('Messaging', language === 'zh' ? '尚未记录' : 'Not recorded yet') },
    { label: language === 'zh' ? '社交' : 'Social', icon: '✦', value: stackValue('Social Network', language === 'zh' ? '尚未记录' : 'Not recorded yet') },
    { label: language === 'zh' ? '娱乐' : 'Entertainment', icon: '▶', value: stackValue('Video', language === 'zh' ? '尚未记录' : 'Not recorded yet') },
    { label: 'AI', icon: '✺', value: stackValue('AI', language === 'zh' ? '尚未收录' : 'Not yet catalogued') },
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
        <nav className={`main-nav ${mobileNav ? 'open' : ''}`} aria-label={copy.explore}>
          <a href="#timeline" onClick={() => setMobileNav(false)}>{copy.timeline}</a>
          <a href="#categories" onClick={() => setMobileNav(false)}>{copy.categories}</a>
          <a href="#rooms" onClick={() => setMobileNav(false)}>{copy.rooms}</a>
          <a href="#about" onClick={() => setMobileNav(false)}>{copy.about}</a>
        </nav>
        <div className="top-actions">
          <button className="text-button" onClick={() => setShowOnThisDay(true)}><CalendarDays size={15} /> {copy.onThisDay}</button>
          <button className="text-button" onClick={surprise}><Shuffle size={15} /> {copy.surprise}</button>
          <button className="language-toggle" onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} aria-label={copy.languageLabel}>{copy.language}</button>
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? (language === 'zh' ? '切换到浅色模式' : 'Switch to light mode') : (language === 'zh' ? '切换到深色模式' : 'Switch to dark mode')}>{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</button>
          <button className="mobile-menu" onClick={() => setMobileNav((value) => !value)} aria-label={copy.explore}><Menu size={18} /></button>
          <div className={`search-wrap ${mobileSearch || query ? 'search-open' : ''}`}>
            <button className="search-toggle" onClick={() => setMobileSearch((value) => !value)} aria-label={copy.searchLabel}><Search size={16} aria-hidden="true" /></button>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.searchPlaceholder} aria-label={copy.searchLabel} />
            {query && <button className="clear-search" onClick={() => setQuery('')} aria-label={copy.close}><X size={14} /></button>}
            {searchResults.length > 0 && (
              <div className="search-results" role="listbox">
                {searchResults.map((entity) => (
                  <button key={entity.id} className="search-result" onClick={() => { setSelectedEntity(entity); setQuery('') }}>
                    <span className="mini-symbol" style={{ color: entity.color }}>{entity.symbol}</span>
                    <span><strong>{entity.name}</strong><small>{entity.category} · {entity.activeYears.start}–{entity.activeYears.end ?? copy.now}</small></span>
                    <ArrowRight size={14} />
                  </button>
                ))}
              </div>
            )}
            {query.trim() === '404' && searchResults.length === 0 && <div className="search-404">404 / {copy.exhibitNotFound}<small>{copy.trySearch}</small></div>}
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
          </div>
          <div className="entrance-mark" aria-hidden="true"><span>1990</span><div className="mark-orbit orbit-one" /><div className="mark-orbit orbit-two" /><strong>→</strong><span>2026</span></div>
        </section>
        <section className="hero-section" id="timeline" aria-labelledby="hero-title">
          <div className="hero-kicker"><span className="status-dot" /> {copy.liveArchive} / {era.label}</div>
          <div className="hero-heading-row">
            <div>
              <div className="year-label">{copy.internetIn}</div>
            <h2 id="hero-title" className="hero-year" key={year} aria-live="polite">{year}</h2>
            </div>
            <div className="hero-note" key={current.year}><span className="eyebrow">{era.range}</span><span>{localizedCurrent.title}</span><p>{localizedCurrent.description}</p></div>
          </div>
          <Timeline year={year} setYear={setYear} rangeRef={rangeRef} goTo={goTo} copy={copy} />
        </section>

        <section className="era-strip" aria-label={copy.eras}>
          <div className="section-eyebrow">{copy.walkThrough}</div>
          <div className="era-list">
            {eras.map((item) => (
              <button key={item.id} className={`era-chip ${item.id === era.id ? 'active' : ''}`} onClick={() => goTo(item.start)}>
                <span>{item.range}</span><strong>{localizeEra(item, language).label}</strong>
              </button>
            ))}
          </div>
        </section>

        <section className="snapshot-section" aria-labelledby="snapshot-heading">
          <div className="section-header"><div><div className="section-eyebrow">{copy.snapshot} · {language === 'zh' ? `基于 ${current.year} 年档案` : `Based on the ${current.year} archive`}</div><h2 id="snapshot-heading">{copy.whatWebFelt}</h2></div><div className="keyboard-hint"><kbd>←</kbd><kbd>→</kbd> {copy.timelineKeyboard}</div></div>
          <div className="stats-grid" key={current.year}>
            <Stat label={copy.estimatedUsers} value={localizedCurrent.internetUsers} />
            <Stat label={copy.popularBrowser} value={localizedCurrent.popularBrowser} />
            <Stat label={copy.majorPlatform} value={localizedCurrent.majorPlatform} />
            <Stat label={copy.majorTrend} value={localizedCurrent.majorTrend} />
          </div>
        </section>

        <section className="exhibits-section" aria-labelledby="exhibits-heading">
          <div className="section-header exhibits-header"><div><div className="section-eyebrow">{copy.exhibits} / {filteredEntities.length.toString().padStart(2, '0')}</div><h2 id="exhibits-heading">{copy.artifactsFrom} {year}</h2></div><span className="section-aside">{copy.selectArtifact} <ArrowRight size={16} /></span></div>
          <div className="exhibits-grid" key={`${current.year}-${categoryFilter}`}>
            {filteredEntities.map((entity, index) => <EntityCard key={entity.id} entity={entity} index={index} onClick={() => setSelectedEntity(entity)} language={language} />)}
          </div>
        </section>

        <section className="event-section" aria-labelledby="event-heading">
          <div className="event-intro"><div className="section-eyebrow">{copy.fromLogbook}</div><h2 id="event-heading">{copy.moment}</h2><p>{copy.logbookIntro}</p></div>
          <div className="event-card" key={current.year}><div className="event-date"><Clock3 size={15} /> {localizedCurrent.events[0]?.date}</div><h3>{localizedCurrent.events[0]?.title}</h3><p>{localizedCurrent.events[0]?.detail}</p><span className="event-index">{String(timelineYears.findIndex((item) => item.year === current.year) + 1).padStart(2, '0')} / {timelineYears.length}</span></div>
        </section>
        <EventsSection events={historicalEvents} language={language} copy={copy} goTo={goTo} onOpen={(entity) => setSelectedEntity(localizeEntity(entity, language))} />

        <CategorySection categories={categories} categoryFilter={categoryFilter} setCategoryFilter={(value) => { setCategoryFilter(value); setCatalogLimit(24) }} language={language} copy={copy} entities={catalogMatches} catalogQuery={catalogQuery} setCatalogQuery={setCatalogQuery} catalogLimit={catalogLimit} setCatalogLimit={setCatalogLimit} onOpen={(entity) => setSelectedEntity(entity)} />
        <RoomsSection language={language} copy={copy} goTo={goTo} />
        <GraphSection entities={visibleEntities.slice(0, 9)} current={localizedCurrent} onOpen={setSelectedEntity} language={language} copy={copy} />
        <CompareSection compareA={compareA} compareB={compareB} setCompareA={setCompareA} setCompareB={setCompareB} language={language} copy={copy} />
        <StackSection items={stackItems} copy={copy} />
        <AboutSection language={language} copy={copy} />
      </main>

      <footer className="footer"><span>Internet Archaeology Museum</span><span>{copy.staticArchive}</span><span>MIT License</span></footer>

      <div className="play-dock" aria-label="Timeline playback controls">
        <button className="dock-play" onClick={() => { if (!playing && year >= MAX_YEAR) setYear(MIN_YEAR); setPlaying((value) => !value) }} aria-label={playing ? 'Pause timeline' : 'Play timeline'}>{playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button>
        <div className="dock-copy"><span>{playing ? copy.travelling : copy.playArchive}</span><strong>{year} <span>→</span> {MAX_YEAR}</strong></div>
        <div className="speed-picker" role="group" aria-label="Playback speed">
          {[0.5, 1, 2, 5].map((item) => <button key={item} onClick={() => setSpeed(item)} className={speed === item ? 'active' : ''}>{item}×</button>)}
        </div>
        <FastForward size={16} className="dock-icon" />
      </div>

      {(selectedEntity || surpriseEntity || showOnThisDay) && (
        <ModalShell label={selectedEntity?.name ?? (showOnThisDay ? copy.onThisDayTitle : copy.discovered)} onDismiss={() => { setSelectedEntity(null); setSurpriseEntity(null); setShowOnThisDay(false) }}>
          {selectedEntity && <EntityDetail entity={selectedEntity} onClose={() => setSelectedEntity(null)} onRelated={(entity) => setSelectedEntity(entity)} copy={copy} language={language} />}
          {surpriseEntity && <SurpriseDetail entity={surpriseEntity} onClose={() => setSurpriseEntity(null)} onOpen={() => { setSelectedEntity(surpriseEntity); setSurpriseEntity(null) }} copy={copy} />}
          {showOnThisDay && <OnThisDay onClose={() => setShowOnThisDay(false)} copy={copy} language={language} />}
        </ModalShell>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="stat"><span>{label}</span><strong>{value}</strong></div> }

function CategorySection({ categories, categoryFilter, setCategoryFilter, language, copy, entities: catalog, catalogQuery, setCatalogQuery, catalogLimit, setCatalogLimit, onOpen }: { categories: string[]; categoryFilter: string; setCategoryFilter: (value: string) => void; language: Language; copy: typeof ui.en; entities: Entity[]; catalogQuery: string; setCatalogQuery: (value: string) => void; catalogLimit: number; setCatalogLimit: (value: number) => void; onOpen: (entity: Entity) => void }) {
  const allCount = entities.length
  const shown = catalog.slice(0, catalogLimit)
  return <section className="category-section" id="categories" aria-labelledby="categories-heading"><div className="section-header"><div><div className="section-eyebrow">{copy.explore}</div><h2 id="categories-heading">{copy.categories}</h2></div><span className="section-aside">{copy.categoryHint}</span></div><div className="category-grid">{categories.map((category, index) => { const sample = category === 'All' ? null : entities.find((entity) => entity.category === category); const label = category === 'All' ? copy.all : sample ? localizeEntity(sample, language).category : category; const count = category === 'All' ? allCount : entities.filter((entity) => entity.category === category).length; return <button key={category} className={`category-tile ${categoryFilter === category ? 'active' : ''}`} onClick={() => setCategoryFilter(category === categoryFilter ? 'All' : category)}><span className="category-tile-index">{String(index + 1).padStart(2, '0')}</span><span className="category-tile-icon">{['◌', '⌕', '✦', '#', '▶', '⊞', '▯', '⌘', '✺', '◎', '●'][index % 11]}</span><strong>{label}</strong><small>{count} {language === 'zh' ? '件展品' : count === 1 ? 'artifact' : 'artifacts'}</small></button> })}</div><div className="catalog-heading"><span className="section-eyebrow">{categoryFilter === 'All' ? copy.all : localizeEntity(entities.find((entity) => entity.category === categoryFilter) ?? entities[0], language).category} / {catalog.length}</span><label className="catalog-search"><Search size={14} /><input value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} placeholder={language === 'zh' ? '筛选全馆目录' : 'Filter the collection'} aria-label={language === 'zh' ? '筛选全馆目录' : 'Filter the collection'} /></label></div><div className="catalog-grid">{shown.map((entity, index) => <EntityCard key={entity.id} entity={entity} index={index} onClick={() => onOpen(entity)} language={language} />)}</div>{catalog.length === 0 && <p className="catalog-empty">{language === 'zh' ? '没有符合条件的展品。' : 'No artifacts match this search.'}</p>}{shown.length < catalog.length && <button className="load-more" onClick={() => setCatalogLimit(catalogLimit + 24)}>{language === 'zh' ? `加载更多（剩余 ${catalog.length - shown.length} 件）` : `Load more (${catalog.length - shown.length} remaining)`}</button>}</section>
}

function RoomsSection({ language, copy, goTo }: { language: Language; copy: typeof ui.en; goTo: (year: number) => void }) {
  return <section className="rooms-section" id="rooms" aria-labelledby="rooms-heading"><div className="section-header"><div><div className="section-eyebrow">{copy.explore}</div><h2 id="rooms-heading">{copy.rooms}</h2></div><span className="section-aside"><Globe2 size={15} /> {eras.length} {language === 'zh' ? '个时代展厅' : 'chapters'}</span></div><div className="rooms-grid">{eras.map((item, index) => { const room = localizeEra(item, language); return <button key={item.id} className={`room-card room-${index + 1}`} onClick={() => goTo(item.start)}><span className="room-number">Room {String(index + 1).padStart(2, '0')}</span><span className="room-range">{room.range}</span><strong>{room.label}</strong><p>{room.description}</p><span className="room-enter">{copy.enterRoom} <ArrowRight size={14} /></span></button> })}</div></section>
}

function GraphSection({ entities: graphEntities, current, onOpen, language, copy }: { entities: Entity[]; current: ReturnType<typeof getYear>; onOpen: (entity: Entity) => void; language: Language; copy: typeof ui.en }) {
  const center = graphEntities[0]
  const relationIds = [...(center?.relatedIds ?? []), ...(center?.competitors ?? [])].filter((id, index, list) => list.indexOf(id) === index && id !== center.id)
  const connected = relationIds.map(getEntity).filter((entity): entity is Entity => Boolean(entity)).map((entity) => localizeEntity(entity, language)).slice(0, 7)
  return <section className="graph-section" id="explore" aria-labelledby="graph-heading"><div className="section-header"><div><div className="section-eyebrow"><Network size={13} /> {copy.explore}</div><h2 id="graph-heading">{copy.graph}</h2></div><span className="section-aside">{center ? `${center.name} · ${copy.graphHint}` : copy.graphHint}</span></div><div className="graph-stage"><div className="graph-gridlines" aria-hidden="true" /><div className="graph-center"><span style={{ color: center?.color }}>{center?.symbol}</span><strong>{center?.name ?? current.majorPlatform}</strong></div><div className="graph-lines" aria-hidden="true">{connected.map((_, index) => <i key={index} style={{ transform: `rotate(${index * (360 / Math.max(connected.length, 1))}deg)` }} />)}</div><div className="graph-nodes">{connected.map((entity, index) => <button key={entity.id} className={`graph-node node-${index + 1}`} onClick={() => onOpen(entity)} title={`${center?.name}: ${center?.relatedIds?.includes(entity.id) ? 'related artifact' : 'competitor'}`}><span style={{ color: entity.color }}>{entity.symbol}</span>{entity.name}</button>)}</div></div></section>
}

function CompareSection({ compareA, compareB, setCompareA, setCompareB, language, copy }: { compareA: number; compareB: number; setCompareA: (value: number) => void; setCompareB: (value: number) => void; language: Language; copy: typeof ui.en }) {
  const left = getYear(compareA)
  const right = getYear(compareB)
  const categories = ['Browser', 'Search Engine', 'Social Network', 'Messaging', 'Video', 'Hardware']
  const display = (yearData: ReturnType<typeof getYear>, category: string) => { const entity = yearData.entities.map(getEntity).find((item) => item?.category === category); return entity ? localizeEntity(entity, language).name : '—' }
  return <section className="compare-section" aria-labelledby="compare-heading"><div className="section-header"><div><div className="section-eyebrow">{copy.explore}</div><h2 id="compare-heading">{copy.compare}</h2></div><span className="section-aside">{copy.compareHint}</span></div><div className="compare-controls"><label><span>{language === 'zh' ? '时刻 A' : 'Moment A'}</span><select value={compareA} onChange={(event) => setCompareA(Number(event.target.value))}>{timelineYears.map((item) => <option key={item.year} value={item.year}>{item.year}</option>)}</select></label><div className="compare-arrow">→</div><label><span>{language === 'zh' ? '时刻 B' : 'Moment B'}</span><select value={compareB} onChange={(event) => setCompareB(Number(event.target.value))}>{timelineYears.map((item) => <option key={item.year} value={item.year}>{item.year}</option>)}</select></label></div><div className="compare-table"><div className="compare-table-head"><span>{language === 'zh' ? '层' : 'Layer'}</span><strong>{left.year}</strong><strong>{right.year}</strong></div>{categories.map((category) => <div className="compare-row" key={category}><span>{language === 'zh' ? localizeEntity(entities.find((entity) => entity.category === category) ?? entities[0], language).category : category}</span><strong>{display(left, category)}</strong><strong>{display(right, category)}</strong></div>)}</div></section>
}

function StackSection({ items, copy }: { items: { label: string; icon: string; value: string }[]; copy: typeof ui.en }) {
  return <section className="stack-section" aria-labelledby="stack-heading"><div className="section-header"><div><div className="section-eyebrow"><Layers3 size={13} /> {copy.explore}</div><h2 id="stack-heading">{copy.stack}</h2></div><span className="section-aside">{copy.stackHint}</span></div><div className="stack-list">{items.map((item, index) => <div className="stack-row" key={item.label}><span className="stack-number">0{index + 1}</span><span className="stack-icon">{item.icon}</span><span className="stack-label">{item.label}</span><strong>{item.value}</strong><span className="stack-arrow">{index < items.length - 1 ? '↓' : '✺'}</span></div>)}</div></section>
}

function AboutSection({ language, copy }: { language: Language; copy: typeof ui.en }) {
  return <section className="about-section" id="about" aria-labelledby="about-heading"><div className="about-stamp"><BookOpen size={20} /><span>IAM / 2.0</span></div><div className="about-copy"><div className="section-eyebrow">{copy.about}</div><h2 id="about-heading">{copy.aboutQuote}</h2><p>{copy.aboutBody}</p><div className="region-row"><span><Globe2 size={14} /> {language === 'zh' ? '全球互联网' : 'Global internet'}</span><span>{language === 'zh' ? '独立教育项目' : 'Independent educational project'}</span><span>{language === 'zh' ? '开放档案' : 'Open archive'}</span></div></div></section>
}

function EventsSection({ events, language, copy, goTo, onOpen }: { events: typeof historicalEvents; language: Language; copy: typeof ui.en; goTo: (year: number) => void; onOpen: (entity: Entity) => void }) {
  return <section className="events-section" aria-labelledby="events-heading"><div className="section-header"><div><div className="section-eyebrow">{copy.explore}</div><h2 id="events-heading">{language === 'zh' ? '历史事件' : 'Historical events'}</h2></div><span className="section-aside">{language === 'zh' ? '每个转折都留下了新的界面' : 'Every turning point leaves a new interface'}</span></div><div className="events-grid">{events.slice(0, 8).map((event) => { const localized = localizeYear(getYear(event.year), language).events[0]; const entity = getEntity(event.entities[0]); return <button className={`event-tile importance-${event.importance}`} key={event.id} onClick={() => { goTo(event.year); if (entity) onOpen(entity) }}><span className="event-tile-date">{localized?.date ?? event.date}</span><strong>{localized?.title ?? event.title}</strong><p>{localized?.detail ?? event.description}</p><span className="event-tile-link">{language === 'zh' ? '进入时代' : 'Enter the era'} <ArrowRight size={13} /></span></button> })}</div></section>
}

function EntityCard({ entity, index, onClick, language }: { entity: Entity; index: number; onClick: () => void; language: Language }) {
  const copy = ui[language]
  return <button className="entity-card" onClick={onClick} style={{ '--card-accent': entity.color, '--delay': `${index * 35}ms` } as React.CSSProperties}><div className="card-top"><span className="card-symbol">{entity.symbol}</span><span className="card-index">{String(index + 1).padStart(2, '0')}</span></div><div className="card-body"><span className="card-category">{entity.category}</span><h3>{entity.name}</h3><p>{entity.shortLabel === entity.name ? entity.description : entity.shortLabel}</p></div><div className="card-footer"><span>{entity.activeYears.start}–{entity.activeYears.end ?? copy.now}</span><ArrowRight size={16} /></div></button>
}

function EntityDetail({ entity, onClose, onRelated, copy, language }: { entity: Entity; onClose: () => void; onRelated: (entity: Entity) => void; copy: typeof ui.en; language: Language }) {
  const related = entities.filter((item) => item.id !== entity.id && item.tags.some((tag) => entity.tags.includes(tag))).slice(0, 3).map((item) => localizeEntity(item, language))
  const milestones = entity.milestones ?? [{ year: entity.activeYears.start, title: language === 'zh' ? '开始出现' : 'First appears', detail: language === 'zh' ? '进入互联网历史的展品记录。' : 'Enters the archive as an internet artifact.' }, ...(entity.activeYears.end ? [{ year: entity.activeYears.end, title: language === 'zh' ? '时代转折' : 'A turning point', detail: language === 'zh' ? '它的影响开始转向新的平台和习惯。' : 'Its influence begins to move into new platforms and habits.' }] : [])]
  const website = entity.links?.website
  const wikipedia = entity.links?.wikipedia
  const sourceLinks = (entity.sources ?? []).filter((source) => source.url !== website && source.url !== wikipedia)
  return <div className="detail-panel" onClick={(event) => event.stopPropagation()}><div className="detail-rail" style={{ background: entity.color }}><span className="detail-symbol">{entity.symbol}</span><span className="detail-rail-label">{copy.fieldNote} / {entity.category}</span></div><div className="detail-content"><button className="close-button" onClick={onClose} aria-label={copy.close}><X size={19} /></button><div className="detail-kicker">{entity.category} · {statusLabel(entity.status, language)}</div><h2>{entity.name}</h2><p className="detail-lede">{entity.description}</p><div className="detail-facts"><div><span>{copy.active}</span><strong>{entity.activeYears.start}–{entity.activeYears.end ?? copy.present}</strong></div><div><span>{copy.founded}</span><strong>{entity.founded ?? '—'}</strong></div><div><span>{copy.origin}</span><strong>{entity.region ?? 'Global'}</strong></div></div><div className="why-mattered"><span className="section-eyebrow">{copy.whyMattered}</span><p>{entity.whyItMattered}</p></div><div className="entity-timeline"><span className="section-eyebrow">{copy.timelineOf} {entity.name}</span>{milestones.map((item) => <div key={`${item.year}-${item.title}`}><strong>{item.year}</strong><span><b>{item.title}</b><small>{item.detail}</small></span></div>)}</div><div className="related"><span className="section-eyebrow">{copy.related}</span><div>{related.map((item) => <button key={item.id} onClick={() => onRelated(item)}><span style={{ color: item.color }}>{item.symbol}</span>{item.name}<ArrowRight size={13} /></button>)}</div></div>{entity.competitors && <div className="related competitors"><span className="section-eyebrow">{copy.competitors}</span><div>{entity.competitors.map((id) => { const competitor = getEntity(id); return competitor ? <button key={id} onClick={() => onRelated(localizeEntity(competitor, language))}>{localizeEntity(competitor, language).name}<ArrowRight size={13} /></button> : null })}</div></div>}<div className="detail-links">{website && <a href={website} target="_blank" rel="noreferrer">{copy.visitOfficial} <ExternalLink size={13} /></a>}{website && <a href={`https://web.archive.org/web/*/${website}`} target="_blank" rel="noreferrer">{copy.wayback} <ExternalLink size={13} /></a>}{wikipedia && <a href={wikipedia} target="_blank" rel="noreferrer">Wikipedia / {copy.source} <ExternalLink size={13} /></a>}{sourceLinks.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} <ExternalLink size={13} /></a>)}</div></div></div>
}

function SurpriseDetail({ entity, onClose, onOpen, copy }: { entity: Entity; onClose: () => void; onOpen: () => void; copy: typeof ui.en }) { return <div className="surprise-panel" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={onClose} aria-label={copy.close}><X size={19} /></button><div className="surprise-orbit"><Sparkles size={20} /><span style={{ color: entity.color }}>{entity.symbol}</span></div><div className="section-eyebrow">{copy.discovered}</div><h2>{entity.name}</h2><p>{entity.whyItMattered}</p><button className="primary-button" onClick={onOpen}>{copy.openFieldNotes} <ArrowRight size={15} /></button></div> }

function OnThisDay({ onClose, copy, language }: { onClose: () => void; copy: typeof ui.en; language: Language }) {
  const today = new Date()
  const month = today.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'long' })
  const day = today.getDate()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const marker = monthNames[today.getMonth()]
  const exactDate = new RegExp(`\\b${marker}\\s+${day}(?:,|\\s|$)`, 'i')
  const matched = historicalEvents.filter((event) => exactDate.test(event.date))
  const items = (matched.length ? matched : historicalEvents.slice(0, 3)).map((event) => ({ date: event.date, title: language === 'zh' ? localizeYear(getYear(event.year), language).events[0]?.title ?? event.title : event.title, detail: language === 'zh' ? localizeYear(getYear(event.year), language).events[0]?.detail ?? event.description : event.description }))
  return <div className="day-panel" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={onClose} aria-label={copy.close}><X size={19} /></button><div className="day-date"><CalendarDays size={18} /> {month} {day}</div><h2>{copy.onThisDayTitle}</h2>{!matched.length && <p className="day-note">{language === 'zh' ? '档案中没有这一天的确切记录，以下是精选历史节点。' : 'No exact date is recorded in this archive; here are selected milestones.'}</p>}<div className="day-items">{items.map((item, index) => <div key={`${item.date}-${index}`}><span>{item.date}</span><strong>{item.title}</strong><p>{item.detail}</p></div>)}</div></div>
}

export default App
