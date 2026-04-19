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

const horseAnchors = $('a[href*="/horse/"]')
console.log('horse anchors total:', horseAnchors.length)

horseAnchors.slice(0, 40).each((i, a) => {
  const href = $(a).attr('href')
  const text = $(a).text().replace(/\s+/g, ' ').trim()
  const parent = $(a).parent()
  const parentClass = parent.attr('class') ?? ''
  const grandParentClass = parent.parent().attr('class') ?? ''
  const trClass = $(a).closest('tr').attr('class') ?? ''
  const tableClass = $(a).closest('table').attr('class') ?? ''

  console.log('---')
  console.log('index:', i)
  console.log('href:', href)
  console.log('text:', text)
  console.log('parentClass:', parentClass)
  console.log('grandParentClass:', grandParentClass)
  console.log('trClass:', trClass)
  console.log('tableClass:', tableClass)
})
