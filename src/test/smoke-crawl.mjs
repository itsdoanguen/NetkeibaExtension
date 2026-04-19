import { load } from 'cheerio'

const URLs = {
  raceTop: 'https://race.netkeiba.com/top/',
  raceResult: 'https://race.netkeiba.com/race/result.html?race_id=202606030801',
  horseMain: 'https://db.netkeiba.com/horse/2023100463',
  horseResult: 'https://db.netkeiba.com/horse/result/2023100463/',
  horsePed: 'https://db.netkeiba.com/horse/ped/2023100463/',
}

const HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'accept-language': 'ja,en-US;q=0.9,en;q=0.8',
  referer: 'https://race.netkeiba.com/',
}

const CHALLENGE_MARKERS = ['cloudfront', 'captcha', 'challenge', 'access denied', 'forbidden', '異常']

function detectChallenge(html) {
  const lower = html.toLowerCase()
  return CHALLENGE_MARKERS.find((marker) => lower.includes(marker)) || null
}

async function fetchHtml(url) {
  const response = await fetch(url, { method: 'GET', headers: HEADERS })
  const html = await response.text()
  return { ok: response.ok, status: response.status, html }
}

async function testRaceTop() {
  const { ok, status, html } = await fetchHtml(URLs.raceTop)
  const marker = detectChallenge(html)
  const $ = load(html)
  const raceCount = $('.RaceList_DataItem a[href*="race_id="]').length
  const raceCountFallback = $('a[href*="race_id="]').length
  return {
    name: 'race-top',
    ok,
    status,
    marker,
    title: $('title').first().text().trim(),
    raceCount,
    raceCountFallback,
  }
}

async function testRaceResult() {
  const { ok, status, html } = await fetchHtml(URLs.raceResult)
  const marker = detectChallenge(html)
  const $ = load(html)
  const rows = $('.ResultTableWrap tbody tr').length
  const horseLinks = $('.Horse_Name a').length
  return {
    name: 'race-result',
    ok,
    status,
    marker,
    title: $('title').first().text().trim(),
    rows,
    horseLinks,
  }
}

async function testHorse() {
  const [main, result, ped] = await Promise.all([
    fetchHtml(URLs.horseMain),
    fetchHtml(URLs.horseResult),
    fetchHtml(URLs.horsePed),
  ])

  const marker = detectChallenge(main.html) || detectChallenge(result.html) || detectChallenge(ped.html)
  const $main = load(main.html)
  const $result = load(result.html)
  const $ped = load(ped.html)

  const historyRows =
    $result('.horse_results_box tbody tr').length ||
    $result('.db_h_race_results tbody tr').length ||
    $result('table tbody tr').length

  const pedigreeLinks = $ped('.horse_pedigree_box a').length || $ped('.blood_table a').length || $ped('a[href*="/horse/"]').length
  return {
    name: 'horse-detail',
    ok: main.ok && result.ok && ped.ok,
    status: `${main.status}/${result.status}/${ped.status}`,
    marker,
    title: $main('title').first().text().trim(),
    historyRows,
    pedigreeLinks,
  }
}

async function main() {
  const results = await Promise.all([testRaceTop(), testRaceResult(), testHorse()])

  console.log('=== Netkeiba Crawl Smoke Test ===')
  for (const result of results) {
    console.log(`\n[${result.name}]`)
    console.log(`status: ${result.status}, ok: ${result.ok}`)
    console.log(`title: ${result.title}`)
    if (result.marker) {
      console.log(`challenge marker: ${result.marker}`)
    }
    for (const [key, value] of Object.entries(result)) {
      if (!['name', 'ok', 'status', 'marker', 'title'].includes(key)) {
        console.log(`${key}: ${value}`)
      }
    }
  }

  const hasChallenge = results.some((result) => Boolean(result.marker))
  const hasNoData = results.some(
    (result) =>
      (result.name === 'race-top' && result.raceCount === 0 && result.raceCountFallback === 0) ||
      (result.name === 'race-result' && result.rows === 0) ||
      (result.name === 'horse-detail' && result.historyRows === 0 && result.pedigreeLinks === 0),
  )

  if (hasChallenge || hasNoData) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
