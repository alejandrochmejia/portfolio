import { DEFAULT_LOOK, pickQuality, type LiquidLook, type Quality } from './look.ts'
import {
  DEFAULT_LAYOUT,
  paintName,
  REFERENCE_CAP_FRACTION,
  type NameLayout,
} from './nameTexture.ts'
import {
  buildFragmentShader,
  UNIFORM_NAMES,
  VERTEX_SHADER,
  type UniformName,
} from './shaders.ts'

export type LiquidOptions = {
  canvas: HTMLCanvasElement
  /** Element the canvas fills; drives sizing and pointer coordinates. */
  host: HTMLElement
  lines: string[]
  fontFamily: string
  reducedMotion?: boolean
  look?: Partial<LiquidLook>
  layout?: Partial<NameLayout>
  ink?: [number, number, number]
  voidColor?: [number, number, number]
  /** Called if the GPU drops the context, so the caller can fall back. */
  onLost?: () => void
}

const INTRO_MS = 2600
const POINTER_ATTACK = 6
const POINTER_RELEASE = 1.4
/** Below ~25fps counts as struggling; 30Hz panels must stay clear of this. */
const SLOW_FRAME_MS = 40
const THROTTLED_MS = 200
/** Frame the static render is sampled at, picked because it composes well. */
const STILL_TIME = 21

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('[liquid] shader compile failed\n', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function link(gl: WebGL2RenderingContext, fragSrc: string): WebGLProgram | null {
  const vert = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const frag = compile(gl, gl.FRAGMENT_SHADER, fragSrc)
  if (!vert || !frag) return null

  const program = gl.createProgram()
  if (!program) return null
  gl.attachShader(program, vert)
  gl.attachShader(program, frag)
  gl.linkProgram(program)
  gl.deleteShader(vert)
  gl.deleteShader(frag)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('[liquid] program link failed\n', gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }
  return program
}

export class LiquidRenderer {
  private gl: WebGL2RenderingContext
  private canvas: HTMLCanvasElement
  private host: HTMLElement
  private quality: Quality

  private program: WebGLProgram | null = null
  private vao: WebGLVertexArrayObject | null = null
  private texture: WebGLTexture | null = null
  private uniforms = new Map<UniformName, WebGLUniformLocation | null>()

  private textCanvas = document.createElement('canvas')
  private lines: string[]
  private fontFamily: string
  private layout: NameLayout
  private look: LiquidLook
  private ink: [number, number, number]
  private voidColor: [number, number, number]
  private reducedMotion: boolean

  private width = 0
  private height = 0
  private dpr = 1

  private time = 0
  private introStart = 0
  private lastFrame = 0
  private frameHandle = 0
  private running = false
  private disposed = false
  private needsTextRepaint = true
  /** Cap height of the current typesetting, relative to the tuned reference. */
  private typeScale = 1

  private pointer = { x: 0.5, y: 0.5 }
  private pointerTarget = { x: 0.5, y: 0.5 }
  private pointerAmp = 0
  private pointerActive = false

  private slowFrames = 0
  private downgrades = 0

  private wanted = false
  private visible = true
  private onScreen = true

  private onLost: (() => void) | undefined
  private observer: ResizeObserver | null = null
  private intersection: IntersectionObserver | null = null
  private cleanups: (() => void)[] = []

  static create(options: LiquidOptions): LiquidRenderer | null {
    const gl = options.canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    })
    if (!gl) return null

    const renderer = new LiquidRenderer(gl, options)
    return renderer.init() ? renderer : null
  }

  private constructor(gl: WebGL2RenderingContext, options: LiquidOptions) {
    this.gl = gl
    this.canvas = options.canvas
    this.host = options.host
    this.lines = options.lines
    this.fontFamily = options.fontFamily
    this.reducedMotion = options.reducedMotion ?? false
    this.look = { ...DEFAULT_LOOK, ...options.look }
    this.layout = { ...DEFAULT_LAYOUT, ...options.layout }
    this.ink = options.ink ?? [0.97, 0.96, 0.94]
    this.voidColor = options.voidColor ?? [0.016, 0.016, 0.02]
    this.onLost = options.onLost
    this.quality = pickQuality()
  }

  private init(): boolean {
    const { gl } = this

    this.program = link(gl, buildFragmentShader(this.quality))
    if (!this.program) return false

    this.vao = gl.createVertexArray()
    this.texture = gl.createTexture()
    if (!this.texture) return false

    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    gl.useProgram(this.program)
    for (const name of UNIFORM_NAMES) {
      this.uniforms.set(name, gl.getUniformLocation(this.program, name))
    }
    gl.uniform1i(this.uniforms.get('uText') ?? null, 0)

    this.introStart = performance.now()
    this.observe()
    this.measure()
    return true
  }

  private observe(): void {
    this.observer = new ResizeObserver(() => this.measure())
    this.observer.observe(this.host)

    // Off-screen and backgrounded frames are wasted work: the hero is the top
    // of a page that will grow more sections under it.
    this.intersection = new IntersectionObserver(
      (entries) => {
        this.onScreen = entries.some((entry) => entry.isIntersecting)
        this.sync()
      },
      { rootMargin: '15%' },
    )
    this.intersection.observe(this.host)

    const onContextLost = (event: Event) => {
      event.preventDefault()
      this.stop()
      this.onLost?.()
    }
    const onVisibility = () => {
      this.visible = !document.hidden
      this.sync()
    }
    const onFontsDone = () => {
      this.needsTextRepaint = true
      if (!this.running) this.renderOnce()
    }

    this.canvas.addEventListener('webglcontextlost', onContextLost)
    document.addEventListener('visibilitychange', onVisibility)
    document.fonts?.addEventListener?.('loadingdone', onFontsDone)

    this.cleanups.push(() => {
      this.canvas.removeEventListener('webglcontextlost', onContextLost)
      document.removeEventListener('visibilitychange', onVisibility)
      document.fonts?.removeEventListener?.('loadingdone', onFontsDone)
    })
  }

  private measure(): void {
    const rect = this.host.getBoundingClientRect()
    const cssW = Math.max(1, Math.round(rect.width))
    const cssH = Math.max(1, Math.round(rect.height))
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    if (cssW === this.width && cssH === this.height && dpr === this.dpr) return

    this.width = cssW
    this.height = cssH
    this.dpr = dpr
    this.needsTextRepaint = true

    // Never render under ~0.85 CSS pixels: below that the smear taps start to
    // show as steps once the canvas is scaled back up.
    const raw = Math.max(this.quality.scale * dpr, 0.85)
    const fit = this.quality.maxEdge / Math.max(cssW, cssH)
    const scale = Math.min(raw, Math.max(fit, 0.5))

    this.canvas.width = Math.max(2, Math.round(cssW * scale))
    this.canvas.height = Math.max(2, Math.round(cssH * scale))

    if (!this.running) this.renderOnce()
  }

  private repaintText(): void {
    const { gl } = this
    // The mass gets blurred to death anyway, so ~1.4x CSS pixels is plenty.
    const textScale = Math.min(this.dpr * 1.1, 1.5)
    const fit = 2560 / Math.max(this.width, this.height)

    const metrics = paintName({
      canvas: this.textCanvas,
      lines: this.lines,
      cssWidth: this.width,
      cssHeight: this.height,
      scale: Math.min(textScale, Math.max(0.5, fit)),
      fontFamily: this.fontFamily,
      layout: this.layout,
    })

    // Keeps the melt proportional to the letterforms, whatever the frame does
    // to them: one line on ultrawide, two shorter ones on a phone.
    this.typeScale = metrics.capFraction / REFERENCE_CAP_FRACTION

    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.textCanvas)
    gl.generateMipmap(gl.TEXTURE_2D)
    this.needsTextRepaint = false
  }

  private draw(): void {
    const { gl, look } = this
    if (!this.program || gl.isContextLost()) return
    if (this.needsTextRepaint) this.repaintText()

    const u = (name: UniformName) => this.uniforms.get(name) ?? null
    const intro = this.reducedMotion
      ? 1
      : easeOutCubic(Math.min(1, (performance.now() - this.introStart) / INTRO_MS))

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
    gl.useProgram(this.program)
    gl.bindVertexArray(this.vao)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texture)

    gl.uniform2f(u('uResolution'), gl.drawingBufferWidth, gl.drawingBufferHeight)
    gl.uniform1f(u('uTime'), this.reducedMotion ? STILL_TIME : this.time)
    gl.uniform1f(u('uIntro'), intro)
    gl.uniform2f(u('uPointer'), this.pointer.x, this.pointer.y)
    gl.uniform1f(u('uPointerAmp'), this.pointerAmp)

    gl.uniform1f(u('uSpeed'), look.speed)
    gl.uniform1f(u('uWarp'), look.warp)
    gl.uniform1f(u('uWarpScale'), look.warpScale)
    gl.uniform1f(u('uTypeScale'), this.typeScale)
    gl.uniform1f(u('uSmear'), look.smear)
    gl.uniform1f(u('uSmearBias'), look.smearBias)
    gl.uniform1f(u('uSoftness'), look.softness)
    gl.uniform1f(u('uFocus'), look.focus)
    gl.uniform1f(u('uGlow'), look.glow)
    gl.uniform1f(u('uGlowSpread'), look.glowSpread)
    gl.uniform2f(u('uContrast'), look.contrast[0], look.contrast[1])
    gl.uniform1f(u('uGamma'), look.gamma)
    gl.uniform1f(u('uSpec'), look.spec)
    gl.uniform1f(u('uGrain'), look.grain)
    gl.uniform1f(u('uVignette'), look.vignette)
    gl.uniform1f(u('uPointerRadius'), look.pointerRadius)
    gl.uniform1f(u('uPointerPush'), look.pointerPush)
    gl.uniform1f(u('uPointerRipple'), look.pointerRipple)
    gl.uniform3fv(u('uInk'), this.ink)
    gl.uniform3fv(u('uVoid'), this.voidColor)

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  private frame = (now: number): void => {
    if (this.disposed || !this.running) return
    const dt = this.lastFrame ? Math.min((now - this.lastFrame) / 1000, 1 / 20) : 1 / 60
    if (this.lastFrame) this.adapt(now - this.lastFrame)
    this.lastFrame = now
    this.time += dt

    const attack = this.pointerActive ? POINTER_ATTACK : POINTER_RELEASE
    const k = 1 - Math.exp(-attack * dt)
    this.pointer.x += (this.pointerTarget.x - this.pointer.x) * k
    this.pointer.y += (this.pointerTarget.y - this.pointer.y) * k
    this.pointerAmp += ((this.pointerActive ? 1 : 0) - this.pointerAmp) * (1 - Math.exp(-2.6 * dt))

    this.draw()
    this.frameHandle = requestAnimationFrame(this.frame)
  }

  /** Drops render resolution when the GPU cannot keep up. */
  private adapt(delta: number): void {
    if (this.downgrades >= 2 || document.hidden) return
    // Anything this long is the browser throttling us (backgrounded or
    // occluded tab), not the GPU struggling, so it must not count.
    if (delta > THROTTLED_MS) {
      this.slowFrames = 0
      return
    }
    this.slowFrames = delta > SLOW_FRAME_MS ? this.slowFrames + 1 : Math.max(0, this.slowFrames - 1)
    if (this.slowFrames < 120) return

    this.slowFrames = 0
    this.downgrades += 1
    this.quality = { ...this.quality, scale: this.quality.scale * 0.75 }
    this.width = 0
    this.measure()
  }

  start(): void {
    this.wanted = true
    this.sync()
  }

  stop(): void {
    this.wanted = false
    this.sync()
  }

  /** Single owner of the animation loop: the flags above decide, not callers. */
  private sync(): void {
    const shouldRun = this.wanted && this.visible && this.onScreen && !this.disposed
    if (shouldRun === this.running) return

    this.running = shouldRun
    if (shouldRun) {
      this.lastFrame = 0
      this.frameHandle = requestAnimationFrame(this.frame)
    } else if (this.frameHandle) {
      cancelAnimationFrame(this.frameHandle)
      this.frameHandle = 0
    }
  }

  renderOnce(): void {
    if (this.disposed) return
    this.draw()
  }

  setPointer(clientX: number, clientY: number): void {
    const rect = this.host.getBoundingClientRect()
    this.pointerTarget.x = (clientX - rect.left) / Math.max(1, rect.width)
    this.pointerTarget.y = 1 - (clientY - rect.top) / Math.max(1, rect.height)
    this.pointerActive = true
  }

  releasePointer(): void {
    this.pointerActive = false
  }

  setLook(patch: Partial<LiquidLook>): void {
    this.look = { ...this.look, ...patch }
    if (!this.running) this.renderOnce()
  }

  setLayout(patch: Partial<NameLayout>): void {
    this.layout = { ...this.layout, ...patch }
    this.needsTextRepaint = true
    if (!this.running) this.renderOnce()
  }

  getLook(): LiquidLook {
    return { ...this.look }
  }

  getLayout(): NameLayout {
    return { ...this.layout }
  }

  dispose(): void {
    this.disposed = true
    this.stop()
    this.observer?.disconnect()
    this.observer = null
    this.intersection?.disconnect()
    this.intersection = null
    for (const off of this.cleanups) off()
    this.cleanups = []

    const { gl } = this
    if (this.program) gl.deleteProgram(this.program)
    if (this.texture) gl.deleteTexture(this.texture)
    if (this.vao) gl.deleteVertexArray(this.vao)
    this.program = null
    this.texture = null
    this.vao = null
  }
}
