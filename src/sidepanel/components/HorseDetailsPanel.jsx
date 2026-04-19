const mockHistory = [
  {
    date: 'Oct 29',
    race: 'Tenno Sho (Autumn)',
    meta: 'G1 • 2000m • Turf',
    jockey: 'C. Lemaire',
    odds: '1.3',
    rank: '1',
    rankClass: 'rank-win',
  },
  {
    date: 'Jun 25',
    race: 'Takarazuka Kinen',
    meta: 'G1 • 2200m • Turf',
    jockey: 'C. Lemaire',
    odds: '1.3',
    rank: '1',
    rankClass: 'rank-win',
  },
  {
    date: 'May 28',
    race: 'Tokyo Yushun',
    meta: 'G1 • 2400m • Turf',
    jockey: 'C. Lemaire',
    odds: '3.8',
    rank: '2',
    rankClass: 'rank-place',
  },
  {
    date: 'Apr 16',
    race: 'Satsuki Sho',
    meta: 'G1 • 2000m • Turf',
    jockey: 'C. Lemaire',
    odds: '5.7',
    rank: '2',
    rankClass: 'rank-place',
  },
  {
    date: 'Nov 20',
    race: 'Tokyo Sports Hai',
    meta: 'G2 • 1800m • Turf',
    jockey: 'C. Lemaire',
    odds: '2.6',
    rank: '1',
    rankClass: 'rank-neutral',
  },
]

function HorseDetailsPanel({ isOpen, runner, onClose }) {
  const horseName = runner?.horse ?? 'Equinox'
  const jockeyName = runner?.jockey ?? 'C. Lemaire'

  return (
    <div className={`horse-detail-overlay${isOpen ? ' open' : ''}`}>
      <button
        type="button"
        className="horse-detail-backdrop"
        aria-label="Close horse details"
        onClick={onClose}
      />

      <aside
        className="horse-detail-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Horse details"
      >
        <header className="horse-detail-header surface-highest">
          <div>
            <span className="horse-badge">Age 4 • Colt</span>
            <h3>{horseName}</h3>
            <p>{`58.0kg • ${jockeyName} • 6 Starts (4-2-0)`}</p>
          </div>
          <button
            type="button"
            className="horse-close-btn"
            aria-label="Close horse details"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <nav className="horse-tabs surface-highest" aria-label="Horse detail tabs">
          <button type="button" className="horse-tab">
            Thông tin chung
          </button>
          <button type="button" className="horse-tab active">
            Lịch sử
          </button>
          <button type="button" className="horse-tab">
            Gia phả
          </button>
        </nav>

        <section className="horse-detail-content">
          <div className="history-head">
            <h4>Recent Form</h4>
            <span>Last 5 Starts</span>
          </div>

          <div className="history-table ghost-border">
            <div className="history-grid history-grid-head">
              <span>Date</span>
              <span>Race</span>
              <span>Jockey</span>
              <span>Odds</span>
              <span>Rank</span>
            </div>

            {mockHistory.map((item) => (
              <div key={`${item.date}-${item.race}`} className="history-grid history-grid-row">
                <span className="history-date">{item.date}</span>
                <div className="history-race">
                  <p>{item.race}</p>
                  <small>{item.meta}</small>
                </div>
                <span className="history-jockey">{item.jockey}</span>
                <span className="history-odds">{item.odds}</span>
                <span className={`history-rank ${item.rankClass}`}>{item.rank}</span>
              </div>
            ))}
          </div>
        </section>

        <footer className="horse-detail-footer">
          <button type="button" className="horse-action-btn ghost-border">
            Share Profile
          </button>
          <button type="button" className="horse-action-btn primary">
            Track Horse
          </button>
        </footer>
      </aside>
    </div>
  )
}

export default HorseDetailsPanel