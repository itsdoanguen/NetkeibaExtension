export function parseOddsFromHtml(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const title = doc.querySelector('title')?.textContent?.trim() || 'Unknown race'

  return {
    title,
    rows: [],
    updatedAt: Date.now(),
  }
}
