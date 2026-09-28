import { useEffect, useState } from 'react'
import { ProjectsOrbit } from './ProjectsOrbit.tsx'
import { ProjectsTurntable } from './ProjectsTurntable.tsx'
import { SHOWCASE } from './projectsData.ts'
import './Projects.css'

const AUTO_MS = 4500

/** The featured showcase: turntable on desktop, orbit on mobile, auto-rotating. */
export function ProjectsFeatured() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || SHOWCASE.length <= 1) return
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setTimeout(() => setActive((a) => (a + 1) % SHOWCASE.length), AUTO_MS)
    return () => clearTimeout(id)
  }, [active, paused])

  const hold = { onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false) }

  return (
    <div className="projects__featured">
      <div className="projects__grain" aria-hidden="true" />
      <header className="projects__head">
        <p className="projects__kicker">02 — Selected work</p>
        <h2 className="projects__title">PROYECTOS</h2>
      </header>

      <div className="projects__desktop" {...hold}>
        <ProjectsTurntable projects={SHOWCASE} active={active} setActive={setActive} />
      </div>
      <div className="projects__mobile" {...hold}>
        <ProjectsOrbit projects={SHOWCASE} active={active} setActive={setActive} />
      </div>
    </div>
  )
}
