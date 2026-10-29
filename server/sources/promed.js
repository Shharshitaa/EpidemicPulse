// ProMED (Program for Monitoring Emerging Diseases) RSS adapter
// ProMED is operated by ISID and provides public outbreak reports via RSS
const PROMED_FEED_URL = 'https://promedmail.org/feed/'
const PROMED_SOURCE_URL = 'https://promedmail.org/'
const CACHE_TTL_MS = 5 * 60 * 1000
const REQUEST_TIMEOUT_MS = 8000

let cache = { expiresAt: 0, payload: null }

function decodeXml(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .trim()
}

function readTag(block, tag) {
  const re = new RegExp('<' + tag + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + tag + '>', 'i')
  const match = block.match(re)
  return match ? decodeXml(match[1]) : ''
}

function stripMarkup(value) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function isPromedUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && (url.hostname === 'promedmail.org' || url.hostname.endsWith('.promedmail.org'))
  } catch {
    return false
  }
}

function normalizeItem(block) {
  const title = readTag(block, 'title')
  const rawLink = readTag(block, 'link')
  const url = isPromedUrl(rawLink) ? rawLink : null
  const rawDate = readTag(block, 'pubDate')
  if (!title || !url) return null
  const timestamp = Date.parse(rawDate)

  // ProMED titles often follow: "DISEASE - COUNTRY: detail" or "DISEASE - COUNTRY (number)"
  // Try to extract location portion after the first dash/dash separator
  let location = null
  const dashMatch = title.match(/[–-]\s+([A-Z][A-Z ,()]+?)(?:\s*:\s*|\s*\(|\s*$)/)
  if (dashMatch) {
    location = dashMatch[1].trim()
  }

  return {
    id: readTag(block, 'guid') || url,
    title,
    summary: stripMarkup(readTag(block, 'description')).slice(0, 400) || null,
    url,
    publicationDate: Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString(),
    eventDate: null,
    retrievedAt: new Date().toISOString(),
    location,
    source: 'ProMED',
    sourceKey: 'promed',
    sourceRecordId: readTag(block, 'guid') || url,
    evidenceStatus: 'source-published',
  }
}

const ITEM_RE = /<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi

async function fetchPromedReports(forceRefresh = false) {
  if (!forceRefresh && cache.payload && cache.expiresAt > Date.now()) return cache.payload
  const response = await fetch(PROMED_FEED_URL, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
  })
  if (!response.ok) throw new Error(`ProMED returned HTTP ${response.status}`)
  const xml = await response.text()
  if (!/<rss[\s>]/i.test(xml) && !/<feed[\s>]/i.test(xml)) {
    throw new Error('ProMED returned an unexpected response format')
  }

  const seen = new Set()
  const records = [...xml.matchAll(ITEM_RE)]
    .map((match) => match[0].replace(/^<item[^>]*>/, '').replace(/<\/item>$/, ''))
    .map(normalizeItem)
    .filter((record) => {
      if (!record || seen.has(record.url)) return false
      seen.add(record.url)
      return true
    })

  const payload = {
    dataMode: 'live',
    source: 'ProMED',
    sourceUrl: PROMED_SOURCE_URL,
    feedUrl: PROMED_FEED_URL,
    fetchedAt: new Date().toISOString(),
    records,
  }
  cache = { expiresAt: Date.now() + CACHE_TTL_MS, payload }
  return payload
}

module.exports = { PROMED_FEED_URL, PROMED_SOURCE_URL, fetchPromedReports }
