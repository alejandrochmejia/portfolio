import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { KIND, TECH } from './techData.ts'
import { track } from './choreography.ts'
import { Blink, ChromeStar } from './y2k.tsx'
import { useCopy, useLang } from '../i18n.ts'
import './TechStack.css'

/** Hits each block takes before it breaks (the first one cracks it). */
const HP = 2
const SHIP_SPEED = 560 // px/s with the arrow keys
const SHOT_SPEED = 820 // px/s
const COOLDOWN = 0.17 // s between shots while holding fire
/** Touch: a horizontal drag past this arms the game (smaller moves may be a scroll starting). */
const DRAG_PX = 6
/** Touch: max finger travel for a tap. */
const TAP_PX = 10
/** Touch: how long a finger has to stay down before it counts as "hold to fire". */
const HOLD_MS = 140

// "Tech stack" stays in English in both languages: it's the term Spanish-speaking devs use.
const COPY = {
  es: {
    stage:
      'Minijuego Stack Invaders: destruye los bloques para descubrir mi stack. ' +
      'Flechas izquierda y derecha o A y D para moverte, Espacio o flecha arriba para disparar, Esc para salir. ' +
      'En pantallas táctiles: toca para jugar, arrastra para moverte y mantén pulsado para disparar.',
    playFine: 'Clic para jugar',
    keysFine: 'Ratón / ← → para moverte · Clic / Espacio para disparar · Esc para salir',
    playCoarse: 'Toca para jugar',
    keysCoarse: 'Arrastra para moverte · Mantén para disparar',
    unlocked: 'Desbloqueado',
    score: 'Desbloqueadas',
    announce: 'desbloqueado',
    allUnlocked: 'Todos los sistemas desbloqueados',
    complete: 'Stack completo',
    again: 'Jugar de nuevo',
    list: 'Tecnologías que uso',
  },
  en: {
    stage:
      'Stack Invaders mini-game: destroy the blocks to discover my stack. ' +
      'Left and right arrows or A and D to move, Space or up arrow to fire, Esc to exit. ' +
      'On touch screens: tap to play, drag to move and hold to fire.',
    playFine: 'Click to play',
    keysFine: 'Mouse / ← → to move · Click / Space to fire · Esc to exit',
    playCoarse: 'Tap to play',
    keysCoarse: 'Drag to move · Hold to fire',
    unlocked: 'Unlocked',
    score: 'Unlocked',
    announce: 'unlocked',
    allUnlocked: 'All systems unlocked',
    complete: 'Stack complete',
    again: 'Play again',
    list: 'Technologies I use',
  },
}

type Block = { x: number; y: number; w: number; h: number; hp: number; flash: number; dead: boolean }
/** Per-block gradients, built in layout() instead of every frame. */
type Paint = { body: CanvasGradient; rim: CanvasGradient; gloss: CanvasGradient }
type Shot = { x: number; y: number }
type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number }

const pad = (n: number) => String(n).padStart(2, '0')
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b)
const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

/** Deterministic pseudo-random (per block), so cracks don't change on resize. */
const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}

/** Crack polylines in block-normalised coords (0..1), drawn after the first hit. */
const CRACKS = TECH.map((_, i) => {
  const rnd = seeded(i * 97 + 13)
  return Array.from({ length: 3 }, () => {
    let x = 0.3 + rnd() * 0.4
    let y = 0.3 + rnd() * 0.4
    const pts: [number, number][] = [[x, y]]
    for (let k = 0; k < 3; k++) {
      x = clamp(x + (rnd() - 0.5) * 0.5, 0.04, 0.96)
      y = clamp(y + (rnd() - 0.5) * 0.7, 0.06, 0.94)
      pts.push([x, y])
    }
    return pts
  })
})

const CHROME: [number, string][] = [
  [0, '#ffffff'],
  [0.28, '#7d8494'],
  [0.5, '#f3f5fa'],
  [0.74, '#4f5463'],
  [1, '#dfe3eb'],
]

type GameApi = { reset: () => void }

