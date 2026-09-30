import { useEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { ExtrudeGeometry, MeshPhysicalMaterial, Shape, type Group, type Mesh, type PerspectiveCamera } from 'three'
import { track, ABOUT_IN, ABOUT_OUT } from './choreography.ts'
import { useCopy, type Lang } from '../i18n.ts'
import { useReducedMotion } from './useReducedMotion.ts'

const FONT = '/fonts/Anton-Regular.ttf'

/** The barrel: a vertical cylinder the camera sits inside. The camera (z=6) is
 *  well behind the axis, near the front wall, so the back wall is far and small
 *  while the sides sweep past close, tall and squeezed — the text reads as glued
 *  to the inner wall. Smaller R / lower AXIS_Z = stronger barrel. */
const R = 7
const AXIS_Z = 0
/** Columns beyond this angle are hidden (well past the screen edges). */
const CULL = 2.2
/** Vertical stretch of the lettering (condensed, poster-like). */
const STRETCH = 1.35

/** Angle θ at which the barrel wall meets the screen's side edge, i.e. where
 *  R·sinθ / (d + R·cosθ) = tan(half horizontal fov), with d = camera→axis. */
function edgeAngle(camZ: number, fovDeg: number, aspect: number) {
  const t = Math.tan((fovDeg * Math.PI) / 360) * aspect
  const d = camZ - AXIS_Z
  const k = (t * d) / (R * Math.sqrt(1 + t * t))
  return Math.atan(t) + Math.asin(Math.min(k, 1))
}

/** One column of the ticker. It sits on the inner wall of the barrel at angle
 *  θ = arc / R, facing the axis; its text is bent with the same radius so it
 *  hugs the wall like a label stuck inside the barrel. */
function Segment({
  baseX,
  off,
  children,
}: {
  baseX: number
  off: MutableRefObject<number>
  children: ReactNode
}) {
  const g = useRef<Group>(null)
  useFrame(() => {
    const s = g.current
    if (!s) return
    const arc = baseX + off.current
    const th = arc / R // 0 = straight ahead on the back wall, + = right
    s.position.set(R * Math.sin(th), 0, -R * Math.cos(th))
    s.rotation.y = -th // face the axis (inward normal)
    s.visible = Math.abs(th) < CULL
  })
  return (
    <group ref={g}>
      <group scale={[1, STRETCH, 1]}>{children}</group>
    </group>
  )
}

type Item = {
  big: string
  bigSize: number
  color: string
  label: string
  labelSize: number
  width: number
}

const CREAM = '#f6ecd4'
const BLUE = '#8bb8ff'
const PINK = '#ff8fd0'
/** Y2K offset "drop" behind the big lettering, in a contrasting palette tone. */
const SHADOW: Record<string, string> = { [BLUE]: '#c2459a', [PINK]: '#3f63b8', [CREAM]: '#4a5fa8' }

/** Column copy per language. `width` = widest line (from Anton's advances) +
 *  margin; Spanish "DESARROLLADOR" is ~45% wider than "FULL STACK", hence 9.6. */
const ITEMS: Record<Lang, Item[]> = {
  en: [
    { big: '3+', bigSize: 3.0, color: BLUE, label: 'YEARS OF\nEXPERIENCE', labelSize: 0.5, width: 4.2 },
    { big: '20+', bigSize: 3.0, color: PINK, label: 'PROJECTS IN\nPRODUCTION', labelSize: 0.5, width: 5.6 },
    { big: 'FULL STACK\nDEVELOPER', bigSize: 1.35, color: CREAM, label: 'AI & COMPUTER ENGINEER', labelSize: 0.5, width: 7.2 },
    { big: 'FROM\nVENEZUELA', bigSize: 1.35, color: CREAM, label: 'BORN IN CCS · NOW IN VALENCIA', labelSize: 0.5, width: 7.2 },
  ],
  es: [
    { big: '3+', bigSize: 3.0, color: BLUE, label: 'AÑOS DE\nEXPERIENCIA', labelSize: 0.5, width: 4.2 },
    { big: '20+', bigSize: 3.0, color: PINK, label: 'PROYECTOS EN\nPRODUCCIÓN', labelSize: 0.5, width: 5.6 },
    { big: 'DESARROLLADOR\nFULL STACK', bigSize: 1.35, color: CREAM, label: 'INGENIERO EN COMPUTACIÓN E IA', labelSize: 0.5, width: 9.6 },
    { big: 'DESDE\nVENEZUELA', bigSize: 1.35, color: CREAM, label: 'NACIDO EN CCS · HOY EN VALENCIA', labelSize: 0.5, width: 7.6 },
  ],
}

const GAP = 1.2

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/** Four-point sparkle (✦) as a thin extruded chrome shape. */
function makeStarGeometry() {
  const k = 0.14 // pinch of the curves toward the centre
  const s = new Shape()
  s.moveTo(0, 1)
  s.quadraticCurveTo(k, k, 1, 0)
  s.quadraticCurveTo(k, -k, 0, -1)
  s.quadraticCurveTo(-k, -k, -1, 0)
  s.quadraticCurveTo(-k, k, 0, 1)
  const g = new ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3, curveSegments: 16 })
  g.center()
  return g
}

