import './OddsTable.css'

function OddsTable({ rows, onRunnerClick }) {
  return (
    <>
      <div className="odds-header" role="row">
        <span>馬番</span>
        <span>馬名 / 着順情報</span>
      </div>

      <div className="odds-list" role="table" aria-label="全着順">
        {rows.map((row) => (
          <article key={row.no} className={`odds-row${row.featured ? ' featured' : ''}`} role="row">
            <div className="rank">{row.no}</div>
            <button
              type="button"
              className="runner runner-btn"
              onClick={() => onRunnerClick?.(row)}
              aria-label={`${row.horse}の詳細を開く`}
            >
              <p className="horse">{row.horse}</p>
              <p className="jockey">騎手：{row.jockey}</p>
              <p className="runner-meta" aria-label="着順情報">
                <span className="meta-chip">オッズ {row.odds}</span>
                <span className="meta-chip">人気 {row.popularity}</span>
                <span className="meta-chip">枠 {row.gate}</span>
              </p>
            </button>
          </article>
        ))}
      </div>
    </>
  )
}

export default OddsTable
