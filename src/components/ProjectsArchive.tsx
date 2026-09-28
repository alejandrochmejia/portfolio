import { type CSSProperties } from 'react'
import { ARCHIVE, SHOWCASE } from './projectsData.ts'
import { useInView } from '../hooks/useInView.ts'

/** The rest of the projects, as a compact grid that reveals on scroll. */
export function ProjectsArchive() {
  const [ref, shown] = useInView<HTMLDivElement>()
  if (ARCHIVE.length === 0) return null

  return (
    <section className="projects projects--tail">
      <div className="projects__grain" aria-hidden="true" />
      <div className="projects__archive" ref={ref} data-shown={shown}>
        <h3 className="archive__title">Archivo</h3>
        <ul className="archive__list">
        {ARCHIVE.map((p, i) => (
          <li className="archive__card" key={p.title} style={{ '--i': i } as CSSProperties}>
            <div className="archive__card-top">
              <span>{String(SHOWCASE.length + i + 1).padStart(2, '0')}</span>
              <span>{p.year}</span>
            </div>
            <h4>{p.title}</h4>
            <p className="archive__card-role">{p.role}</p>
            <div className="archive__card-links">
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
          </li>
        ))}
        </ul>
      </div>
    </section>
  )
}
