import { Canvas } from '@react-three/fiber'
import {
  Suspense,
  useEffect,
  useRef,
  useState,
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
import { useCopy } from '../i18n.ts'
import { ProjectDesktop } from './ProjectDesktop.tsx'
import { createGenie, type GenieInstance } from 'genie-web'
import { captureDesktop, warmup } from './desktopGenie.ts'
import './World.css'

/** Same genie timing as the menu (Menu.tsx): the panel warps out of the tile. */
const GENIE_MS = 560
/** Fraction of the warp after which the real panel fades in underneath. */
const HANDOFF = 0.72

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b)

const COPY = {
  es: {
    h1: 'Alejandro Chávez — Desarrollador Full-Stack e Ingeniero de IA',
    tag: ['Desarrollador Full-Stack', 'Ingeniero de IA'],
    scroll: 'Desliza',
    hintMouse: 'Haz click en un proyecto',
    hintTouch: 'Toca un proyecto',
  },
  en: {
    h1: 'Alejandro Chávez — Full-Stack Developer & AI Engineer',
    tag: ['Full-Stack Developer', 'AI Engineer'],
    scroll: 'Scroll',
    hintMouse: 'Click a project',
    hintTouch: 'Tap a project',
  },
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
const isBackdrop = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.tagName === 'DIALOG' || t.hasAttribute('data-backdrop'))

/** Hero + About in one 3D world, then the projects as a DOM collage layered over
 *  the canvas. Clicking a tile opens a glass detail panel (native modal <dialog>). */
export function World() {
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
  const genie = useRef<GenieInstance | null>(null)
  /** The running show() (a close waits for it) and whether a hide is running. */
  const opening = useRef<Promise<void> | null>(null)
  const closing = useRef(false)

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
  const tileOf = (i: number | null) =>
    i === null ? null : (collageRef.current?.querySelector<HTMLElement>(`.tile[data-index="${i}"]`) ?? null)

  // Genie: the panel maximizes out of the clicked tile and minimizes back into
  // the tile of the project on screen. The snapshot is painted by captureDesktop
  // (backdrop-filter can't be captured from the DOM).
  useEffect(() => {
    const d = dialogRef.current
    if (!d || !collageRef.current) return
    const g = createGenie({
      target: d,
      origin: collageRef.current,
      open: false,
      direction: 'auto',
      duration: GENIE_MS,
      easing: 'linear',
      zIndex: 50,
      capture: captureDesktop,
    })
    genie.current = g
    return () => {
      g.destroy()
      genie.current = null
    }
  }, [])

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
      // Keep the real panel invisible until the warp hands over to it.
      d.style.setProperty('visibility', 'hidden', 'important')
      d.showModal()
      // A visibility:hidden element can't take focus: focus once it's shown.
      const focusIn = () => {
        if (!d.contains(document.activeElement)) closeRef.current?.focus({ preventScroll: true })
      }
      const g = genie.current
      // lastIdx was just set by the effect above (same commit, runs first).
      const tile = tileOf(lastIdx.current)
      if (!g || !tile) {
        d.style.removeProperty('visibility')
        focusIn()
        return
      }
      g.set({ origin: tile })
      let handoff = 0
      opening.current = warmup(d).then(() => {
        const shown = g.show()
        handoff = window.setTimeout(() => {
          d.style.setProperty('visibility', 'visible', 'important')
          d.animate([{ opacity: 0 }, { opacity: 1 }], { duration: GENIE_MS * (1 - HANDOFF), easing: 'ease-out' })
          focusIn()
        }, GENIE_MS * HANDOFF)
        return shown
      })
      void opening.current.finally(() => {
        window.clearTimeout(handoff)
        d.style.setProperty('visibility', 'visible', 'important')
        focusIn()
        opening.current = null
      })
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
  // Minimize back into the tile, then really close (the effect above).
  const close = () => {
    const g = genie.current
    const d = dialogRef.current
    const tile = tileOf(lastIdx.current)
    if (!g || !d?.open || !tile) return setSelectedIdx(null)
    if (closing.current) return
    closing.current = true
    void (async () => {
      await opening.current?.catch(() => {})
      g.set({ origin: tile })
      await g.hide().catch(() => {})
      closing.current = false
      setSelectedIdx(null)
    })()
  }
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
      // Only rendered ones: minimized windows / inactive tabs are `hidden`.
      const items = [...(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter(
        (el) => el.getClientRects().length > 0,
      )
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

  // Click on the empty desktop (the dialog or an element marked data-backdrop),
  // outside every window — press and release both there, so dragging a window
  // and releasing over the wallpaper doesn't close it.
  const onBackdrop = (e: MouseEvent<HTMLDialogElement>) => {
    if (isBackdrop(e.target) && downOnBackdrop.current) close()
    downOnBackdrop.current = false
  }

  // Horizontal swipe (touch) → previous / next project. Not from inside the
  // screenshot viewer or a draggable window bar ([data-noswipe]).
  const onSwipeStart = (e: ReactPointerEvent) => {
    const noSwipe = e.target instanceof Element && !!e.target.closest('[data-noswipe]')
    swipe.current = e.pointerType === 'mouse' || noSwipe ? null : { x: e.clientX, y: e.clientY }
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

        {/* Detail panel — a full-screen Y2K "desktop" with draggable windows (ProjectDesktop). */}
        <dialog
          ref={dialogRef}
          className="detail"
          aria-label={p?.title}
          onCancel={(e) => {
            e.preventDefault()
            close()
          }}
          onClose={() => setSelectedIdx(null)}
          onPointerDown={(e) => (downOnBackdrop.current = isBackdrop(e.target))}
          onClick={onBackdrop}
          onKeyDown={onKeyDown}
        >
          {p && (
            <ProjectDesktop
              project={p}
              index={selectedIdx!}
              total={PROJECTS.length}
              onStep={step}
              onClose={close}
              closeRef={closeRef}
              swipe={{ onPointerDown: onSwipeStart, onPointerUp: onSwipeEnd, onPointerCancel: () => (swipe.current = null) }}
            />
          )}
        </dialog>
      </div>
    </section>
  )
}
