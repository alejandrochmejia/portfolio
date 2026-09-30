import { Canvas } from '@react-three/fiber'
import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { WorldScene } from './WorldScene.tsx'
import { PROJECTS } from './projectsData.ts'
import { ProjectsCollage } from './ProjectsCollage.tsx'
import { AboutHud } from './AboutHud.tsx'
import { track, FIELD_IN, FIELD_OUT } from './choreography.ts'
import { QUALITY } from './quality.ts'
import { tr, useCopy, useLang } from '../i18n.ts'
import { WindowDots } from './y2k.tsx'
import './World.css'

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b)
const pad = (n: number) => String(n).padStart(2, '0')

const COPY = {
  es: {
    h1: 'Alejandro Chávez — Desarrollador Full-Stack e Ingeniero de IA',
    tag: ['Desarrollador Full-Stack', 'Ingeniero de IA'],
    scroll: 'Desliza',
    hintMouse: 'Haz click en un proyecto',
    hintTouch: 'Toca un proyecto',
    close: 'Cerrar',
    prev: 'Proyecto anterior',
    next: 'Proyecto siguiente',
    openSite: 'Abrir sitio ↗',
    viewCode: 'Ver código ↗',
    contribution: 'Mi aporte',
    demo: 'Demo ↗',
    code: 'Código ↗',
  },
  en: {
    h1: 'Alejandro Chávez — Full-Stack Developer & AI Engineer',
    tag: ['Full-Stack Developer', 'AI Engineer'],
    scroll: 'Scroll',
    hintMouse: 'Click a project',
    hintTouch: 'Tap a project',
    close: 'Close',
    prev: 'Previous project',
    next: 'Next project',
    openSite: 'Open live site ↗',
    viewCode: 'View code ↗',
    contribution: 'My contribution',
    demo: 'Demo ↗',
    code: 'Code ↗',
  },
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Hero + About in one 3D world, then the projects as a DOM collage layered over
 *  the canvas. Clicking a tile opens a glass detail panel (native modal <dialog>). */
export function World() {
  const lang = useLang()
  const t = useCopy(COPY)
  const sectionRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const collageRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const downOnBackdrop = useRef(false)
  const lastIdx = useRef<number | null>(null)
  const progress = useRef(0)

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [phase, setPhase] = useState<'name' | 'about' | 'field' | 'none'>('name')
  const [past, setPast] = useState(false)

  // Scroll → progress (drives hero exit + field appear/exit in the scene).
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = sectionRef.current
      if (!el) return
      // Pinned distance = section − pin height (both in svh), not innerHeight:
      // iOS changes innerHeight as the URL bar hides, which made progress jump.
      const pinH = pinRef.current?.offsetHeight ?? window.innerHeight
      const total = Math.max(1, el.offsetHeight - pinH)
      const p = clamp(-el.getBoundingClientRect().top / total, 0, 1)
      progress.current = p
      // Collage parallax: 0→1 across the projects phase (enter → exit).
      collageRef.current?.style.setProperty('--t', track(p, FIELD_IN[0], FIELD_OUT[1]).toFixed(4))
      // hero → about (curved marquee) → projects, along the pinned scroll.
      setPhase(p < 0.13 ? 'name' : p < 0.45 ? 'about' : p < 0.93 ? 'field' : 'none')
      setPast(el.getBoundingClientRect().bottom <= window.innerHeight * 0.4)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // Pointer parallax for the collage (CSS vars, no re-render). Mouse only: on
  // touch a tap would make the whole collage jump.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const el = collageRef.current
      if (!el) return
      el.style.setProperty('--mx', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3))
      el.style.setProperty('--my', ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3))
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  // Open/close the native modal dialog from state. showModal() gives us the top
  // layer (above the sticky pin's overflow clip), inert background and Escape
  // (→ `cancel`); focus goes to the close button, and on close back to the tile
  // of the project last shown (the opener, or where prev/next left off).
  const open = selectedIdx !== null
  useEffect(() => {
    if (selectedIdx === null) return
    lastIdx.current = selectedIdx
    // prev/next re-mounts the panel body: if focus was in there, keep it in the dialog.
    const d = dialogRef.current
    if (d?.open && !d.contains(document.activeElement)) closeRef.current?.focus()
  }, [selectedIdx])
  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (open && !d.open) {
      d.showModal()
      closeRef.current?.focus()
    } else if (!open && d.open) {
      d.close()
      const tile = collageRef.current?.querySelector<HTMLElement>(`.tile[data-index="${lastIdx.current}"]`)
      tile?.focus({ preventScroll: true })
    }
  }, [open])

  // Lock page scroll while the detail panel is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const select = (i: number) => setSelectedIdx(i)
  const close = () => setSelectedIdx(null)
  const step = (dir: 1 | -1) =>
    setSelectedIdx((i) => (i === null ? i : (i + dir + PROJECTS.length) % PROJECTS.length))

  const onKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      step(-1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      step(1)
    } else if (e.key === 'Tab') {
      // Keep Tab cycling inside the panel (the native modal lets it escape to
      // the browser chrome).
      const items = [...(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])]
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  // Click on the dialog itself = on the dimmed backdrop, outside the card
  // (press and release both there, so a drag out of the card doesn't close it).
  const onBackdrop = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget && downOnBackdrop.current) close()
    downOnBackdrop.current = false
  }

  // Horizontal swipe (touch) → previous / next project.
  const onSwipeStart = (e: ReactPointerEvent) => {
    swipe.current = e.pointerType === 'mouse' ? null : { x: e.clientX, y: e.clientY }
  }
  const onSwipeEnd = (e: ReactPointerEvent) => {
    const s = swipe.current
    swipe.current = null
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1)
  }

  const p = selectedIdx !== null ? PROJECTS[selectedIdx] : null
  const contribution = p?.contribution ? tr(p.contribution, lang) : null

  return (
    <section className="world" ref={sectionRef}>
      <h1 className="world__sr">{t.h1}</h1>

      <div className="world__pin" ref={pinRef}>
        <Canvas
          className="world__canvas"
          aria-hidden="true"
          dpr={[1, QUALITY.maxDpr]}
          camera={{ position: [0, 0, 6], fov: 42 }}
          // preserveDrawingBuffer: the menu's genie snapshot reads this canvas (Menu.tsx).
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
          frameloop={past ? 'never' : 'always'}
        >
          <Suspense fallback={null}>
            <WorldScene progress={progress} />
          </Suspense>
        </Canvas>

        <div className="world__overlay" data-phase={phase} data-open={open}>
          <AboutHud />

          <p className="world__tag">
            <span>{t.tag[0]}</span>
            <span className="world__dot" aria-hidden="true">
              ·
            </span>
            <span>{t.tag[1]}</span>
          </p>
          <div className="world__hint" aria-hidden="true" data-phase={phase}>
            {phase === 'field' ? (
              <>
                <span className="world__hint-mouse">{t.hintMouse}</span>
                <span className="world__hint-touch">{t.hintTouch}</span>
              </>
            ) : (
              <>
                {t.scroll} <span className="world__arrow">↓</span>
              </>
            )}
          </div>
        </div>

        <ProjectsCollage ref={collageRef} active={phase === 'field' && !open} onSelect={select} />

        {/* Detail panel — glass frame with a preview + the write-up. */}
        <dialog
          ref={dialogRef}
          className="detail"
          aria-label={p?.title}
          onCancel={(e) => {
            e.preventDefault()
            close()
          }}
          onClose={() => setSelectedIdx(null)}
          onPointerDown={(e) => (downOnBackdrop.current = e.target === e.currentTarget)}
          onClick={onBackdrop}
          onKeyDown={onKeyDown}
        >
          {p && (
            <div
              className="detail__card"
              onPointerDown={onSwipeStart}
              onPointerUp={onSwipeEnd}
              onPointerCancel={() => (swipe.current = null)}
            >
              {/* Window bar: counter + prev/next + close (sticky on phones). */}
              <div className="detail__bar">
                <WindowDots />
                <span className="detail__count" aria-live="polite">
                  {pad(selectedIdx! + 1)} / {pad(PROJECTS.length)}
                </span>
                <div className="detail__nav">
                  <button type="button" className="detail__btn" onClick={() => step(-1)} aria-label={t.prev}>
                    ‹
                  </button>
                  <button type="button" className="detail__btn" onClick={() => step(1)} aria-label={t.next}>
                    ›
                  </button>
                  <button
                    type="button"
                    ref={closeRef}
                    className="detail__btn detail__close"
                    onClick={close}
                    aria-label={t.close}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div
                key={`pv-${selectedIdx}`}
                className="detail__preview"
                data-demo={!!p.demo}
                style={{ '--accent': p.accent } as CSSProperties}
              >
                {p.demo ? (
                  <>
                    <div className="detail__preview-glow" />
                    <span className="detail__preview-label">{new URL(p.demo).host}</span>
                    <a className="detail__open" href={p.demo} target="_blank" rel="noreferrer">
                      {t.openSite}
                    </a>
                  </>
                ) : (
                  <>
                    <img className="detail__preview-icon" src={p.icon} alt="" />
                    {p.repo && (
                      <a className="detail__open" href={p.repo} target="_blank" rel="noreferrer">
                        {t.viewCode}
                      </a>
                    )}
                  </>
                )}
              </div>

              <div key={`in-${selectedIdx}`} className="detail__info">
                <h2 className="detail__title">{p.title}</h2>
                <p className="detail__role">
                  {tr(p.role, lang)} · {p.year}
                </p>
                <p className="detail__what">{tr(p.blurb, lang)}</p>
                {contribution && (
                  <p className="detail__did">
                    <strong>{t.contribution}</strong>
                    {contribution}
                  </p>
                )}
                {p.stack.length > 0 && (
                  <ul className="detail__stack">
                    {p.stack.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                )}
                <div className="detail__links">
                  {p.demo && (
                    <a href={p.demo} target="_blank" rel="noreferrer">
                      {t.demo}
                    </a>
                  )}
                  {p.repo && (
                    <a href={p.repo} target="_blank" rel="noreferrer">
                      {t.code}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </dialog>
      </div>
    </section>
  )
}
