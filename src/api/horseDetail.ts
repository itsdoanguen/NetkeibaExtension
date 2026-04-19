import { load } from 'cheerio'

import { fetchHtml, toAbsoluteUrl, withRetry } from './http'
import { setHorseDetails } from './storage'
import type { HorseDetails, PedigreeNode, RaceHistoryRecord } from './types'

const HORSE_DB_BASE = 'https://db.netkeiba.com/'

function buildHorseUrl(horseId: string): string {
  return `https://db.netkeiba.com/horse/${encodeURIComponent(horseId)}`
}

function extractHorseIdFromUrl(url: string): string | undefined {
  const match = url.match(/\/horse\/(\d+)/)
  return match?.[1]
}

function parseRaceHistory($: ReturnType<typeof load>): RaceHistoryRecord[] {
  return $('.horse_results_box tbody tr')
    .map((_, row) => {
      const cells = $(row)
        .find('td')
        .map((__, cell) => $(cell).text().replace(/\s+/g, ' ').trim())
        .get()

      return {
        date: cells[0],
        venue: cells[1],
        weather: cells[2],
        raceNumber: cells[3],
        raceName: cells[4],
        raceClass: cells[5],
        horseNumber: cells[7],
        jockey: cells[12],
        carriedWeight: cells[13],
        odds: cells[14],
        popularity: cells[15],
        finishPosition: cells[11],
        goalTime: cells[17],
        margin: cells[18],
        passingOrder: cells[20],
        closing3F: cells[21],
        bodyWeight: cells[23],
        winnerOrTopHorse: cells[26],
        prize: cells[27],
        rawColumns: cells,
      }
    })
    .get()
}

function parsePedigree($: ReturnType<typeof load>): PedigreeNode[] {
  const nodes: PedigreeNode[] = []

  $('.horse_pedigree_box a').each((_, anchor) => {
    const horseName = $(anchor).text().trim()
    const href = $(anchor).attr('href')

    if (!horseName || !href) {
      return
    }

    const link = toAbsoluteUrl(HORSE_DB_BASE, href)
    nodes.push({
      horseName,
      link,
      horseId: extractHorseIdFromUrl(link),
    })
  })

  return nodes
}

function parseProfile($: ReturnType<typeof load>): Record<string, string> {
  const profile: Record<string, string> = {}

  $('.db_prof_table tr').each((_, row) => {
    const label = $(row).find('th').first().text().trim()
    const value = $(row).find('td').first().text().replace(/\s+/g, ' ').trim()
    if (label && value) {
      profile[label] = value
    }
  })

  return profile
}

export async function fetchHorseDetails(horseId: string): Promise<HorseDetails> {
  const url = buildHorseUrl(horseId)
  const html = await withRetry(() => fetchHtml(url, 160))
  const $ = load(html)

  const horseName = $('.horse_title h1').first().text().trim() || $('title').first().text().trim() || undefined

  const details: HorseDetails = {
    horseId,
    horseName,
    profile: parseProfile($),
    raceHistory: parseRaceHistory($),
    pedigree: parsePedigree($),
  }

  await setHorseDetails(details)
  return details
}