/** Logo sprite resolution; the glow is baked in once so frames don't pay for shadowBlur. */
const ICON_PX = 128
const ICON_PAD = 20

/** Fetch a Simple Icons SVG, tint it with the tech colour and bake a neon glow
 *  into an offscreen canvas that the game loop just drawImage()s. */
async function loadIcon(src: string, color: string): Promise<HTMLCanvasElement> {
  const svg = (await (await fetch(src)).text()).replace('<svg ', `<svg fill="${color}" width="${ICON_PX}" height="${ICON_PX}" `)
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await img.decode()
  const size = ICON_PX + ICON_PAD * 2
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  g.shadowColor = color
  g.shadowBlur = 16
  g.drawImage(img, ICON_PAD, ICON_PAD, ICON_PX, ICON_PX)
  g.shadowBlur = 0
  g.drawImage(img, ICON_PAD, ICON_PAD, ICON_PX, ICON_PX)
  return c
}

/** "Stack Invaders": a Space-Invaders-style mini-game on a 2D canvas inside a
 *  Y2K OS window. Each static block hides a technology; destroying it reveals
 *  the name (big chrome text) and adds it to the inventory below. Mouse moves
 *  the ship + click fires; ← → / A D move and Space / ↑ fire. On touch a tap
 *  or a horizontal drag arms it; then drag moves and holding fires. */
