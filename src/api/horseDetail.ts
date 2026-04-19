import { load } from 'cheerio'

import { fetchHtml, toAbsoluteUrl, withRetry } from './http'
import { setHorseDetails } from './storage'
import type { HorseDetails, PedigreeNode, RaceHistoryRecord } from './types'

const HORSE_DB_BASE = 'https://db.netkeiba.com/'

function buildHorseUrl(horseId: string): string {
  return `https://db.netkeiba.com/horse/${encodeURIComponent(horseId)}`
}

function buildHorseResultUrl(horseId: string): string {
  return `https://db.netkeiba.com/horse/result/${encodeURIComponent(horseId)}/`
}

function buildHorsePedUrl(horseId: string): string {
  return `https://db.netkeiba.com/horse/ped/${encodeURIComponent(horseId)}/`
}

function extractHorseIdFromUrl(url: string): string | undefined {
  const match = url.match(/\/horse\/(\d+)/)
  return match?.[1]
}

function parseRaceHistory($: ReturnType<typeof load>): RaceHistoryRecord[] {
  const rows =
    $('.horse_results_box tbody tr').length > 0
      ? $('.horse_results_box tbody tr')
      : $('.db_h_race_results tbody tr')

  return rows
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

  const pedigreeLinks = $('.horse_pedigree_box a').length > 0 ? $('.horse_pedigree_box a') : $('.blood_table a')

  pedigreeLinks.each((_, anchor) => {
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

  const profileRows = $('.db_prof_table tr').length > 0 ? $('.db_prof_table tr') : $('.horse_profile_table tr')

  profileRows.each((_, row) => {
    const label = $(row).find('th').first().text().trim()
    const value = $(row).find('td').first().text().replace(/\s+/g, ' ').trim()
    if (label && value) {
      profile[label] = value
    }
  })

  return profile
}

export async function fetchHorseDetails(horseId: string): Promise<HorseDetails> {
  const mainUrl = buildHorseUrl(horseId)
  const resultUrl = buildHorseResultUrl(horseId)
  const pedUrl = buildHorsePedUrl(horseId)

  const [mainHtml, resultHtml, pedHtml] = await Promise.all([
    withRetry(() => fetchHtml(mainUrl, 160)),
    withRetry(() => fetchHtml(resultUrl, 180)),
    withRetry(() => fetchHtml(pedUrl, 200)),
  ])

  const main$ = load(mainHtml)
  const result$ = load(resultHtml)
  const ped$ = load(pedHtml)

  const horseName =
    main$('.horse_title h1').first().text().trim() ||
    main$('.horse_data_top h1').first().text().trim() ||
    result$('.horse_title h1').first().text().trim() ||
    ped$('.horse_title h1').first().text().trim() ||
    main$('h1').first().text().trim() ||
    main$('title').first().text().trim() ||
    undefined

  const raceHistory = parseRaceHistory(result$)
  const pedigree = parsePedigree(ped$)
  const profile = parseProfile(main$)

  if (raceHistory.length === 0 && pedigree.length === 0 && Object.keys(profile).length === 0) {
    throw new Error(
      `Horse detail parse failed for horse ${horseId}. Titles: main=${main$('title').first().text().trim()} result=${result$('title').first().text().trim()} ped=${ped$('title').first().text().trim()}`,
    )
  }

  const details: HorseDetails = {
    horseId,
    horseName,
    profile,
    raceHistory,
    pedigree,
  }

  await setHorseDetails(details)
  return details
}
