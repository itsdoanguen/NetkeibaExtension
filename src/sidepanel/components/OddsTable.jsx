import './OddsTable.css'

function OddsTable({ rows, onRunnerClick }) {
  return (
    <>
      <div className="odds-header" role="row">
        <span>NO.</span>
        <span>馬名 / 詳細情報</span>
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
              <p className="runner-meta" aria-label="基本情報">
                <span className="meta-chip">枠 {row.gate}</span>
                <span className="meta-chip">馬番 {row.silk}</span>
                <span className="meta-chip">性齢 {row.sexAge}</span>
                <span className="meta-chip">斤量 {row.carriedWeight}</span>
                <span className="meta-chip">厩舎 {row.trainer}</span>
              </p>
              <p className="runner-meta" aria-label="レース結果情報">
                <span className="meta-chip">人気 {row.popularity}</span>
                <span className="meta-chip">馬体重 {row.bodyWeight}</span>
                <span className="meta-chip">着順 {row.finish}</span>
                <span className="meta-chip">タイム {row.goalTime}</span>
                <span className="meta-chip">着差 {row.margin}</span>
                <span className="meta-chip">通過 {row.passingOrder}</span>
                <span className="meta-chip">上り3F {row.closing3F}</span>
                <span className="meta-chip">備考 {row.note}</span>
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
