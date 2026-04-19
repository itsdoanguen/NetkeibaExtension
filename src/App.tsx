import { useMemo, useState } from 'react'

import './App.css'
import {
  fetchHorseDetails,
  fetchRaceHorses,
  fetchRaceList,
  runPipeline,
  type Horse,
  type HorseDetails,
  type Race,
  type RaceResult,
} from './api'

function App() {
  const [races, setRaces] = useState<Race[]>([])
  const [selectedRaceId, setSelectedRaceId] = useState<string>('')
  const [raceResult, setRaceResult] = useState<RaceResult | null>(null)
  const [selectedHorseId, setSelectedHorseId] = useState<string>('')
  const [horseDetails, setHorseDetails] = useState<HorseDetails | null>(null)
  const [pipelineMessage, setPipelineMessage] = useState<string>('')
  const [loadingLabel, setLoadingLabel] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const horses = raceResult?.horses ?? []

  const selectedHorse: Horse | undefined = useMemo(
    () => horses.find((horse) => horse.horseId === selectedHorseId),
    [horses, selectedHorseId],
  )

  async function handleLoadRaces(): Promise<void> {
    setLoadingLabel('Loading races...')
    setErrorMessage('')
    setPipelineMessage('')
    try {
      const data = await fetchRaceList()
      setRaces(data)
      const firstRaceId = data[0]?.raceId ?? ''
      setSelectedRaceId(firstRaceId)
      setRaceResult(null)
      setSelectedHorseId('')
      setHorseDetails(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load races')
    } finally {
      setLoadingLabel('')
    }
  }

  async function handleLoadHorses(): Promise<void> {
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

  async function handleLoadHorseDetails(): Promise<void> {
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

  async function handleRunQuickPipeline(): Promise<void> {
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
    <div className="crawler-app">
      <header className="app-header">
        <h1>Netkeiba Crawler</h1>
        <p>Race list → race horses → horse details + pedigree</p>
      </header>

      <section className="panel controls">
        <button type="button" onClick={handleLoadRaces} disabled={Boolean(loadingLabel)}>
          1) Load Today Races
        </button>

        <label>
          Race
          <select
            value={selectedRaceId}
            onChange={(event) => setSelectedRaceId(event.target.value)}
            disabled={Boolean(loadingLabel) || races.length === 0}
          >
            {races.length === 0 && <option value="">No race loaded</option>}
            {races.map((race) => (
              <option key={race.raceId} value={race.raceId}>
                {race.trackName ? `[${race.trackName}] ` : ''}
                {race.raceNumber ? `${race.raceNumber} ` : ''}
                {race.raceName}
              </option>
            ))}
          </select>
        </label>

        <button type="button" onClick={handleLoadHorses} disabled={Boolean(loadingLabel) || !selectedRaceId}>
          2) Load Horses In Race
        </button>

        <label>
          Horse
          <select
            value={selectedHorseId}
            onChange={(event) => setSelectedHorseId(event.target.value)}
            disabled={Boolean(loadingLabel) || horses.length === 0}
          >
            {horses.length === 0 && <option value="">No horse loaded</option>}
            {horses.map((horse) => (
              <option key={horse.horseId} value={horse.horseId}>
                {horse.horseNumber ? `${horse.horseNumber}. ` : ''}
                {horse.horseName}
              </option>
            ))}
          </select>
        </label>

        <button type="button" onClick={handleLoadHorseDetails} disabled={Boolean(loadingLabel) || !selectedHorseId}>
          3) Load Horse Details
        </button>

        <button type="button" onClick={handleRunQuickPipeline} disabled={Boolean(loadingLabel)}>
          Quick Pipeline Test
        </button>
      </section>

      {loadingLabel && <p className="status loading">{loadingLabel}</p>}
      {errorMessage && <p className="status error">{errorMessage}</p>}
      {pipelineMessage && <p className="status success">{pipelineMessage}</p>}

      <section className="panel">
        <h2>Races ({races.length})</h2>
        <div className="list-box">
          {races.map((race) => (
            <div key={race.raceId} className="line-item">
              <strong>{race.raceId}</strong>
              <span>{race.trackName ?? '-'}</span>
              <span>{race.raceName}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Horses ({horses.length})</h2>
        <div className="list-box">
          {horses.map((horse) => (
            <div key={horse.horseId} className="line-item">
              <strong>{horse.horseNumber ?? '-'}</strong>
              <span>{horse.horseName}</span>
              <span>Odds: {horse.odds ?? '-'}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Horse Details</h2>
        {!horseDetails && <p className="placeholder">Select a horse and load details.</p>}

        {horseDetails && (
          <>
            <div className="detail-top">
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

            <h3>Profile</h3>
            <div className="list-box">
              {Object.entries(horseDetails.profile).map(([key, value]) => (
                <div key={key} className="line-item profile-row">
                  <strong>{key}</strong>
                  <span>{value}</span>
                </div>
              ))}
            </div>

            <h3>Pedigree (first 12 links)</h3>
            <div className="list-box">
              {horseDetails.pedigree.slice(0, 12).map((node, index) => (
                <div key={`${node.horseId ?? node.horseName}-${index}`} className="line-item">
                  <strong>{node.horseName}</strong>
                  <span>{node.horseId ?? '-'}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default App
