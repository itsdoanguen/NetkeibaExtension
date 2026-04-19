function OddsTable({ rows }) {
  return (
    <>
      <div className="odds-header" role="row">
        <span>NO.</span>
        <span>HORSE / JOCKEY</span>
        <span>ODDS</span>
      </div>

      <div className="odds-list" role="table" aria-label="Current odds">
        {rows.map((row) => (
          <article
            key={row.no}
            className={`odds-row${row.featured ? ' featured' : ''}`}
            role="row"
          >
            <div className="rank">{row.no}</div>
            <div className="runner">
              <p className="horse">{row.horse}</p>
              <p className="jockey">{row.jockey}</p>
            </div>
            <p className={`price${row.featured ? ' top' : ''}`}>{row.odds}</p>
          </article>
        ))}
      </div>
    </>
  )
}

export default OddsTable
