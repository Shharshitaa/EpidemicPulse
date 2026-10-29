const express = require('express')
const cors = require('cors')

const app = express()
const PORT = Number(process.env.PORT) || 5000
const WHO_API_URL = 'https://www.who.int/api/default/diseaseoutbreaknews?$top=20&$orderby=PublicationDate%20desc'
const WHO_SOURCE_URL = 'https://www.who.int/emergencies/disease-outbreak-news'
const CACHE_TTL_MS = 5 * 60 * 1000
const REQUEST_TIMEOUT_MS = 8000

let reportCache = { expiresAt: 0, payload: null }

app.use(cors())
app.use(express.json())

function parseRefreshFlag(value) {
  if (value === undefined) return false
  if (value !== '1' && value !== 'true' && value !== '0' && value !== 'false') {
    const error = new Error('refresh must be true or false')
    error.statusCode = 400
    throw error
  }
  return value === '1' || value === 'true'
}

function toOfficialUrl(item) {
  const slug = typeof item.UrlName === 'string' ? item.UrlName.trim().replace(/^\/+/, '') : ''
  if (!slug || !/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(slug)) return null
  return `https://www.who.int/emergencies/disease-outbreak-news/item/${slug}`
}

function normalizeReport(item) {
  if (!item || typeof item !== 'object') return null
  const title = typeof item.Title === 'string' ? item.Title.trim() : ''
  const url = toOfficialUrl(item)
  if (!title || !url) return null
  const rawDate = item.PublicationDate || item.PublicationDateAndTime
  const publicationDate = rawDate && !Number.isNaN(Date.parse(rawDate)) ? new Date(rawDate).toISOString() : null
  return {
    id: typeof item.DonId === 'string' && item.DonId.trim() ? item.DonId.trim() : item.UrlName,
    title,
    url,
    publicationDate,
    location: null,
    source: 'WHO Disease Outbreak News',
  }
}

async function fetchReports(forceRefresh = false) {
  if (!forceRefresh && reportCache.payload && reportCache.expiresAt > Date.now()) return reportCache.payload

  const response = await fetch(WHO_API_URL, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`WHO returned HTTP ${response.status}`)
  const body = await response.json()
  const items = Array.isArray(body) ? body : body && Array.isArray(body.value) ? body.value : null
  if (!items) throw new Error('WHO returned an unexpected response format')

  const seen = new Set()
  const reports = items.map(normalizeReport).filter((report) => {
    if (!report || seen.has(report.url)) return false
    seen.add(report.url)
    return true
  })
  const payload = { dataMode: 'live', source: 'WHO Disease Outbreak News', sourceUrl: WHO_SOURCE_URL, fetchedAt: new Date().toISOString(), reports }
  reportCache = { expiresAt: Date.now() + CACHE_TTL_MS, payload }
  return payload
}

function unavailableResponse(error) {
  return {
    dataMode: 'unavailable',
    source: 'WHO Disease Outbreak News',
    sourceUrl: WHO_SOURCE_URL,
    fetchedAt: new Date().toISOString(),
    reports: [],
    error: { code: 'WHO_SOURCE_UNAVAILABLE', message: error instanceof Error ? error.message : 'WHO data is unavailable' },
  }
}

app.get('/', (req, res) => {
  res.json({ message: 'EpidemicPulse API is running' })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', project: 'EpidemicPulse' })
})

app.get('/api/reports', async (req, res) => {
  try {
    const payload = await fetchReports(parseRefreshFlag(req.query.refresh))
    res.status(200).json(payload)
  } catch (error) {
    const payload = unavailableResponse(error)
    res.status(error.statusCode || 503).json(payload)
  }
})

app.get('/api/dashboard', async (req, res) => {
  try {
    const payload = await fetchReports(parseRefreshFlag(req.query.refresh))
    res.status(200).json({
      schemaVersion: '2.0',
      dataMode: payload.dataMode,
      source: payload.source,
      sourceUrl: payload.sourceUrl,
      fetchedAt: payload.fetchedAt,
      summary: { retrievedPublications: payload.reports.length, sourceStatus: 'live', dataFreshness: payload.fetchedAt },
      trend: null,
      locations: [],
      reports: payload.reports,
      alerts: [],
      limitations: ['Publication volume is not a case count or disease-incidence measure.', 'Location is shown only when supported by the source response.'],
    })
  } catch (error) {
    const payload = unavailableResponse(error)
    res.status(error.statusCode || 503).json({ schemaVersion: '2.0', ...payload, summary: { retrievedPublications: 0, sourceStatus: 'unavailable', dataFreshness: null }, trend: null, locations: [], alerts: [], limitations: ['WHO data could not be retrieved.'] })
  }
})

app.listen(PORT, () => {
  console.log(`EpidemicPulse API running on http://localhost:${PORT}`)
})
