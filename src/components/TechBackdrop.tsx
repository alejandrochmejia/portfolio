import { Canvas } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { QUALITY } from './quality.ts'

/** The World's backdrop (same colour, camera and Sparkles as WorldScene) so the
 *  Tech Stack section keeps the site's floating-particles background. Lazy-loaded
 *  from TechStack; three/drei come from the shared `vendor-three` chunk. */
export default function TechBackdrop({ running }: { running: boolean }) {
  return (
    <Canvas
      className="tstack__bg"
      // Inline: R3F sets `position: relative` on its wrapper, which would beat a class.
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      dpr={[1, QUALITY.maxDpr]}
      camera={{ position: [0, 0, 6], fov: 42 }}
      gl={{ antialias: false, alpha: false }}
      frameloop={running ? 'always' : 'never'}
      aria-hidden="true"
    >
      <color attach="background" args={['#050506']} />
      <Sparkles count={QUALITY.sparkles} scale={[14, 8, 4]} size={3} speed={0.2} color="#ffffff" opacity={0.6} />
    </Canvas>
  )
}
