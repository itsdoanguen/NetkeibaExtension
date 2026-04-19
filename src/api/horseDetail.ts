import { load } from 'cheerio'

import { fetchHtml, toAbsoluteUrl, withRetry } from './http'
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
  const match = url.match(/\/horse\/([0-9a-zA-Z]+)/)
  return match?.[1]
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function buildHeaderMap($: ReturnType<typeof load>, rows: ReturnType<typeof $>): string[] {
  const table = rows.first().closest('table')
  if (!table.length) {
    return []
  }

  const headers = table
    .find('thead th')
    .map((_, th) => normalizeText($(th).text()))
    .get()

  return headers
}

function findValueByHeader(
  headerMap: string[],
  cells: string[],
  patterns: RegExp[],
  fallbackIndex?: number,
): string | undefined {
  for (const pattern of patterns) {
    const index = headerMap.findIndex((header) => pattern.test(header))
    if (index >= 0) {
      const value = cells[index]
      if (value) {
        return value
      }
    }
  }

  if (typeof fallbackIndex === 'number') {
    return cells[fallbackIndex]
  }

  return undefined
}

function parseRaceHistory($: ReturnType<typeof load>): RaceHistoryRecord[] {
  const rows =
    $('.horse_results_box tbody tr').length > 0
      ? $('.horse_results_box tbody tr')
      : $('.db_h_race_results tbody tr')

  const headerMap = buildHeaderMap($, rows)

  return rows
    .map((_, row) => {
      const cells = $(row)
        .find('td')
        .map((__, cell) => normalizeText($(cell).text()))
        .get()

      return {
        date: findValueByHeader(headerMap, cells, [/^日付$/], 0),
        venue: findValueByHeader(headerMap, cells, [/開催/, /^場$/], 1),
        weather: findValueByHeader(headerMap, cells, [/天候/], 2),
        raceNumber: findValueByHeader(headerMap, cells, [/R$/], 3),
        raceName: findValueByHeader(headerMap, cells, [/レース名/, /レース/, /レース名/], 4),
        raceClass: findValueByHeader(headerMap, cells, [/クラス/, /条件/], 5),
        horseNumber: findValueByHeader(headerMap, cells, [/馬番/], 7),
        jockey: findValueByHeader(headerMap, cells, [/騎手/], 12),
        carriedWeight: findValueByHeader(headerMap, cells, [/斤量/], 13),
        odds: findValueByHeader(headerMap, cells, [/オッズ/], 14),
        popularity: findValueByHeader(headerMap, cells, [/人気/], 15),
        finishPosition: findValueByHeader(headerMap, cells, [/着順/], 11),
        goalTime: findValueByHeader(headerMap, cells, [/タイム/], 17),
        margin: findValueByHeader(headerMap, cells, [/着差/], 18),
        passingOrder: findValueByHeader(headerMap, cells, [/通過/], 20),
        closing3F: findValueByHeader(headerMap, cells, [/上り/], 21),
        bodyWeight: findValueByHeader(headerMap, cells, [/馬体重/], 23),
        winnerOrTopHorse: findValueByHeader(headerMap, cells, [/1着馬/, /勝ち馬/], 26),
        prize: findValueByHeader(headerMap, cells, [/賞金/], 27),
        rawColumns: cells,
      }
    })
    .get()
    .filter((row) => Boolean(row.date || row.raceName || row.finishPosition))
}

function parsePedigree($: ReturnType<typeof load>): PedigreeNode[] {
  const nodes: PedigreeNode[] = []
  const seenLinks = new Set<string>()

  const pedigreeLinks = $('.horse_pedigree_box a').length > 0 ? $('.horse_pedigree_box a') : $('.blood_table a')

  pedigreeLinks.each((_, anchor) => {
    const horseName = normalizeText($(anchor).text())
    const href = $(anchor).attr('href')

    if (!horseName || !href) {
      return
    }

    const link = toAbsoluteUrl(HORSE_DB_BASE, href)
    const pathname = new URL(link).pathname

    // Keep only direct horse profile links in pedigree tree.
    if (!/^\/horse\/[0-9a-zA-Z]+\/?$/.test(pathname)) {
      return
    }

    if (seenLinks.has(link)) {
      return
    }
    seenLinks.add(link)

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
    const value = normalizeText($(row).find('td').first().text())
    if (label && value) {
      profile[label] = value
    }
  })

  if (Object.keys(profile).length === 0) {
    $('.horse_profile .data_intro p').each((_, p) => {
      const value = normalizeText($(p).text())
      if (value) {
        profile[`intro_${String(_ + 1)}`] = value
      }
    })
  }

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
    main$('.horse_data h1').first().text().trim() ||
    main$('.horse_data_top h1').first().text().trim() ||
    result$('.horse_title h1').first().text().trim() ||
    result$('.horse_title').first().text().trim() ||
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

  return details
}
