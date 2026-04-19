import { useState } from 'react'
import './styles.css'
import Dropdown from './components/Dropdown.jsx'
import OddsTable from './components/OddsTable.jsx'
import HorseDetailsPanel from './components/HorseDetailsPanel.jsx'

function App() {
  const [selectedRunner, setSelectedRunner] = useState(null)

  const rows = [
    {
      no: 1,
      horse: 'Equinox',
      jockey: 'C. Lemaire',
      gate: 2,
      silk: 6,
      favourite: '本命',
      odds: '1.8',
      featured: true,
    },
    {
      no: 4,
      horse: 'Liberty Island',
      jockey: 'Y. Kawada',
      gate: 4,
      silk: 8,
      favourite: '対抗',
      odds: '3.5',
    },
    {
      no: 7,
      horse: 'Do Deuce',
      jockey: 'Y. Take',
      gate: 6,
      silk: 12,
      favourite: '単穴',
      odds: '6.2',
    },
    {
      no: 11,
      horse: 'Stars on Earth',
      jockey: 'W. Buick',
      gate: 7,
      silk: 13,
      favourite: '連下',
      odds: '12.0',
    },
    {
      no: 13,
      horse: 'Titleholder',
      jockey: 'R. Moore',
      gate: 8,
      silk: 16,
      favourite: '穴',
      odds: '18.4',
    },
  ]

  return (
    <div className="tracker">
      <header className="tracker-header surface-highest">
        <h1>JRA オッズトラッカー</h1>
        <div className="header-actions" aria-label="ヘッダー操作">
          <button type="button" className="icon-btn" aria-label="更新">
            ↻
          </button>
          <button type="button" className="icon-btn" aria-label="設定">
            ⚙
          </button>
        </div>
      </header>

      <main className="tracker-body">
        <section className="filter-card surface-low ghost-border">
          <div className="filter-grid">
            <Dropdown label="競馬場" value="東京" options={['東京']} />
            <Dropdown label="レース" value="11R" options={['11R']} />
          </div>

          <button className="fetch-btn" type="button">
            ☁ ライブデータ取得
          </button>
        </section>

        <section className="odds-section">
          <div className="odds-title-row">
            <h2>現在のオッズ</h2>
            <span className="live-chip">ライブ</span>
          </div>

          <OddsTable rows={rows} onRunnerClick={setSelectedRunner} />
        </section>
      </main>

      <footer className="tracker-footer surface-highest">
        <span className="dot" /> 12秒前に更新
      </footer>

      <HorseDetailsPanel
        isOpen={Boolean(selectedRunner)}
        runner={selectedRunner}
        onClose={() => setSelectedRunner(null)}
      />
    </div>
  )
}

export default App
