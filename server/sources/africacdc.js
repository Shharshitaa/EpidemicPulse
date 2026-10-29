// Africa CDC outbreak news adapter — RSS feed
const AFRICA_CDC_FEED_URL = 'https://africacdc.org/feed/'
const AFRICA_CDC_SOURCE_URL = 'https://africacdc.org/outbreaks-and-special-reports/'
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

function isAfricaCdcUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && (url.hostname === 'africacdc.org' || url.hostname.endsWith('.africacdc.org'))
  } catch {
    return false
  }
}

// Only keep outbreak/disease-relevant posts by title keyword
const OUTBREAK_KEYWORDS = [
  'outbreak', 'disease', 'virus', 'mpox', 'ebola', 'cholera', 'dengue',
  'malaria', 'plague', 'fever', 'epidemic', 'alert', 'surveillance', 'pathogen',
  'infection', 'influenza', 'covid', 'coronavirus', 'rift valley', 'marburg',
]

function isOutbreakRelevant(title) {
  const lower = title.toLowerCase()
  return OUTBREAK_KEYWORDS.some((kw) => lower.includes(kw))
}

function normalizeItem(block) {
  const title = readTag(block, 'title')
  const rawLink = readTag(block, 'link')
  const url = isAfricaCdcUrl(rawLink) ? rawLink : null
  const rawDate = readTag(block, 'pubDate')
  if (!title || !url) return null
  if (!isOutbreakRelevant(title)) return null
  const timestamp = Date.parse(rawDate)
  return {
    id: readTag(block, 'guid') || url,
    title,
    summary: stripMarkup(readTag(block, 'description')) || null,
    url,
    publicationDate: Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString(),
    eventDate: null,
    retrievedAt: new Date().toISOString(),
    location: null,
    source: 'Africa CDC',
    sourceKey: 'africacdc',
    sourceRecordId: readTag(block, 'guid') || url,
    evidenceStatus: 'source-published',
  }
}

// Regex to match <item>...</item> blocks — defined once, not inline
const ITEM_RE = /<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi

async function fetchAfricaCdcReports(forceRefresh = false) {
  if (!forceRefresh && cache.payload && cache.expiresAt > Date.now()) return cache.payload
  const response = await fetch(AFRICA_CDC_FEED_URL, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
  })
  if (!response.ok) throw new Error(`Africa CDC returned HTTP ${response.status}`)
  const xml = await response.text()
  if (!/<rss[\s>]/i.test(xml)) throw new Error('Africa CDC returned an unexpected response format')

  const seen = new Set()
  // Strip the outer <item> tags to get the block content
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
    source: 'Africa CDC',
    sourceUrl: AFRICA_CDC_SOURCE_URL,
    feedUrl: AFRICA_CDC_FEED_URL,
    fetchedAt: new Date().toISOString(),
    records,
  }
  cache = { expiresAt: Date.now() + CACHE_TTL_MS, payload }
  return payload
}

module.exports = { AFRICA_CDC_FEED_URL, AFRICA_CDC_SOURCE_URL, fetchAfricaCdcReports }
