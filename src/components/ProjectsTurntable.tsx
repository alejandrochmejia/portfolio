import type { Dispatch, SetStateAction } from 'react'
import { Disc } from './Disc.tsx'
import type { Project } from './projectsData.ts'

type Props = {
  projects: Project[]
  active: number
  setActive: Dispatch<SetStateAction<number>>
}

/** Desktop layout: a big spinning disc (turntable) beside a numbered tracklist.
 *  Hovering / focusing / clicking a track swaps the disc and its details. */
export function ProjectsTurntable({ projects, active, setActive }: Props) {
  const p = projects[active]

  return (
    <div className="tt">
      <div className="tt__stage">
        <div className="tt__platter">
          <div className="tt__disc" key={active}>
            <Disc title={p.title} />
          </div>
        </div>
        <div className="tt__info" key={`info-${active}`}>
          <h3 className="tt__title">{p.title}</h3>
          <p className="tt__role">{p.role}</p>
          <div className="tt__links">
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

      <ol className="tt__list">
        {projects.map((proj, i) => (
          <li key={proj.title}>
            <button
              className="tt__track"
              data-on={i === active}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-current={i === active}
            >
              <span className="tt__num">{String(i + 1).padStart(2, '0')}</span>
              <span className="tt__name">{proj.title}</span>
              <span className="tt__meta">{proj.role}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
