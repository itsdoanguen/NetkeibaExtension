import { useState } from 'react'
import './styles.css'
import Dropdown from './components/Dropdown.jsx'
import OddsTable from './components/OddsTable.jsx'
import HorseDetailsPanel from './components/HorseDetailsPanel.jsx'

function App() {
  const [selectedRunner, setSelectedRunner] = useState(null)

  const rows = [
    { no: 1, horse: 'Equinox', jockey: 'C. Lemaire', gate: 2, silk: 6, odds: '1.8', featured: true },
    { no: 4, horse: 'Liberty Island', jockey: 'Y. Kawada', gate: 4, silk: 8, odds: '3.5' },
    { no: 7, horse: 'Do Deuce', jockey: 'Y. Take', gate: 6, silk: 12, odds: '6.2' },
    { no: 11, horse: 'Stars on Earth', jockey: 'W. Buick', gate: 7, silk: 13, odds: '12.0' },
    { no: 13, horse: 'Titleholder', jockey: 'R. Moore', gate: 8, silk: 16, odds: '18.4' },
  ]

  return (
    <div className="tracker">
      <header className="tracker-header surface-highest">
        <h1>JRA Odds Tracker</h1>
        <div className="header-actions" aria-label="Header actions">
          <button type="button" className="icon-btn" aria-label="Refresh">
            ↻
          </button>
          <button type="button" className="icon-btn" aria-label="Settings">
            ⚙
          </button>
        </div>
      </header>

      <main className="tracker-body">
        <section className="filter-card surface-low ghost-border">
          <div className="filter-grid">
            <Dropdown label="Track" value="Tokyo" options={['Tokyo']} />
            <Dropdown label="Race" value="11R" options={['11R']} />
          </div>

          <button className="fetch-btn" type="button">
            ☁ Fetch Live Data
          </button>
        </section>

        <section className="odds-section">
          <div className="odds-title-row">
            <h2>Current Odds</h2>
            <span className="live-chip">LIVE</span>
          </div>

          <OddsTable rows={rows} onRunnerClick={setSelectedRunner} />
        </section>
      </main>

      <footer className="tracker-footer surface-highest">
        <span className="dot" /> Updated 12 sec ago
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
