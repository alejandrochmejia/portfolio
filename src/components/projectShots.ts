import type { L10n } from '../i18n.ts'

/** Screenshots of each system, shown in the project desktop's screens.exe window.
 *  Full-page captures (tall images): the window scrolls through them.
 *  Files live in /public/projects/<slug>/, keyed by `Project.title`. */
export type Shot = {
  src: string
  /** Intrinsic size (px) so the viewer can reserve space / compute the scroll. */
  w: number
  h: number
  device: 'desktop' | 'mobile'
  label: L10n
}

/** Captured from each live demo (Playwright, 1440 and 390 wide, then cropped + WebP). */
export const SHOTS: Record<string, Shot[]> = {
  // The demo is gone (Render: Not Found); this is the store screenshot from the repo README.
  Drinkers: [
    { src: '/projects/drinkers/store.webp', w: 640, h: 363, device: 'desktop', label: { es: 'Tienda', en: 'Store' } },
  ],
  // Pickop's landing is scroll-driven (a full-page capture comes out black), so
  // these are viewport frames along its scroll, stitched top to bottom.
  Pickop: [
    { src: '/projects/pickop/desktop.webp', w: 1200, h: 3750, device: 'desktop', label: { es: 'Escritorio', en: 'Desktop' } },
    { src: '/projects/pickop/mobile.webp', w: 600, h: 9089, device: 'mobile', label: { es: 'Móvil', en: 'Mobile' } },
  ],
  'Roda': [
    { src: '/projects/roda/desktop.webp', w: 1200, h: 5053, device: 'desktop', label: { es: 'Escritorio', en: 'Desktop' } },
    { src: '/projects/roda/mobile.webp', w: 600, h: 10769, device: 'mobile', label: { es: 'Móvil', en: 'Mobile' } },
  ],
  'Botinfy.com': [
    { src: '/projects/botinfy/desktop.webp', w: 1200, h: 5053, device: 'desktop', label: { es: 'Escritorio', en: 'Desktop' } },
    { src: '/projects/botinfy/mobile.webp', w: 600, h: 10045, device: 'mobile', label: { es: 'Móvil', en: 'Mobile' } },
  ],
  'Encuéntralos VZLA': [
    { src: '/projects/encuentralos/desktop.webp', w: 1200, h: 1565, device: 'desktop', label: { es: 'Escritorio', en: 'Desktop' } },
    { src: '/projects/encuentralos/mobile.webp', w: 600, h: 3189, device: 'mobile', label: { es: 'Móvil', en: 'Mobile' } },
  ],
  'Mediart': [
    { src: '/projects/mediart/desktop.webp', w: 1200, h: 5053, device: 'desktop', label: { es: 'Escritorio', en: 'Desktop' } },
    { src: '/projects/mediart/mobile.webp', w: 600, h: 10769, device: 'mobile', label: { es: 'Móvil', en: 'Mobile' } },
  ],
  'Charlotte Bistró': [
    { src: '/projects/charlotte/desktop.webp', w: 1200, h: 4983, device: 'desktop', label: { es: 'Escritorio', en: 'Desktop' } },
    { src: '/projects/charlotte/mobile.webp', w: 600, h: 10769, device: 'mobile', label: { es: 'Móvil', en: 'Mobile' } },
  ],
}
