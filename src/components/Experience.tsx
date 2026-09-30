import { useEffect, useId, useRef, type CSSProperties } from 'react'
import { EXPERIENCE, KIND_LABEL, fmtMonth, fmtRange, type Experience as Exp } from './experienceData.ts'
import { track } from './choreography.ts'
import { tr, useLang, type Lang } from '../i18n.ts'
import { Blink, ChromeStar, RingBadge, SegLoader } from './y2k.tsx'
import './Experience.css'

const pad = (n: number) => String(n).padStart(2, '0')
const ease = (t: number) => 1 - (1 - t) ** 3

/** Same query as the one-column layout in Experience.css (mobile, tablet, landscape phone). */
const COMPACT = '(max-width: 1024px), (max-height: 500px)'
/** A tap that moved more than this (finger or page scroll) since pointerdown isn't a toggle. */
const TAP_SLOP = 10

const COPY = {
  es: {
    title: 'Experiencia',
    skills: 'Habilidades',
    now: 'Hoy',
    nowPlaying: 'Sonando',
    reading: 'Leyendo disco…',
    hint: {
      clickClose: '⏏ Click para cerrar',
      clickOpen: '▶ Click para abrir',
      tapClose: '⏏ Toca para cerrar',
      tapOpen: '▶ Toca para abrir',
    },
  },
  en: {
    title: 'Experience',
    skills: 'Skills',
    now: 'Now',
    nowPlaying: 'Now playing',
    reading: 'Reading disc…',
    hint: {
      clickClose: '⏏ Click to close',
      clickOpen: '▶ Click to open',
      tapClose: '⏏ Tap to close',
      tapOpen: '▶ Tap to open',
    },
  },
}
type Copy = (typeof COPY)[Lang]

/** Experience as a zig-zag timeline of CD jewel cases (most recent first).
 *  Each case opens with the scroll — lid swings on its spine, the disc slides
 *  out towards the timeline and spins — next to a short summary.
 *  Experience.tsx writes per row: --v (scrolled in 0..1), --o (open 0..1), --d (disc out), --py (parallax),
 *  [data-near] (row close to the viewport → will-change); on each visible .cd__spin: --rot (disc spin);
 *  on the header: --ti (title in); on the line: --p (timeline fill).
 *  Once opened by the scroll, clicking/tapping a case closes it (and reopens it).
 *  The case is decorative (aria-hidden): everything it prints is also in the notes. */