/** A chrome sparkle riding the wall between two columns, spinning slowly. */
function Spark({ geometry, material, phase, k }: { geometry: ExtrudeGeometry; material: MeshPhysicalMaterial; phase: number; k: number }) {
  const m = useRef<Mesh>(null)
  const reduced = useReducedMotion()
  useFrame((state) => {
    const t = (reduced ? 0 : state.clock.elapsedTime) + phase
    if (m.current) {
      m.current.rotation.z = t * 0.6
      m.current.rotation.y = Math.sin(t * 0.8) * 0.5
    }
  })
  // Undo the column's vertical stretch so the star stays a star.
  return (
    <group position={[0, 1.25 * k, 0.05]} scale={[0.42 * k, (0.42 * k) / STRETCH, 0.42 * k]}>
      <mesh ref={m} geometry={geometry} material={material} />
    </group>
  )
}

/** The "Sobre mí" phase: the stats ride the inner wall of a barrel around the
 *  camera, emerging on the right and disappearing on the left as you scroll. */
export function AboutMarquee({ progress }: { progress: MutableRefObject<number> }) {
  const grp = useRef<Group>(null)
  const off = useRef(0)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const aspect = useThree((s) => s.size.width / s.size.height)
  const short = useThree((s) => s.size.height <= 500)
  const items = useCopy(ITEMS)
  // Arc position of the screen's side edges on the wall (adapts to aspect).
  const edge = R * edgeAngle(camera.position.z, camera.fov, aspect)
  // Lettering scale: portrait shrinks the columns (sizes, widths, gap) so they
  // fit the screen; phone landscape (short) shrinks a bit more and lifts the
  // row to clear the scroll hint. The barrel geometry (R/AXIS_Z/STRETCH) stays.
  const k = clamp(aspect / 1.1, 0.55, 1) * (short ? 0.82 : 1)
  const rowY = short ? -0.95 : -1.2

  // The sparkle geometry + its chrome material.
  const assets = useMemo(() => {
    const star = makeStarGeometry()
    const starMat = new MeshPhysicalMaterial({ color: '#ffffff', metalness: 1, roughness: 0.12, clearcoat: 1, envMapIntensity: 1.8 })
    return { star, starMat }
  }, [])
  useEffect(
    () => () => {
      assets.star.dispose()
      assets.starMat.dispose()
    },
    [assets],
  )

  const { placed, start, end, gap } = useMemo(() => {
    const gap = GAP * k
    let run = 0
    const placed = items.map((src) => {
      const it = { ...src, bigSize: src.bigSize * k, labelSize: src.labelSize * k, width: src.width * k }
      const center = run + it.width / 2
      run += it.width + gap
      return { it, baseX: center }
    })
    const first = placed[0]
    const last = placed[placed.length - 1]
    // Offsets where the first column is just past the right edge / the last
    // column is just past the left edge: each column crosses exactly once.
    const start = edge + first.it.width / 2 - first.baseX
    const end = -(edge + last.it.width / 2) - last.baseX
    return { placed, start, end, gap }
  }, [edge, items, k])

  useFrame(() => {
    // The whole "about" window drives one right → left pass of the row. The
    // barrel itself never moves: columns just enter and leave by the sides.
    const t = track(progress.current ?? 0, ABOUT_IN[0], ABOUT_OUT[1])
    off.current = start + (end - start) * t
    if (grp.current) grp.current.visible = t > 0 && t < 1
  })

  return (
    <group ref={grp} position={[0, rowY, AXIS_Z]}>
      {placed.map(({ it, baseX }, i) => (
        <Segment key={i} baseX={baseX} off={off}>
          <Text
            font={FONT}
            fontSize={it.bigSize}
            lineHeight={0.9}
            color={it.color}
            anchorX="center"
            anchorY="bottom"
            textAlign="center"
            position={[0, -0.12 * k, 0]}
            letterSpacing={0.01}
            // troika supports curveRadius; drei's Text typings omit it.
            {...{ curveRadius: R }}
            outlineWidth={0}
            outlineOffsetX="3.5%"
            outlineOffsetY="3.5%"
            outlineColor={SHADOW[it.color]}
            outlineOpacity={0.85}
          >
            {it.big}
          </Text>
          <Text
            font={FONT}
            fontSize={it.labelSize}
            lineHeight={1.15}
            color={it.color}
            fillOpacity={0.72}
            anchorX="center"
            anchorY="top"
            textAlign="center"
            position={[0, -0.02 * k, 0]}
            letterSpacing={0.02}
            // troika supports curveRadius; drei's Text typings omit it.
            {...{ curveRadius: R }}
            outlineWidth="4%"
            outlineBlur="40%"
            outlineColor={it.color}
            outlineOpacity={0.16}
          >
            {it.label}
          </Text>
        </Segment>
      ))}
      {/* Chrome sparkles in the gaps between columns. */}
      {placed.slice(0, -1).map(({ it, baseX }, i) => (
        <Segment key={`spark-${i}`} baseX={baseX + it.width / 2 + gap / 2} off={off}>
          <Spark geometry={assets.star} material={assets.starMat} phase={i * 1.7} k={k} />
        </Segment>
      ))}
    </group>
  )
}
