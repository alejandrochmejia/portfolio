import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { Scene } from './Scene.tsx'
import './Hero.css'

/** Crisp 4-point Y2K sparkle. */
function Star({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <path
        d="M50 0 C53 33 67 47 100 50 C67 53 53 67 50 100 C47 67 33 53 0 50 C33 47 47 33 50 0 Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function Hero() {
  return (
    <section className="hero">
      <Canvas
        className="hero__canvas"
        dpr={[1, 2]}
        camera={{ position: [0, 0, 6], fov: 42 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      <div className="hero__stars" aria-hidden="true">
        <Star className="hero__star hero__star--a" />
        <Star className="hero__star hero__star--b" />
        <Star className="hero__star hero__star--c" />
      </div>

      <div className="hero__grain" aria-hidden="true" />

      {/* Real heading for search engines and assistive tech. */}
      <h1 className="hero__sr">Alejandro Chávez — Full-Stack Developer & AI Engineer</h1>

      <p className="hero__tag">
        <span>Full-Stack Developer</span>
        <span className="hero__dot">·</span>
        <span>AI Engineer</span>
      </p>
    </section>
  )
}