export function Experience() {
  const lang = useLang()
  const t = COPY[lang]
  const sectionRef = useRef<HTMLElement>(null)
  const headRef = useRef<HTMLElement>(null)
  const lineRef = useRef<HTMLSpanElement>(null)
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const el = sectionRef.current!
    const head = headRef.current!
    const line = lineRef.current!
    const list = listRef.current!
    const rows = [...list.querySelectorAll<HTMLElement>('.xp__row')]
    const spins = rows.map((row) => row.querySelector<HTMLElement>('.cd__spin')!)
    const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mqCompact = window.matchMedia(COMPACT)
    let reduced = mqReduced.matches
    let compact = mqCompact.matches
    let raf = 0
    // Click-to-close: once the scroll has opened a case, clicking it closes it
    // (and clicking again reopens it), tweened over TWEEN ms.
    const TWEEN = 750
    const closed = rows.map(() => false)
    const shown = rows.map(() => 0)
    const tween: ({ from: number; t0: number } | null)[] = rows.map(() => null)

    // Only touch the DOM when a value actually changes (custom props inherit,
    // so every write restyles the subtree).
    const caches = new Map<HTMLElement, Record<string, string>>()
    const put = (node: HTMLElement, key: string, value: string) => {
      let c = caches.get(node)
      if (!c) caches.set(node, (c = {}))
      if (c[key] === value) return
      c[key] = value
      if (key.startsWith('--')) node.style.setProperty(key, value)
      else node.setAttribute(key, value)
    }

    const update = () => {
      raf = 0
      const vh = window.innerHeight
      // ---- Reads (all layout queries first, no writes in between) ----
      const sr = el.getBoundingClientRect()
      if (sr.top > vh * 1.5 || sr.bottom < -vh * 0.5) return
      const lr = list.getBoundingClientRect()
      const rects = rows.map((row) => row.getBoundingClientRect())
      const scrollY = window.scrollY

      // ---- Writes ----
      put(head, '--ti', ease(track(vh - sr.top, vh * 0.15, vh * 0.7)).toFixed(3))
      put(line, '--p', track(vh * 0.55 - lr.top, 0, lr.height).toFixed(4))
      const spin = reduced || compact ? '0' : (scrollY * 0.3).toFixed(1)
      const tweenMs = reduced ? 0 : TWEEN
      const now = performance.now()
      let animating = false
      rows.forEach((row, i) => {
        const r = rects[i]
        const c = r.top + r.height / 2
        const near = r.bottom > -vh * 0.5 && r.top < vh * 1.5
        const scrolled = reduced ? 1 : ease(track(c, vh * 1.02, vh * 0.52))
        // Scrolled back out of view: hand the case back to the scroll.
        if (closed[i] && scrolled < 0.05) closed[i] = false
        const target = closed[i] ? 0 : scrolled
        let o = target
        const tw = tween[i]
        if (tw) {
          const k = tweenMs ? track(now - tw.t0, 0, tweenMs) : 1
          o = tw.from + (target - tw.from) * ease(k)
          if (k < 1) animating = true
          else tween[i] = null
        }
        shown[i] = o
        put(row, '--v', scrolled.toFixed(3))
        put(row, '--o', o.toFixed(3))
        put(row, '--d', ease(track(o, 0.35, 1)).toFixed(3))
        put(row, 'data-near', String(near))
        put(row, 'data-open', String(o > 0.7))
        put(row, 'data-closed', String(closed[i]))
        put(row, 'data-toggle', String(closed[i] || scrolled > 0.7))
        if (near) put(row, '--py', reduced ? '0' : ((c - vh / 2) / vh).toFixed(3))
        // Scroll-driven spin only on the discs actually on screen (desktop only).
        if (r.bottom > 0 && r.top < vh) put(spins[i], '--rot', spin)
      })
      if (animating) raf = requestAnimationFrame(update)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    const toggle = (target: EventTarget | null) => {
      const row = (target as Element | null)?.closest<HTMLElement>('.cd')?.closest<HTMLElement>('.xp__row')
      const i = row ? rows.indexOf(row) : -1
      if (i < 0 || row!.dataset.toggle !== 'true') return
      closed[i] = !closed[i]
      tween[i] = { from: shown[i], t0: performance.now() }
      onScroll()
    }
    // Ignore the click that ends a drag / scroll gesture (touch especially).
    let down: { x: number; y: number; sy: number } | null = null
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY, sy: window.scrollY }
    }
    const onClick = (e: MouseEvent) => {
      const d = down
      down = null
      if (d && (Math.abs(window.scrollY - d.sy) > TAP_SLOP || Math.hypot(e.clientX - d.x, e.clientY - d.y) > TAP_SLOP))
        return
      toggle(e.target)
    }
    const onReduced = () => {
      reduced = mqReduced.matches
      onScroll()
    }
    const onCompact = () => {
      compact = mqCompact.matches
      onScroll()
    }
    list.addEventListener('pointerdown', onDown, { passive: true })
    list.addEventListener('click', onClick)
    mqReduced.addEventListener('change', onReduced)
    mqCompact.addEventListener('change', onCompact)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    update()
    return () => {
      list.removeEventListener('pointerdown', onDown)
      list.removeEventListener('click', onClick)
      mqReduced.removeEventListener('change', onReduced)
      mqCompact.removeEventListener('change', onCompact)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section className="xp" ref={sectionRef} aria-labelledby="xp-title">
      {/* Sticky full-screen vignette over the site backdrop. */}
      <div className="xp__bg" aria-hidden="true">
        <div className="xp__crt" />
      </div>

      <header className="xp__head" ref={headRef}>
        <h2 id="xp-title" className="xp__title y2k-chrome">
          {t.title}
          <sup aria-hidden="true">✦</sup>
        </h2>
        <ChromeStar className="xp__spark xp__spark--l" />
        <ChromeStar className="xp__spark xp__spark--r" />
      </header>

      <div className="xp__track">
        <span className="xp__line" ref={lineRef} aria-hidden="true">
          <i className="xp__line-fill" />
          <i className="xp__line-head" />
        </span>
        <ol className="xp__list" ref={listRef}>
          {EXPERIENCE.map((x, i) => (
            <Row key={`${x.org}-${x.start}`} x={x} i={i} lang={lang} t={t} />
          ))}
        </ol>
      </div>
    </section>
  )
}

