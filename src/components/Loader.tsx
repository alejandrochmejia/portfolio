import './Loader.css'

export function Loader() {
  return (
    <div className="ldr" role="status" aria-live="polite" aria-label="Cargando">
      <div className="ldr__glow" aria-hidden="true" />
      <div className="ldr__name">ALEJANDRO CHÁVEZ</div>
      <div className="ldr__bar" aria-hidden="true">
        <span />
      </div>
    </div>
  )
}
