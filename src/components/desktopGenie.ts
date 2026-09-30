/** Snapshot of the project desktop for the genie warp (World.tsx).
 *  genie-web can't capture `backdrop-filter` and its SVG clone chokes on big
 *  screenshots, so — like the menu (Menu.tsx) — we paint it ourselves from the
 *  live layout: tinted glass backdrop, each window at its real rect, the
 *  screenshots clipped to their viewers and the visible text. The real dialog
 *  fades in on top for the last stretch, so this only has to read as the panel. */

const SCALE = 0.5

type Box = { x: number; y: number; w: number; h: number }

const boxOf = (el: Element): Box => {
  const r = el.getBoundingClientRect()
  return { x: r.left * SCALE, y: r.top * SCALE, w: r.width * SCALE, h: r.height * SCALE }
}

/** Nearest ancestor that clips its content (the screenshot viewer's viewport). */
function clipOf(el: Element, root: Element): Box | null {
  for (let a = el.parentElement; a && a !== root; a = a.parentElement) {
    const o = getComputedStyle(a)
    if (o.overflow !== 'visible' || o.overflowY !== 'visible') return boxOf(a)
  }
  return null
}

function roundRect(ctx: CanvasRenderingContext2D, b: Box, r: number) {
  ctx.beginPath()
  ctx.roundRect(b.x, b.y, b.w, b.h, r)
}

export async function captureDesktop(root: HTMLElement): Promise<HTMLCanvasElement> {
  const W = Math.round(window.innerWidth * SCALE)
  const H = Math.round(window.innerHeight * SCALE)
  const out = document.createElement('canvas')
  out.width = W
  out.height = H
  const ctx = out.getContext('2d')!
  const accent = getComputedStyle(root.querySelector('.pd') ?? root).getPropertyValue('--accent').trim() || '#8bb8ff'

  // Glass desktop: dark base, accent glow, faint grid.
  ctx.fillStyle = '#07070c'
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(W * 0.3, H * 0.2, 0, W * 0.3, H * 0.2, W * 0.8)
  glow.addColorStop(0, /^#[0-9a-f]{6}$/i.test(accent) ? `${accent}38` : 'rgba(139, 184, 255, 0.22)')
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)'
  ctx.lineWidth = 1
  for (let x = 0; x < W; x += 24) ctx.strokeRect(x + 0.5, -1, 0, H + 2)
  for (let y = 0; y < H; y += 24) ctx.strokeRect(-1, y + 0.5, W + 2, 0)

  const visible = (el: Element) => el.getClientRects().length > 0

  // Windows (and the taskbar) as rounded glass panes with a chrome rim.
  for (const win of root.querySelectorAll('.pdw, .pd__bar')) {
    if (!visible(win)) continue
    const b = boxOf(win)
    const r = parseFloat(getComputedStyle(win).borderTopLeftRadius) * SCALE || 0
    roundRect(ctx, b, r)
    ctx.fillStyle = 'rgba(16, 17, 25, 0.94)'
    ctx.fill()
    const rim = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h)
    rim.addColorStop(0, 'rgba(255,255,255,0.9)')
    rim.addColorStop(0.5, 'rgba(125,132,148,0.6)')
    rim.addColorStop(1, 'rgba(223,227,235,0.8)')
    ctx.strokeStyle = rim
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Screenshots / icons, clipped to their viewers.
  for (const img of root.querySelectorAll('img')) {
    if (!visible(img) || !img.complete || !img.naturalWidth) continue
    const b = boxOf(img)
    const clip = clipOf(img, root)
    ctx.save()
    if (clip) {
      ctx.beginPath()
      ctx.rect(clip.x, clip.y, clip.w, clip.h)
      ctx.clip()
    }
    try {
      ctx.drawImage(img, b.x, b.y, b.w, b.h)
    } catch {
      /* tainted / not decoded: skip */
    }
    ctx.restore()
  }

  // Text: one line per text-bearing element, in its computed font and colour.
  ctx.textBaseline = 'top'
  for (const el of root.querySelectorAll<HTMLElement>('h2, h3, p, li, a, button, .pdw__name')) {
    // Leaves only (an <li> holding a <p> would print twice).
    if (!visible(el) || el.querySelector('h2, h3, p, li, a, button')) continue
    const text = el.innerText.split('\n')[0]?.trim()
    if (!text) continue
    const cs = getComputedStyle(el)
    const b = boxOf(el)
    const size = parseFloat(cs.fontSize) * SCALE
    ctx.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`
    const fill = cs.webkitTextFillColor || cs.color
    // Chrome display text (background-clip: text) → paint a chrome gradient.
    if (fill === 'rgba(0, 0, 0, 0)' || cs.color === 'rgba(0, 0, 0, 0)') {
      const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h)
      g.addColorStop(0, '#ffffff')
      g.addColorStop(0.5, '#6f7584')
      g.addColorStop(1, '#eef1f7')
      ctx.fillStyle = g
    } else ctx.fillStyle = cs.color
    const pad = (parseFloat(cs.paddingLeft) || 0) * SCALE
    const top = b.y + (parseFloat(cs.paddingTop) || 0) * SCALE
    ctx.fillText(cs.textTransform === 'uppercase' ? text.toUpperCase() : text, b.x + pad, top, Math.max(1, b.w - pad))
  }

  return out
}

/** Wait (briefly) for the panel's first images so the warp isn't blank. */
export async function warmup(root: HTMLElement, ms = 300) {
  const imgs = [...root.querySelectorAll('img')].filter((i) => !i.complete)
  if (!imgs.length) return
  await Promise.race([
    Promise.all(imgs.map((i) => i.decode().catch(() => {}))),
    new Promise((r) => setTimeout(r, ms)),
  ])
}
