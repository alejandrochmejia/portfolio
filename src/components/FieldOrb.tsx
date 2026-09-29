import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Text, MeshTransmissionMaterial } from '@react-three/drei'
import { type Group, type Mesh, type Texture } from 'three'
import { type Project } from './projectsData.ts'
import { clamp, slotFor } from './fieldLayout.ts'
import { QUALITY } from './quality.ts'

const FONT = '/fonts/Anton-Regular.ttf'

export type FieldOrbProps = {
  project: Project
  index: number
  icon: Texture
  glow: Texture
  mask: Texture
  progress: MutableRefObject<number>
  pan: MutableRefObject<number>
  selected: MutableRefObject<number | null>
  onHover: (i: number | null) => void
  onSelect: (i: number) => void
}

/** A floating glass orb carrying a project's app icon + name. It appears/exits
 *  with scroll, slides with the field's pan, grows a touch on hover, and fades
 *  out when any project is selected. */
export function FieldOrb({ project, index, icon, glow, mask, progress, pan, selected, onHover, onSelect }: FieldOrbProps) {
  const grp = useRef<Group>(null)
  const content = useRef<Group>(null)
  const core = useRef<Mesh>(null)
  const hov = useRef(false)
  const s = useRef(0)
  const slot = useMemo(() => slotFor(index), [index])

  // Keep the icon's aspect ratio so wide logos (e.g. Drinkers) don't squash.
  const img = icon.image as { width?: number; height?: number } | undefined
  const ar = img && img.width && img.height ? img.width / img.height : 1
  const iconH = 0.4
  const iconW = iconH * ar
  const glowSize = Math.max(iconW, iconH) * 1.7

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const p = progress.current
    const appear = clamp((p - 0.14) / 0.1, 0, 1)
    const exit = clamp((p - 0.82) / 0.14, 0, 1)
    const dim = selected.current !== null ? 0 : 1
    const target = appear * (1 - exit) * dim * (hov.current ? 1.18 : 1)
    s.current += (target - s.current) * 0.16

    // Live position: resting slot, minus the pan, plus a gentle drift.
    const x = slot.x - pan.current + Math.cos(t * 0.5 + index * 1.3) * 0.1
    const y = slot.y + Math.sin(t * 0.6 + index) * 0.12

    const g = grp.current
    if (g) {
      g.position.set(x, y, slot.z)
      g.scale.setScalar(s.current * 0.8)
      // Cull orbs panned well off-screen (transmission is expensive).
      g.visible = s.current > 0.01 && Math.abs(x) < 4.7
    }
    // The icon + name float in front of the glass; for off-centre orbs that front
    // offset shifts them outward (perspective parallax). Pull them back toward the
    // orb's centre by a fraction of its live position so they read as centred.
    if (content.current) content.current.position.set(-0.125 * x, -0.125 * slot.y, 0)
    if (core.current) core.current.rotation.y = t * 0.2
  })

  return (
    <group ref={grp} position={[slot.x, slot.y, slot.z]}>
      {/* Icon + name float in front of the glass, parallax-compensated. */}
      <group ref={content}>
        {/* Soft glow so the icon reads on any part of the orb. */}
        <mesh position={[0, 0.16, 0.93]} scale={[glowSize, glowSize, 1]}>
          <planeGeometry />
          <meshBasicMaterial map={glow} transparent toneMapped={false} depthWrite={false} opacity={0.5} />
        </mesh>
        <mesh position={[0, 0.16, 0.95]} scale={[iconW, iconH, 1]}>
          <planeGeometry />
          <meshBasicMaterial map={icon} alphaMap={mask} transparent toneMapped={false} depthWrite={false} />
        </mesh>

        <Text
          font={FONT}
          fontSize={0.21}
          letterSpacing={-0.02}
          lineHeight={0.95}
          position={[0, -0.34, 0.95]}
          maxWidth={1.5}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          color="#f6f5f2"
          outlineWidth="3%"
          outlineBlur="45%"
          outlineColor="#000000"
          outlineOpacity={0.35}
        >
          {project.title.toUpperCase()}
        </Text>
      </group>

      <mesh
        ref={core}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          hov.current = true
          onHover(index)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          hov.current = false
          onHover(null)
          document.body.style.cursor = ''
        }}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          onSelect(index)
        }}
      >
        <sphereGeometry args={[0.9, 32, 32]} />
        <MeshTransmissionMaterial
          transmission={1}
          thickness={0.5}
          roughness={0.05}
          ior={1.4}
          chromaticAberration={0.14}
          anisotropicBlur={0.1}
          distortion={0.28}
          distortionScale={0.4}
          temporalDistortion={0.2}
          clearcoat={1}
          color="#ffffff"
          transmissionSampler
          resolution={QUALITY.resolution}
          samples={QUALITY.samples}
        />
      </mesh>
    </group>
  )
}
