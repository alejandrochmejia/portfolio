import { useEffect, useRef, useState } from 'react'
import { Hero } from './Hero.tsx'
import { ProjectsFeatured } from './ProjectsFeatured.tsx'
import './Showcase.css'

/** Hero and the Projects showcase share one pinned viewport and swap with a Y2K
 *  glitch as you scroll: the hero rises/fades out while Projects fades/rises in
 *  at the same spot, under a burst of static, scanlines, colour-split and shake
 *  — like tuning to a new channel. No overlap-slide, no black gap. */
export function Showcase() {
  const pinRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const featRef = useRef<HTMLDivElement>(null)
  const [frozen, setFrozen] = useState(false)

  useEffect(() => {
    const reduce =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const update = () => {
      raf = 0
      if (reduce) {
        for (const el of [heroRef.current, featRef.current]) {
          if (el) {
            el.style.opacity = '1'
            el.style.pointerEvents = 'auto'
          }
        }
        return
      }
      const h = window.innerHeight
      const t = Math.min(Math.max(window.scrollY / h, 0), 1) // 0→1 across the pinned travel

      // Swap the two layers under the glitch peak.
      const heroP = Math.min(t / 0.24, 1)
      const featP = Math.min(Math.max((t - 0.08) / 0.24, 0), 1)
      // Glitch burst: ramps 0→1→0 across the transition, 0 at rest.
      const g = t <= 0 ? 0 : t < 0.15 ? t / 0.15 : t < 0.32 ? (0.32 - t) / 0.17 : 0

      const hero = heroRef.current
      if (hero) {
        hero.style.opacity = String(1 - heroP)
        hero.style.transform = `translateY(${(-heroP * 12).toFixed(2)}vh)`
        hero.style.pointerEvents = heroP >= 1 ? 'none' : 'auto'
      }
      const feat = featRef.current
      if (feat) {
        feat.style.opacity = String(featP)
        feat.style.transform = `translateY(${((1 - featP) * 40).toFixed(1)}px)`
        feat.style.pointerEvents = featP >= 0.6 ? 'auto' : 'none'
      }
      if (pinRef.current) pinRef.current.style.setProperty('--g', Math.max(0, g).toFixed(3))
      setFrozen(heroP >= 1)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section className="showcase">
      <div className="showcase__pin" ref={pinRef}>
        <div className="showcase__stage">
          <div className="showcase__layer showcase__featured" ref={featRef}>
            <ProjectsFeatured />
          </div>
          <div className="showcase__layer showcase__hero" ref={heroRef}>
            <Hero frozen={frozen} />
          </div>
        </div>
        <div className="showcase__glitch" aria-hidden="true" />
      </div>
    </section>
  )
}
