/** The iridescent spinning disc (visual only). Size is controlled by the
 *  `--disc-size` custom property on an ancestor (defaults to 170px). */
export function Disc({ title }: { title: string }) {
  return (
    <div className="disc">
      <div className="cd__disc" />
      <div className="disc__gloss" />
      <div className="cd__ring" />
      <div className="cd__hole" />
      <span className="cd__name">{title}</span>
    </div>
  )
}
