import { ProjectCD } from './ProjectCD.tsx'
import './Projects.css'

export type Project = {
  title: string
  role: string
  year: string
  blurb: string
  stack: string[]
  demo?: string
  repo?: string
}

/** Placeholder projects — reemplaza por los tuyos (title, blurb, stack, links). */
const PROJECTS: Project[] = [
  {
    title: 'Nebula',
    role: 'Full-Stack · AI',
    year: '2025',
    blurb: 'Asistente conversacional con RAG sobre documentos privados y respuestas citadas.',
    stack: ['React', 'Node', 'LangChain', 'pgvector'],
    demo: '#',
    repo: '#',
  },
  {
    title: 'Fluxboard',
    role: 'Full-Stack',
    year: '2024',
    blurb: 'Dashboard en tiempo real con websockets y visualizaciones en vivo.',
    stack: ['Next.js', 'WebSocket', 'Redis', 'D3'],
    demo: '#',
    repo: '#',
  },
  {
    title: 'Vórtex',
    role: 'Creative Dev',
    year: '2024',
    blurb: 'Configurador de producto 3D en el navegador con materiales realistas.',
    stack: ['Three.js', 'R3F', 'GLSL'],
    demo: '#',
    repo: '#',
  },
  {
    title: 'Synth',
    role: 'AI Engineer',
    year: '2025',
    blurb: 'Gateway de APIs LLM con caché semántica y control de costos.',
    stack: ['Python', 'FastAPI', 'Redis', 'LLMs'],
    demo: '#',
    repo: '#',
  },
]

export function Projects() {
  return (
    <section className="projects" id="proyectos">
      <div className="projects__grain" aria-hidden="true" />

      <header className="projects__head">
        <p className="projects__kicker">02 — Selected work</p>
        <h2 className="projects__title">PROYECTOS</h2>
        <p className="projects__sub">Pasa el cursor para el brillo · haz clic para girar el disco</p>
      </header>

      <div className="projects__grid">
        {PROJECTS.map((p, i) => (
          <ProjectCD key={p.title} project={p} index={i} />
        ))}
      </div>
    </section>
  )
}
