import { Canvas } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { QUALITY } from './quality.ts'

/** One fixed backdrop for the whole page (site colour + floating Sparkles, same
 *  camera as the World). Sections are transparent over it, so the background
 *  stays put while the content scrolls. Lazy-loaded from App; three/drei come
 *  from the shared `vendor-three` chunk. */
export default function SiteBackdrop() {
  return (
    <Canvas
      className="site-bg"
      // Inline: R3F sets `position: relative` on its wrapper, which would beat a class.
      style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}
      dpr={[1, QUALITY.maxDpr]}
      camera={{ position: [0, 0, 6], fov: 42 }}
      gl={{ antialias: false, alpha: false }}
      aria-hidden="true"
    >
      <color attach="background" args={['#050506']} />
      <Sparkles count={QUALITY.sparkles} scale={[14, 8, 4]} size={3} speed={0.2} color="#ffffff" opacity={0.6} />
    </Canvas>
  )
}
