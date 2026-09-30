import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { createGenie, type GenieInstance } from 'genie-web'
import { useLang, setLang, tr, LANGS } from '../i18n.ts'
import { SECTIONS, currentSection, goToSection } from './sections.ts'
import { Blink } from './y2k.tsx'
import { ContactLinks } from './Contact.tsx'
import './Menu.css'

/** How long the "/ → arrow" shot plays before the jump. */
const SHOOT_MS = 260

const GENIE_MS = 560
/** Fraction of the maximize after which the real window starts fading in underneath. */
const HANDOFF = 0.72

/** Snapshot resolution vs the viewport (it's blurred anyway, so half is plenty). */
const SNAP_SCALE = 0.5

/** Paint what the liquid-glass window looks like right now: the 3D scene behind
 *  it, blurred + saturated, with the same tint and sheen as `.menu__win`.
 *  genie-web warps this bitmap; `backdrop-filter` can't be captured from the DOM. */
async function captureGlass(): Promise<HTMLCanvasElement> {
  const w = Math.round(window.innerWidth * SNAP_SCALE)
  const h = Math.round(window.innerHeight * SNAP_SCALE)
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const ctx = out.getContext('2d')!
  ctx.fillStyle = '#050506'
  ctx.fillRect(0, 0, w, h)

  const scene = document.querySelector<HTMLCanvasElement>('.world__canvas canvas')
  if (scene) {
    ctx.filter = `blur(${34 * SNAP_SCALE}px) saturate(170%) brightness(0.9)`
    // Overdraw the edges so the blur doesn't fade to transparent at the borders.
    const pad = 40 * SNAP_SCALE
    ctx.drawImage(scene, -pad, -pad, w + pad * 2, h + pad * 2)
    ctx.filter = 'none'
  }

  const tint = (x: number, y: number, r: number, color: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, color)
    g.addColorStop(1, 'transparent')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }
  ctx.fillStyle = 'rgba(18, 18, 26, 0.32)'
  ctx.fillRect(0, 0, w, h)
  tint(w * 0.85, 0, w * 0.7, 'rgba(139, 184, 255, 0.14)')
  tint(0, h, w * 0.55, 'rgba(255, 143, 208, 0.1)')
  const sheen = ctx.createLinearGradient(0, 0, 0, h * 0.22)
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.1)')
  sheen.addColorStop(1, 'transparent')
  ctx.fillStyle = sheen
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1)
  return out
}

/** Top-right chrome hamburger + full-screen liquid-glass window that maximizes
 *  out of / minimizes into the button with the macOS genie effect (genie-web).
 *  The window lists the sections as `/paths`; on hover / click the slash
 *  morphs into a chrome arrow → and a click jumps there. */
export function Menu() {
  const lang = useLang()
  const [open, setOpen] = useState(false)
  const [here, setHere] = useState('home')
  const [going, setGoing] = useState<string | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const winRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const genie = useRef<GenieInstance | null>(null)

  // Deep link (#projects…) on load: wait for the lazy sections to lay out.
  useEffect(() => {
    const id = location.hash.slice(1)
    if (!SECTIONS.some((s) => s.id === id)) return
    const t = window.setTimeout(() => goToSection(id), 400)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!winRef.current || !btnRef.current) return
    const g = createGenie({
      target: winRef.current,
      origin: btnRef.current,
      open: false,
      direction: 'top',
      duration: GENIE_MS,
      // Linear keeps the funnel moving; easing stalls it near-full at both ends.
      easing: 'linear',
      // Above the page, below the hamburger (z 60) so it reads as the "icon".
      zIndex: 58,
      capture: captureGlass,
    })
    genie.current = g
    winRef.current.dataset.ready = ''
    return () => g.destroy()
  }, [])

  const wasOpen = useRef(false)
  useEffect(() => {
    const g = genie.current
    if (!g || open === wasOpen.current) return
    wasOpen.current = open
    const win = winRef.current!
    if (!open) {
      void g.hide()
      return
    }
    void g.show()
    // The mesh's far corner lands last; fade the real window in *under* the
    // overlay for the final stretch so that sliver is filled and the swap is seamless.
    const t = window.setTimeout(() => {
      win.style.setProperty('visibility', 'visible', 'important')
      win.animate([{ opacity: 0 }, { opacity: 1 }], { duration: GENIE_MS * (1 - HANDOFF), easing: 'ease-out' })
    }, GENIE_MS * HANDOFF)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key !== 'Tab') return
      // Keep Tab inside the window + its close button.
      const stops = [btnRef.current!, ...winRef.current!.querySelectorAll<HTMLElement>('a, button')]
      const i = stops.indexOf(document.activeElement as HTMLElement)
      const next = e.shiftKey ? (i <= 0 ? stops.length - 1 : i - 1) : (i + 1) % stops.length
      e.preventDefault()
      stops[next].focus()
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    // Focus the current section's link once the window has landed.
    const t = window.setTimeout(
      () => navRef.current?.querySelector<HTMLElement>('[aria-current]')?.focus({ preventScroll: true }),
      GENIE_MS,
    )
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
    }
  }, [open])

  const toggle = () => {
    if (!open) setHere(currentSection())
    setGoing(null)
    setOpen((o) => !o)
  }

  const go = (e: MouseEvent, id: string) => {
    e.preventDefault()
    if (going) return
    setGoing(id)
    // The arrow shoots right, then jump under the glass and minimize.
    window.setTimeout(() => {
      goToSection(id)
      setOpen(false)
      btnRef.current?.focus({ preventScroll: true })
    }, SHOOT_MS)
  }

  return (
    <>
      <button
        ref={btnRef}
        className="menu-btn"
        data-open={open}
        onClick={toggle}
        aria-label={lang === 'es' ? (open ? 'Cerrar menú' : 'Abrir menú') : open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="site-menu"
      >
        <span className="menu-btn__bars" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </button>

      <div id="site-menu" className="menu" data-open={open} aria-hidden={!open} inert={!open}>
        <div ref={winRef} className="menu__win">
          <div className="menu__lang" role="group" aria-label={lang === 'es' ? 'Idioma' : 'Language'}>
            {LANGS.map((l) => (
              <button key={l} type="button" lang={l} aria-pressed={lang === l} onClick={() => setLang(l)}>
                {l}
              </button>
            ))}
          </div>
          <nav ref={navRef} className="menu__nav" aria-label={lang === 'es' ? 'Secciones' : 'Sections'}>
            <ol className="menu__list" data-going={going !== null}>
              {SECTIONS.map((s, i) => (
                <li key={s.id} style={{ '--i': i } as CSSProperties}>
                  <a
                    className="mlink"
                    href={`#${s.id}`}
                    onClick={(e) => go(e, s.id)}
                    aria-current={here === s.id ? 'location' : undefined}
                    data-go={going === s.id}
                  >
                    <span className="mlink__idx" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {/* "/" at rest → chrome arrow on hover / focus / click. */}
                    <span className="mlink__glyph" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className="mlink__path" data-text={s.id}>
                      <span className="y2k-chrome">{s.id}</span>
                    </span>
                    <span className="mlink__label">
                      {here === s.id && <Blink />}
                      {tr(s.label, lang)}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
            <ContactLinks className="menu__socials" />
          </nav>
        </div>
      </div>
    </>
  )
}
