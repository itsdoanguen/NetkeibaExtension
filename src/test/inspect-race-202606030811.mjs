import { load } from 'cheerio'

const url = 'https://race.netkeiba.com/race/result.html?race_id=202606030811'
const response = await fetch(url, {
  headers: {
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    'accept-language': 'ja,en-US;q=0.9,en;q=0.8',
  },
})

const html = await response.text()
const $ = load(html)
const rows = $('.ResultTableWrap tbody tr')

console.log('title:', $('title').first().text().trim())
console.log('rows:', rows.length)
console.log('selector counts:', {
  ResultTableWrap: $('.ResultTableWrap').length,
  result_table_02: $('.result_table_02').length,
  race_table_01: $('.RaceTable01').length,
  race_table_01_rows: $('.RaceTable01 tbody tr').length,
  anyTable: $('table').length,
  anyTbodyRows: $('tbody tr').length,
  horseHref: $('a[href*="/horse/"]').length,
  horseIdQuery: $('a[href*="horse_id"]').length,
})

const tableClasses = $('table')
  .map((_, table) => $(table).attr('class') ?? '(none)')
  .get()
  .slice(0, 20)
console.log('table classes:', tableClasses)

const hasRaceIdScript = html.includes('race_id')
const hasHorsePath = html.includes('/horse/')
console.log('html markers:', { hasRaceIdScript, hasHorsePath })

$('.RaceCommon_Table').each((tableIndex, table) => {
  const rowsInTable = $(table).find('tbody tr')
  console.log(`table[${tableIndex}] rowCount:`, rowsInTable.length)
  rowsInTable.slice(0, 5).each((rowIndex, row) => {
    const rowText = $(row).text().replace(/\s+/g, ' ').trim().slice(0, 120)
    const horseLinks = $(row)
      .find('a[href*="/horse/"]')
      .map((_, a) => $(a).attr('href'))
      .get()
    const classes = $(row)
      .find('[class]')
      .map((_, e) => $(e).attr('class'))
      .get()
      .slice(0, 12)

    console.log(`  row[${rowIndex}] text:`, rowText)
    console.log(`  row[${rowIndex}] horseLinks:`, horseLinks)
    console.log(`  row[${rowIndex}] classes:`, classes)
  })
})

rows.slice(0, 8).each((index, row) => {
  const rowClass = $(row).attr('class') ?? ''
  const horseNameClass = $(row).find('.Horse_Name a, td.Horse_Name a').first().text().trim()
  const horseNameAny = $(row)
    .find('a[href*="/horse/"]')
    .first()
    .text()
    .trim()

  const horseLinks = $(row)
    .find('a[href*="/horse/"]')
    .map((_, anchor) => $(anchor).attr('href'))
    .get()

  const classList = $(row)
    .find('[class]')
    .map((_, el) => $(el).attr('class'))
    .get()

  console.log('---')
  console.log('row index:', index)
  console.log('row class:', rowClass)
  console.log('horseName via .Horse_Name:', horseNameClass)
  console.log('horseName via any /horse/ link:', horseNameAny)
  console.log('horse links:', horseLinks)
  console.log('child classes sample:', classList.slice(0, 12))
})
