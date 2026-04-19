import { useEffect, useState } from 'react'

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

const mockPedigree = [
  {
    generation: '第1世代',
    entries: [{ role: '対象馬', name: 'Equinox' }],
  },
  {
    generation: '第2世代',
    entries: [
      { role: '父', name: 'Kitasan Black' },
      { role: '母', name: 'Chateau Blanche' },
    ],
  },
  {
    generation: '第3世代',
    entries: [
      { role: '父父', name: 'Black Tide' },
      { role: '父母', name: 'Sugar Heart' },
      { role: '母父', name: 'King Halo' },
      { role: '母母', name: 'Blancherie' },
    ],
  },
  {
    generation: '第4世代',
    entries: [
      { role: '父父父', name: 'Sunday Silence' },
      { role: '父父母', name: 'Wind in Her Hair' },
      { role: '父母父', name: 'Sakura Bakushin O' },
      { role: '父母母', name: 'Otome Gokoro' },
      { role: '母父父', name: 'Dancing Brave' },
      { role: '母父母', name: 'Goodbye Halo' },
      { role: '母母父', name: 'Tony Bin' },
      { role: '母母母', name: 'Shadai Cosmo' },
    ],
  },
]

function getPedigreeBranch(role) {
  if (role === '対象馬') {
    return 'self'
  }

  return role.startsWith('父') ? 'sire' : 'dam'
}

function getFourthGenerationBranch(role) {
  if (role.length < 3) {
    return ''
  }

  const group = role.slice(0, 2)
  if (group === '父父') {
    return 'sire-sire'
  }

  if (group === '父母') {
    return 'sire-dam'
  }

  if (group === '母父') {
    return 'dam-sire'
  }

  if (group === '母母') {
    return 'dam-dam'
  }

  return ''
}

function HorseDetailsPanel({ isOpen, runner, onClose }) {
  const horseName = runner?.horse ?? 'Equinox'
  const jockeyName = runner?.jockey ?? 'C. Lemaire'
  const [activeTab, setActiveTab] = useState('history')

  useEffect(() => {
    if (isOpen) {
      setActiveTab('history')
    }
  }, [isOpen])

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
          <button
            type="button"
            className={`horse-tab${activeTab === 'overview' ? ' active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            基本情報
          </button>
          <button
            type="button"
            className={`horse-tab${activeTab === 'history' ? ' active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            戦績
          </button>
          <button
            type="button"
            className={`horse-tab${activeTab === 'pedigree' ? ' active' : ''}`}
            onClick={() => setActiveTab('pedigree')}
          >
            血統
          </button>
        </nav>

        <section className="horse-detail-content">
          {(activeTab === 'history' || activeTab === 'overview') && (
            <>
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
            </>
          )}

          {activeTab === 'pedigree' && (
            <div className="pedigree-view">
              <div className="pedigree-head">
                <h4>4世代血統</h4>
                <span>縦スクロール表示</span>
              </div>

              <div className="pedigree-legend" aria-label="血統の色分け凡例">
                <span className="legend-chip sire">父系</span>
                <span className="legend-chip dam">母系</span>
              </div>

              <div className="pedigree-legend pedigree-legend-detail" aria-label="第4世代の色分け凡例">
                <span className="legend-chip detail-sire-sire">父父系</span>
                <span className="legend-chip detail-sire-dam">父母系</span>
                <span className="legend-chip detail-dam-sire">母父系</span>
                <span className="legend-chip detail-dam-dam">母母系</span>
              </div>

              <div className="pedigree-timeline">
                {mockPedigree.map((level) => (
                  <section key={level.generation} className="pedigree-level ghost-border">
                    <div className="pedigree-level-top">
                      <span className="pedigree-generation">{level.generation}</span>
                      <span className="pedigree-count">{level.entries.length}頭</span>
                    </div>

                    <div
                      className={`pedigree-grid${level.entries.length <= 2 ? ' single' : ''}`}
                    >
                      {level.entries.map((entry) => {
                        const branch = getPedigreeBranch(entry.role)
                        const detailBranch = getFourthGenerationBranch(entry.role)
                        const isThirdGeneration = level.generation === '第3世代'

                        return (
                          <article
                            key={`${level.generation}-${entry.role}`}
                            className={`pedigree-card pedigree-card-${branch}${
                              detailBranch ? ` pedigree-card-${detailBranch}` : ''
                            }${
                              isThirdGeneration && (branch === 'sire' || branch === 'dam')
                                ? ` pedigree-card-gen3 pedigree-card-gen3-${branch}`
                                : ''
                            }`}
                          >
                            <p>{entry.name}</p>
                            <small>{entry.role}</small>
                          </article>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}
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