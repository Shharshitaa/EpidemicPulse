// GDELT (Global Database of Events, Language, and Tone) Doc 2.0 API adapter
// GDELT public query endpoint strictly rate limits automated callers (HTTP 429)
const GDELT_API_URL = 'https://api.gdeltproject.org/api/v2/doc/doc?query=outbreak%20OR%20epidemic&mode=ArtList&maxrecords=15&format=json'
const GDELT_SOURCE_URL = 'https://www.gdeltproject.org/'
const REQUEST_TIMEOUT_MS = 6000

async function fetchGdeltReports() {
  try {
    const response = await fetch(GDELT_API_URL, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Accept: 'application/json',
        'User-Agent': 'EpidemicPulse-Research/1.0',
      },
    })
    if (response.status === 429) {
      const err = new Error('GDELT API returned HTTP 429 (Rate limited: Public query quota exceeded; direct automated polling restricted)')
      err.code = 'GDELT_RATE_LIMITED'
      throw err
    }
    if (!response.ok) {
      throw new Error(`GDELT returned HTTP ${response.status}`)
    }
    const body = await response.json().catch(() => null)
    if (!body || !Array.isArray(body.articles)) {
      throw new Error('GDELT returned unexpected JSON structure')
    }
    const records = body.articles.map((art) => ({
      id: art.url,
      title: art.title || 'Untitled outbreak dispatch',
      summary: art.seendate ? `Published ${art.seendate}` : null,
      url: art.url,
      publicationDate: art.seendate ? new Date(art.seendate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')).toISOString() : null,
      location: art.sourcecountry || null,
      source: 'GDELT Project',
      sourceKey: 'gdelt',
      sourceRecordId: art.url,
      evidenceStatus: 'unverified-news',
    }))
    return {
      dataMode: 'live',
      source: 'GDELT Project',
      sourceUrl: GDELT_SOURCE_URL,
      fetchedAt: new Date().toISOString(),
      records,
    }
  } catch (err) {
    if (err.code === 'GDELT_RATE_LIMITED') throw err
    const error = new Error(`GDELT discovery access failed: ${err.message}`)
    error.code = 'GDELT_UNAVAILABLE'
    throw error
  }
}

module.exports = { GDELT_API_URL, GDELT_SOURCE_URL, fetchGdeltReports }
