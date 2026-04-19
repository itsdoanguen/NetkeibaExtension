const DEFAULT_HEADERS: HeadersInit = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'ja,en-US;q=0.9,en;q=0.8',
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchHtml(url: string, delayMs = 0): Promise<string> {
  if (delayMs > 0) {
    await sleep(delayMs)
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
    credentials: 'omit',
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText} for ${url}`)
  }

  return response.text()
}

export function toAbsoluteUrl(baseUrl: string, maybeRelativeUrl: string): string {
  return new URL(maybeRelativeUrl, baseUrl).toString()
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  initialDelayMs = 400,
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === retries) {
        break
      }
      await sleep(initialDelayMs * (attempt + 1))
    }
  }

  throw lastError
}
