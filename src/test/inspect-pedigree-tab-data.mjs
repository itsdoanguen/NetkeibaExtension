import { load } from 'cheerio'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

const raceId = process.env.RACE_ID ?? '202606030811'
const horseIdFromEnv = process.env.HORSE_ID
const horseIndex = Number.parseInt(process.env.HORSE_INDEX ?? '0', 10)
const outputFilePath = process.env.OUTPUT_JSON ?? 'e:/CODE/NetkeibaExtension/keiba-extension/src/test/output/pedigree-tab-data.json'
const unicodeEscapeInTerminal = process.env.TERMINAL_ESCAPE_UNICODE === '1'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'

function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim()
}

function toAbsoluteUrl(baseUrl, href) {
  return new URL(href, baseUrl).toString()
}

function extractHorseId(link) {
  const match = link.match(/\/horse\/([0-9a-zA-Z]+)/)
  return match?.[1] ?? null
}

function buildRaceResultUrl(id) {
  return `https://race.netkeiba.com/race/result.html?race_id=${encodeURIComponent(id)}`
}

function buildRaceShutubaUrl(id) {
  return `https://race.netkeiba.com/race/shutuba.html?race_id=${encodeURIComponent(id)}`
}

function buildHorsePedUrl(horseId) {
  return `https://db.netkeiba.com/horse/ped/${encodeURIComponent(horseId)}/`
}

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

  const buffer = await response.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  const contentType = response.headers.get('content-type') ?? ''
  const charsetFromHeader = contentType.match(/charset=([^;\s]+)/i)?.[1]?.toLowerCase()
  const probeText = new TextDecoder('utf-8').decode(bytes.subarray(0, Math.min(bytes.length, 8192)))
  const charsetFromMeta =
    probeText.match(/<meta[^>]+charset=['"]?([a-zA-Z0-9_-]+)/i)?.[1]?.toLowerCase() ??
    probeText.match(/<meta[^>]+content=['"][^'"]*charset=([^;\s'">]+)/i)?.[1]?.toLowerCase()

  const preferredEncodings = [
    charsetFromHeader,
    charsetFromMeta,
    'euc-jp',
    'shift_jis',
    'utf-8',
  ].filter(Boolean)

  for (const encoding of preferredEncodings) {
    try {
      const decoded = new TextDecoder(encoding).decode(bytes)
      if (decoded.includes('�') && encoding !== 'utf-8') {
        continue
      }
      return decoded
    } catch {
      // Ignore unsupported encoding labels and continue fallback chain.
    }
  }

  return new TextDecoder('utf-8').decode(bytes)
}

function parseRaceHorseCandidates($) {
  const rows = $('.Shutuba_Table tbody tr.HorseList, .ResultTableWrap tbody tr.HorseList, .RaceTable01.RaceCommon_Table tbody tr.HorseList')
  const horses = []
  const seenHorseIds = new Set()

  rows.each((_, row) => {
    const horseAnchor =
      $(row).find('.Horse_Name a, td.Horse_Name a, td.HorseInfo a, .HorseInfo a').first().length > 0
        ? $(row).find('.Horse_Name a, td.Horse_Name a, td.HorseInfo a, .HorseInfo a').first()
        : $(row).find('a[href*="/horse/"]').first()

    const horseName = normalizeText(horseAnchor.text())
    const href = horseAnchor.attr('href')
    if (!horseName || !href) {
      return
    }

    const horseLink = toAbsoluteUrl('https://race.netkeiba.com/', href)
    const horseId = extractHorseId(horseLink)
    if (!horseId || seenHorseIds.has(horseId)) {
      return
    }

    seenHorseIds.add(horseId)
    horses.push({ horseId, horseName, horseLink })
  })

  return horses
}

async function resolveHorseByRace(id, index) {
  const urls = [buildRaceShutubaUrl(id), buildRaceResultUrl(id)]

  for (const url of urls) {
    const html = await fetchHtml(url)
    const $ = load(html)
    const horses = parseRaceHorseCandidates($)
    if (horses.length > 0) {
      const selectedIndex = Number.isInteger(index) && index >= 0 ? index : 0
      return {
        sourceUrl: url,
        selected: horses[selectedIndex] ?? horses[0],
        total: horses.length,
      }
    }
  }

  throw new Error(`Could not resolve horse from race ${id} via shutuba/result pages.`)
}

function parsePedigree($) {
  const nodes = []
  const seenLinks = new Set()
  const pedigreeLinks = $('.horse_pedigree_box a').length > 0 ? $('.horse_pedigree_box a') : $('.blood_table a')

  pedigreeLinks.each((_, anchor) => {
    const horseName = normalizeText($(anchor).text())
    const href = $(anchor).attr('href')

    if (!horseName || !href) {
      return
    }

    const link = toAbsoluteUrl('https://db.netkeiba.com/', href)
    const pathname = new URL(link).pathname
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
      horseId: extractHorseId(link) ?? undefined,
    })
  })

  return nodes
}

function buildPedigreeLevels(pedigree = []) {
  if (!Array.isArray(pedigree) || pedigree.length === 0) {
    return []
  }

  const levelSizes = [1, 2, 4, 8]
  const levelLabels = ['第1世代', '第2世代', '第3世代', '第4世代']
  const roleByLevel = [
    ['対象馬'],
    ['父', '母'],
    ['父父', '父母', '母父', '母母'],
    ['父父父', '父父母', '父母父', '父母母', '母父父', '母父母', '母母父', '母母母'],
  ]
  let cursor = 0

  return levelSizes
    .map((size, index) => {
      const entries = pedigree.slice(cursor, cursor + size).map((node, entryIndex) => ({
        role: roleByLevel[index]?.[entryIndex] ?? `Line ${entryIndex + 1}`,
        name: node.horseName,
        key: node.link ?? `${levelLabels[index]}-${entryIndex}-${node.horseId ?? node.horseName}`,
      }))
      cursor += size

      return {
        generation: levelLabels[index],
        entries,
      }
    })
    .filter((level) => level.entries.length > 0)
}

