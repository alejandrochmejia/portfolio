import { useRef, useState, type PointerEvent, type KeyboardEvent } from 'react'
import type { Project } from './Projects.tsx'

type Props = { project: Project; index: number }

/** A single Y2K CD: iridescent disc that tilts holographically toward the cursor
 *  and flips on click to reveal the project's inlay (role, stack, links). */
export function ProjectCD({ project, index }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [flipped, setFlipped] = useState(false)

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    el.style.setProperty('--rx', ((0.5 - py) * 16).toFixed(2) + 'deg')
    el.style.setProperty('--ry', ((px - 0.5) * 16).toFixed(2) + 'deg')
    el.style.setProperty('--mx', (px * 100).toFixed(1) + '%')
    el.style.setProperty('--my', (py * 100).toFixed(1) + '%')
  }

  const reset = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  const toggle = () => setFlipped((f) => !f)
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle()
    }
  }

  const num = String(index + 1).padStart(2, '0')

  return (
    <div className="cd-wrap">
      <div
        ref={ref}
        className="cd"
        data-flipped={flipped}
        onPointerMove={onMove}
        onPointerLeave={reset}
        onClick={toggle}
        onKeyDown={onKey}
        role="button"
        tabIndex={0}
        aria-label={`${project.title} — ${flipped ? 'ver disco' : 'ver detalles'}`}
        aria-expanded={flipped}
      >
        <div className="cd__inner">
          <div className="cd__flip">
            <div className="cd__face cd__front">
              <div className="cd__disc" />
              <div className="cd__sheen" />
              <div className="cd__ring" />
              <div className="cd__hole" />
              <span className="cd__name">{project.title}</span>
              <span className="cd__hint">⟳</span>
            </div>

            <div className="cd__face cd__back">
              <div className="cd__inlay-top">
                <span className="cd__idx">{num}</span>
                <span className="cd__year">{project.year}</span>
              </div>
              <h3 className="cd__inlay-title">{project.title}</h3>
              <p className="cd__role">{project.role}</p>
              <p className="cd__blurb">{project.blurb}</p>
              <ul className="cd__stack">
                {project.stack.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <div className="cd__links">
                {project.demo && (
                  <a href={project.demo} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                    Demo ↗
                  </a>
                )}
                {project.repo && (
                  <a href={project.repo} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                    Código ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="cd-wrap__caption">
        <span>{num}</span> {project.title}
      </p>
    </div>
  )
}
