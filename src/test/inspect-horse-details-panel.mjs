import { load } from 'cheerio'

const raceId = process.env.RACE_ID ?? '202606030811'
const horseIdFromEnv = process.env.HORSE_ID

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      'accept-language': 'ja,en-US;q=0.9,en;q=0.8',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  return response.text()
}

function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim()
}

function toAbsoluteUrl(baseUrl, href) {
  return new URL(href, baseUrl).toString()
}

function extractHorseId(link) {
  const match = link.match(/\/horse\/(\d+)/)
  return match?.[1] ?? null
}

function buildHorseUrl(horseId) {
  return `https://db.netkeiba.com/horse/${encodeURIComponent(horseId)}`
}

function buildHorseResultUrl(horseId) {
  return `https://db.netkeiba.com/horse/result/${encodeURIComponent(horseId)}/`
}

function buildHorsePedUrl(horseId) {
  return `https://db.netkeiba.com/horse/ped/${encodeURIComponent(horseId)}/`
}

function buildRaceResultUrl(id) {
  return `https://race.netkeiba.com/race/result.html?race_id=${encodeURIComponent(id)}`
}

function buildRaceShutubaUrl(id) {
  return `https://race.netkeiba.com/race/shutuba.html?race_id=${encodeURIComponent(id)}`
}

function getCellText(cells, index) {
  const value = cells[index]?.trim()
  return value ? value : undefined
}

function parseSexAge(sexAge) {
  if (!sexAge) {
    return {}
  }

  const match = sexAge.match(/^([牡牝セ])\s*(\d+)/)
  return {
    horseSex: match?.[1],
    horseAge: match?.[2],
  }
}

function parseBodyWeight(value) {
  if (!value) {
    return {}
  }

  const match = value.match(/(\d+)\s*\(([-+]?\d+)\)/)
  if (match) {
    return {
      bodyWeight: match[1],
      bodyWeightDiff: match[2],
    }
  }

  const plain = value.match(/\d+/)?.[0]
  return {
    bodyWeight: plain,
    bodyWeightDiff: undefined,
  }
}

function findCellByClass(cells, classPattern) {
  return cells.find((cell) => classPattern.test(cell.className))
}

function findCellTextByClass(cells, classPattern) {
  return findCellByClass(cells, classPattern)?.text
}

function parseRaceInfo($, sourcePage) {
  const raceData01 = normalizeText($('.RaceData01').first().text()) || undefined
  const raceData02 = normalizeText($('.RaceData02').first().text()) || undefined

  const startTime = raceData01?.match(/(\d{1,2}:\d{2})/)?.[1]
  const surfaceDistance = raceData01?.match(/([芝ダ障])\s*(\d+)m/)
  const turnDirection = raceData01?.match(/\(([^)]+)\)/)?.[1]
  const weather = raceData01?.match(/天候\s*[:：]\s*([^\s/]+)/)?.[1]
  const trackCondition = raceData01?.match(/馬場\s*[:：]\s*([^\s/]+)/)?.[1]
  const fieldSize = raceData02?.match(/(\d+)頭/)?.[1]

  return {
    sourcePage,
    startTime,
    distance: surfaceDistance?.[2],
    surfaceType: surfaceDistance?.[1],
    turnDirection,
    weather,
    trackCondition,
    fieldSize,
    raceData01,
    raceData02,
  }
}

function getHorseRows($, mode) {
  if (mode === 'result') {
    const resultRows = $('.ResultTableWrap tbody tr.HorseList')
    if (resultRows.length > 0) {
      return resultRows
    }

    return $('.RaceTable01.RaceCommon_Table tbody tr.HorseList')
  }

  const shutubaRows = $('.Shutuba_Table tbody tr.HorseList')
  if (shutubaRows.length > 0) {
    return shutubaRows
  }

  return $('.RaceTable01.RaceCommon_Table tbody tr.HorseList')
}

