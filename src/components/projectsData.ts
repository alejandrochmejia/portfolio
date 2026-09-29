export type Project = {
  title: string
  role: string
  year: string
  blurb: string
  stack: string[]
  /** App icon shown inside its glass orb (path under /public). */
  icon: string
  demo?: string
  repo?: string
}

/** The projects shown as glass orbs in the floating field, in display order.
 *  Appended projects extend the field rightward (revealed by the pan arrow). */
export const PROJECTS: Project[] = [
  { title: 'Pickop', role: 'Full-Stack', year: '2025', blurb: 'Sistema completo.', stack: [], icon: '/icons/pickop.png', demo: 'https://pickop.app' },
  { title: 'Roda', role: 'Full-Stack', year: '2025', blurb: 'Sistema completo.', stack: [], icon: '/icons/roda-v3.svg', demo: 'https://roda.club' },
  { title: 'Botinfy.com', role: 'Landing · Demos', year: '2025', blurb: 'Landing y página de demos (demos.botinfy.com).', stack: [], icon: '/icons/botinfy.png', demo: 'https://botinfy.com' },
  { title: 'Encuéntralos VZLA', role: 'Backend · Data', year: '2024', blurb: 'Manejo de la data y la base de datos.', stack: [], icon: '/icons/encuentralos.svg', demo: 'https://encuentralosvzla.com' },
  { title: 'Mediart', role: 'Dev Support', year: '2024', blurb: 'Apoyo dev en un proyecto universitario.', stack: [], icon: '/icons/mediart.png', demo: 'https://mediart.jesusaraujo.lat', repo: 'https://github.com/JesusAraujoDEV/mediart' },
  { title: 'Drinkers', role: 'Frontend · Ecommerce', year: '2023', blurb: 'Landing de ecommerce.', stack: [], icon: '/icons/drinkers.png', repo: 'https://github.com/alejandrochmejia/drinkers' },
  { title: 'Pago Móvil Manager', role: 'Full-Stack', year: '2024', blurb: 'Gestor de pagos móviles.', stack: [], icon: '/icons/pagomovil.png', repo: 'https://github.com/alejandrochmejia/pagomovil-manager' },
  { title: 'Sistema de Restaurante', role: 'Full-Stack', year: '2023', blurb: 'Sistema de gestión integral para restaurante (Bistrot).', stack: [], icon: '/icons/bistrot.png', repo: 'https://github.com/angelopol/bistrot' },
  { title: 'Charlotte Bistró', role: 'Frontend', year: '2024', blurb: 'Sistema de interfaces y control para Charlotte Bistró.', stack: [], icon: '/icons/charlotte.png', demo: 'https://interfaces-control.vercel.app', repo: 'https://github.com/JesusAraujoDEV/interfaces-control' },
]
