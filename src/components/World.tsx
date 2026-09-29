import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState } from 'react'
import { WorldScene } from './WorldScene.tsx'
import { PROJECTS } from './projectsData.ts'
import { MAX_PAN } from './fieldLayout.ts'
import { QUALITY } from './quality.ts'
import './World.css'

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b)

/** Hero + a floating field of project orbs in one 3D world. Hover shows a small
 *  label; clicking an orb hides the field and opens a glass detail panel. */
export function World() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const progress = useRef(0)
  const pan = useRef(0)
  const panDir = useRef(0)
  const selected = useRef<number | null>(null)

  const [hovered, setHovered] = useState<number | null>(null)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [phase, setPhase] = useState<'name' | 'field'>('name')
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
      setPhase(p > 0.18 && p < 0.86 ? 'field' : 'name')
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

  // Tooltip follows the cursor (no re-render).
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = tipRef.current
      if (el) el.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
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

  // Stop panning whenever the field isn't the active, interactive layer.
  useEffect(() => {
    if (phase !== 'field' || selectedIdx !== null) panDir.current = 0
  }, [phase, selectedIdx])

  const open = (i: number) => {
    selected.current = i
    setSelectedIdx(i)
    setHovered(null)
    panDir.current = 0
    document.body.style.cursor = ''
  }
  const canPan = MAX_PAN > 0 && phase === 'field' && selectedIdx === null
  const close = () => {
    selected.current = null
    setSelectedIdx(null)
  }

  const p = selectedIdx !== null ? PROJECTS[selectedIdx] : null

  return (
    <section className="world" ref={sectionRef}>
      <div className="world__pin">
        <Canvas
          className="world__canvas"
          dpr={[1, QUALITY.maxDpr]}
          camera={{ position: [0, 0, 6], fov: 42 }}
          gl={{ antialias: true }}
          frameloop={past ? 'never' : 'always'}
        >
          <Suspense fallback={null}>
            <WorldScene
              progress={progress}
              pan={pan}
              panDir={panDir}
              selected={selected}
              onHover={setHovered}
              onSelect={open}
            />
          </Suspense>
        </Canvas>

        <div className="world__overlay" data-phase={phase} data-open={selectedIdx !== null}>
          <div className="world__section">
            <p className="world__kicker">02 — Selected work</p>
            <h2 className="world__section-title">Proyectos</h2>
          </div>

          <p className="world__tag">
            <span>Full-Stack Developer</span>
            <span className="world__dot">·</span>
            <span>AI Engineer</span>
          </p>
          <div className="world__hint" aria-hidden="true" data-phase={phase}>
            {phase === 'field' ? 'Toca un orbe para ver el proyecto' : 'Scroll ↓'}
          </div>
        </div>

        {/* Horizontal pan arrows — hover (or hold) to glide the field. */}
        <button
          type="button"
          className="world__nav world__nav--left"
          data-show={canPan}
          aria-label="Proyectos anteriores"
          onPointerEnter={() => (panDir.current = -1)}
          onPointerLeave={() => (panDir.current = 0)}
          onPointerDown={() => (panDir.current = -1)}
          onPointerUp={() => (panDir.current = 0)}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <button
          type="button"
          className="world__nav world__nav--right"
          data-show={canPan}
          aria-label="Más proyectos"
          onPointerEnter={() => (panDir.current = 1)}
          onPointerLeave={() => (panDir.current = 0)}
          onPointerDown={() => (panDir.current = 1)}
          onPointerUp={() => (panDir.current = 0)}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>

        {/* Hover label (few details). */}
        <div
          ref={tipRef}
          className="world__tip"
          data-show={hovered !== null && selectedIdx === null}
          aria-hidden="true"
        >
          {hovered !== null && (
            <>
              <span className="world__tip-name">{PROJECTS[hovered].title}</span>
              <span className="world__tip-role">{PROJECTS[hovered].role}</span>
            </>
          )}
        </div>

        {/* Detail panel — glass frame with a preview + the write-up. */}
        {p && (
          <div className="detail" role="dialog" aria-modal="true" aria-label={p.title}>
            <button className="detail__close" onClick={close} aria-label="Cerrar">
              ✕
            </button>
            <div className="detail__card">
              <div className="detail__preview">
                <div className="detail__preview-glow" />
                <span className="detail__preview-label">{p.demo ? new URL(p.demo).host : 'GitHub'}</span>
                {p.demo && (
                  <a className="detail__open" href={p.demo} target="_blank" rel="noreferrer">
                    Abrir sistema ↗
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
                  Mi aporte: {p.role.toLowerCase()} del proyecto — [describe aquí qué construiste, decisiones
                  técnicas y resultados].
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
                      Código ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <h1 className="world__sr">Alejandro Chávez — Full-Stack Developer & AI Engineer. Proyectos.</h1>
    </section>
  )
}
