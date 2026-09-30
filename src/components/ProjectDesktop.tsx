import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import type { Project } from './projectsData.ts'
import { SHOTS, type Shot } from './projectShots.ts'
import { tr, useCopy, useLang, type Lang } from '../i18n.ts'
import { useReducedMotion } from './useReducedMotion.ts'
import { ChromeStar, WindowDots } from './y2k.tsx'
import './ProjectDesktop.css'

/* "Y2K multi-window desktop" project detail. Lives inside World's native
   <dialog> (which owns focus, Escape, click-outside and ←/→ navigation).

   Three layouts, picked in JS (one source of truth, exposed as data-mode):
   - desk  (≥1025px wide and >500px tall): absolutely placed windows in a
     collage, draggable by their bar, click-to-front, double-click maximises,
     "–" minimises to a chip in the taskbar.
   - grid  (tablets 721–1024): static 2-column layout that scrolls, no drag.
   - tabs  (phones ≤720px and landscape phones ≤500px tall): one window at a
     time, picked from tabs in the taskbar. */

type WinId = 'screens' | 'role' | 'stack' | 'links'
type Mode = 'desk' | 'grid' | 'tabs'
type Offset = { x: number; y: number }

const FILES: Record<WinId, string> = {
  screens: 'screens.exe',
  role: 'my_role.log',
  stack: 'stack.sys',
  links: 'links.url',
}

const COPY = {
  es: {
    close: 'Cerrar',
    prev: 'Proyecto anterior',
    next: 'Proyecto siguiente',
    windows: 'Ventanas',
    minimized: 'Ventanas minimizadas',
    minimize: 'Minimizar',
    restore: 'Restaurar',
    tabs: { screens: 'Capturas', role: 'Mi rol', stack: 'Stack', links: 'Links' } as Record<WinId, string>,
    shots: 'Capturas',
    device: { desktop: 'Escritorio', mobile: 'Móvil' },
    scrollHint: 'captura desplazable',
    openSite: 'Abrir sitio',
    viewCode: 'Ver código',
    demo: 'Demo',
    code: 'Código',
    newTab: '(abre en una pestaña nueva)',
    highlights: 'Logros',
    contribution: 'Mi aporte',
  },
  en: {
    close: 'Close',
    prev: 'Previous project',
    next: 'Next project',
    windows: 'Windows',
    minimized: 'Minimized windows',
    minimize: 'Minimize',
    restore: 'Restore',
    tabs: { screens: 'Screens', role: 'My role', stack: 'Stack', links: 'Links' } as Record<WinId, string>,
    shots: 'Screenshots',
    device: { desktop: 'Desktop', mobile: 'Mobile' },
    scrollHint: 'scrollable screenshot',
    openSite: 'Open live site',
    viewCode: 'View code',
    demo: 'Demo',
    code: 'Code',
    newTab: '(opens in a new tab)',
    highlights: 'Highlights',
    contribution: 'My contribution',
  },
}
type Copy = (typeof COPY)['es']

const pad = (n: number) => String(n).padStart(2, '0')
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b)

/* ---- Layout mode: matchMedia stores (module level, like useReducedMotion) ---- */
const TABS_Q = '(max-width: 720px), (max-height: 500px)'
const DESK_Q = '(min-width: 1025px) and (min-height: 501px)'
const mq = (q: string) => (typeof matchMedia !== 'undefined' ? matchMedia(q) : null)
const tabsList = mq(TABS_Q)
const deskList = mq(DESK_Q)
const modeSubscribe = (cb: () => void) => {
  tabsList?.addEventListener('change', cb)
  deskList?.addEventListener('change', cb)
  return () => {
    tabsList?.removeEventListener('change', cb)
    deskList?.removeEventListener('change', cb)
  }
}
const modeGet = (): Mode => (tabsList?.matches ? 'tabs' : deskList?.matches ? 'desk' : 'grid')
const useMode = () => useSyncExternalStore(modeSubscribe, modeGet, () => 'desk' as Mode)

/** Host (+ path for repos) shown in the browser frame's URL bar. */
function hostOf(url?: string) {
  if (!url) return ''
  const u = new URL(url)
  return u.host + (u.pathname === '/' ? '' : u.pathname)
}

type SwipeHandlers = {
  onPointerDown: (e: ReactPointerEvent) => void
  onPointerUp: (e: ReactPointerEvent) => void
  onPointerCancel: () => void
}