function parseHorseRows($, rows, id, mode) {
  const horses = []
  const seenHorseIds = new Set()

  rows.each((_, row) => {
    const rowCells = $(row).find('td')
    const cells = rowCells
      .map((__, cell) => normalizeText($(cell).text()))
      .get()

    const cellsWithClass = rowCells
      .map((__, cell) => ({
        text: normalizeText($(cell).text()) || undefined,
        className: $(cell).attr('class') ?? '',
      }))
      .get()

    const horseAnchor =
      $(row).find('.Horse_Name a, td.Horse_Name a, td.HorseInfo a, .HorseInfo a').first().length > 0
        ? $(row).find('.Horse_Name a, td.Horse_Name a, td.HorseInfo a, .HorseInfo a').first()
        : $(row).find('a[href*="/horse/"]').first()

    const jockeyAnchor = $(row).find('td.Jockey a[href*="/jockey/"]').first()
    const trainerAnchor = $(row).find('td.Trainer a[href*="/trainer/"]').first()

    const horseName = horseAnchor.text().trim()
    const rawHref = horseAnchor.attr('href')

    if (!horseName || !rawHref) {
      return
    }

    const horseDetailLink = toAbsoluteUrl('https://race.netkeiba.com/', rawHref)
    const horseId = extractHorseId(horseDetailLink)
    const jockeyLink = jockeyAnchor.attr('href') ? toAbsoluteUrl('https://race.netkeiba.com/', jockeyAnchor.attr('href')) : undefined
    const trainerLink = trainerAnchor.attr('href') ? toAbsoluteUrl('https://race.netkeiba.com/', trainerAnchor.attr('href')) : undefined

    if (!horseId || seenHorseIds.has(horseId)) {
      return
    }
    seenHorseIds.add(horseId)

    const sexAge =
      findCellTextByClass(cellsWithClass, /Barei|Horse_Info\s+Txt_C/i) ||
      getCellText(cells, mode === 'result' ? 4 : 4)

    const bodyWeightRaw =
      findCellTextByClass(cellsWithClass, /\bWeight\b/i) ||
      getCellText(cells, mode === 'result' ? 13 : 8)

    const { horseSex, horseAge } = parseSexAge(sexAge)
    const { bodyWeight, bodyWeightDiff } = parseBodyWeight(bodyWeightRaw)

    horses.push({
      raceId: id,
      horseId,
      horseName,
      horseSex,
      horseAge,
      horseDetailLink,
      frameNumber:
        (mode === 'result'
          ? findCellTextByClass(cellsWithClass, /\bNum\s+Waku\d+\b|\bWaku\d+\b/i)
          : findCellTextByClass(cellsWithClass, /\bWaku\d+\b/i)) ||
        getCellText(cells, mode === 'result' ? 1 : 0),
      horseNumber:
        (mode === 'result'
          ? findCellTextByClass(cellsWithClass, /\bNum\s+Txt_C\b/i)
          : findCellTextByClass(cellsWithClass, /\bUmaban\d+\b/i)) ||
        getCellText(cells, mode === 'result' ? 2 : 1),
      sexAge,
      carriedWeight:
        (mode === 'result'
          ? findCellTextByClass(cellsWithClass, /\bJockey_Info\b/i)
          : getCellText(cells, 5)) || undefined,
      jockeyName:
        findCellTextByClass(cellsWithClass, /^Jockey\b/i) ||
        getCellText(cells, mode === 'result' ? 6 : 6),
      jockeyLink,
      trainerName:
        findCellTextByClass(cellsWithClass, /^Trainer\b/i) ||
        getCellText(cells, mode === 'result' ? 13 : 7),
      trainerLink,
      odds:
        findCellTextByClass(cellsWithClass, /\bOdds\b/i) ||
        getCellText(cells, mode === 'result' ? 10 : 9),
      popularity:
        findCellTextByClass(cellsWithClass, /\bPopular_Ninki\b/i) ||
        getCellText(cells, mode === 'result' ? 9 : 10),
      bodyWeight,
      bodyWeightDiff,
      finishPosition: mode === 'result' ? findCellTextByClass(cellsWithClass, /Result_Num|\bRank\b/i) || getCellText(cells, 0) : undefined,
      goalTime: mode === 'result' ? findCellTextByClass(cellsWithClass, /\bTime\b/i) || getCellText(cells, 7) : undefined,
      margin: mode === 'result' ? getCellText(cells, 8) : undefined,
      passingOrder: mode === 'result' ? findCellTextByClass(cellsWithClass, /PassageRate/i) || getCellText(cells, 12) : undefined,
      closing3F: mode === 'result' ? getCellText(cells, 11) : undefined,
      note0: mode === 'shutuba' ? findCellTextByClass(cellsWithClass, /\bNote0\b/i) : undefined,
      note1: mode === 'shutuba' ? findCellTextByClass(cellsWithClass, /\bNote1\b/i) : undefined,
      rawColumns: cells,
    })
  })

  return horses
}

async function fetchRaceHorses(raceIdValue) {
  const resultUrl = buildRaceResultUrl(raceIdValue)
  const resultHtml = await fetchHtml(resultUrl)
  const result$ = load(resultHtml)

  const resultRows = getHorseRows(result$, 'result')
  const resultHorses = parseHorseRows(result$, resultRows, raceIdValue, 'result')
  const resultInfo = parseRaceInfo(result$, 'result')

  const shouldTryShutuba = resultHorses.length < 2
  if (!shouldTryShutuba) {
    return {
      raceId: raceIdValue,
      raceInfo: resultInfo,
      horses: resultHorses,
    }
  }

  const shutubaUrl = buildRaceShutubaUrl(raceIdValue)
  const shutubaHtml = await fetchHtml(shutubaUrl)
  const shutuba$ = load(shutubaHtml)
  const shutubaRows = getHorseRows(shutuba$, 'shutuba')
  const shutubaHorses = parseHorseRows(shutuba$, shutubaRows, raceIdValue, 'shutuba')
  const shutubaInfo = parseRaceInfo(shutuba$, 'shutuba')

  return {
    raceId: raceIdValue,
    raceInfo: shutubaHorses.length > resultHorses.length ? shutubaInfo : resultInfo,
    horses: shutubaHorses.length > resultHorses.length ? shutubaHorses : resultHorses,
  }
}

