import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment, Lightformer, Sparkles, useTexture } from '@react-three/drei'
import { SRGBColorSpace, type Group, type Texture } from 'three'
import { PROJECTS } from './projectsData.ts'
import { HeroRig } from './HeroRig.tsx'
import { FieldOrb } from './FieldOrb.tsx'
import { clamp, MAX_PAN } from './fieldLayout.ts'
import { QUALITY } from './quality.ts'
import { makeGlowTexture, makeRoundedMask } from './iconTextures.ts'

type Props = {
  progress: MutableRefObject<number>
  pan: MutableRefObject<number>
  panDir: MutableRefObject<number>
  selected: MutableRefObject<number | null>
  onHover: (i: number | null) => void
  onSelect: (i: number) => void
}

const PAN_SPEED = 1.7 // world units per second while an arrow is hovered

/** The single 3D world: the hero rig (which scrolls away) and the floating field
 *  of project orbs, lit by a studio env. All motion is ref-driven in useFrame. */
export function WorldScene({ progress, pan, panDir, selected, onHover, onSelect }: Props) {
  const heroRef = useRef<Group>(null)

  // App icons as textures (one per project, same order as PROJECTS).
  const icons = useTexture(PROJECTS.map((p) => p.icon)) as Texture[]
  icons.forEach((t) => (t.colorSpace = SRGBColorSpace))
  const glow = useMemo(makeGlowTexture, [])
  const mask = useMemo(makeRoundedMask, [])

  useFrame((_, delta) => {
    const p = progress.current ?? 0
    // Hero rises + shrinks away on a short scroll — it leaves as the field arrives.
    const nf = clamp((p - 0.05) / 0.12, 0, 1)
    if (heroRef.current) {
      heroRef.current.position.y = nf * 2.6
      heroRef.current.scale.setScalar(1 - 0.9 * nf)
      heroRef.current.visible = nf < 1
    }
    // Advance the horizontal pan while an arrow is hovered (held direction).
    pan.current = clamp(pan.current + panDir.current * PAN_SPEED * delta, 0, MAX_PAN)
  })

  return (
    <>
      <color attach="background" args={['#050506']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={2} />

      <group ref={heroRef}>
        <HeroRig />
      </group>

      {PROJECTS.map((proj, i) => (
        <FieldOrb
          key={proj.title}
          project={proj}
          index={i}
          icon={icons[i]}
          glow={glow}
          mask={mask}
          progress={progress}
          pan={pan}
          selected={selected}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}

      <Sparkles count={QUALITY.sparkles} scale={[14, 8, 4]} size={3} speed={0.2} color="#ffffff" opacity={0.6} />

      <Environment resolution={512}>
        <Lightformer form="rect" intensity={1.6} position={[0, 0, 12]} scale={[50, 50, 1]} color="#c7d0e2" />
        <Lightformer form="rect" intensity={3} position={[0, 9, 3]} rotation={[Math.PI / 2, 0, 0]} scale={[30, 30, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.2} position={[0, -9, 3]} rotation={[-Math.PI / 2, 0, 0]} scale={[30, 30, 1]} color="#dfe6ff" />
        <Lightformer form="rect" intensity={6} position={[-12, 1, 1]} rotation={[0, Math.PI / 2, 0]} scale={[30, 20, 1]} color="#5f9bff" />
        <Lightformer form="rect" intensity={6} position={[12, -1, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[30, 20, 1]} color="#ff6fc0" />
      </Environment>
    </>
  )
}
