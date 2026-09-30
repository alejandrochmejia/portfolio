import { useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { type Group } from 'three'
import { HeroRig } from './HeroRig.tsx'
import { AboutMarquee } from './AboutMarquee.tsx'
import { track, HERO_OUT } from './choreography.ts'
import { QUALITY } from './quality.ts'

type Props = {
  progress: MutableRefObject<number>
}

/** The single 3D world: the hero rig (which scrolls away) and the About barrel,
 *  lit by a studio env. The projects collage is DOM, layered over this canvas.
 *  No background/Sparkles here: the canvas is transparent over SiteBackdrop. */
export function WorldScene({ progress }: Props) {
  const heroRef = useRef<Group>(null)

  useFrame(() => {
    const p = progress.current ?? 0
    // Hero rises + shrinks away on a short scroll — it leaves as the About arrives.
    const nf = track(p, HERO_OUT[0], HERO_OUT[1])
    if (heroRef.current) {
      heroRef.current.position.y = nf * 2.6
      heroRef.current.scale.setScalar(1 - 0.9 * nf)
      heroRef.current.visible = nf < 1
    }
  })

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={2} />

      <group ref={heroRef}>
        <HeroRig />
      </group>

      <AboutMarquee progress={progress} />

      <Environment resolution={QUALITY.envResolution}>
        <Lightformer form="rect" intensity={1.6} position={[0, 0, 12]} scale={[50, 50, 1]} color="#c7d0e2" />
        <Lightformer form="rect" intensity={3} position={[0, 9, 3]} rotation={[Math.PI / 2, 0, 0]} scale={[30, 30, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.2} position={[0, -9, 3]} rotation={[-Math.PI / 2, 0, 0]} scale={[30, 30, 1]} color="#dfe6ff" />
        <Lightformer form="rect" intensity={6} position={[-12, 1, 1]} rotation={[0, Math.PI / 2, 0]} scale={[30, 20, 1]} color="#5f9bff" />
        <Lightformer form="rect" intensity={6} position={[12, -1, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[30, 20, 1]} color="#ff6fc0" />
      </Environment>
    </>
  )
}
