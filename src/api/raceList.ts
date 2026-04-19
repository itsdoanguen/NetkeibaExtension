import { load } from 'cheerio'

import { fetchHtml, toAbsoluteUrl, withRetry } from './http'
import { setRaces } from './storage'
import type { Race } from './types'

const RACE_TOP_URL = 'https://race.netkeiba.com/top/'

function extractRaceId(url: string): string | null {
  const absoluteUrl = new URL(url)
  return absoluteUrl.searchParams.get('race_id')
}

export async function fetchRaceList(): Promise<Race[]> {
  const html = await withRetry(() => fetchHtml(RACE_TOP_URL, 120))
  const $ = load(html)
  const races: Race[] = []

  $('.RaceList_Box.clearfix .RaceList_DataList .RaceList_Data').each((_, raceDataElement) => {
    const trackName = $(raceDataElement).find('.RaceList_DataTitle').first().text().trim() || undefined

    $(raceDataElement)
      .find('.RaceList_DataItem a[href*="race_id="]')
      .each((__, linkElement) => {
        const relativeLink = $(linkElement).attr('href')
        if (!relativeLink) {
          return
        }

        const raceListLink = toAbsoluteUrl(RACE_TOP_URL, relativeLink)
        const raceId = extractRaceId(raceListLink)
        if (!raceId) {
          return
        }

        const raceName =
          $(linkElement).find('.RaceList_ItemTitle').text().trim() ||
          $(linkElement).find('.RaceList_ItemMain').text().trim() ||
          $(linkElement).text().trim() ||
          `Race ${raceId}`

        const raceNumber =
          $(linkElement).find('.RaceList_ItemNo').text().trim() ||
          $(linkElement).find('.RaceNo').text().trim() ||
          undefined

        const raceStartTime =
          $(linkElement).find('.RaceList_Itemtime').text().trim() ||
          $(linkElement).find('.RaceTime').text().trim() ||
          undefined

        races.push({
          raceId,
          raceName,
          raceNumber,
          raceStartTime,
          trackName,
          raceListLink,
        })
      })
  })

  await setRaces(races)
  return races
}
