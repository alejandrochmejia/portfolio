import type { Quality } from './look.ts'

/** Attribute-less full screen quad, driven by gl_VertexID. */
export const VERTEX_SHADER = `#version 300 es
precision highp float;

out vec2 vUv;

void main() {
  vec2 p = vec2(
    (gl_VertexID == 1 || gl_VertexID == 3) ? 1.0 : -1.0,
    (gl_VertexID == 2 || gl_VertexID == 3) ? 1.0 : -1.0
  );
  vUv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}
`

/**
 * 3D simplex noise, after Ashima Arts / Ian McEwan (MIT). The third dimension
 * is time, so the field breathes in place instead of scrolling past.
 */
const NOISE = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < OCTAVES; i++) {
    v += a * snoise(p);
    p *= 2.03;
    p.z += 7.3;
    a *= 0.5;
  }
  return v;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
}
`

const BODY = `
uniform sampler2D uText;
uniform vec2 uResolution;
uniform float uTime;
uniform float uIntro;
uniform vec2 uPointer;
uniform float uPointerAmp;

uniform float uSpeed;
uniform float uWarp;
uniform float uWarpScale;
uniform float uTypeScale;
uniform float uSmear;
uniform float uSmearBias;
uniform float uSoftness;
uniform float uFocus;
uniform float uGlow;
uniform float uGlowSpread;
uniform vec2 uContrast;
uniform float uGamma;
uniform float uSpec;
uniform float uGrain;
uniform float uVignette;
uniform float uPointerRadius;
uniform float uPointerPush;
uniform float uPointerRipple;
uniform vec3 uInk;
uniform vec3 uVoid;

in vec2 vUv;
out vec4 fragColor;

float ink(vec2 uv, float lod) {
  return textureLod(uText, uv, lod).r;
}

void main() {
  float aspect = uResolution.x / uResolution.y;
  float t = uTime;

  // Everything below is measured in type units, where 1.0 is the frame width.
  // The lines are typeset to that same width, so the melt keeps its proportion
  // to the letterforms at any aspect ratio instead of tracking the short edge.
  vec2 iso = vec2(vUv.x, vUv.y / aspect);
  vec2 centre = vec2(0.5, 0.5 / aspect);
  vec2 toUv = vec2(1.0, aspect);

  // Flow field: fbm warped by another fbm. This is what liquefies the glyphs.
  vec2 p = (iso - centre) * (uWarpScale / uTypeScale);
  vec3 seed = vec3(p, t * uSpeed);
  vec2 q = vec2(fbm(seed), fbm(seed + vec3(4.7, 2.3, 1.9)));
  vec2 r = vec2(
    snoise(vec3(p * 1.9 + q * 1.6, t * uSpeed * 1.3 + 7.0)),
    snoise(vec3(p * 1.9 + q * 1.6 + 3.4, t * uSpeed * 1.2 + 13.0))
  );
  vec2 flow = q * 0.85 + r * 0.45;

  // Depth of field: the same field decides where the type stays legible and
  // where it melts, so the two always agree.
  float melt = smoothstep(-0.75, 0.9, q.y);

  // The pointer drags the type around like thick liquid. The offset vector is
  // used raw rather than normalised, so the field stays smooth through the
  // centre instead of pinching into a cusp.
  vec2 pd = iso - vec2(uPointer.x, uPointer.y / aspect);
  float pr = length(pd);
  float radius = max(uPointerRadius, 1e-3);
  float pf = exp(-pr * pr / (radius * radius)) * uPointerAmp;
  vec2 lens = pd / radius;
  flow += lens * (uPointerPush + sin(pr * 30.0 - t * 3.0) * uPointerRipple) * pf;

  // Intro: the name condenses out of a heavier dissolve.
  float dissolve = 1.0 + (1.0 - uIntro) * 2.6;

  vec2 base = vUv + flow * (uWarp * uTypeScale * dissolve) * toUv;

  // Curved motion blur along the flow: the tube / ghost smear.
  vec2 sdir = normalize(mix(flow, vec2(0.28, 1.0), uSmearBias) + 1e-5);
  float len = uSmear * uTypeScale * dissolve * (0.45 + 1.3 * melt) * (1.0 + 1.4 * pf);
  float lod = uSoftness + uFocus * melt + (1.0 - uIntro) * 1.6;

  float core = 0.0;
  float wsum = 0.0;
  for (int i = 0; i < TAPS; i++) {
    float f = (float(i) + 0.5) / float(TAPS) - 0.5;
    float w = exp(-f * f * 4.5);
    core += ink(base + sdir * (f * len) * toUv, lod) * w;
    wsum += w;
  }
  core /= wsum;

  // Wide, cheap bloom straight off the mip chain.
  float halo = 0.5 * (
    ink(base, uGlowSpread) +
    ink(base + sdir * (len * 0.7) * toUv, uGlowSpread + 1.2)
  );

  float mass = smoothstep(uContrast.x, uContrast.y, core);
  float tone = pow(clamp(core, 0.0, 1.0), uGamma);
  float v = max(mass, tone * 0.8);
  v += halo * uGlow;

  // Sheen from the field gradient: bright crests, dark creases.
  vec2 grad = vec2(dFdx(core), dFdy(core)) * uResolution.y * 0.035;
  vec3 n = normalize(vec3(-grad, 1.0));
  float sheen = pow(max(dot(n, normalize(vec3(0.42, 0.68, 0.62))), 0.0), 4.0);
  v += sheen * uSpec * smoothstep(0.04, 0.55, core);

  float vig = 1.0 - uVignette *
    pow(clamp(length((vUv - 0.5) * vec2(1.06, 1.0)) * 1.34, 0.0, 1.0), 2.1);
  v = clamp(v * vig, 0.0, 1.0);
  v *= mix(0.35, 1.0, smoothstep(0.0, 0.55, uIntro));

  vec3 col = mix(uVoid, uInk, v);
  col += (hash(vUv * uResolution + fract(t * 3.0) * 311.0) - 0.5) *
         uGrain * (0.35 + 0.65 * (1.0 - v));
  col += (hash(vUv * uResolution * 1.7) - 0.5) / 255.0;

  fragColor = vec4(max(col, 0.0), 1.0);
}
`

export function buildFragmentShader(q: Quality): string {
  return [
    '#version 300 es',
    'precision highp float;',
    `#define TAPS ${q.taps}`,
    `#define OCTAVES ${q.octaves}`,
    NOISE,
    BODY,
  ].join('\n')
}

export const UNIFORM_NAMES = [
  'uText',
  'uResolution',
  'uTime',
  'uIntro',
  'uPointer',
  'uPointerAmp',
  'uSpeed',
  'uWarp',
  'uWarpScale',
  'uTypeScale',
  'uSmear',
  'uSmearBias',
  'uSoftness',
  'uFocus',
  'uGlow',
  'uGlowSpread',
  'uContrast',
  'uGamma',
  'uSpec',
  'uGrain',
  'uVignette',
  'uPointerRadius',
  'uPointerPush',
  'uPointerRipple',
  'uInk',
  'uVoid',
] as const

export type UniformName = (typeof UNIFORM_NAMES)[number]
