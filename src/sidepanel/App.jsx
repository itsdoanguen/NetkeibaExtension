import { useEffect, useMemo, useState } from 'react'

import './styles.css'
import './App.css'
import Dropdown from './components/Dropdown.jsx'
import HorseDetailsPanel from './components/HorseDetailsPanel.jsx'
import OddsTable from './components/OddsTable.jsx'
import { fetchHorseDetails, fetchRaceHorses, fetchRaceList, runPipeline } from '../api'

function App() {
  const [races, setRaces] = useState([])
  const [selectedTrack, setSelectedTrack] = useState('')
  const [selectedRaceId, setSelectedRaceId] = useState('')
  const [raceResult, setRaceResult] = useState(null)
  const [selectedHorseId, setSelectedHorseId] = useState('')
  const [isHorseDetailsOpen, setIsHorseDetailsOpen] = useState(false)
  const [horseDetails, setHorseDetails] = useState(null)
  const [horseDetailsLoading, setHorseDetailsLoading] = useState(false)
  const [horseDetailsError, setHorseDetailsError] = useState('')
  const [pipelineMessage, setPipelineMessage] = useState('')
  const [loadingLabel, setLoadingLabel] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const horses = raceResult?.horses ?? []

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

  const oddsRows = useMemo(
    () =>
      horses.map((horse, index) => ({
        horseId: horse.horseId,
        no: horse.horseNumber || String(index + 1),
        horse: horse.horseName,
        jockey: horse.jockeyName || '-',
        odds: horse.odds || '-',
        gate: horse.frameNumber ?? '-',
        silk: horse.horseNumber ?? '-',
        sexAge: horse.sexAge ?? '-',
        carriedWeight: horse.carriedWeight ?? '-',
        trainer: horse.trainerName ?? '-',
        popularity: horse.popularity ?? '-',
        bodyWeight: formatBodyWeight(horse),
        finish: horse.finishPosition ?? '-',
        goalTime: horse.goalTime ?? '-',
        margin: horse.margin ?? '-',
        passingOrder: horse.passingOrder ?? '-',
        closing3F: horse.closing3F ?? '-',
        note: [horse.note0, horse.note1].filter(Boolean).join(' / ') || '-',
        featured: horse.horseId === selectedHorseId,
      })),
    [horses, selectedHorseId],
  )

  const selectedRunner = useMemo(
    () => oddsRows.find((row) => row.horseId === selectedHorseId) ?? null,
    [oddsRows, selectedHorseId],
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
      setHorseDetails(null)
      setHorseDetailsError('')
      return
    }

    if (!horses.some((horse) => horse.horseId === selectedHorseId)) {
      setSelectedHorseId(horses[0].horseId)
    }
  }, [horses, selectedHorseId])

  useEffect(() => {
    if (!isHorseDetailsOpen || !selectedHorseId) {
      return
    }

    let isCancelled = false

    async function loadHorseDetails() {
      setHorseDetailsLoading(true)
      setHorseDetailsError('')
      try {
        const result = await fetchHorseDetails(selectedHorseId)
        if (!isCancelled) {
          setHorseDetails(result)
        }
      } catch (error) {
        if (!isCancelled) {
          setHorseDetails(null)
          setHorseDetailsError(error instanceof Error ? error.message : 'Failed to load horse details')
        }
      } finally {
        if (!isCancelled) {
          setHorseDetailsLoading(false)
        }
      }
    }

    loadHorseDetails()

    return () => {
      isCancelled = true
    }
  }, [isHorseDetailsOpen, selectedHorseId])

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
      setIsHorseDetailsOpen(false)
      setHorseDetails(null)
      setHorseDetailsError('')
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
      setIsHorseDetailsOpen(false)
      setHorseDetails(null)
      setHorseDetailsError('')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load horses')
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

  function formatBodyWeight(horse) {
    if (!horse?.bodyWeight) {
      return '-'
    }

    return `${horse.bodyWeight}${horse.bodyWeightDiff ? ` (${horse.bodyWeightDiff})` : ''}`
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
            <h2>現在のオッズ</h2>
            <span className="live-chip">ライブ</span>
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

          <OddsTable
            rows={oddsRows}
            onRunnerClick={(row) => {
              if (row?.horseId) {
                setSelectedHorseId(row.horseId)
                setIsHorseDetailsOpen(true)
              }
            }}
          />
        </section>

        {loadingLabel && <p className="status loading">{loadingLabel}</p>}
        {errorMessage && <p className="status error">{errorMessage}</p>}
        {pipelineMessage && <p className="status success">{pipelineMessage}</p>}

        <HorseDetailsPanel
          isOpen={isHorseDetailsOpen}
          runner={selectedRunner}
          details={horseDetails}
          isLoading={horseDetailsLoading}
          errorMessage={horseDetailsError}
          onClose={() => setIsHorseDetailsOpen(false)}
        />

      </main>
    </div>
  )
}

export default App
