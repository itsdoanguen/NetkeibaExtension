import { parseOddsFromHtml } from '../utils/parser.js'

const NETKEIBA_ODDS_URL = 'https://www.netkeiba.com/'

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'FETCH_ODDS') {
    return false
  }

  fetchAndParseOdds()
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) => sendResponse({ ok: false, error: String(error) }))

  return true
})

async function fetchAndParseOdds() {
  const response = await fetch(NETKEIBA_ODDS_URL, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch odds page: ${response.status}`)
  }

  const html = await response.text()
  return parseOddsFromHtml(html)
}
