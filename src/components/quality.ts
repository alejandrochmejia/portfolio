const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches
const small = typeof window !== 'undefined' && window.innerWidth < 768
const isMobile = coarse || small

/** Calidad de render adaptada al dispositivo (calculada una vez).
 *  En desktop mantenemos la transmisión por-orbe (cada orbe refracta la escena de
 *  verdad = el vidrio líquido con reflejos). En móvil usamos el sampler compartido
 *  (una sola pasada) + resolución baja, que es mucho más barato para la GPU. */
export const QUALITY = {
  maxDpr: isMobile ? 1 : 1.5,
  samples: isMobile ? 2 : 6,
  resolution: isMobile ? 64 : 160,
  sparkles: isMobile ? 20 : 40,
  /** Compartir un buffer único (barato pero plano) solo en móvil. */
  transmissionSampler: isMobile,
}
