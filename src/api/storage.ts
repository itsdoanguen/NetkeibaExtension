import type { HorseDetails, PipelineResult, Race, RaceResult } from './types'

const KEY_RACES = 'netkeiba:races'
const KEY_RACE_RESULT_PREFIX = 'netkeiba:race-result:'
const KEY_HORSE_DETAIL_PREFIX = 'netkeiba:horse-detail:'

type StorageAreaLike = {
  set: (items: Record<string, unknown>) => Promise<void>
  get: (key: string) => Promise<Record<string, unknown>>
}

function getChromeStorageLocal(): StorageAreaLike | null {
  const maybeChrome = (globalThis as { chrome?: { storage?: { local?: StorageAreaLike } } }).chrome
  if (maybeChrome?.storage?.local) {
    return maybeChrome.storage.local
  }
  return null
}

async function setValue<T>(key: string, value: T): Promise<void> {
  const chromeStorage = getChromeStorageLocal()
  if (chromeStorage) {
    await chromeStorage.set({ [key]: value })
    return
  }

  localStorage.setItem(key, JSON.stringify(value))
}

async function getValue<T>(key: string): Promise<T | null> {
  const chromeStorage = getChromeStorageLocal()
  if (chromeStorage) {
    const result = await chromeStorage.get(key)
    return (result[key] as T | undefined) ?? null
  }

  const raw = localStorage.getItem(key)
  if (!raw) {
    return null
  }

  return JSON.parse(raw) as T
}

export async function setRaces(races: Race[]): Promise<void> {
  await setValue(KEY_RACES, races)
}

export async function getRaces(): Promise<Race[]> {
  return (await getValue<Race[]>(KEY_RACES)) ?? []
}

export async function setRaceResult(raceResult: RaceResult): Promise<void> {
  await setValue(`${KEY_RACE_RESULT_PREFIX}${raceResult.raceId}`, raceResult)
}

export async function getRaceResult(raceId: string): Promise<RaceResult | null> {
  return getValue<RaceResult>(`${KEY_RACE_RESULT_PREFIX}${raceId}`)
}

export async function setHorseDetails(details: HorseDetails): Promise<void> {
  await setValue(`${KEY_HORSE_DETAIL_PREFIX}${details.horseId}`, details)
}

export async function getHorseDetails(horseId: string): Promise<HorseDetails | null> {
  return getValue<HorseDetails>(`${KEY_HORSE_DETAIL_PREFIX}${horseId}`)
}

export async function setPipelineResult(result: PipelineResult): Promise<void> {
  await setRaces(result.races)

  await Promise.all([
    ...Object.values(result.raceResultByRaceId).map((raceResult) => setRaceResult(raceResult)),
    ...Object.values(result.horseDetailsByHorseId).map((details) => setHorseDetails(details)),
  ])
}
