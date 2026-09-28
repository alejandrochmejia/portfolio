import { useRef, type Dispatch, type KeyboardEvent, type PointerEvent, type SetStateAction } from 'react'
import { Disc } from './Disc.tsx'
import type { Project } from './projectsData.ts'

const RADIUS_X = 250
const LIFT_Y = 45

type Props = {
  projects: Project[]
  active: number
  setActive: Dispatch<SetStateAction<number>>
}

/** Mobile layout: discs ride an ellipse, the front one is the active project,
 *  navigated by arrows, dots, drag, keyboard, or clicking a disc. */
export function ProjectsOrbit({ projects, active, setActive }: Props) {
  const count = projects.length
  const dragX = useRef<number | null>(null)

  const go = (dir: number) => setActive((a) => (a + dir + count) % count)

  const itemStyle = (i: number) => {
    let rel = i - active
    while (rel > count / 2) rel -= count
    while (rel < -count / 2) rel += count
    const th = rel * ((Math.PI * 2) / count)
    const depth = Math.cos(th) // 1 = front, -1 = back
    const x = Math.sin(th) * RADIUS_X
    const y = -(1 - depth) * LIFT_Y
    const norm = (depth + 1) / 2 // 0..1
    return {
      transform: `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(
        0.52 +
        norm * 0.6
      ).toFixed(3)})`,
      opacity: 0.2 + norm * 0.8,
      zIndex: Math.round(norm * 100),
      filter: `blur(${((1 - norm) * 3).toFixed(1)}px)`,
    }
  }

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    dragX.current = e.clientX
  }
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    if (dragX.current == null) return
    const dx = e.clientX - dragX.current
    if (dx > 45) go(-1)
    else if (dx < -45) go(1)
    dragX.current = null
  }
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') go(-1)
    else if (e.key === 'ArrowRight') go(1)
  }

  const p = projects[active]

  return (
    <div className="orbit-wrap">
      <div
        className="orbit"
        role="group"
        aria-label="Carrusel de proyectos"
        tabIndex={0}
        onPointerDown={onDown}
        onPointerUp={onUp}
        onKeyDown={onKey}
      >
        {projects.map((proj, i) => (
          <button
            key={proj.title}
            className="orbit-item"
            style={itemStyle(i)}
            onClick={() => setActive(i)}
            aria-label={proj.title}
            aria-current={i === active}
            tabIndex={i === active ? 0 : -1}
          >
            <Disc title={proj.title} />
          </button>
        ))}
      </div>

      <div className="orbit-ctrls">
        <button className="orbit-btn" onClick={() => go(-1)} aria-label="Proyecto anterior">
          ‹
        </button>
        <div className="orbit-dots">
          {projects.map((proj, i) => (
            <button
              key={proj.title}
              className="orbit-dot"
              data-on={i === active}
              onClick={() => setActive(i)}
              aria-label={`Ir a ${proj.title}`}
            />
          ))}
        </div>
        <button className="orbit-btn" onClick={() => go(1)} aria-label="Proyecto siguiente">
          ›
        </button>
      </div>

      <div className="orbit-details" key={active}>
        <h3 className="orbit-details__title">{p.title}</h3>
        <p className="orbit-details__role">{p.role}</p>
        <div className="orbit-links">
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
  )
}
