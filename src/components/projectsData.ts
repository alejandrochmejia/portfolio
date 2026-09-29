export type Project = {
  title: string
  role: string
  year: string
  blurb: string
  stack: string[]
  /** App icon shown inside its glass orb (path under /public). */
  icon: string
  /** Tile tint in the projects collage (matches the icon's dominant colour). */
  accent: string
  /** Optional screenshot/cover (path under /public). Falls back to the icon. */
  cover?: string
  demo?: string
  repo?: string
}

/** The projects shown in the collage, in display order (their position in the
 *  grid lives in `collageLayout.ts`, keyed by index). */
export const PROJECTS: Project[] = [
  { title: 'Pickop', role: 'Full-Stack', year: '2026', blurb: 'End-to-end system.', stack: [], icon: '/icons/pickop.png', accent: '#7fdc6a', demo: 'https://pickop.app' },
  { title: 'Roda', role: 'Full-Stack', year: '2026', blurb: 'End-to-end system.', stack: [], icon: '/icons/roda-v3.svg', accent: '#ff8a3d', demo: 'https://roda.club' },
  { title: 'Botinfy.com', role: 'Landing · Demos', year: '2025', blurb: 'Landing page and demos site (demos.botinfy.com).', stack: [], icon: '/icons/botinfy.png', accent: '#4b4bff', demo: 'https://botinfy.com' },
  { title: 'Encuéntralos VZLA', role: 'Backend · Data', year: '2024', blurb: 'Data handling and database.', stack: [], icon: '/icons/encuentralos.svg', accent: '#ff4d4d', demo: 'https://encuentralosvzla.com' },
  { title: 'Mediart', role: 'Dev Support', year: '2024', blurb: 'Dev support on a university project.', stack: [], icon: '/icons/mediart.png', accent: '#ff8fd0', demo: 'https://mediart.jesusaraujo.lat', repo: 'https://github.com/JesusAraujoDEV/mediart' },
  { title: 'Drinkers', role: 'Frontend · Ecommerce', year: '2023', blurb: 'E-commerce landing page.', stack: [], icon: '/icons/drinkers.png', accent: '#8bb8ff', repo: 'https://github.com/alejandrochmejia/drinkers' },
  { title: 'Pago Móvil Manager', role: 'Full-Stack', year: '2025', blurb: 'Mobile payments manager.', stack: [], icon: '/icons/pagomovil.png', accent: '#5fd3c6', repo: 'https://github.com/alejandrochmejia/pagomovil-manager' },
  { title: 'Restaurant System', role: 'Full-Stack', year: '2023', blurb: 'All-in-one restaurant management system (Bistrot).', stack: [], icon: '/icons/bistrot.png', accent: '#f6c56b', repo: 'https://github.com/angelopol/bistrot' },
  { title: 'Charlotte Bistró', role: 'Frontend', year: '2024', blurb: 'Interfaces and control system for Charlotte Bistró.', stack: [], icon: '/icons/charlotte.png', accent: '#c9a2ff', demo: 'https://interfaces-control.vercel.app', repo: 'https://github.com/JesusAraujoDEV/interfaces-control' },
]
