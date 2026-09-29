import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState } from 'react'
import { WorldScene } from './WorldScene.tsx'
import { PROJECTS } from './projectsData.ts'
import { ProjectsCollage } from './ProjectsCollage.tsx'
import { AboutHud } from './AboutHud.tsx'
import { track, FIELD_IN, FIELD_OUT } from './choreography.ts'
import { QUALITY } from './quality.ts'
import './World.css'

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b)

/** Hero + About in one 3D world, then the projects as a DOM collage layered over
 *  the canvas. Clicking a tile opens a glass detail panel. */
export function World() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const collageRef = useRef<HTMLDivElement>(null)
  const progress = useRef(0)

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [phase, setPhase] = useState<'name' | 'about' | 'field' | 'none'>('name')
  const [past, setPast] = useState(false)

  // Scroll → progress (drives hero exit + field appear/exit in the scene).
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = sectionRef.current
      if (!el) return
      const total = Math.max(1, el.offsetHeight - window.innerHeight)
      const p = clamp(-el.getBoundingClientRect().top / total, 0, 1)
      progress.current = p
      // Collage parallax: 0→1 across the projects phase (enter → exit).
      collageRef.current?.style.setProperty('--t', track(p, FIELD_IN[0], FIELD_OUT[1]).toFixed(4))
      // hero → about (curved marquee) → projects, along the pinned scroll.
      setPhase(p < 0.13 ? 'name' : p < 0.45 ? 'about' : p < 0.93 ? 'field' : 'none')
      setPast(el.getBoundingClientRect().bottom <= window.innerHeight * 0.4)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // Pointer parallax for the collage (CSS vars, no re-render).
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = collageRef.current
      if (!el) return
      el.style.setProperty('--mx', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3))
      el.style.setProperty('--my', ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3))
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  // Lock page scroll while the detail panel is open.
  useEffect(() => {
    document.body.style.overflow = selectedIdx !== null ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedIdx])

  const open = (i: number) => setSelectedIdx(i)
  const close = () => setSelectedIdx(null)

  const p = selectedIdx !== null ? PROJECTS[selectedIdx] : null

  return (
    <section className="world" ref={sectionRef}>
      <div className="world__pin">
        <Canvas
          className="world__canvas"
          dpr={[1, QUALITY.maxDpr]}
          camera={{ position: [0, 0, 6], fov: 42 }}
          // preserveDrawingBuffer: the menu's genie snapshot reads this canvas (Menu.tsx).
          gl={{ antialias: true, preserveDrawingBuffer: true }}
          frameloop={past ? 'never' : 'always'}
        >
          <Suspense fallback={null}>
            <WorldScene progress={progress} />
          </Suspense>
        </Canvas>

        <div className="world__overlay" data-phase={phase} data-open={selectedIdx !== null}>
          <AboutHud />

          <p className="world__tag">
            <span>Full-Stack Developer</span>
            <span className="world__dot">·</span>
            <span>AI Engineer</span>
          </p>
          <div className="world__hint" aria-hidden="true" data-phase={phase}>
            {phase === 'field' ? 'Tap a project to open it' : 'Scroll ↓'}
          </div>
        </div>

        <ProjectsCollage ref={collageRef} active={phase === 'field' && selectedIdx === null} onSelect={open} />

        {/* Detail panel — glass frame with a preview + the write-up. */}
        {p && (
          <div className="detail" role="dialog" aria-modal="true" aria-label={p.title}>
            <button className="detail__close" onClick={close} aria-label="Close">
              ✕
            </button>
            <div className="detail__card">
              <div className="detail__preview">
                <div className="detail__preview-glow" />
                <span className="detail__preview-label">{p.demo ? new URL(p.demo).host : 'GitHub'}</span>
                {p.demo && (
                  <a className="detail__open" href={p.demo} target="_blank" rel="noreferrer">
                    Open live site ↗
                  </a>
                )}
              </div>

              <div className="detail__info">
                <span className="detail__count">
                  {String(selectedIdx! + 1).padStart(2, '0')} / {String(PROJECTS.length).padStart(2, '0')}
                </span>
                <h2 className="detail__title">{p.title}</h2>
                <p className="detail__role">{p.role}</p>
                <p className="detail__what">{p.blurb}</p>
                <p className="detail__did">
                  My role: {p.role.toLowerCase()} — [describe here what you built, technical decisions and
                  results].
                </p>
                {p.stack.length > 0 && (
                  <ul className="detail__stack">
                    {p.stack.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                )}
                <div className="detail__links">
                  {p.demo && (
                    <a href={p.demo} target="_blank" rel="noreferrer">
                      Demo ↗
                    </a>
                  )}
                  {p.repo && (
                    <a href={p.repo} target="_blank" rel="noreferrer">
                      Code ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <h1 className="world__sr">Alejandro Chávez — Full-Stack Developer & AI Engineer. Projects.</h1>
    </section>
  )
}
