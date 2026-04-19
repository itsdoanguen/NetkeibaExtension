function OddsTable({ rows, onRunnerClick }) {
  return (
    <>
      <div className="odds-header" role="row">
        <span>NO.</span>
        <span>馬名 / 情報</span>
        <span>オッズ</span>
      </div>

      <div className="odds-list" role="table" aria-label="現在のオッズ">
        {rows.map((row) => (
          <article
            key={row.no}
            className={`odds-row${row.featured ? ' featured' : ''}`}
            role="row"
          >
            <div className="rank">{row.no}</div>
            <button
              type="button"
              className="runner runner-btn"
              onClick={() => onRunnerClick?.(row)}
              aria-label={`${row.horse}の詳細を開く`}
            >
              <p className="horse">{row.horse}</p>
              <p className="jockey">{row.jockey}</p>
              <p className="runner-meta" aria-label="枠番と馬番、印情報">
                <span className="meta-chip">枠 {row.gate}</span>
                <span className="meta-chip">馬番 {row.silk}</span>
                <span className="meta-chip">印 {row.favourite}</span>
              </p>
            </button>
            <p className={`price${row.featured ? ' top' : ''}`}>{row.odds}</p>
          </article>
        ))}
      </div>
    </>
  )
}

export default OddsTable
