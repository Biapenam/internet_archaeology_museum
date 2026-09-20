import { useEffect, useRef } from 'react'

type Props = { label: string; onDismiss: () => void; children: React.ReactNode }

export function ModalShell({ label, onDismiss, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const dismissRef = useRef(onDismiss)
  dismissRef.current = onDismiss
  const returnFocus = useRef<HTMLElement | null>(null)
  useEffect(() => {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const background = [...document.querySelectorAll<HTMLElement>('main, header, footer, .play-dock')]
    const previous = background.map((node) => node.inert)
    background.forEach((node) => { node.inert = true })
    ref.current?.querySelector<HTMLElement>('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); dismissRef.current(); return }
      if (event.key !== 'Tab' || !ref.current) return
      const items = [...ref.current.querySelectorAll<HTMLElement>('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      if (!items.length) return
      const first = items[0], last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      background.forEach((node, index) => { node.inert = previous[index] })
      returnFocus.current?.focus()
    }
  }, [])
  return <div className="modal-backdrop" onClick={onDismiss}><div ref={ref} role="dialog" aria-modal="true" aria-label={label}>{children}</div></div>
}
