export interface Race {
  raceId: string
  raceNumber?: string
  raceName: string
  trackName?: string
  raceStartTime?: string
  raceListLink: string
}

export interface Horse {
  raceId: string
  horseId: string
  horseNumber?: string
  frameNumber?: string
  horseName: string
  jockeyName?: string
  trainerName?: string
  finishPosition?: string
  odds?: string
  popularity?: string
  sexAge?: string
  carriedWeight?: string
  bodyWeight?: string
  bodyWeightDiff?: string
  goalTime?: string
  margin?: string
  passingOrder?: string
  closing3F?: string
  rawColumns: string[]
  horseDetailLink: string
}

export interface RaceResult {
  raceId: string
  raceName?: string
  horses: Horse[]
}

export interface RaceHistoryRecord {
  date?: string
  venue?: string
  weather?: string
  raceNumber?: string
  raceName?: string
  raceClass?: string
  horseNumber?: string
  jockey?: string
  carriedWeight?: string
  odds?: string
  popularity?: string
  finishPosition?: string
  goalTime?: string
  margin?: string
  passingOrder?: string
  closing3F?: string
  bodyWeight?: string
  winnerOrTopHorse?: string
  prize?: string
  rawColumns: string[]
}

export interface PedigreeNode {
  horseId?: string
  horseName: string
  link?: string
}

export interface HorseDetails {
  horseId: string
  horseName?: string
  profile: Record<string, string>
  raceHistory: RaceHistoryRecord[]
  pedigree: PedigreeNode[]
}

export interface PipelineResult {
  races: Race[]
  raceResultByRaceId: Record<string, RaceResult>
  horseDetailsByHorseId: Record<string, HorseDetails>
}
