import type { L10n } from '../l10n.ts'

/** "Sobre mí" facts. The barrel (AboutMarquee) draws them in WebGL; AboutHud
 *  mirrors them as a visually hidden list and the build's static HTML lists them. */
export const ABOUT_FACTS: L10n[] = [
  { es: '3+ años de experiencia', en: '3+ years of experience' },
  { es: '20+ proyectos en producción', en: '20+ projects in production' },
  { es: 'Desarrollador Full Stack', en: 'Full Stack Developer' },
  { es: 'Ingeniero en Computación e IA', en: 'AI & Computer Engineer' },
  { es: 'Desde Venezuela: nacido en Caracas, hoy en Valencia', en: 'From Venezuela: born in Caracas, now in Valencia' },
]
