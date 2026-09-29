const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches
const small = typeof window !== 'undefined' && window.innerWidth < 768
const isMobile = coarse || small

/** Calidad de render adaptada al dispositivo (calculada una vez). */
export const QUALITY = {
  maxDpr: isMobile ? 1 : 1.5,
  samples: isMobile ? 2 : 4,
  resolution: isMobile ? 64 : 96,
  sparkles: isMobile ? 20 : 40,
}
