import { CanvasTexture, SRGBColorSpace } from 'three'

/** A soft radial white glow, drawn once and shared, that sits behind each app
 *  icon so it lifts off the glass no matter the icon's colour (rescues dark
 *  icons like Roda without washing out the light ones). */
export function makeGlowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,255,255,0.85)')
  g.addColorStop(0.45, 'rgba(255,255,255,0.3)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

/** A rounded-rect alpha mask (white shape on black), shared by every icon so
 *  square logos (e.g. Pickop) get the same rounded app-tile corners. */
export function makeRoundedMask() {
  const s = 256
  const r = 48
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, s, s)
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.arcTo(s, 0, s, s, r)
  ctx.arcTo(s, s, 0, s, r)
  ctx.arcTo(0, s, 0, 0, r)
  ctx.arcTo(0, 0, s, 0, r)
  ctx.closePath()
  ctx.fill()
  return new CanvasTexture(c)
}