type Props = {
  project: Project
  index: number
  total: number
  onStep: (dir: 1 | -1) => void
  onClose: () => void
  /** World focuses this on open (and when focus is lost on prev/next). */
  closeRef: RefObject<HTMLButtonElement | null>
  /** Horizontal swipe → prev/next (World ignores gestures starting in [data-noswipe]). */
  swipe: SwipeHandlers
}

export function ProjectDesktop({ project: p, index, total, onStep, onClose, closeRef, swipe }: Props) {
  const lang = useLang()
  const t = useCopy(COPY)
  const mode = useMode()
  const reduced = useReducedMotion()
  const uid = useId()
  const deskRef = useRef<HTMLDivElement>(null)
  const winEls = useRef<Partial<Record<WinId, HTMLElement | null>>>({})
  const drag = useRef<{
    id: WinId
    el: HTMLElement
    px: number
    py: number
    ox: number
    oy: number
    minX: number
    maxX: number
    minY: number
    maxY: number
    x: number
    y: number
  } | null>(null)

  // Window state persists across projects (your arrangement stays as you flip).
  const [offsets, setOffsets] = useState<Partial<Record<WinId, Offset>>>({})
  const [order, setOrder] = useState<WinId[]>(['links', 'stack', 'role', 'screens'])
  const [minimized, setMinimized] = useState<WinId[]>([])
  const [maxed, setMaxed] = useState<WinId | null>(null)
  const [tab, setTab] = useState<WinId>('screens')

  const hasStack = p.stack.length > 0
  const hasLinks = !!(p.demo || p.repo)
  const wins: WinId[] = ['screens', 'role', ...(hasStack ? (['stack'] as const) : []), ...(hasLinks ? (['links'] as const) : [])]
  const activeTab = wins.includes(tab) ? tab : 'screens'
  const url = p.demo ?? p.repo
  const host = hostOf(url)

  // Pixel offsets are relative to %-based slots: a resize would push dragged
  // windows off the desk, so start from the default layout again.
  useEffect(() => {
    const reset = () => setOffsets({})
    window.addEventListener('resize', reset)
    return () => window.removeEventListener('resize', reset)
  }, [])

  const front = (id: WinId) => setOrder((o) => (o[o.length - 1] === id ? o : [...o.filter((w) => w !== id), id]))

  const minimize = (id: WinId) => {
    setMinimized((m) => [...m, id])
    if (maxed === id) setMaxed(null)
    // Focus follows the window into its taskbar chip.
    requestAnimationFrame(() => document.getElementById(`${uid}-chip-${id}`)?.focus())
  }
  const restore = (id: WinId) => {
    setMinimized((m) => m.filter((w) => w !== id))
    front(id)
    requestAnimationFrame(() => winEls.current[id]?.focus())
  }

  /* ---- Drag by the window bar (desk mode only), written straight to the
     element's `translate` while moving; committed to state on release. ---- */
  const onBarDown = (id: WinId, e: ReactPointerEvent<HTMLElement>) => {
    if (mode !== 'desk' || e.button !== 0 || maxed === id) return
    if ((e.target as Element).closest('button')) return
    const el = winEls.current[id]
    const desk = deskRef.current
    if (!el || !desk) return
    const r = el.getBoundingClientRect()
    const d = desk.getBoundingClientRect()
    const o = offsets[id] ?? { x: 0, y: 0 }
    const minX = o.x + (d.left - r.left)
    const maxX = o.x + (d.right - r.right)
    const minY = o.y + (d.top - r.top)
    const maxY = o.y + (d.bottom - r.bottom)
    drag.current = {
      id,
      el,
      px: e.clientX,
      py: e.clientY,
      ox: o.x,
      oy: o.y,
      minX: Math.min(minX, o.x),
      maxX: Math.max(maxX, o.x),
      minY: Math.min(minY, o.y),
      maxY: Math.max(maxY, o.y),
      x: o.x,
      y: o.y,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    el.dataset.dragging = 'true'
    e.preventDefault()
  }
  const onBarMove = (e: ReactPointerEvent<HTMLElement>) => {
    const g = drag.current
    if (!g) return
    g.x = clamp(g.ox + e.clientX - g.px, g.minX, g.maxX)
    g.y = clamp(g.oy + e.clientY - g.py, g.minY, g.maxY)
    g.el.style.translate = `${g.x}px ${g.y}px`
  }
  const onBarUp = () => {
    const g = drag.current
    if (!g) return
    drag.current = null
    delete g.el.dataset.dragging
    setOffsets((o) => ({ ...o, [g.id]: { x: g.x, y: g.y } }))
  }

  // Tabs (phones): roving tabindex; ←/→ move between tabs here instead of
  // switching project (stopPropagation keeps the dialog's handler out).
  const onTabsKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = wins.indexOf(activeTab)
    let next = -1
    if (e.key === 'ArrowRight') next = (i + 1) % wins.length
    else if (e.key === 'ArrowLeft') next = (i - 1 + wins.length) % wins.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = wins.length - 1
    if (next < 0) return
    e.preventDefault()
    e.stopPropagation()
    setTab(wins[next])
    document.getElementById(`${uid}-tab-${wins[next]}`)?.focus()
  }

  const renderWin = (id: WinId, i: number, body: ReactNode) => {
    const isTabs = mode === 'tabs'
    const off = mode === 'desk' && maxed !== id ? offsets[id] : undefined
    const hidden = isTabs ? id !== activeTab : minimized.includes(id)
    const titleId = `${uid}-title-${id}`
    return (
      <section
        key={`${p.title}-${id}`}
        id={`${uid}-win-${id}`}
        ref={(el) => {
          winEls.current[id] = el
        }}
        className={`pdw pdw--${id}`}
        aria-labelledby={titleId}
        role={isTabs ? 'tabpanel' : undefined}
        tabIndex={-1}
        hidden={hidden}
        data-max={mode === 'desk' && maxed === id}
        style={
          {
            '--i': i,
            zIndex: mode === 'desk' ? 10 + order.indexOf(id) + (maxed === id ? 20 : 0) : undefined,
            translate: off ? `${off.x}px ${off.y}px` : undefined,
          } as CSSProperties
        }
        onPointerDownCapture={() => front(id)}
        onFocus={() => front(id)}
      >
        <header
          className="pdw__bar"
          data-noswipe={mode === 'desk' ? '' : undefined}
          onPointerDown={(e) => onBarDown(id, e)}
          onPointerMove={onBarMove}
          onPointerUp={onBarUp}
          onPointerCancel={onBarUp}
          onDoubleClick={(e) => {
            if (mode !== 'desk' || (e.target as Element).closest('button')) return
            setMaxed((m) => (m === id ? null : id))
            front(id)
          }}
        >
          <WindowDots />
          <h3 className="pdw__name" id={titleId}>
            {FILES[id]}
          </h3>
          {!isTabs && (
            <button
              type="button"
              className="pdw__min"
              onClick={() => minimize(id)}
              aria-label={`${t.minimize} ${FILES[id]}`}
            >
              <span aria-hidden="true">–</span>
            </button>
          )}
        </header>
        <div className="pdw__body">{body}</div>
      </section>
    )
  }

  const shots = SHOTS[p.title] ?? []
  const contribution = p.contribution ? tr(p.contribution, lang) : null
  const highlights = p.highlights ?? []

  return (
    <div
      className="pd"
      data-mode={mode}
      data-backdrop={mode === 'desk' ? '' : undefined}
      style={{ '--accent': p.accent } as CSSProperties}
      {...swipe}
    >
      {/* Taskbar: dots · counter · (tabs | minimized chips) · ‹ › ✕ */}
      <div className="pd__bar">
        <div className="pd__id">
          <WindowDots />
          <span className="pd__count" aria-live="polite">
            {pad(index + 1)} / {pad(total)}
          </span>
          <span className="pd__bar-title" aria-hidden="true">
            {p.title}
          </span>
        </div>

        {mode === 'tabs' ? (
          <div className="pd__tabs" role="tablist" aria-label={t.windows} onKeyDown={onTabsKey}>
            {wins.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`${uid}-tab-${id}`}
                className="pd__tab"
                aria-selected={id === activeTab}
                aria-controls={`${uid}-win-${id}`}
                tabIndex={id === activeTab ? 0 : -1}
                onClick={() => setTab(id)}
              >
                {t.tabs[id]}
              </button>
            ))}
          </div>
        ) : (
          minimized.some((id) => wins.includes(id)) && (
            <div className="pd__chips" role="group" aria-label={t.minimized}>
              {minimized
                .filter((id) => wins.includes(id))
                .map((id) => (
                  <button
                    key={id}
                    type="button"
                    id={`${uid}-chip-${id}`}
                    className="pd__chip"
                    onClick={() => restore(id)}
                    aria-label={`${t.restore} ${FILES[id]}`}
                  >
                    <WindowDots />
                    <span>{FILES[id]}</span>
                  </button>
                ))}
            </div>
          )
        )}

        <div className="pd__nav">
          <button type="button" className="pd__btn" onClick={() => onStep(-1)} aria-label={t.prev}>
            ‹
          </button>
          <button type="button" className="pd__btn" onClick={() => onStep(1)} aria-label={t.next}>
            ›
          </button>
          <button type="button" ref={closeRef} className="pd__btn pd__close" onClick={onClose} aria-label={t.close}>
            ✕
          </button>
        </div>
      </div>

      <div className="pd__desk" ref={deskRef} data-backdrop={mode === 'desk' ? '' : undefined}>
        {/* Wallpaper: the project's name in chrome (behind the windows on desktop). */}
        <div className="pd__wall" key={`wall-${p.title}`} style={{ '--len': p.title.length } as CSSProperties}>
          <h2 className="pd__title y2k-chrome">{p.title}</h2>
          <ChromeStar className="pd__star" />
        </div>

        {renderWin(
          'screens',
          0,
          <Screens key={p.title} project={p} shots={shots} host={host} url={url} reduced={reduced} lang={lang} t={t} />,
        )}

        {renderWin(
          'role',
          1,
          <div className="pdr">
            <p className="pdr__prompt" aria-hidden="true">
              C:\&gt; type {FILES.role}
            </p>
            <p className="pdr__title">
              {tr(p.role, lang)} · {p.year}
            </p>
            <p className="pdr__blurb">{tr(p.blurb, lang)}</p>
            {highlights.length > 0 ? (
              <ol className="pdr__list" aria-label={t.highlights}>
                {highlights.map((h, i) => (
                  <li key={i} className="pdr__line" style={{ '--i': i } as CSSProperties}>
                    <span className="pdr__num" aria-hidden="true">
                      {pad(i + 1)} &gt;
                    </span>
                    <span>{tr(h, lang)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              contribution && (
                <p className="pdr__did pdr__line" style={{ '--i': 0 } as CSSProperties}>
                  <strong>{t.contribution}</strong>
                  {contribution}
                </p>
              )
            )}
            <span className="pdr__caret" aria-hidden="true" />
          </div>,
        )}

        {hasStack &&
          renderWin(
            'stack',
            2,
            <ul className="pdst">
              {p.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>,
          )}

        {hasLinks &&
          renderWin(
            'links',
            3,
            <div className="pdl">
              {p.demo && (
                <a className="pdl__btn" href={p.demo} target="_blank" rel="noreferrer">
                  {t.demo} <span aria-hidden="true">↗</span>
                  <span className="pd__sr">{t.newTab}</span>
                </a>
              )}
              {p.repo && (
                <a className="pdl__btn" href={p.repo} target="_blank" rel="noreferrer">
                  {t.code} <span aria-hidden="true">↗</span>
                  <span className="pd__sr">{t.newTab}</span>
                </a>
              )}
            </div>,
          )}
      </div>
    </div>
  )
}

/* ---------------------------- screens.exe ---------------------------- */

type ScreensProps = {
  project: Project
  shots: Shot[]
  host: string
  url?: string
  reduced: boolean
  lang: Lang
  t: Copy
}

function Screens({ project: p, shots, host, url, reduced, lang, t }: ScreensProps) {
  // Phones open on the mobile capture (a desktop one is unreadable at 390px).
  const [cur, setCur] = useState(() => {
    const narrow = typeof matchMedia !== 'undefined' && matchMedia('(max-width: 720px)').matches
    return narrow ? Math.max(0, shots.findIndex((s) => s.device === 'mobile')) : 0
  })
  const shot = shots[cur] ?? shots[0]

  if (!shot) {
    // No captures yet: the project's icon, big, lit with its accent + a CTA.
    return (
      <div className="pds">
        <div className="pds__stage">
          <div className="pds__browser">
            <BrowserChrome host={host} />
            <div className="pds__empty">
              <img className="pds__icon" src={p.icon} alt="" />
              {url && (
                <a className="pdl__btn" href={url} target="_blank" rel="noreferrer">
                  {p.demo ? t.openSite : t.viewCode} <span aria-hidden="true">↗</span>
                  <span className="pd__sr">{t.newTab}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const alt = tr(shot.label, lang)
  const view = <ShotView key={shot.src} shot={shot} alt={alt} eager={cur === 0} auto={!reduced} hint={t.scrollHint} />

  return (
    <div className="pds">
      <div className="pds__stage" data-device={shot.device}>
        {shot.device === 'mobile' ? (
          <div className="pds__phone">
            <span className="pds__notch" aria-hidden="true" />
            {view}
          </div>
        ) : (
          <div className="pds__browser">
            <BrowserChrome host={host} />
            {view}
          </div>
        )}
      </div>

      {shots.length > 1 && (
        <div className="pds__shots" role="group" aria-label={t.shots}>
          {shots.map((s, i) => (
            <button
              key={s.src}
              type="button"
              className="pds__shot"
              aria-pressed={i === cur}
              onClick={() => setCur(i)}
            >
              <span className="pds__dev" data-device={s.device} aria-hidden="true" />
              <span className="pd__sr">{t.device[s.device]}: </span>
              {tr(s.label, lang)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function BrowserChrome({ host }: { host: string }) {
  return (
    <div className="pds__chrome">
      <span className="pds__ctl" aria-hidden="true">
        ◀
      </span>
      <span className="pds__ctl" aria-hidden="true">
        ▶
      </span>
      <span className="pds__ctl" aria-hidden="true">
        ⟳
      </span>
      <span className="pds__url">{host}</span>
    </div>
  )
}

/** A full-page capture cropped to the frame: slow auto-scroll down and back
 *  (pauses on hover/focus/user scroll; off with reduced motion), wheel/touch
 *  scroll, and mouse drag-to-scroll. */
function ShotView({ shot, alt, eager, auto, hint }: { shot: Shot; alt: string; eager: boolean; auto: boolean; hint: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const grab = useRef<{ y: number; top: number } | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !auto) return
    let raf = 0
    let last = performance.now()
    let pos = el.scrollTop
    let dir = 1
    let hold = 1400 // initial pause so the top of the page reads first
    let hover = false
    let focus = false
    let userUntil = 0
    const user = () => (userUntil = performance.now() + 3500)
    const tick = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      const max = el.scrollHeight - el.clientHeight
      if (hover || focus || now < userUntil || max <= 2) {
        pos = el.scrollTop
        hold = Math.max(hold, 700)
      } else if (hold > 0) {
        hold -= dt
      } else {
        // ~18 s down whatever the page length; back up 3× faster.
        const speed = clamp(max / 18, 24, 90) * (dir < 0 ? 3 : 1)
        pos += (dir * speed * dt) / 1000
        if (pos >= max) {
          pos = max
          dir = -1
          hold = 1800
        } else if (pos <= 0) {
          pos = 0
          dir = 1
          hold = 2600
        }
        el.scrollTop = pos
      }
      raf = requestAnimationFrame(tick)
    }
    const enter = (e: PointerEvent) => e.pointerType === 'mouse' && (hover = true)
    const leave = (e: PointerEvent) => e.pointerType === 'mouse' && (hover = false)
    const fin = () => (focus = true)
    const fout = () => (focus = false)
    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointerleave', leave)
    el.addEventListener('focusin', fin)
    el.addEventListener('focusout', fout)
    el.addEventListener('wheel', user, { passive: true })
    el.addEventListener('touchstart', user, { passive: true })
    el.addEventListener('pointerdown', user)
    el.addEventListener('keydown', user)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointerenter', enter)
      el.removeEventListener('pointerleave', leave)
      el.removeEventListener('focusin', fin)
      el.removeEventListener('focusout', fout)
      el.removeEventListener('wheel', user)
      el.removeEventListener('touchstart', user)
      el.removeEventListener('pointerdown', user)
      el.removeEventListener('keydown', user)
    }
  }, [auto])

  // Mouse drag-to-scroll (touch already scrolls natively).
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    grab.current = { y: e.clientY, top: e.currentTarget.scrollTop }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.currentTarget.dataset.grabbing = 'true'
  }
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = grab.current
    if (g) e.currentTarget.scrollTop = g.top - (e.clientY - g.y)
  }
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    grab.current = null
    delete e.currentTarget.dataset.grabbing
  }

  return (
    <div
      ref={ref}
      className="pds__view"
      tabIndex={0}
      role="region"
      aria-label={`${alt} — ${hint}`}
      data-noswipe=""
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <img
        src={shot.src}
        width={shot.w}
        height={shot.h}
        alt={alt}
        draggable={false}
        loading={eager ? 'eager' : 'lazy'}
        decoding={eager ? 'auto' : 'async'}
      />
    </div>
  )
}
