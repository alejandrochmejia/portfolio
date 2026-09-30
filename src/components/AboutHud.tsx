import { ChromeStar } from './y2k.tsx'
import { tr, useCopy, useLang } from '../i18n.ts'
import { ABOUT_FACTS } from './aboutData.ts'
import './AboutHud.css'

const COPY = {
  es: { title: 'Sobre mí' },
  en: { title: 'About me' },
}

/** DOM overlay for the "Sobre mí" phase: a chrome Y2K title up top with a couple of
 *  sparkles, framing the 3D barrel without covering it. Shown
 *  by `.world__overlay[data-phase='about']`. The barrel's stats only exist in
 *  WebGL, so they're mirrored here as a visually hidden list for screen readers. */
export function AboutHud() {
  const t = useCopy(COPY)
  const lang = useLang()
  return (
    <div className="ahud">
      <div className="ahud__title">
        <h2 className="ahud__name y2k-chrome">
          {t.title}
          <sup aria-hidden="true">✦</sup>
        </h2>
        <ChromeStar className="ahud__spark ahud__spark--l" />
        <ChromeStar className="ahud__spark ahud__spark--r" />
      </div>

      <ul className="ahud__sr">
        {ABOUT_FACTS.map((f) => (
          <li key={f.en}>{tr(f, lang)}</li>
        ))}
      </ul>

      {/* Faint CRT scanlines + vignette over the barrel. */}
      <div className="ahud__crt" aria-hidden="true" />
    </div>
  )
}
