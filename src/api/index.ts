import { fetchHorseDetails } from './horseDetail'
import { fetchRaceHorses } from './raceDetail'
import { fetchRaceList } from './raceList'
import type { HorseDetails, PipelineResult, RaceResult } from './types'

export { fetchRaceList } from './raceList'
export { fetchRaceHorses } from './raceDetail'
export { fetchHorseDetails } from './horseDetail'
export * from './types'

export async function runPipeline(options?: {
  raceLimit?: number
  horsePerRaceLimit?: number
}): Promise<PipelineResult> {
  const raceLimit = options?.raceLimit ?? 3
  const horsePerRaceLimit = options?.horsePerRaceLimit ?? 5

  const races = await fetchRaceList()
  const selectedRaces = races.slice(0, raceLimit)

  const raceResultByRaceId: Record<string, RaceResult> = {}
  const horseDetailsByHorseId: Record<string, HorseDetails> = {}

  for (const race of selectedRaces) {
    const raceResult = await fetchRaceHorses(race.raceId)
    raceResultByRaceId[race.raceId] = raceResult

    const selectedHorses = raceResult.horses.slice(0, horsePerRaceLimit)
    for (const horse of selectedHorses) {
      const details = await fetchHorseDetails(horse.horseId)
      horseDetailsByHorseId[horse.horseId] = details
    }
  }

  const result: PipelineResult = {
    races,
    raceResultByRaceId,
    horseDetailsByHorseId,
  }

  return result
}
