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
        aria-label="馬詳細を閉じる"
        onClick={onClose}
      />

      <aside
        className="horse-detail-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="馬詳細"
      >
        <header className="horse-detail-header surface-highest">
          <div>
            <span className="horse-badge">4歳 • 牡馬</span>
            <h3>{horseName}</h3>
            <p>{`58.0kg • ${jockeyName} • 6戦 (4-2-0)`}</p>
          </div>
          <button
            type="button"
            className="horse-close-btn"
            aria-label="馬詳細を閉じる"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <nav className="horse-tabs surface-highest" aria-label="馬詳細タブ">
          <button type="button" className="horse-tab">
            基本情報
          </button>
          <button type="button" className="horse-tab active">
            戦績
          </button>
          <button type="button" className="horse-tab">
            血統
          </button>
        </nav>

        <section className="horse-detail-content">
          <div className="history-head">
            <h4>最近の成績</h4>
            <span>直近5走</span>
          </div>

          <div className="history-table ghost-border">
            <div className="history-grid history-grid-head">
              <span>日付</span>
              <span>レース</span>
              <span>騎手</span>
              <span>オッズ</span>
              <span>着順</span>
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
            プロフィール共有
          </button>
          <button type="button" className="horse-action-btn primary">
            追跡に追加
          </button>
        </footer>
      </aside>
    </div>
  )
}

export default HorseDetailsPanel