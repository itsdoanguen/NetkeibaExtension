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
console.log('title:', $('title').first().text().trim())
console.log('table count:', $('table').length)
console.log('tbody rows:', $('tbody tr').length)
console.log('horse links:', $('a[href*="/horse/"]').length)
console.log('shutuba rows candidate:', $('.Shutuba_Table tbody tr').length)
console.log('race common rows candidate:', $('.RaceCommon_Table tbody tr').length)
console.log('table classes:', $('table').map((_, t) => $(t).attr('class') ?? '(none)').get().slice(0, 20))
