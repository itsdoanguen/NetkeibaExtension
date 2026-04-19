import { useEffect, useMemo, useState } from 'react'

import './styles.css'
import Dropdown from './components/Dropdown.jsx'
import OddsTable from './components/OddsTable.jsx'
import { fetchHorseDetails, fetchRaceHorses, fetchRaceList, runPipeline } from '../api'

function App() {
  const [races, setRaces] = useState([])
  const [selectedTrack, setSelectedTrack] = useState('')
  const [selectedRaceId, setSelectedRaceId] = useState('')
  const [raceResult, setRaceResult] = useState(null)
  const [selectedHorseId, setSelectedHorseId] = useState('')
  const [horseDetails, setHorseDetails] = useState(null)
  const [pipelineMessage, setPipelineMessage] = useState('')
  const [loadingLabel, setLoadingLabel] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const horses = raceResult?.horses ?? []

  const selectedHorse = useMemo(
    () => horses.find((horse) => horse.horseId === selectedHorseId),
    [horses, selectedHorseId],
  )

  const trackOptions = useMemo(() => {
    const values = races
      .map((race) => race.trackName)
      .filter((trackName) => typeof trackName === 'string' && trackName.length > 0)
    return [...new Set(values)]
  }, [races])

  const filteredRaces = useMemo(() => {
    if (!selectedTrack) {
      return races
    }
    return races.filter((race) => race.trackName === selectedTrack)
  }, [races, selectedTrack])

  const raceOptions = useMemo(
    () =>
      filteredRaces.map((race) => ({
        value: race.raceId,
        label: `${race.raceNumber ? `${race.raceNumber} ` : ''}${race.raceName}`,
      })),
    [filteredRaces],
  )

  const horseOptions = useMemo(
    () =>
      horses.map((horse) => ({
        value: horse.horseId,
        label: `${horse.horseNumber ? `${horse.horseNumber}. ` : ''}${horse.horseName}`,
      })),
    [horses],
  )

  const oddsRows = useMemo(
    () =>
      horses.map((horse, index) => ({
        no: horse.horseNumber || String(index + 1),
        horse: horse.horseName,
        jockey: horse.jockeyName || '-',
        odds: horse.odds || '-',
        featured: horse.horseId === selectedHorseId,
      })),
    [horses, selectedHorseId],
  )

  useEffect(() => {
    if (filteredRaces.length === 0) {
      setSelectedRaceId('')
      return
    }

    if (!filteredRaces.some((race) => race.raceId === selectedRaceId)) {
      setSelectedRaceId(filteredRaces[0].raceId)
    }
  }, [filteredRaces, selectedRaceId])

  useEffect(() => {
    if (horses.length === 0) {
      setSelectedHorseId('')
      return
    }

    if (!horses.some((horse) => horse.horseId === selectedHorseId)) {
      setSelectedHorseId(horses[0].horseId)
    }
  }, [horses, selectedHorseId])

  async function handleLoadRaces() {
    setLoadingLabel('Loading races...')
    setErrorMessage('')
    setPipelineMessage('')
    try {
      const data = await fetchRaceList()
      setRaces(data)
      setSelectedTrack(data[0]?.trackName ?? '')
      setRaceResult(null)
      setSelectedHorseId('')
      setHorseDetails(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load races')
    } finally {
      setLoadingLabel('')
    }
  }

  async function handleLoadHorses() {
    if (!selectedRaceId) {
      setErrorMessage('Please select a race first.')
      return
    }

    setLoadingLabel(`Loading horses for race ${selectedRaceId}...`)
    setErrorMessage('')
    setPipelineMessage('')
    try {
      const result = await fetchRaceHorses(selectedRaceId)
      setRaceResult(result)
      const firstHorseId = result.horses[0]?.horseId ?? ''
      setSelectedHorseId(firstHorseId)
      setHorseDetails(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load horses')
    } finally {
      setLoadingLabel('')
    }
  }

  async function handleLoadHorseDetails() {
    if (!selectedHorseId) {
      setErrorMessage('Please select a horse first.')
      return
    }

    setLoadingLabel(`Loading horse details: ${selectedHorseId}...`)
    setErrorMessage('')
    setPipelineMessage('')
    try {
      const result = await fetchHorseDetails(selectedHorseId)
      setHorseDetails(result)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load horse details')
    } finally {
      setLoadingLabel('')
    }
  }

  async function handleRunQuickPipeline() {
    setLoadingLabel('Running quick pipeline (1 race, 3 horses)...')
    setErrorMessage('')
    try {
      const result = await runPipeline({ raceLimit: 1, horsePerRaceLimit: 3 })
      setPipelineMessage(
        `Done. Races: ${result.races.length}, race results: ${Object.keys(result.raceResultByRaceId).length}, horse details: ${Object.keys(result.horseDetailsByHorseId).length}.`,
      )
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to run pipeline')
    } finally {
      setLoadingLabel('')
    }
  }

  return (
    <div className="tracker">
      <header className="tracker-header surface-highest">
        <h1>Netkeiba Crawler</h1>
        <div className="header-actions" aria-label="Header actions">
          <button type="button" className="icon-btn" aria-label="Refresh races" onClick={handleLoadRaces}>
            ↻
          </button>
          <button type="button" className="icon-btn" aria-label="Quick pipeline" onClick={handleRunQuickPipeline}>
            ⚡
          </button>
        </div>
      </header>

      <main className="tracker-body">
        <section className="filter-card surface-low ghost-border">
          <div className="filter-grid">
            <Dropdown
              label="Track"
              value={selectedTrack}
              options={trackOptions}
              onChange={setSelectedTrack}
              placeholder="Select track"
              disabled={Boolean(loadingLabel) || trackOptions.length === 0}
            />
            <Dropdown
              label="Race"
              value={selectedRaceId}
              options={raceOptions}
              onChange={setSelectedRaceId}
              placeholder="Select race"
              disabled={Boolean(loadingLabel) || raceOptions.length === 0}
            />
          </div>

          <div className="actions-row">
            <button className="fetch-btn" type="button" onClick={handleLoadRaces} disabled={Boolean(loadingLabel)}>
              ☁ Fetch Race List
            </button>
            <button
              className="fetch-btn secondary"
              type="button"
              onClick={handleLoadHorses}
              disabled={Boolean(loadingLabel) || !selectedRaceId}
            >
              ⇢ Load Horses
            </button>
          </div>
        </section>

        <section className="odds-section">
          <div className="odds-title-row">
            <h2>Current Odds</h2>
            <span className="live-chip">LIVE</span>
          </div>

          {raceResult && (
            <section className="detail-card surface-low ghost-border">
              <h3>Race Details</h3>
              <div className="detail-grid">
                <p>
                  <strong>Race:</strong> {raceResult.raceNumber ? `${raceResult.raceNumber} ` : ''}
                  {raceResult.raceName ?? '-'}
                </p>
                <p>
                  <strong>Source:</strong> {raceResult.raceInfo?.sourcePage ?? '-'}
                </p>
                <p>
                  <strong>Start time:</strong> {raceResult.raceInfo?.startTime ?? '-'}
                </p>
                <p>
                  <strong>Distance:</strong>{' '}
                  {raceResult.raceInfo?.distance
                    ? `${raceResult.raceInfo.surfaceType ?? ''}${raceResult.raceInfo.distance}m`
                    : '-'}
                </p>
                <p>
                  <strong>Weather:</strong> {raceResult.raceInfo?.weather ?? '-'}
                </p>
                <p>
                  <strong>Track:</strong> {raceResult.raceInfo?.trackCondition ?? '-'}
                </p>
                <p>
                  <strong>Direction:</strong> {raceResult.raceInfo?.turnDirection ?? '-'}
                </p>
                <p>
                  <strong>Field size:</strong> {raceResult.raceInfo?.fieldSize ?? '-'}
                </p>
              </div>
            </section>
          )}

          <OddsTable rows={oddsRows} />

          <div className="horse-controls">
            <Dropdown
              label="Horse"
              value={selectedHorseId}
              options={horseOptions}
              onChange={setSelectedHorseId}
              placeholder="Select horse"
              disabled={Boolean(loadingLabel) || horseOptions.length === 0}
            />
            <button
              className="fetch-btn"
              type="button"
              onClick={handleLoadHorseDetails}
              disabled={Boolean(loadingLabel) || !selectedHorseId}
            >
              View Horse Detail
            </button>
          </div>
        </section>

        {loadingLabel && <p className="status loading">{loadingLabel}</p>}
        {errorMessage && <p className="status error">{errorMessage}</p>}
        {pipelineMessage && <p className="status success">{pipelineMessage}</p>}

        <section className="detail-card surface-low ghost-border">
          <h3>Horse Details</h3>
          {!selectedHorse && <p className="placeholder">Select a horse then click "View Horse Detail".</p>}

          {selectedHorse && (
            <div className="detail-grid" style={{ marginBottom: '10px' }}>
              <p>
                <strong>Race horse:</strong> {selectedHorse.horseNumber ? `${selectedHorse.horseNumber}. ` : ''}
                {selectedHorse.horseName}
              </p>
              <p>
                <strong>Frame:</strong> {selectedHorse.frameNumber ?? '-'}
              </p>
              <p>
                <strong>Sex/Age:</strong> {selectedHorse.sexAge ?? '-'}
              </p>
              <p>
                <strong>Carried weight:</strong> {selectedHorse.carriedWeight ?? '-'}
              </p>
              <p>
                <strong>Jockey:</strong> {selectedHorse.jockeyName ?? '-'}
              </p>
              <p>
                <strong>Trainer:</strong> {selectedHorse.trainerName ?? '-'}
              </p>
              <p>
                <strong>Odds:</strong> {selectedHorse.odds ?? '-'}
              </p>
              <p>
                <strong>Popularity:</strong> {selectedHorse.popularity ?? '-'}
              </p>
              <p>
                <strong>Body weight:</strong>{' '}
                {selectedHorse.bodyWeight
                  ? `${selectedHorse.bodyWeight}${selectedHorse.bodyWeightDiff ? ` (${selectedHorse.bodyWeightDiff})` : ''}`
                  : '-'}
              </p>
              <p>
                <strong>Finish:</strong> {selectedHorse.finishPosition ?? '-'}
              </p>
              <p>
                <strong>Goal time:</strong> {selectedHorse.goalTime ?? '-'}
              </p>
              <p>
                <strong>Margin:</strong> {selectedHorse.margin ?? '-'}
              </p>
              <p>
                <strong>Passing order:</strong> {selectedHorse.passingOrder ?? '-'}
              </p>
              <p>
                <strong>Closing 3F:</strong> {selectedHorse.closing3F ?? '-'}
              </p>
              <p>
                <strong>Note:</strong> {[selectedHorse.note0, selectedHorse.note1].filter(Boolean).join(' / ') || '-'}
              </p>
            </div>
          )}

          {!horseDetails && selectedHorse && (
            <p className="placeholder">Race page data loaded. Click "View Horse Detail" for profile + pedigree.</p>
          )}

          {horseDetails && (
            <div className="detail-grid">
              <p>
                <strong>ID:</strong> {horseDetails.horseId}
              </p>
              <p>
                <strong>Name:</strong> {horseDetails.horseName ?? selectedHorse?.horseName ?? '-'}
              </p>
              <p>
                <strong>Race history rows:</strong> {horseDetails.raceHistory.length}
              </p>
              <p>
                <strong>Pedigree links:</strong> {horseDetails.pedigree.length}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
