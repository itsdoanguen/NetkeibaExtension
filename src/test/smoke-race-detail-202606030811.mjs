import { load } from 'cheerio'

const raceId = '202606030811'

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
      'accept-language': 'ja,en-US;q=0.9,en;q=0.8',
    },
  })
  return response.text()
}

function parseRows($, rows, mode) {
  const out = []
  rows.each((_, row) => {
    const anchor =
      $(row).find('.Horse_Name a, td.Horse_Name a, td.HorseInfo a, .HorseInfo a').first().length > 0
        ? $(row).find('.Horse_Name a, td.Horse_Name a, td.HorseInfo a, .HorseInfo a').first()
        : $(row).find('a[href*="/horse/"]').first()

    const href = anchor.attr('href')
    const name = anchor.text().trim()
    if (!href || !name) {
      return
    }

    out.push({ href, name, mode })
  })

  return out
}

const resultUrl = `https://race.netkeiba.com/race/result.html?race_id=${raceId}`
const resultHtml = await fetchHtml(resultUrl)
const result$ = load(resultHtml)
const resultRows = result$('.ResultTableWrap tbody tr').length > 0 ? result$('.ResultTableWrap tbody tr') : result$('.RaceCommon_Table tbody tr')
let horses = parseRows(result$, resultRows, 'result')

if (horses.length === 0) {
  const shutubaUrl = `https://race.netkeiba.com/race/shutuba.html?race_id=${raceId}`
  const shutubaHtml = await fetchHtml(shutubaUrl)
  const shutuba$ = load(shutubaHtml)
  const shutubaRows = shutuba$('.Shutuba_Table tbody tr').length > 0 ? shutuba$('.Shutuba_Table tbody tr') : shutuba$('.RaceTable01 tbody tr')
  horses = parseRows(shutuba$, shutubaRows, 'shutuba')
}

console.log('raceId:', raceId)
console.log('parsed horses:', horses.length)
console.log('first 5:', horses.slice(0, 5))

if (horses.length === 0) {
  process.exitCode = 1
}
