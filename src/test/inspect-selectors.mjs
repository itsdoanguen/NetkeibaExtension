import { load } from 'cheerio'

const urls = [
  'https://race.netkeiba.com/top/',
  'https://db.netkeiba.com/horse/2023100463',
]

for (const url of urls) {
  const response = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
      'accept-language': 'ja,en-US;q=0.9,en;q=0.8',
    },
  })

  const html = await response.text()
  const $ = load(html)

  console.log('\nURL:', url)
  console.log('status:', response.status)
  console.log('title:', $('title').first().text().trim())
  console.log('counts:', {
    RaceList_Box: $('.RaceList_Box').length,
    RaceList_Data: $('.RaceList_Data').length,
    RaceList_DataItem: $('.RaceList_DataItem').length,
    raceIdLinks: $('a[href*="race_id="]').length,
    horse_results_box: $('.horse_results_box').length,
    horse_pedigree_box: $('.horse_pedigree_box').length,
    db_h_race_results: $('.db_h_race_results').length,
    blood_table: $('.blood_table').length,
    horseProfileRows: $('.db_prof_table tr').length,
  })

  console.log('body classes:', $('body').attr('class') ?? '(none)')

  if (url.includes('/horse/')) {
    const classSet = new Set()
    $('[class]').each((_, el) => {
      const cls = $(el).attr('class')
      if (!cls) {
        return
      }
      for (const part of cls.split(/\s+/)) {
        if (part) {
          classSet.add(part)
        }
      }
    })

    const filtered = [...classSet]
      .filter((name) => /(race|result|pedigree|blood|horse|db_)/i.test(name))
      .sort()
      .slice(0, 80)

    console.log('horse candidate classes:', filtered)
    console.log('table class summary:',
      $('table')
        .map((_, table) => $(table).attr('class') ?? '(none)')
        .get()
        .slice(0, 20),
    )
    console.log('horse-related links:', $('a[href*="/horse/"]').length)
    console.log(
      'horse-related href samples:',
      $('a[href*="/horse/"]')
        .map((_, a) => $(a).attr('href'))
        .get()
        .slice(0, 30),
    )
  }
}