function getPedigreeBranch(role) {
  if (role === '対象馬') {
    return 'self'
  }
  return role.startsWith('父') ? 'sire' : 'dam'
}

function getFourthGenerationBranch(role) {
  if (role.length < 3) {
    return ''
  }

  const group = role.slice(0, 2)
  if (group === '父父') {
    return 'sire-sire'
  }
  if (group === '父母') {
    return 'sire-dam'
  }
  if (group === '母父') {
    return 'dam-sire'
  }
  if (group === '母母') {
    return 'dam-dam'
  }
  return ''
}

function buildPanelPedigreeSnapshot(rawPedigreeNodes) {
  const pedigreeLevels = buildPedigreeLevels(rawPedigreeNodes)

  const renderedEntries = pedigreeLevels.flatMap((level) =>
    level.entries.map((entry) => {
      const branch = getPedigreeBranch(entry.role)
      const detailBranch = getFourthGenerationBranch(entry.role)
      const isThirdGeneration = level.generation === '第3世代'
      const className = `pedigree-card pedigree-card-${branch}${
        detailBranch ? ` pedigree-card-${detailBranch}` : ''
      }${
        isThirdGeneration && (branch === 'sire' || branch === 'dam')
          ? ` pedigree-card-gen3 pedigree-card-gen3-${branch}`
          : ''
      }`

      return {
        generation: level.generation,
        role: entry.role,
        name: entry.name,
        branch,
        detailBranch,
        className,
      }
    }),
  )

  return {
    rawPedigreeNodes,
    pedigreeLevels,
    renderedEntries,
  }
}

function toUnicodeEscaped(value) {
  return value.replace(/[\u007F-\uFFFF]/g, (char) => {
    const hex = char.codePointAt(0).toString(16).padStart(4, '0')
    return `\\u${hex}`
  })
}

function printJsonBlock(title, data) {
  console.log(`\n--- ${title} ---`)
  const json = JSON.stringify(data, null, 2)
  if (unicodeEscapeInTerminal) {
    console.log(toUnicodeEscaped(json))
    return
  }
  console.log(json)
}

const resolvedHorse = horseIdFromEnv
  ? { selected: { horseId: horseIdFromEnv, horseName: undefined }, sourceUrl: 'HORSE_ID env', total: undefined }
  : await resolveHorseByRace(raceId, horseIndex)

const horseId = resolvedHorse.selected.horseId
const pedUrl = buildHorsePedUrl(horseId)
const pedHtml = await fetchHtml(pedUrl)
const ped$ = load(pedHtml)
const rawPedigreeNodes = parsePedigree(ped$)
const snapshot = buildPanelPedigreeSnapshot(rawPedigreeNodes)

const allRoles = snapshot.renderedEntries.map((entry) => entry.role)
const expectedRolePrefixes = ['対象馬', '父', '母']
const hasExpectedRoleStyle = allRoles.some((role) => expectedRolePrefixes.some((prefix) => role.startsWith(prefix)))

const report = {
  input: {
    raceId,
    horseId,
    horseName: resolvedHorse.selected.horseName,
    sourceUrl: resolvedHorse.sourceUrl,
    raceHorseCount: resolvedHorse.total,
    pedUrl,
  },
  summary: {
    rawPedigreeNodeCount: snapshot.rawPedigreeNodes.length,
    levelCount: snapshot.pedigreeLevels.length,
    renderedEntryCount: snapshot.renderedEntries.length,
    hasExpectedRoleStyle,
    unicodeEscapeInTerminal,
  },
  sections: {
    rawPedigreeNodes: snapshot.rawPedigreeNodes,
    pedigreeLevels: snapshot.pedigreeLevels,
    renderedEntries: snapshot.renderedEntries,
  },
}

await mkdir(dirname(outputFilePath), { recursive: true })
await writeFile(outputFilePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

console.log('=== HorseDetailsPanel pedigree tab data inspection ===')
console.log(`UTF-8 report file: ${outputFilePath}`)
if (unicodeEscapeInTerminal) {
  console.log('Terminal mode: Unicode escaped (safe for cp1252/cp437 terminals)')
} else {
  console.log('Terminal mode: Raw UTF-8 (may be garbled if terminal code page/font is incompatible)')
  console.log('Tip: set TERMINAL_ESCAPE_UNICODE=1 to force readable escaped output in terminal.')
}

printJsonBlock('Summary', report)
printJsonBlock('RAW details.pedigree (exact source for tab)', snapshot.rawPedigreeNodes)
printJsonBlock('After buildPedigreeLevels (tab-level input)', snapshot.pedigreeLevels)
printJsonBlock('Final mapped entries used by render loop (branch + classes)', snapshot.renderedEntries)

if (!hasExpectedRoleStyle) {
  console.log('\n[notice] role values are currently ID-based (for example: "ID 2018105027").')
  console.log('[notice] getPedigreeBranch/getFourthGenerationBranch are name-prefix based (対象馬/父/母/父父...).')
  console.log('[notice] this means most entries will be classified as dam in current component logic.')
}