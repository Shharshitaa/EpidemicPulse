// CDC (Centers for Disease Control and Prevention) Outbreak RSS adapter
// CDC public feeds frequently enforce Cloudflare bot protection (HTTP 403)
const CDC_FEED_URL = 'https://tools.cdc.gov/api/v2/resources/media/403372.rss'
const CDC_SOURCE_URL = 'https://www.cdc.gov/outbreaks/'
const REQUEST_TIMEOUT_MS = 6000

function decodeXml(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .trim()
}

function readTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'))
  return match ? decodeXml(match[1]) : ''
}

function stripMarkup(value) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function fetchCdcReports() {
  try {
    const response = await fetch(CDC_FEED_URL, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml',
        'User-Agent': 'EpidemicPulse-HealthMonitor/1.0',
      },
    })
    if (response.status === 403) {
      const err = new Error('CDC RSS endpoint returned HTTP 403 (Forbidden: Cloudflare bot mitigation active; requires registered API key/proxy)')
      err.code = 'CDC_ACCESS_RESTRICTED'
      throw err
    }
    if (!response.ok) {
      throw new Error(`CDC returned HTTP ${response.status}`)
    }
    const xml = await response.text()
    if (!/<rss[\s>]/i.test(xml)) throw new Error('CDC returned unexpected response format')
    const seen = new Set()
    const records = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)]
      .map((match) => {
        const block = match[1]
        const title = readTag(block, 'title')
        const url = readTag(block, 'link')
        const rawDate = readTag(block, 'pubDate')
        if (!title || !url) return null
        const timestamp = Date.parse(rawDate)
        return {
          id: readTag(block, 'guid') || url,
          title,
          summary: stripMarkup(readTag(block, 'description')) || null,
          url,
          publicationDate: Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString(),
          location: 'United States',
          source: 'CDC (Centers for Disease Control and Prevention)',
          sourceKey: 'cdc',
          sourceRecordId: readTag(block, 'guid') || url,
          evidenceStatus: 'source-published',
        }
      })
      .filter((record) => {
        if (!record || seen.has(record.url)) return false
        seen.add(record.url)
        return true
      })
    return {
      dataMode: 'live',
      source: 'CDC (Centers for Disease Control and Prevention)',
      sourceUrl: CDC_SOURCE_URL,
      feedUrl: CDC_FEED_URL,
      fetchedAt: new Date().toISOString(),
      records,
    }
  } catch (err) {
    if (err.code === 'CDC_ACCESS_RESTRICTED') throw err
    const error = new Error(`CDC feed access failed: ${err.message}`)
    error.code = 'CDC_UNAVAILABLE'
    throw error
  }
}

module.exports = { CDC_FEED_URL, CDC_SOURCE_URL, fetchCdcReports }