function Row({ x, i, lang, t }: { x: Exp; i: number; lang: Lang; t: Copy }) {
  const side = i % 2 === 0 ? 'left' : 'right'
  const year = x.current ? t.now : x.start.slice(0, 4)
  return (
    <li
      className="xp__row"
      data-side={side}
      data-open="false"
      data-plate={x.plate ?? false}
      style={{ '--a': x.tint[0], '--b': x.tint[1], '--dir': side === 'left' ? 1 : -1 } as CSSProperties}
    >
      <span className="xp__node" aria-hidden="true">
        <i />
        <b>{year}</b>
      </span>

      <div className="xp__cdcol">
        <CdCase x={x} i={i} lang={lang} t={t} />
        <Decor i={i} t={t} />
      </div>

      <article className="xp__notes">
        <p className="xp__kind">
          {x.current && <Blink />}
          {x.kind === 'education' && <span className="xp__badge">{tr(KIND_LABEL[x.kind], lang)}</span>}
          <span>
            <time dateTime={x.start}>{fmtMonth(x.start, lang)}</time>
            {' — '}
            {x.end ? <time dateTime={x.end}>{fmtMonth(x.end, lang)}</time> : fmtMonth(null, lang)}
          </span>
        </p>
        <h3 className="xp__org y2k-chrome">{x.org}</h3>
        <p className="xp__role">{tr(x.role, lang)}</p>
        <p className="xp__place">{tr(x.place, lang)}</p>
        <p className="xp__sum">{tr(x.summary, lang)}</p>
        <ul className="xp__tags" aria-label={t.skills}>
          {x.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </article>
    </li>
  )
}

/** CSS-3D jewel case: tray + disc + hinged lid (cover outside, booklet inside).
 *  Decorative for assistive tech (all its text is repeated in the notes), so it's
 *  aria-hidden and not focusable; pointer users can still click/tap it open/closed. */
function CdCase({ x, i, lang, t }: { x: Exp; i: number; lang: Lang; t: Copy }) {
  const id = useId()
  const range = fmtRange(x, lang)
  const role = tr(x.role, lang)
  const ring = `${x.org} ✦ ${range} ✦ ${role} ✦ `.toUpperCase()
  return (
    <div className="cd" aria-hidden="true">
      <div className="cd__case">
        <div className="cd__tray">
          <span className="cd__hub" />
        </div>

        <div className="cd__disc">
          <div className="cd__spin">
            <div className="cd__face">
              <span className="cd__label">
                <img src={x.logo} alt="" loading="lazy" />
              </span>
              <svg className="cd__ring" viewBox="0 0 200 200">
                <defs>
                  <path id={id} d="M100 100 m-74 0 a74 74 0 1 1 148 0 a74 74 0 1 1 -148 0" />
                </defs>
                <text>
                  <textPath href={`#${id}`} textLength="462">
                    {ring}
                  </textPath>
                </text>
              </svg>
              <span className="cd__hole" />
            </div>
          </div>
          {/* Fixed reflection: doesn't turn with the disc. */}
          <span className="cd__sheen" />
        </div>

        <div className="cd__lid">
          <div className="cd__front">
            <div className="cd__art">
              <span className="cd__art-grid" />
              <span className="cd__art-logo">
                <img src={x.logo} alt="" loading="lazy" />
              </span>
              <span className="cd__art-title">{x.org}</span>
              <span className="cd__art-sub">{range}</span>
              <span className="cd__sticker">{x.current ? t.nowPlaying : tr(KIND_LABEL[x.kind], lang)}</span>
              <span className="cd__art-num">CD {pad(i + 1)}</span>
            </div>
            <span className="cd__glass" />
          </div>
          <div className="cd__inner">
            <span className="cd__inner-k">Liner notes</span>
            <span className="cd__inner-t">{role}</span>
            <span className="cd__inner-s">{tr(x.place, lang)}</span>
            <span className="cd__inner-bc" />
          </div>
        </div>
      </div>
      <span className="cd__shadow" />
      <span
        className="cd__hint"
        data-click-close={t.hint.clickClose}
        data-click-open={t.hint.clickOpen}
        data-tap-close={t.hint.tapClose}
        data-tap-open={t.hint.tapOpen}
      />
    </div>
  )
}

/** Y2K filler around each case (parallax with --py), like the projects collage. */
function Decor({ i, t }: { i: number; t: Copy }) {
  if (i % 3 === 0)
    return (
      <>
        <RingBadge text="CAREER.CD ✦ NOW PLAYING ✦ " className="xp__decor xp__decor--badge" />
        <ChromeStar className="xp__decor xp__decor--star" />
      </>
    )
  if (i % 3 === 1)
    return (
      <>
        <span className="xp__decor xp__decor--load" aria-hidden="true">
          <span>{t.reading}</span>
          <SegLoader count={8} />
        </span>
        <ChromeStar className="xp__decor xp__decor--star" />
      </>
    )
  return (
    <>
      <span className="xp__decor xp__decor--cdr" aria-hidden="true">
        <b>CD-R</b>
        <span>700MB · 80 min</span>
        <span>Rewritable ✦ v3</span>
      </span>
      <ChromeStar className="xp__decor xp__decor--star" />
    </>
  )
}
