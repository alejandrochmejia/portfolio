import { ChromeStar } from './y2k.tsx'
import './AboutHud.css'

/** DOM overlay for the "Sobre mí" phase: a chrome Y2K title up top with a couple of
 *  sparkles, framing the 3D barrel without covering it. Shown
 *  by `.world__overlay[data-phase='about']`. */
export function AboutHud() {
  return (
    <div className="ahud">
      <div className="ahud__title">
        <h2 className="ahud__name y2k-chrome">
          About me<sup>✦</sup>
        </h2>
        <ChromeStar className="ahud__spark ahud__spark--l" />
        <ChromeStar className="ahud__spark ahud__spark--r" />
      </div>

      {/* Faint CRT scanlines + vignette over the barrel. */}
      <div className="ahud__crt" aria-hidden="true" />
    </div>
  )
}
