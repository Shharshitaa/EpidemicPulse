const ECDC_FEED_URL = 'https://www.ecdc.europa.eu/en/taxonomy/term/1505/feed'
const ECDC_SOURCE_URL = 'https://www.ecdc.europa.eu/en/publications-data/monitoring/weekly-threats-reports'
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
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'))
  return match ? decodeXml(match[1]) : ''
}

function stripMarkup(value) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function officialEcdcUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && (url.hostname === 'ecdc.europa.eu' || url.hostname.endsWith('.ecdc.europa.eu')) ? url.toString() : null
  } catch {
    return null
  }
}

function normalizeItem(block) {
  const title = readTag(block, 'title')
  const url = officialEcdcUrl(readTag(block, 'link'))
  const rawDate = readTag(block, 'pubDate')
  if (!title || !url) return null
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
    source: 'European Centre for Disease Prevention and Control',
    sourceKey: 'ecdc',
    sourceRecordId: readTag(block, 'guid') || url,
    evidenceStatus: 'source-published',
  }
}

async function fetchEcdcReports(forceRefresh = false) {
  if (!forceRefresh && cache.payload && cache.expiresAt > Date.now()) return cache.payload
  const response = await fetch(ECDC_FEED_URL, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), headers: { Accept: 'application/rss+xml, application/xml, text/xml' } })
  if (!response.ok) throw new Error(`ECDC returned HTTP ${response.status}`)
  const xml = await response.text()
  if (!/<rss[\s>]/i.test(xml)) throw new Error('ECDC returned an unexpected RSS response')
  const seen = new Set()
  const records = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map((match) => normalizeItem(match[1])).filter((record) => {
    if (!record || seen.has(record.url)) return false
    seen.add(record.url)
    return true
  })
  const payload = { dataMode: 'live', source: 'European Centre for Disease Prevention and Control', sourceUrl: ECDC_SOURCE_URL, feedUrl: ECDC_FEED_URL, fetchedAt: new Date().toISOString(), records }
  cache = { expiresAt: Date.now() + CACHE_TTL_MS, payload }
  return payload
}

module.exports = { ECDC_FEED_URL, ECDC_SOURCE_URL, fetchEcdcReports }
