import { ArrowLeft, ArrowRight } from 'lucide-react'
import { timelineYears } from '../data'

type Props = { year: number; setYear: (year: number) => void; rangeRef: React.RefObject<HTMLInputElement | null>; goTo: (year: number) => void; copy: { timeline: string; timelineHint: string; previousYear: string; nextYear: string; chooseYear: string } }

export function Timeline({ year, setYear, rangeRef, goTo, copy }: Props) {
  return <div className="timeline-shell"><div className="timeline-top"><span className="section-eyebrow">{copy.timeline} / 1990—2026</span><span className="timeline-instruction">{copy.timelineHint}</span></div><div className="timeline-control"><button className="timeline-arrow" onClick={() => setYear(Math.max(1990, year - 1))} aria-label={copy.previousYear}><ArrowLeft size={17} /></button><div className="range-wrap"><input ref={rangeRef} type="range" min={1990} max={2026} value={year} onChange={(event) => setYear(Number(event.target.value))} aria-label={copy.chooseYear} /><div className="range-labels"><span>1990</span>{timelineYears.filter((item) => item.year !== 1990 && item.year !== 2026).map((item) => <button key={item.year} onClick={() => goTo(item.year)} className={item.year === year ? 'current' : ''} style={{ left: `${((item.year - 1990) / 36) * 100}%` }}>{item.year}</button>)}<span>2026</span></div></div><button className="timeline-arrow" onClick={() => setYear(Math.min(2026, year + 1))} aria-label={copy.nextYear}><ArrowRight size={17} /></button></div></div>
}
