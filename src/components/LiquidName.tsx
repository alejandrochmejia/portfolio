import { useEffect, useRef, useState } from 'react'
import { LiquidRenderer } from '../liquid/renderer.ts'
import { DISPLAY_FONT, ensureDisplayFont } from '../liquid/typeface.ts'
import { useReducedMotion } from '../hooks/useReducedMotion.ts'
import './LiquidName.css'

export type LiquidStatus = 'idle' | 'ready' | 'unsupported'

type Props = {
  /** Pre-broken lines, uppercase. Each one is typeset to span the full width. */
  lines: string[]
  onStatus?: (status: LiquidStatus) => void
}

export function LiquidName({ lines, onStatus }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return

    let cancelled = false
    let renderer: LiquidRenderer | null = null

    const onPointerMove = (event: PointerEvent) => {
      renderer?.setPointer(event.clientX, event.clientY)
    }
    const onPointerOut = () => renderer?.releasePointer()
    // Touch has no leave event, so release when the finger lifts.
    const onPointerEnd = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') renderer?.releasePointer()
    }

    // The glyphs are rasterised to a texture, so the face has to be loaded first.
    void ensureDisplayFont().then(() => {
      if (cancelled) return

      renderer = LiquidRenderer.create({
        canvas,
        host,
        lines,
        fontFamily: DISPLAY_FONT,
        reducedMotion,
        onLost: () => {
          setReady(false)
          onStatus?.('unsupported')
        },
      })

      if (!renderer) {
        onStatus?.('unsupported')
        return
      }

      if (reducedMotion) {
        // One still frame, no loop and nothing that reacts to the pointer.
        renderer.renderOnce()
      } else {
        renderer.start()
        window.addEventListener('pointermove', onPointerMove, { passive: true })
        window.addEventListener('pointerup', onPointerEnd, { passive: true })
        window.addEventListener('pointercancel', onPointerEnd, { passive: true })
        window.addEventListener('blur', onPointerOut)
        document.addEventListener('pointerleave', onPointerOut)
      }

      if (import.meta.env.DEV) {
        Object.assign(window, { __liquid: renderer })
      }

      setReady(true)
      onStatus?.('ready')
    })

    return () => {
      cancelled = true
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerEnd)
      window.removeEventListener('pointercancel', onPointerEnd)
      window.removeEventListener('blur', onPointerOut)
      document.removeEventListener('pointerleave', onPointerOut)
      renderer?.dispose()
      setReady(false)
    }
  }, [lines, reducedMotion, onStatus])

  return (
    <div className="liquid" ref={hostRef} data-ready={ready} aria-hidden="true">
      <canvas className="liquid__canvas" ref={canvasRef} />
    </div>
  )
}