export function TechStack() {
  const t = useCopy(COPY)
  const lang = useLang()
  const sectionRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const api = useRef<GameApi | null>(null)

  const [found, setFound] = useState<number[]>([])
  const [reveal, setReveal] = useState<{ i: number; key: number } | null>(null)
  const [armed, setArmed] = useState(false)

  // Scroll-driven CRT transition. The section is taller than the screen and its
  // content is pinned: it powers on while arriving and powers off while leaving.
  useEffect(() => {
    const el = sectionRef.current!
    const pin = pinRef.current!
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ease = (t: number) => 1 - (1 - t) ** 3
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const LINE = 0.006 // collapsed height (a 1–2px line)
    const DOT = 0.004 // collapsed width (a dot)
    let raf = 0
    const update = () => {
      raf = 0
      // The pin's real height (100svh), not innerHeight: on mobile they differ
      // while the browser bars show/hide, and the CSS heights are in svh.
      const vh = pin.offsetHeight || window.innerHeight
      const total = Math.max(1, el.offsetHeight - vh)
      const y = -el.getBoundingClientRect().top
      const e = track(y, -0.35 * vh, 0.5 * vh) // entry
      const o = track(y, total - 0.6 * vh, total) // exit
      let title = ease(track(e, 0.55, 1)) * (1 - ease(track(o, 0, 0.35)))
      let sx = 1
      let sy = 1
      let fade = Math.min(track(e, 0, 0.3), 1 - track(o, 0.7, 1))
      // Reduced motion uses a shorter section, where entry and exit overlap: the title just follows the fade.
      if (reduced) title = fade
      else {
        // on: dot → horizontal line → full screen; off: the same, backwards.
        sx = Math.max(DOT, Math.min(ease(track(e, 0.05, 0.4)), 1 - ease(track(o, 0.45, 0.8))))
        sy = Math.min(lerp(LINE, 1, ease(track(e, 0.4, 0.8))), lerp(1, LINE, ease(track(o, 0, 0.45))))
        fade = Math.min(track(e, 0, 0.06), 1 - track(o, 0.85, 1))
      }
      const s = el.style
      s.setProperty('--sx', sx.toFixed(4))
      s.setProperty('--sy', sy.toFixed(4))
      s.setProperty('--fade', fade.toFixed(3))
      s.setProperty('--beam', reduced ? '0' : ((1 - sy) ** 2).toFixed(3))
      s.setProperty('--ti', title.toFixed(3))
      s.setProperty('--lift', track(o, 0, 0.35).toFixed(3))
      el.dataset.fx = (e > 0 && e < 1) || (o > 0 && o < 1) ? 'on' : 'off'
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

  useEffect(() => {
    const section = sectionRef.current!
    const stage = stageRef.current!
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let W = 0
    let H = 0
    let dpr = 1
    let s = 22 // ship half-width
    const blocks: Block[] = TECH.map(() => ({ x: 0, y: 0, w: 0, h: 0, hp: HP, flash: 0, dead: false }))
    const ship = { x: 0, y: 0, tilt: 0 }
    let target: number | null = null
    const keys = { left: false, right: false, fire: false }
    let pointerFire = false
    let isArmed = false
    let shots: Shot[] = []
    let sparks: Spark[] = []
    let cool = 0
    let shake = 0
    let time = 0
    let revealKey = 0
    // Touch gesture in progress (a finger that went down on the stage).
    let touch: { id: number; x0: number; y0: number; dragged: boolean; timer: number } | null = null
    // Cached gradients (rebuilt in layout()).
    let paints: Paint[] = []
    let floorFade: CanvasGradient | null = null
    let hullGrad: CanvasGradient | null = null
    let cockpitGrad: CanvasGradient | null = null
    // The loop shows a still frame while idle (CRT transition, or reduced motion before playing).
    let still = false
    const stars = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random() }))
    const icons: (HTMLCanvasElement | undefined)[] = []
    let alive = true
    TECH.forEach((t, i) =>
      loadIcon(t.icon, t.color)
        .then((c) => {
          if (!alive) return
          icons[i] = c
          redraw()
        })
        .catch(() => {}),
    )

    const arm = (v: boolean) => {
      if (isArmed === v) return
      isArmed = v
      setArmed(v)
    }

    // ---- Layout: blocks centred in rows, ship near the bottom ----
    const layout = () => {
      // client* ignores the CRT transition's scale transform.
      W = stage.clientWidth
      H = stage.clientHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      s = clamp(Math.min(W * 0.03, H * 0.07), 14, 26)

      // More columns on wide/short stages (landscape phones, short laptops) so
      // the blocks don't end up as flat strips with tiny logos.
      const n = blocks.length
      const aspect = W / Math.max(H, 1)
      const cols = aspect > 2.6 ? 10 : aspect > 1.95 ? 7 : W < 520 ? 4 : 5
      const rows = Math.ceil(n / cols)
      const gap = clamp(Math.min(W * 0.016, H * 0.03), 6, 16)
      const side = W * (cols > 5 ? 0.05 : 0.07)
      const area = H * (aspect < 0.9 ? 0.56 : 0.5)
      const bw = Math.min(150, (W - side * 2 - gap * (cols - 1)) / cols)
      const bh = Math.min(bw * (cols > 5 ? 0.64 : 0.52), (area - gap * (rows - 1)) / rows)
      const top = H * (H < 320 ? 0.07 : 0.1)
      blocks.forEach((b, i) => {
        const row = Math.floor(i / cols)
        const col = i % cols
        const inRow = row === rows - 1 ? n - row * cols : cols
        const x0 = (W - (inRow * bw + (inRow - 1) * gap)) / 2
        b.x = x0 + col * (bw + gap)
        b.y = top + row * (bh + gap)
        b.w = bw
        b.h = bh
      })
      ship.y = H - Math.max(s * 2, H * 0.11)
      ship.x = ship.x ? clamp(ship.x, s, W - s) : W / 2

      // The hint / reveal sit in the gap between the last row and the ship.
      const blocksBottom = top + rows * bh + (rows - 1) * gap
      stage.style.setProperty('--hint-y', `${Math.round((blocksBottom + ship.y - s * 1.1) / 2)}px`)

      paints = blocks.map((b, i) => {
        const c = TECH[i].color
        const body = ctx.createLinearGradient(0, b.y, 0, b.y + b.h)
        body.addColorStop(0, rgba(c, 0.38))
        body.addColorStop(1, rgba(c, 0.06))
        const gloss = ctx.createLinearGradient(0, b.y, 0, b.y + b.h * 0.45)
        gloss.addColorStop(0, 'rgba(255, 255, 255, 0.28)')
        gloss.addColorStop(1, 'rgba(255, 255, 255, 0)')
        return { body, rim: chromeGradient(b.x, b.y, b.x + b.w, b.y + b.h), gloss }
      })
      const horizon = H * 0.66
      floorFade = ctx.createLinearGradient(0, horizon, 0, H)
      floorFade.addColorStop(0, 'rgba(139, 184, 255, 0)')
      floorFade.addColorStop(1, 'rgba(139, 184, 255, 0.28)')
      // Ship gradients are in its local (translated) coords, so they only depend on `s`.
      hullGrad = chromeGradient(-s, -s, s, s)
      cockpitGrad = ctx.createLinearGradient(0, -s * 0.55, 0, s * 0.2)
      cockpitGrad.addColorStop(0, '#ff8fd0')
      cockpitGrad.addColorStop(1, '#8bb8ff')
    }

    // ---- Effects ----
    const burst = (x: number, y: number, color: string, count: number, power: number) => {
      for (let k = 0; k < count; k++) {
        const a = Math.random() * Math.PI * 2
        const v = power * (0.3 + Math.random() * 0.7)
        const max = 0.4 + Math.random() * 0.6
        sparks.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - power * 0.25,
          life: max,
          max,
          color: Math.random() < 0.3 ? '#ffffff' : color,
          size: 2 + Math.random() * 3,
        })
      }
    }

    const kill = (i: number) => {
      const b = blocks[i]
      if (b.dead) return
      b.dead = true
      b.hp = 0
      burst(b.x + b.w / 2, b.y + b.h / 2, TECH[i].color, 38, 340)
      if (!reduced) shake = 9
      setFound((f) => (f.includes(i) ? f : [...f, i]))
      setReveal({ i, key: ++revealKey })
    }

    const hit = (i: number, x: number, y: number) => {
      const b = blocks[i]
      b.hp--
      b.flash = 1
      if (b.hp <= 0) kill(i)
      else burst(x, y, TECH[i].color, 8, 160)
    }

    const fire = () => {
      if (cool > 0) return
      cool = COOLDOWN
      shots.push({ x: ship.x, y: ship.y - s * 1.1 })
    }

    // ---- Update ----
    const update = (dt: number) => {
      time += dt
      const prev = ship.x
      const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0)
      if (dir) {
        target = null
        ship.x += dir * SHIP_SPEED * dt
      } else if (target !== null) {
        ship.x += (target - ship.x) * Math.min(1, dt * 12)
      }
      ship.x = clamp(ship.x, s, W - s)
      const vx = (ship.x - prev) / Math.max(dt, 1e-4)
      ship.tilt += (clamp(vx / 900, -1, 1) - ship.tilt) * Math.min(1, dt * 10)

      cool -= dt
      if (keys.fire || pointerFire) fire()

      shots = shots.filter((sh) => {
        sh.y -= SHOT_SPEED * dt
        if (sh.y < -20) return false
        for (let i = 0; i < blocks.length; i++) {
          const b = blocks[i]
          if (!b.dead && sh.x >= b.x && sh.x <= b.x + b.w && sh.y >= b.y && sh.y <= b.y + b.h) {
            hit(i, sh.x, b.y + b.h)
            return false
          }
        }
        return true
      })

      sparks = sparks.filter((p) => {
        p.life -= dt
        p.vx *= 1 - dt * 2.2
        p.vy = p.vy * (1 - dt * 2.2) + 420 * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        return p.life > 0
      })

      for (const b of blocks) b.flash = Math.max(0, b.flash - dt * 6)
      shake = Math.max(0, shake - dt * 40)
    }

    // ---- Draw ----
    const chromeGradient = (x0: number, y0: number, x1: number, y1: number) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1)
      for (const [o, c] of CHROME) g.addColorStop(o, c)
      return g
    }

    const drawBackdrop = () => {
      for (const st of stars) {
        const y = ((st.y + time * 0.015 * (0.4 + st.z)) % 1) * H
        const tw = 0.6 + 0.4 * Math.sin(time * 3 + st.x * 60)
        ctx.fillStyle = `rgba(220, 230, 255, ${(0.15 + 0.55 * st.z) * tw})`
        const size = 0.6 + st.z * 1.4
        ctx.fillRect(st.x * W, y, size, size)
      }

      // Y2K perspective grid floor, scrolling towards the viewer.
      const horizon = H * 0.66
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, horizon, W, H - horizon)
      ctx.clip()
      ctx.strokeStyle = floorFade!
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let k = -12; k <= 12; k++) {
        ctx.moveTo(W / 2 + k * W * 0.02, horizon)
        ctx.lineTo(W / 2 + k * W * 0.16, H)
      }
      const phase = (time * 0.35) % 1
      for (let k = 0; k < 9; k++) {
        const t = (k + phase) / 9
        const y = horizon + (H - horizon) * t * t
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
      }
      ctx.stroke()
      ctx.restore()
    }

    const drawBlock = (b: Block, i: number) => {
      const c = TECH[i].color
      const paint = paints[i]
      const r = Math.max(0, Math.min(12, b.h * 0.24))

      ctx.beginPath()
      ctx.roundRect(b.x, b.y, b.w, b.h, r)
      ctx.fillStyle = '#0b0d13'
      ctx.fill()
      ctx.fillStyle = paint.body
      ctx.fill()
      ctx.lineWidth = 1.5
      ctx.strokeStyle = paint.rim
      ctx.stroke()

      // Glossy bubble highlight on the top half.
      ctx.beginPath()
      ctx.roundRect(b.x + 3, b.y + 3, b.w - 6, b.h * 0.42, [Math.max(0, r - 2), Math.max(0, r - 2), r * 0.6, r * 0.6])
      ctx.fillStyle = paint.gloss
      ctx.fill()

      // Logo (or a "?" until it loads) + hex tag + HP pips.
      const icon = icons[i]
      if (icon) {
        // Short blocks give the logo a bigger share so it stays readable (≥ ~16px).
        const logo = Math.min(b.h * (b.h < 44 ? 0.62 : 0.5), b.w * 0.6)
        const scale = logo / ICON_PX
        const full = icon.width * scale
        ctx.globalAlpha = b.hp < HP ? 0.7 : 1
        ctx.drawImage(icon, b.x + (b.w - full) / 2, b.y + b.h * 0.54 - full / 2, full, full)
        ctx.globalAlpha = 1
      } else {
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = `${Math.round(b.h * 0.52)}px Anton, Impact, sans-serif`
        ctx.fillStyle = rgba(c, 0.95)
        ctx.fillText('?', b.x + b.w / 2, b.y + b.h * 0.56)
      }
      ctx.textBaseline = 'middle'

      // The hex tag is decoration: on short blocks it would crowd the logo.
      if (b.h >= 36) {
        const tag = clamp(b.h * 0.15, 7, 10)
        ctx.font = `${tag}px ui-monospace, Consolas, monospace`
        ctx.textAlign = 'left'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.fillText(`0x${(i + 1).toString(16).toUpperCase().padStart(2, '0')}`, b.x + 7, b.y + tag + 3)
      }
      for (let k = 0; k < HP; k++) {
        ctx.fillStyle = k < b.hp ? rgba(c, 0.95) : 'rgba(255, 255, 255, 0.15)'
        ctx.fillRect(b.x + b.w - 8 - (HP - k) * 7, b.y + b.h - 8, 5, 3)
      }

      if (b.hp < HP) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'
        ctx.lineWidth = 1
        ctx.beginPath()
        for (const line of CRACKS[i]) {
          line.forEach(([u, v], k) => {
            const x = b.x + u * b.w
            const y = b.y + v * b.h
            if (k) ctx.lineTo(x, y)
            else ctx.moveTo(x, y)
          })
        }
        ctx.stroke()
      }

      if (b.flash > 0) {
        ctx.beginPath()
        ctx.roundRect(b.x, b.y, b.w, b.h, r)
        ctx.fillStyle = `rgba(255, 255, 255, ${b.flash * 0.6})`
        ctx.fill()
      }
    }

    const drawShip = () => {
      ctx.save()
      ctx.translate(ship.x, ship.y)
      ctx.rotate(ship.tilt * 0.22)

      // Engine flame.
      const flick = 0.75 + 0.25 * Math.sin(time * 42) * Math.sin(time * 17)
      const fl = ctx.createLinearGradient(0, s * 0.5, 0, s * (0.5 + 1.2 * flick))
      fl.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
      fl.addColorStop(0.3, 'rgba(139, 184, 255, 0.85)')
      fl.addColorStop(1, 'rgba(255, 143, 208, 0)')
      ctx.fillStyle = fl
      ctx.beginPath()
      ctx.moveTo(-s * 0.2, s * 0.55)
      ctx.lineTo(0, s * (0.55 + 1.2 * flick))
      ctx.lineTo(s * 0.2, s * 0.55)
      ctx.fill()

      // Chrome hull.
      ctx.beginPath()
      ctx.moveTo(0, -s * 1.1)
      ctx.lineTo(s * 0.28, -s * 0.3)
      ctx.lineTo(s * 1.0, s * 0.3)
      ctx.lineTo(s * 0.95, s * 0.62)
      ctx.lineTo(s * 0.3, s * 0.42)
      ctx.lineTo(s * 0.2, s * 0.62)
      ctx.lineTo(-s * 0.2, s * 0.62)
      ctx.lineTo(-s * 0.3, s * 0.42)
      ctx.lineTo(-s * 0.95, s * 0.62)
      ctx.lineTo(-s * 1.0, s * 0.3)
      ctx.lineTo(-s * 0.28, -s * 0.3)
      ctx.closePath()
      ctx.fillStyle = hullGrad!
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Cockpit bubble.
      ctx.fillStyle = cockpitGrad!
      ctx.beginPath()
      ctx.ellipse(0, -s * 0.15, s * 0.16, s * 0.36, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.beginPath()
      ctx.ellipse(-s * 0.05, -s * 0.3, s * 0.05, s * 0.12, 0, 0, Math.PI * 2)
      ctx.fill()

      // Wing-tip lights.
      const on = Math.sin(time * 6) > 0
      ctx.fillStyle = on ? '#ff8fd0' : 'rgba(255, 143, 208, 0.3)'
      ctx.fillRect(-s * 0.98, s * 0.3, 3, 3)
      ctx.fillStyle = !on ? '#8bb8ff' : 'rgba(139, 184, 255, 0.3)'
      ctx.fillRect(s * 0.98 - 3, s * 0.3, 3, 3)
      ctx.restore()
    }

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      drawBackdrop()

      ctx.save()
      if (shake) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake)
      blocks.forEach((b, i) => !b.dead && drawBlock(b, i))

      for (const sh of shots) {
        ctx.fillStyle = 'rgba(255, 143, 208, 0.3)'
        ctx.fillRect(sh.x - 3, sh.y - 4, 6, 20)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(sh.x - 1, sh.y, 2, 14)
      }

      drawShip()

      ctx.globalCompositeOperation = 'lighter'
      for (const p of sparks) {
        const k = p.life / p.max
        ctx.globalAlpha = k
        ctx.fillStyle = p.color
        const sz = p.size * (0.4 + k * 0.6)
        ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz)
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
      ctx.restore()
    }

    // ---- Loop (only while the stage is on screen) ----
    let raf = 0
    let last = 0
    let visible = false
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      // Idle: during the scroll CRT transition (the screen is scaled/filtered,
      // nobody is playing) and, with reduced motion, until the player arms the
      // game. One still frame, no stars / grid / sparks moving.
      if (section.dataset.fx === 'on' || (reduced && !isArmed)) {
        if (!still) {
          draw()
          still = true
        }
        return
      }
      still = false
      update(dt)
      draw()
    }
    /** Repaint after a change outside the loop (icons, fonts, resize, reset). */
    const redraw = () => {
      still = false
      if (!raf) draw()
    }
    const start = () => {
      if (raf) return
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting
        if (visible) start()
        else {
          stop()
          arm(false)
          releaseAll()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(stage)

    const ro = new ResizeObserver(() => {
      layout()
      redraw()
    })
    ro.observe(stage)
    layout()
    void document.fonts?.load('40px Anton').then(() => alive && redraw())

    // ---- Input ----
    const localX = (e: PointerEvent) => e.clientX - stage.getBoundingClientRect().left
    const shoot = (e: PointerEvent) => {
      arm(true)
      target = localX(e)
      cool = Math.min(cool, 0)
      fire()
    }
    /** Touch: once armed, a finger that stays down fires continuously. */
    const holdToFire = () => {
      if (!touch) return
      clearTimeout(touch.timer)
      touch.timer = window.setTimeout(() => {
        pointerFire = true
      }, HOLD_MS)
    }
    const releaseAll = () => {
      keys.left = keys.right = keys.fire = false
      pointerFire = false
      if (touch) clearTimeout(touch.timer)
      touch = null
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') {
        target = localX(e)
        return
      }
      if (!touch || e.pointerId !== touch.id) return
      const dx = e.clientX - touch.x0
      if (Math.abs(dx) > DRAG_PX) {
        // A horizontal drag arms the game (a vertical one is a scroll: the
        // browser takes it over with touch-action: pan-y and sends pointercancel).
        if (!isArmed && Math.abs(dx) <= Math.abs(e.clientY - touch.y0)) return
        if (!touch.dragged && !isArmed) {
          arm(true)
          holdToFire()
        }
        touch.dragged = true
      }
      if (isArmed) target = localX(e)
    }
    const onDown = (e: PointerEvent) => {
      // Clicks on overlay buttons (Play again) shouldn't fire a shot.
      if (e.button !== 0 || (e.target as Element).closest('button')) return
      if (e.pointerType === 'touch') {
        // Don't fire yet: this finger may be starting a page scroll.
        if (touch) clearTimeout(touch.timer)
        touch = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dragged: false, timer: 0 }
        if (isArmed) {
          target = localX(e)
          holdToFire()
        }
        return
      }
      shoot(e)
      pointerFire = true
    }
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') {
        pointerFire = false
        return
      }
      if (!touch || e.pointerId !== touch.id) return
      clearTimeout(touch.timer)
      const tap =
        e.type === 'pointerup' &&
        !touch.dragged &&
        Math.abs(e.clientX - touch.x0) < TAP_PX &&
        Math.abs(e.clientY - touch.y0) < TAP_PX
      // A tap arms and fires one shot (unless the hold already fired).
      if (tap && !pointerFire) shoot(e)
      pointerFire = false
      touch = null
    }

    const onKey = (e: KeyboardEvent) => {
      if (!visible || e.metaKey || e.ctrlKey || e.altKey) return
      const down = e.type === 'keydown'
      const k = e.key.toLowerCase()
      const fireKey = k === ' ' || k === 'arrowup' || k === 'w'
      // Space / Enter on a focused button (Play again) belong to the button.
      if (fireKey && down && (e.target as Element | null)?.closest?.('button')) return
      const focused = document.activeElement === stage
      if (k === 'arrowleft' || k === 'a') keys.left = down
      else if (k === 'arrowright' || k === 'd') keys.right = down
      else if (fireKey && (isArmed || focused || !down)) keys.fire = down
      else if (k === 'escape' && down) {
        arm(false)
        releaseAll()
        return
      } else return
      // Left/right never scroll the page, so they arm the game by themselves;
      // Space / ↑ are only captured once the player has engaged (or focused the stage).
      if (down) arm(true)
      e.preventDefault()
    }
    const onBlur = releaseAll

    stage.addEventListener('pointermove', onMove)
    stage.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    stage.addEventListener('pointercancel', onUp)
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    window.addEventListener('blur', onBlur)

    api.current = {
      reset: () => {
        for (const b of blocks) Object.assign(b, { hp: HP, flash: 0, dead: false })
        shots = []
        sparks = []
        setFound([])
        setReveal(null)
        redraw()
      },
    }

    return () => {
      alive = false
      stop()
      releaseAll()
      io.disconnect()
      ro.disconnect()
      stage.removeEventListener('pointermove', onMove)
      stage.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      stage.removeEventListener('pointercancel', onUp)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      window.removeEventListener('blur', onBlur)
      api.current = null
    }
  }, [])

  const done = found.length === TECH.length
  const shown = reveal ? TECH[reveal.i] : null
  const score = `${pad(found.length)}/${pad(TECH.length)}`
  // Screen-reader announcement for the last unlock ("React desbloqueado · 01/20").
  const announce = shown ? `${shown.name} ${t.announce} · ${score}${done ? ` · ${t.complete}` : ''}` : ''

  return (
    <section className="tstack" ref={sectionRef} aria-labelledby="tstack-title">
      <div className="tstack__pin" ref={pinRef}>
        <div className="tstack__head">
          <h2 id="tstack-title" className="tstack__title y2k-chrome">
            Tech stack<sup>✦</sup>
          </h2>
          <ChromeStar className="tstack__spark tstack__spark--l" />
          <ChromeStar className="tstack__spark tstack__spark--r" />
        </div>

        {/* CRT power on/off: .tstack__tv scales dot → line → screen; the beam is the glowing line. */}
        <div className="tstack__screen">
          <span className="tstack__beam" aria-hidden="true" />
          <div className="tstack__tv">
            <div className="tstack__win">
              <div
                className="tstack__stage"
                ref={stageRef}
                data-armed={armed}
                data-done={done}
                tabIndex={0}
                role="application"
                aria-label={t.stage}
              >
                <canvas ref={canvasRef} className="tstack__canvas" aria-hidden="true" />
                <div className="tstack__crt" aria-hidden="true" />

                {shown && !done && (
                  <div className="tstack__reveal" key={reveal!.key} style={{ '--c': shown.color } as CSSProperties} aria-hidden="true">
                    <span className="tstack__reveal-kind">
                      {pad(reveal!.i + 1)} · {KIND[shown.kind][lang]} · {t.unlocked}
                    </span>
                    <span className="tstack__reveal-name" data-text={shown.name}>
                      {shown.name}
                    </span>
                  </div>
                )}

                {/* Both variants are rendered; CSS picks one with (pointer: coarse). */}
                {!armed && !done && (
                  <div className="tstack__hint" aria-hidden="true">
                    <span className="tstack__hint-v tstack__hint-v--fine">
                      <b className="tstack__hint-go">{t.playFine}</b>
                      <span className="tstack__hint-keys">{t.keysFine}</span>
                    </span>
                    <span className="tstack__hint-v tstack__hint-v--coarse">
                      <b className="tstack__hint-go">{t.playCoarse}</b>
                      <span className="tstack__hint-keys">{t.keysCoarse}</span>
                    </span>
                  </div>
                )}

                {done && (
                  <div className="tstack__done">
                    <span className="tstack__done-kicker">{t.allUnlocked}</span>
                    <span className="tstack__done-title y2k-chrome">
                      {t.complete}
                      <sup>✦</sup>
                    </span>
                    <button type="button" className="tstack__btn" onClick={() => api.current?.reset()}>
                      {t.again} ↻
                    </button>
                  </div>
                )}
              </div>

              {/* Visual game state; the accessible version is the hidden list below. */}
              <div className="tstack__foot" aria-hidden="true">
                <span className="tstack__score">
                  <Blink /> {t.score} {score}
                </span>
                <ul className="tstack__inv">
                  {TECH.map((tech, i) => (
                    <li key={tech.name} data-got={found.includes(i)} style={{ '--c': tech.color } as CSSProperties}>
                      {tech.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* For screen readers and SEO: the whole stack, no game required. */}
      <ul className="tstack__sr" aria-label={t.list}>
        {TECH.map((tech) => (
          <li key={tech.name}>
            {tech.name} ({KIND[tech.kind][lang]})
          </li>
        ))}
      </ul>
      <p className="tstack__sr" aria-live="polite">
        {announce}
      </p>
    </section>
  )
}
