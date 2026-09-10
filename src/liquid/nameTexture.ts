/**
 * Typesets the name onto a 2D canvas (white on black) so the shader can treat
 * it as a signed-distance-ish mass to warp. Each line is sized independently so
 * it spans the full width — the editorial, full-bleed look of the reference.
 */
export type NameLayout = {
  /** Letter spacing, in em. Negative tightens. */
  tracking: number
  /**
   * Target ink width as a share of the frame. Kept a little under 1 so the warp
   * has room to push the outer letters around without slicing them off.
   */
  bleed: number
  /** Share of the height the stacked block is allowed to occupy. */
  spread: number
  /** Gap between lines, as a share of the mean cap height. */
  minGap: number
  maxGap: number
  /** Whole-block rotation, in degrees. */
  rotation: number
  /** Per-line horizontal nudge, as a share of the width. */
  offsets: number[]
  /** How much of the block may run past `spread` before it gets scaled down. */
  overflowY: number
  /**
   * Gaussian pre-blur applied while rasterising, as a share of the cap height
   * of each line. This is what turns the glyphs into the soft tubes of the
   * reference; the shader then only has to warp and smear them.
   */
  blur: number
}

export const DEFAULT_LAYOUT: NameLayout = {
  tracking: 0.03,
  bleed: 0.97,
  spread: 0.84,
  minGap: 0.04,
  maxGap: 0.5,
  rotation: -2.5,
  offsets: [-0.015, 0.02],
  overflowY: 1.06,
  blur: 0.033,
}

type PaintArgs = {
  canvas: HTMLCanvasElement
  lines: string[]
  cssWidth: number
  cssHeight: number
  scale: number
  fontFamily: string
  layout: NameLayout
}

const REF = 320

/**
 * Past this aspect ratio two stacked lines have to shrink so much to fit the
 * height that they leave big side margins, so the name runs as a single line
 * instead. Covers ultrawide monitors and phones held sideways.
 */
const ONE_LINE_ASPECT = 2.05

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

type LineMetrics = { ink: number; left: number; ascent: number; descent: number }

export type NameMetrics = {
  /** Mean cap height of the typeset lines, as a share of the frame width. */
  capFraction: number
}

/** capFraction of the two-line desktop layout, which the look was tuned on. */
export const REFERENCE_CAP_FRACTION = 0.256

export function paintName({
  canvas,
  lines: source,
  cssWidth,
  cssHeight,
  scale,
  fontFamily,
  layout,
}: PaintArgs): NameMetrics {
  const w = Math.max(2, Math.round(cssWidth * scale))
  const h = Math.max(2, Math.round(cssHeight * scale))

  if (canvas.width !== w) canvas.width = w
  if (canvas.height !== h) canvas.height = h

  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) return { capFraction: REFERENCE_CAP_FRACTION }

  const aspect = w / h
  const lines = aspect >= ONE_LINE_ASPECT && source.length > 1 ? [source.join(' ')] : source

  // Tall frames: the lines drift apart to fill the height, and pull in and
  // straighten a little, since at that size the warp would otherwise push the
  // outer letters clean off the edge.
  const tall = clamp((0.9 - aspect) / 0.6, 0, 1)
  const bleed = layout.bleed - tall * 0.14
  const maxGap = layout.maxGap + tall * 1.2
  const rotation = layout.rotation * (1 - 0.55 * tall)
  const offsetScale = 1 - tall
  // Wide ones instead trade a little vertical crop for keeping the full bleed.
  const overflowY = layout.overflowY + clamp((aspect - 1.55) / 0.5, 0, 1) * 0.12

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.filter = 'none'
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  const applyFont = (size: number) => {
    ctx.font = `${size}px ${fontFamily}`
    // Re-derive the tracking in px so it scales exactly with the font size.
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${layout.tracking * size}px`
  }

  applyFont(REF)
  const metrics: LineMetrics[] = lines.map((line) => {
    const m = ctx.measureText(line)
    return {
      ink: Math.max(1, m.actualBoundingBoxLeft + m.actualBoundingBoxRight),
      left: m.actualBoundingBoxLeft,
      ascent: m.actualBoundingBoxAscent,
      descent: m.actualBoundingBoxDescent,
    }
  })

  // Size each line so its ink box spans the target width.
  const target = w * bleed
  let sizes = metrics.map((m) => (REF * target) / m.ink)

  const capAt = (i: number) => ((metrics[i].ascent + metrics[i].descent) * sizes[i]) / REF
  let caps = lines.map((_, i) => capAt(i))
  const meanCap = sum(caps) / caps.length
  const gapCount = Math.max(0, lines.length - 1)

  let gap = gapCount
    ? clamp(
        (h * layout.spread - sum(caps)) / gapCount,
        layout.minGap * meanCap,
        maxGap * meanCap,
      )
    : 0

  let blockH = sum(caps) + gap * gapCount
  const maxBlockH = h * layout.spread * overflowY
  if (blockH > maxBlockH) {
    const k = maxBlockH / blockH
    sizes = sizes.map((s) => s * k)
    caps = lines.map((_, i) => capAt(i))
    gap *= k
    blockH = sum(caps) + gap * gapCount
  }

  ctx.translate(w / 2, h / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.fillStyle = '#fff'

  let top = -blockH / 2
  lines.forEach((line, i) => {
    const size = sizes[i]
    const k = size / REF
    const m = metrics[i]
    const inkW = m.ink * k
    const ascent = m.ascent * k

    applyFont(size)
    // Blurred against this line, so both lines melt by the same proportion.
    // ctx.filter is missing on older engines; there the shader blur carries it.
    const soft = layout.blur * caps[i]
    ctx.filter = soft > 0.4 ? `blur(${soft.toFixed(2)}px)` : 'none'

    const x = -inkW / 2 + m.left * k + (layout.offsets[i] ?? 0) * offsetScale * w
    ctx.fillText(line, x, top + ascent)

    top += caps[i] + gap
  })

  return { capFraction: sum(caps) / caps.length / w }
}
