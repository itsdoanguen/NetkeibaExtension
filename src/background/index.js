import { parseOddsFromHtml } from '../utils/parser.js'

const NETKEIBA_ODDS_URL = 'https://www.netkeiba.com/'

async function enableSidePanelOnActionClick() {
  if (!chrome.sidePanel?.setPanelBehavior) {
    return
  }

  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  } catch (error) {
    console.error('Failed to configure side panel behavior:', error)
  }
}

chrome.runtime.onInstalled.addListener(() => {
  enableSidePanelOnActionClick()
})

chrome.runtime.onStartup.addListener(() => {
  enableSidePanelOnActionClick()
})

enableSidePanelOnActionClick()

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
