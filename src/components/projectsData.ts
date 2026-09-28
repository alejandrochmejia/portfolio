export type Project = {
  title: string
  role: string
  year: string
  blurb: string
  stack: string[]
  demo?: string
  repo?: string
  featured?: boolean
}

/** Placeholder projects — reemplaza por los tuyos. Marca los mejores con
 *  `featured: true` (van al showcase animado); el resto cae en el archivo. */
export const PROJECTS: Project[] = [
  { title: 'Nebula', role: 'Full-Stack · AI', year: '2025', blurb: 'Asistente conversacional con RAG.', stack: ['React', 'Node', 'LangChain', 'pgvector'], demo: '#', repo: '#', featured: true },
  { title: 'Fluxboard', role: 'Full-Stack', year: '2024', blurb: 'Dashboard en tiempo real.', stack: ['Next.js', 'WebSocket', 'Redis', 'D3'], demo: '#', repo: '#', featured: true },
  { title: 'Vórtex', role: 'Creative Dev', year: '2024', blurb: 'Configurador 3D en el navegador.', stack: ['Three.js', 'R3F', 'GLSL'], demo: '#', repo: '#', featured: true },
  { title: 'Synth', role: 'AI Engineer', year: '2025', blurb: 'Gateway de APIs LLM.', stack: ['Python', 'FastAPI', 'Redis'], demo: '#', repo: '#', featured: true },
  { title: 'Aurora', role: 'Frontend', year: '2023', blurb: 'Design system y librería de componentes.', stack: ['React', 'Storybook'], demo: '#', repo: '#' },
  { title: 'Relay', role: 'Backend', year: '2023', blurb: 'Infraestructura de chat en tiempo real.', stack: ['Go', 'gRPC', 'NATS'], demo: '#', repo: '#' },
  { title: 'Pulse', role: 'Full-Stack', year: '2022', blurb: 'Plataforma de analítica de producto.', stack: ['Vue', 'ClickHouse'], demo: '#', repo: '#' },
  { title: 'Forge', role: 'Dev Tools', year: '2023', blurb: 'Toolkit de CLI para scaffolding.', stack: ['Rust', 'WASM'], demo: '#', repo: '#' },
]

const FEATURED = PROJECTS.filter((p) => p.featured)
export const SHOWCASE = FEATURED.length ? FEATURED : PROJECTS
export const ARCHIVE = FEATURED.length ? PROJECTS.filter((p) => !p.featured) : []
