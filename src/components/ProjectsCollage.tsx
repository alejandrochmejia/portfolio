import { type CSSProperties, type Ref } from 'react'
import { PROJECTS, type Project } from './projectsData.ts'
import { tr, useCopy, useLang } from '../i18n.ts'
import { COLLAGE, entryOrder, type CollageItem, type DecorKind } from './collageLayout.ts'
import { Blink, ChromeStar, RingBadge, SegLoader, WindowDots } from './y2k.tsx'
import './ProjectsCollage.css'

type Props = {
  /** Root element: World writes the scroll (`--t`) and pointer (`--mx/--my`) vars here. */
  ref?: Ref<HTMLDivElement>
  /** Tiles are shown + interactive only while the projects phase is on screen. */
  active: boolean
  onSelect: (i: number) => void
}

const pad = (n: number) => String(n).padStart(2, '0')

const COPY = {
  es: { title: 'Proyectos', online: 'En línea', loading: 'Cargando trabajos…', badge: 'PROYECTOS ✦ ALEJANDRO CHÁVEZ ✦ ' },
  en: { title: 'Projects', online: 'Online', loading: 'Loading work…', badge: 'SELECTED WORK ✦ ALEJANDRO CHÁVEZ ✦ ' },
}

/** Grid placement + parallax depth + entry order as CSS vars on the cell. */
function cellStyle(item: CollageItem, i: number): CSSProperties {
  const [c, r, cs = 1, rs = 1] = item.d
  const [tc, tRow, tcs = 1, trs = 1] = item.t
  const m = item.m
  return {
    '--c': c,
    '--r': r,
    '--cs': cs,
    '--rs': rs,
    '--tc': tc,
    '--tr': tRow,
    '--tcs': tcs,
    '--trs': trs,
    '--mc': m ? m[0] : 1,
    '--mr': m ? m[1] : 1,
    '--mcs': m?.[2] ?? 1,
    '--mrs': m?.[3] ?? 1,
    '--z': item.depth,
    '--o': entryOrder(i),
    // Phone-landscape strip order (title first, then projects by index).
    '--pi': item.kind === 'project' ? item.index + 1 : 0,
  } as CSSProperties
}

/** Projects as a scattered collage (ref: studiofreight.com) in the portfolio's
 *  Y2K liquid-glass language: rounded "OS window" tiles with chrome rims, the
 *  section title in the centre, and a few decorative Y2K tiles in the gaps. */
export function ProjectsCollage({ ref, active, onSelect }: Props) {
  return (
    <div className="collage" ref={ref} data-active={active}>
      <div className="collage__grid">
        {COLLAGE.map((item, i) => (
          <div
            key={i}
            className="collage__cell"
            data-kind={item.kind}
            data-mobile={item.m ? 'show' : 'hide'}
            style={cellStyle(item, i)}
          >
            <div className="collage__pop">
            {item.kind === 'title' && <CollageTitle />}
            {item.kind === 'decor' && <DecorTile kind={item.decor} />}
            {item.kind === 'project' && (
              <ProjectTile
                project={PROJECTS[item.index]}
                index={item.index}
                featured={(item.d[2] ?? 1) > 1}
                tabbable={active}
                onSelect={onSelect}
              />
            )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CollageTitle() {
  const t = useCopy(COPY)
  return (
    <div className="ctitle">
      <h2 className="ctitle__name y2k-chrome">
        {t.title}
        <sup aria-hidden="true">✦</sup>
      </h2>
    </div>
  )
}

type TileProps = {
  project: Project
  index: number
  featured: boolean
  tabbable: boolean
  onSelect: (i: number) => void
}

function ProjectTile({ project, index, featured, tabbable, onSelect }: TileProps) {
  const lang = useLang()
  const role = tr(project.role, lang)
  const host = project.demo
    ? new URL(project.demo).host
    : `gh/${project.repo?.split('/').pop() ?? ''}`
  return (
    <button
      type="button"
      className="tile"
      data-featured={featured}
      data-index={index}
      tabIndex={tabbable ? 0 : -1}
      style={{ '--accent': project.accent } as CSSProperties}
      onClick={() => onSelect(index)}
      aria-label={`${project.title} — ${role} · ${project.year}`}
    >
      {/* Y2K OS-window title bar. */}
      <span className="tile__bar" aria-hidden="true">
        <WindowDots />
        <span className="tile__host">{host}</span>
        <span className="tile__num">{pad(index + 1)}</span>
      </span>

      <span className="tile__screen" aria-hidden="true">
        {project.cover ? (
          <img className="tile__cover" src={project.cover} alt="" loading="lazy" />
        ) : (
          <span className="tile__icon">
            <img src={project.icon} alt="" loading="lazy" />
          </span>
        )}
        <span className="tile__scan" />
      </span>

      <span className="tile__meta" aria-hidden="true">
        <span className="tile__title">{project.title}</span>
        <span className="tile__role">
          {role} · {project.year}
        </span>
      </span>
    </button>
  )
}

function DecorTile({ kind }: { kind: DecorKind }) {
  const t = useCopy(COPY)
  if (kind === 'star')
    return (
      <div className="decor decor--star" aria-hidden="true">
        <ChromeStar />
      </div>
    )

  if (kind === 'badge')
    return (
      <div className="decor decor--badge" aria-hidden="true">
        <RingBadge text={t.badge} />
      </div>
    )

  if (kind === 'count')
    return (
      <div className="decor decor--count" aria-hidden="true">
        <span className="decor__big">{pad(PROJECTS.length)}</span>
        <span className="decor__label">
          <Blink /> {t.online}
        </span>
      </div>
    )

  return (
    <div className="decor decor--loader" aria-hidden="true">
      <span className="decor__label">{t.loading}</span>
      <SegLoader />
      <span className="decor__label decor__label--dim">© 2026 · v3</span>
    </div>
  )
}
