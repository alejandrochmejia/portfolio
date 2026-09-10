/**
 * Tunable parameters for the liquid-ghost type effect.
 * Everything here maps 1:1 to a uniform in the fragment shader, so the whole
 * look can be dialled in at runtime (see `window.__liquid` in dev).
 */
export type LiquidLook = {
  /** How fast the flow field evolves (noise units per second). */
  speed: number
  /** Displacement amplitude, in uv units. */
  warp: number
  /** Frequency of the flow field. Lower = bigger, slower swirls. */
  warpScale: number
  /** Length of the directional smear, in uv units. */
  smear: number
  /** 0 = smear follows the flow, 1 = smear follows a fixed diagonal. */
  smearBias: number
  /** Mip bias for the core taps. Higher = softer glyphs. */
  softness: number
  /** Extra mip bias in the melted regions. Reads as depth of field. */
  focus: number
  /** Amount of wide bloom added on top. */
  glow: number
  /** Mip level the bloom is sampled from. */
  glowSpread: number
  /** smoothstep window that turns the blurred mass into liquid tubes. */
  contrast: [number, number]
  /** Tone curve on the raw field (< 1 lifts the mid greys). */
  gamma: number
  /** Fake specular along the field gradient. Gives the chrome sheen. */
  spec: number
  /** Film grain. */
  grain: number
  /** Corner falloff. */
  vignette: number
  /** Radius of the pointer influence, in uv units. */
  pointerRadius: number
  /** How hard the pointer pushes the type away. */
  pointerPush: number
  /** Concentric ripple riding on the pointer push. */
  pointerRipple: number
}

export const DEFAULT_LOOK: LiquidLook = {
  speed: 0.075,
  warp: 0.034,
  warpScale: 1.85,
  smear: 0.031,
  smearBias: 0.45,
  softness: 1.1,
  focus: 2.2,
  glow: 0.2,
  glowSpread: 6.5,
  contrast: [0.055, 0.8],
  gamma: 1.0,
  spec: 0.18,
  grain: 0.014,
  vignette: 0.45,
  pointerRadius: 0.2,
  pointerPush: 2.4,
  pointerRipple: 0.5,
}

/** Compile-time shader budget + render resolution, picked per device. */
export type Quality = {
  /** Number of taps in the directional smear loop. */
  taps: number
  /** fbm octaves in the flow field. */
  octaves: number
  /** Render scale, multiplied by the (capped) device pixel ratio. */
  scale: number
  /** Hard cap on the render target's longest edge. */
  maxEdge: number
}

export function pickQuality(): Quality {
  const coarse =
    typeof matchMedia === 'function' &&
    matchMedia('(pointer: coarse), (max-width: 820px)').matches

  return coarse
    ? { taps: 14, octaves: 2, scale: 0.9, maxEdge: 1300 }
    : { taps: 18, octaves: 3, scale: 0.75, maxEdge: 2300 }
}