function parseHeaderMap($, rows) {
  const table = rows.first().closest('table')
  if (!table.length) {
    return []
  }

  return table
    .find('thead th')
    .map((_, th) => normalizeText($(th).text()))
    .get()
}

function findValueByHeader(headerMap, cells, patterns, fallbackIndex) {
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

function parseRaceHistory($) {
  const rows =
    $('.horse_results_box tbody tr').length > 0
      ? $('.horse_results_box tbody tr')
      : $('.db_h_race_results tbody tr')

  const headerMap = parseHeaderMap($, rows)

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
        raceName: findValueByHeader(headerMap, cells, [/レース名/, /レース/], 4),
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

function parsePedigree($) {
  const nodes = []
  const pedigreeLinks = $('.horse_pedigree_box a').length > 0 ? $('.horse_pedigree_box a') : $('.blood_table a')

  pedigreeLinks.each((_, anchor) => {
    const horseName = $(anchor).text().trim()
    const href = $(anchor).attr('href')
    if (!horseName || !href) {
      return
    }

    const link = toAbsoluteUrl('https://db.netkeiba.com/', href)
    nodes.push({
      horseName,
      link,
      horseId: extractHorseId(link) ?? undefined,
    })
  })

  return nodes
}

function parseProfile($) {
  const profile = {}
  const profileRows = $('.db_prof_table tr').length > 0 ? $('.db_prof_table tr') : $('.horse_profile_table tr')

  profileRows.each((_, row) => {
    const label = $(row).find('th').first().text().trim()
    const value = normalizeText($(row).find('td').first().text())
    if (label && value) {
      profile[label] = value
    }
  })

  if (Object.keys(profile).length === 0) {
    $('.horse_profile .data_intro p').each((index, p) => {
      const value = normalizeText($(p).text())
      if (value) {
        profile[`intro_${String(index + 1)}`] = value
      }
    })
  }

  return profile
}

function buildHorseDetailsPayload(runner, details) {
  return {
    runner,
    details,
    profileEntries: Object.entries(details.profile ?? {}),
    raceHistoryCount: details.raceHistory?.length ?? 0,
    pedigreeCount: details.pedigree?.length ?? 0,
  }
}

function toPanelRunner(horse) {
  return {
    horseId: horse.horseId,
    horse: horse.horseName,
    jockey: horse.jockeyName ?? '-',
    carriedWeight: horse.carriedWeight ?? '-',
    odds: horse.odds ?? '-',
    popularity: horse.popularity ?? '-',
    sexAge: horse.sexAge ?? '-',
    bodyWeight: horse.bodyWeight ?? '-',
    bodyWeightDiff: horse.bodyWeightDiff ?? '-',
    goalTime: horse.goalTime ?? '-',
    margin: horse.margin ?? '-',
    passingOrder: horse.passingOrder ?? '-',
    closing3F: horse.closing3F ?? '-',
    note: [horse.note0, horse.note1].filter(Boolean).join(' / ') || '-',
    trainer: horse.trainerName ?? '-',
    featured: true,
  }
}

async function fetchHorseDetails(horseId) {
  const mainUrl = buildHorseUrl(horseId)
  const resultUrl = buildHorseResultUrl(horseId)
  const pedUrl = buildHorsePedUrl(horseId)

  const [mainHtml, resultHtml, pedHtml] = await Promise.all([
    fetchHtml(mainUrl),
    fetchHtml(resultUrl),
    fetchHtml(pedUrl),
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

  return {
    horseId,
    horseName,
    profile: parseProfile(main$),
    raceHistory: parseRaceHistory(result$),
    pedigree: parsePedigree(ped$),
  }
}

const raceResult = await fetchRaceHorses(raceId)
const selectedHorse = horseIdFromEnv
  ? raceResult.horses.find((horse) => horse.horseId === horseIdFromEnv)
  : raceResult.horses[0]

if (!selectedHorse) {
  throw new Error(
    horseIdFromEnv
      ? `Horse ${horseIdFromEnv} was not found in race ${raceId}`
      : `No horses parsed for race ${raceId}`,
  )
}

const runner = toPanelRunner(selectedHorse)
const details = await fetchHorseDetails(selectedHorse.horseId)
const panelPayload = buildHorseDetailsPayload(runner, details)

console.log('raceId:', raceId)
console.log('selected horseId:', selectedHorse.horseId)
console.log('runner:')
console.log(JSON.stringify(runner, null, 2))
console.log('details:')
console.log(JSON.stringify(details, null, 2))
console.log('panel payload summary:')
console.log(JSON.stringify(panelPayload, null, 2))