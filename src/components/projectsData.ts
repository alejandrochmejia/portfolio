import type { L10n } from '../i18n.ts'

export type Project = {
  title: string
  role: L10n
  year: string
  blurb: L10n
  /** "My contribution" paragraph in the detail panel (hidden when missing). */
  contribution?: L10n
  /** 3–5 achievements ("verb + result"), shown as the my_role.log tracklist. */
  highlights?: L10n[]
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

const same = (s: string): L10n => ({ es: s, en: s })

/** The projects shown in the collage, in display order (their position in the
 *  grid lives in `collageLayout.ts`, keyed by index). */
// DRAFT: validar con Alejandro — los textos de `contribution` son un borrador.
export const PROJECTS: Project[] = [
  {
    title: 'Pickop',
    role: same('Full-Stack'),
    year: '2026',
    blurb: { es: 'Sistema de punta a punta.', en: 'End-to-end system.' },
    contribution: {
      es: 'Desarrollé el sistema de punta a punta: del frontend al backend y su puesta en producción.',
      en: 'I built the system end to end: from the frontend to the backend and its release to production.',
    },
    stack: [],
    icon: '/icons/pickop.png',
    accent: '#7fdc6a',
    demo: 'https://pickop.app',
  },
  {
    title: 'Roda',
    role: same('Full-Stack'),
    year: '2026',
    blurb: { es: 'Sistema de punta a punta.', en: 'End-to-end system.' },
    contribution: {
      es: 'Me encargué del producto completo, desde la interfaz hasta la lógica de servidor, y de mantenerlo en producción.',
      en: 'I owned the whole product, from the interface to the server-side logic, and kept it running in production.',
    },
    stack: [],
    icon: '/icons/roda-v3.svg',
    accent: '#ff8a3d',
    demo: 'https://roda.club',
  },
  {
    title: 'Botinfy.com',
    role: { es: 'Landing · Demos', en: 'Landing · Demos' },
    year: '2025',
    blurb: {
      es: 'Landing page y sitio de demos (demos.botinfy.com).',
      en: 'Landing page and demos site (demos.botinfy.com).',
    },
    contribution: {
      es: 'Construí la landing de la empresa y el sitio de demos donde se muestran los productos a clientes.',
      en: "I built the company's landing page and the demos site used to show the products to clients.",
    },
    stack: [],
    icon: '/icons/botinfy.png',
    accent: '#4b4bff',
    demo: 'https://botinfy.com',
  },
  {
    title: 'Encuéntralos VZLA',
    role: { es: 'Backend · Datos', en: 'Backend · Data' },
    year: '2024',
    blurb: { es: 'Manejo de datos y base de datos.', en: 'Data handling and database.' },
    contribution: {
      es: 'Trabajé en el backend: el modelado de la base de datos y el manejo de la información que alimenta el sitio.',
      en: 'I worked on the backend: modelling the database and handling the data behind the site.',
    },
    stack: [],
    icon: '/icons/encuentralos.svg',
    accent: '#ff4d4d',
    demo: 'https://encuentralosvzla.com',
  },
  {
    title: 'Mediart',
    role: { es: 'Soporte de desarrollo', en: 'Dev Support' },
    year: '2024',
    blurb: {
      es: 'Soporte de desarrollo en un proyecto universitario.',
      en: 'Dev support on a university project.',
    },
    contribution: {
      es: 'Apoyé al equipo en el desarrollo: resolviendo problemas puntuales y ayudando a sacar funcionalidades adelante.',
      en: 'I supported the team during development, fixing specific issues and helping ship features.',
    },
    stack: [],
    icon: '/icons/mediart.png',
    accent: '#ff8fd0',
    demo: 'https://mediart.jesusaraujo.lat',
    repo: 'https://github.com/JesusAraujoDEV/mediart',
  },
  {
    title: 'Drinkers',
    role: { es: 'Frontend · E-commerce', en: 'Frontend · E-commerce' },
    year: '2023',
    blurb: { es: 'Landing page de e-commerce.', en: 'E-commerce landing page.' },
    contribution: {
      es: 'Diseñé e implementé el frontend de la tienda, con foco en presentar el catálogo de forma clara.',
      en: 'I designed and built the store frontend, focused on presenting the catalogue clearly.',
    },
    stack: [],
    icon: '/icons/drinkers.png',
    accent: '#8bb8ff',
    repo: 'https://github.com/alejandrochmejia/drinkers',
  },
  {
    title: 'Pago Móvil Manager',
    role: same('Full-Stack'),
    year: '2025',
    blurb: { es: 'Gestor de pagos móviles.', en: 'Mobile payments manager.' },
    contribution: {
      es: 'Desarrollé la aplicación completa para registrar y organizar pagos móviles en un solo lugar.',
      en: 'I built the full application to record and organise mobile payments in one place.',
    },
    stack: [],
    icon: '/icons/pagomovil.png',
    accent: '#5fd3c6',
    repo: 'https://github.com/alejandrochmejia/pagomovil-manager',
  },
  {
    title: 'Restaurant System',
    role: same('Full-Stack'),
    year: '2023',
    blurb: {
      es: 'Sistema integral de gestión para restaurantes (Bistrot).',
      en: 'All-in-one restaurant management system (Bistrot).',
    },
    contribution: {
      es: 'Participé en el desarrollo full-stack del sistema, integrando las distintas áreas de gestión del restaurante.',
      en: "I took part in the full-stack development, bringing the restaurant's management areas together in one system.",
    },
    stack: [],
    icon: '/icons/bistrot.png',
    accent: '#f6c56b',
    repo: 'https://github.com/angelopol/bistrot',
  },
  {
    title: 'Charlotte Bistró',
    role: same('Frontend'),
    year: '2024',
    blurb: {
      es: 'Interfaces y sistema de control para Charlotte Bistró.',
      en: 'Interfaces and control system for Charlotte Bistró.',
    },
    contribution: {
      es: 'Me ocupé de las interfaces del sistema de control, buscando que el uso diario fuera simple para el personal.',
      en: 'I handled the control system interfaces, aiming to keep day-to-day use simple for the staff.',
    },
    stack: [],
    icon: '/icons/charlotte.png',
    accent: '#c9a2ff',
    demo: 'https://interfaces-control.vercel.app',
    repo: 'https://github.com/JesusAraujoDEV/interfaces-control',
  },
]
