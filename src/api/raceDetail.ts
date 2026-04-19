import { load } from 'cheerio'

import { fetchHtml, toAbsoluteUrl, withRetry } from './http'
import { setRaceResult } from './storage'
import type { Horse, RaceResult } from './types'

const RACE_RESULT_BASE_URL = 'https://race.netkeiba.com/race/result.html'
const RACE_SITE_BASE = 'https://race.netkeiba.com/'

function buildRaceResultUrl(raceId: string): string {
  return `${RACE_RESULT_BASE_URL}?race_id=${encodeURIComponent(raceId)}`
}

function extractHorseId(link: string): string | null {
  const match = link.match(/\/horse\/(\d+)/)
  return match?.[1] ?? null
}

function getCellText(cells: string[], index: number): string | undefined {
  const value = cells[index]?.trim()
  return value ? value : undefined
}

export async function fetchRaceHorses(raceId: string): Promise<RaceResult> {
  const url = buildRaceResultUrl(raceId)
  const html = await withRetry(() => fetchHtml(url, 140))
  const $ = load(html)

  const horses: Horse[] = []
  const raceName = $('title').first().text().trim() || undefined

  $('.ResultTableWrap tbody tr').each((_, row) => {
    const cells = $(row)
      .find('td')
      .map((__, cell) => $(cell).text().replace(/\s+/g, ' ').trim())
      .get()

    const horseAnchor = $(row).find('.Horse_Name a, td.Horse_Name a').first()
    const horseName = horseAnchor.text().trim()
    const rawHref = horseAnchor.attr('href')

    if (!horseName || !rawHref) {
      return
    }

    const horseDetailLink = toAbsoluteUrl(RACE_SITE_BASE, rawHref)
    const horseId = extractHorseId(horseDetailLink)

    if (!horseId) {
      return
    }

    horses.push({
      raceId,
      horseId,
      horseName,
      horseDetailLink,
      finishPosition: getCellText(cells, 0),
      frameNumber: getCellText(cells, 1),
      horseNumber: getCellText(cells, 2),
      sexAge: getCellText(cells, 4),
      carriedWeight: getCellText(cells, 5),
      jockeyName: getCellText(cells, 6),
      goalTime: getCellText(cells, 7),
      margin: getCellText(cells, 8),
      passingOrder: getCellText(cells, 9),
      closing3F: getCellText(cells, 10),
      odds: getCellText(cells, 11),
      popularity: getCellText(cells, 12),
      bodyWeight: getCellText(cells, 13),
      trainerName: getCellText(cells, 18),
      rawColumns: cells,
    })
  })

  const raceResult: RaceResult = { raceId, raceName, horses }
  await setRaceResult(raceResult)

  return raceResult
}
