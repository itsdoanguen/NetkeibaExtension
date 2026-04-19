import './styles.css'
import Dropdown from './components/Dropdown.jsx'
import OddsTable from './components/OddsTable.jsx'

function App() {
  const rows = [
    { no: 1, horse: 'Equinox', jockey: 'C. Lemaire', odds: '1.8', featured: true },
    { no: 4, horse: 'Liberty Island', jockey: 'Y. Kawada', odds: '3.5' },
    { no: 7, horse: 'Do Deuce', jockey: 'Y. Take', odds: '6.2' },
    { no: 11, horse: 'Stars on Earth', jockey: 'W. Buick', odds: '12.0' },
    { no: 13, horse: 'Titleholder', jockey: 'R. Moore', odds: '18.4' },
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

          <OddsTable rows={rows} />
        </section>
      </main>

      <footer className="tracker-footer surface-highest">
        <span className="dot" /> Updated 12 sec ago
      </footer>
    </div>
  )
}

export default App
