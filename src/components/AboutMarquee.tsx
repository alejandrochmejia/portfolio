import { useMemo, useRef, type MutableRefObject, type ReactNode } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { type Group, type PerspectiveCamera } from 'three'
import { track, ABOUT_IN, ABOUT_OUT } from './choreography.ts'

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

const ITEMS: Item[] = [
  { big: '3+', bigSize: 3.0, color: BLUE, label: 'YEARS OF\nEXPERIENCE', labelSize: 0.5, width: 4.2 },
  { big: '20+', bigSize: 3.0, color: PINK, label: 'PROJECTS IN\nPRODUCTION', labelSize: 0.5, width: 5.6 },
  { big: 'FULL STACK\nDEVELOPER', bigSize: 1.35, color: CREAM, label: 'AI & COMPUTER ENGINEER', labelSize: 0.5, width: 7.2 },
  { big: 'FROM\nVENEZUELA', bigSize: 1.35, color: CREAM, label: 'BORN IN CCS · NOW IN VALENCIA', labelSize: 0.5, width: 7.2 },
]

const GAP = 1.2

/** The "Sobre mí" phase: the stats ride the inner wall of a barrel around the
 *  camera, emerging on the right and disappearing on the left as you scroll. */
export function AboutMarquee({ progress }: { progress: MutableRefObject<number> }) {
  const grp = useRef<Group>(null)
  const off = useRef(0)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const aspect = useThree((s) => s.size.width / s.size.height)
  // Arc position of the screen's side edges on the wall (adapts to aspect).
  const edge = R * edgeAngle(camera.position.z, camera.fov, aspect)

  const { placed, start, end } = useMemo(() => {
    let run = 0
    const placed = ITEMS.map((it) => {
      const center = run + it.width / 2
      run += it.width + GAP
      return { it, baseX: center }
    })
    const first = placed[0]
    const last = placed[placed.length - 1]
    // Offsets where the first column is just past the right edge / the last
    // column is just past the left edge: each column crosses exactly once.
    const start = edge + first.it.width / 2 - first.baseX
    const end = -(edge + last.it.width / 2) - last.baseX
    return { placed, start, end }
  }, [edge])

  useFrame(() => {
    // The whole "about" window drives one right → left pass of the row. The
    // barrel itself never moves: columns just enter and leave by the sides.
    const t = track(progress.current ?? 0, ABOUT_IN[0], ABOUT_OUT[1])
    off.current = start + (end - start) * t
    if (grp.current) grp.current.visible = t > 0 && t < 1
  })

  return (
    <group ref={grp} position={[0, -1.2, AXIS_Z]}>
      {placed.map(({ it, baseX }) => (
        <Segment key={it.big} baseX={baseX} off={off}>
          <Text
            font={FONT}
            fontSize={it.bigSize}
            lineHeight={0.9}
            color={it.color}
            anchorX="center"
            anchorY="bottom"
            textAlign="center"
            position={[0, -0.12, 0]}
            letterSpacing={0.01}
            curveRadius={R}
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
            position={[0, -0.02, 0]}
            letterSpacing={0.02}
            curveRadius={R}
          >
            {it.label}
          </Text>
        </Segment>
      ))}
    </group>
  )
}
