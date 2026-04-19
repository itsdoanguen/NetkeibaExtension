import { load } from 'cheerio'

const url = 'https://race.netkeiba.com/race/shutuba.html?race_id=202606030811'
const response = await fetch(url, {
  headers: {
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    'accept-language': 'ja,en-US;q=0.9,en;q=0.8',
  },
})
const html = await response.text()
const $ = load(html)
const rows = $('.Shutuba_Table tbody tr')
console.log('rows', rows.length)
rows.slice(0, 5).each((i, row) => {
  const cells = $(row)
    .find('td')
    .map((_, td) => $(td).text().replace(/\s+/g, ' ').trim())
    .get()
  const horseAnchor = $(row).find('.HorseInfo a, .Horse_Name a, a[href*="/horse/"]').first()
  const horseHref = horseAnchor.attr('href')
  const horseText = horseAnchor.text().trim()
  const tdClasses = $(row)
    .find('td')
    .map((_, td) => $(td).attr('class') ?? '')
    .get()
  console.log('---')
  console.log('row', i)
  console.log('cells', cells)
  console.log('td classes', tdClasses)
  console.log('horse text', horseText)
  console.log('horse href', horseHref)
})
