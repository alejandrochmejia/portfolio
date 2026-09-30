/** Phones = narrow viewport (same 720px breakpoint as the CSS) or a coarse pointer
 *  on a small screen (phone landscape is >720px wide but still a phone). */
const mq = (q: string) => typeof matchMedia !== 'undefined' && matchMedia(q).matches
const coarse = mq('(pointer: coarse)')
const isMobile = mq('(max-width: 720px)') || (coarse && mq('(max-width: 1024px), (max-height: 500px)'))

/** Cap the rendered pixel count (~2.2 MP) so ultrawide / 4K screens don't render
 *  a 3840×2160 transmission buffer. */
const pixels = typeof window !== 'undefined' ? window.innerWidth * window.innerHeight : 1
const pixelCap = Math.sqrt(2.2e6 / Math.max(1, pixels))

/** Calidad de render adaptada al dispositivo (calculada una vez al cargar).
 *  En desktop mantenemos la transmisión por-orbe (cada orbe refracta la escena de
 *  verdad = el vidrio líquido con reflejos). En móvil usamos el sampler compartido
 *  (una sola pasada) + resolución baja, que es mucho más barato para la GPU. */
export const QUALITY = {
  isMobile,
  maxDpr: isMobile ? 1 : Math.max(1, Math.min(1.5, pixelCap)),
  samples: isMobile ? 2 : 6,
  resolution: isMobile ? 64 : 160,
  sparkles: isMobile ? 20 : 40,
  /** Compartir un buffer único (barato pero plano) solo en móvil. */
  transmissionSampler: isMobile,
  /** Segmentos de las esferas y resolución del Environment. */
  segments: isMobile ? 48 : 96,
  envResolution: isMobile ? 256 : 512,
}
