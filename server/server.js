const express = require('express')
const cors = require('cors')
const { ECDC_SOURCE_URL, fetchEcdcReports } = require('./sources/ecdc')
const { AFRICA_CDC_SOURCE_URL, fetchAfricaCdcReports } = require('./sources/africacdc')
const { PROMED_SOURCE_URL, fetchPromedReports } = require('./sources/promed')
const { CDC_SOURCE_URL, fetchCdcReports } = require('./sources/cdc')
const { GDELT_SOURCE_URL, fetchGdeltReports } = require('./sources/gdelt')
const { IDSP_SOURCE_URL, fetchIdspReports } = require('./sources/idsp')
const { runSourceAdapter } = require('./sources')
const { correlateEvents } = require('./correlator')

const app = express()
const PORT = Number(process.env.PORT) || 5000
const WHO_API_URL = 'https://www.who.int/api/default/diseaseoutbreaknews?$top=20&$orderby=PublicationDate%20desc'
const WHO_SOURCE_URL = 'https://www.who.int/emergencies/disease-outbreak-news'
const CACHE_TTL_MS = 5 * 60 * 1000
const REQUEST_TIMEOUT_MS = 8000

// Caches
let reportCache = { expiresAt: 0, payload: null }
let eventsCache = { expiresAt: 0, payload: null }

const sourceAdapters = [
  { key: 'who', name: 'WHO Disease Outbreak News', sourceUrl: WHO_SOURCE_URL, fetch: fetchReports },
  { key: 'ecdc', name: 'European Centre for Disease Prevention and Control', sourceUrl: ECDC_SOURCE_URL, fetch: fetchEcdcReports },
  { key: 'africacdc', name: 'Africa CDC', sourceUrl: AFRICA_CDC_SOURCE_URL, fetch: fetchAfricaCdcReports },
  { key: 'promed', name: 'ProMED', sourceUrl: PROMED_SOURCE_URL, fetch: fetchPromedReports },
  { key: 'cdc', name: 'CDC Outbreak Notices', sourceUrl: CDC_SOURCE_URL, fetch: fetchCdcReports },
  { key: 'gdelt', name: 'GDELT Global News Discovery', sourceUrl: GDELT_SOURCE_URL, fetch: fetchGdeltReports },
  { key: 'idsp', name: 'India NCDC / IDSP Surveillance', sourceUrl: IDSP_SOURCE_URL, fetch: fetchIdspReports },
]

app.use(cors())
app.use(express.json())

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function normalizeWhoReport(item) {
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
    sourceKey: 'who',
    retrievedAt: new Date().toISOString(),
    evidenceStatus: 'source-published',
    summary: null,
  }
}

// ── WHO fetch ────────────────────────────────────────────────────────────────

async function fetchReports(forceRefresh = false) {
  if (!forceRefresh && reportCache.payload && reportCache.expiresAt > Date.now()) return reportCache.payload

  const response = await fetch(WHO_API_URL, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`WHO returned HTTP ${response.status}`)
  const body = await response.json()
  const items = Array.isArray(body) ? body : body && Array.isArray(body.value) ? body.value : null
  if (!items) throw new Error('WHO returned an unexpected response format')

  const seen = new Set()
  const reports = items.map(normalizeWhoReport).filter((report) => {
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

// ── All-sources fetch ────────────────────────────────────────────────────────

async function fetchAllSources(forceRefresh = false) {
  const results = await Promise.allSettled(
    sourceAdapters.map((adapter) => runSourceAdapter(adapter, forceRefresh))
  )
  return results.map((result, idx) => {
    if (result.status === 'fulfilled') return result.value
    const adapter = sourceAdapters[idx]
    return {
      key: adapter.key,
      source: adapter.name,
      sourceUrl: adapter.sourceUrl,
      dataMode: 'unavailable',
      status: 'unavailable',
      fetchedAt: new Date().toISOString(),
      records: [],
      error: { code: `${adapter.key.toUpperCase()}_SOURCE_UNAVAILABLE`, message: result.reason?.message || 'Adapter failed' },
    }
  })
}

// ── Shared events handler ────────────────────────────────────────────────────

async function handleEvents(forceRefresh = false) {
  if (!forceRefresh && eventsCache.payload && eventsCache.expiresAt > Date.now()) {
    return eventsCache.payload
  }

  const sources = await fetchAllSources(forceRefresh)
  const availableCount = sources.filter((s) => s.status === 'available').length

  const allRecords = sources.flatMap((s) =>
    s.records.map((r) => ({
      ...r,
      sourceKey: s.key,
      sourceName: s.source,
    }))
  )

  const events = correlateEvents(allRecords)

  const payload = {
    schemaVersion: '1.0',
    dataMode: availableCount > 0 ? (availableCount === sources.length ? 'live' : 'partial') : 'unavailable',
    fetchedAt: new Date().toISOString(),
    totalEvents: events.length,
    sourcesSummary: sources.map((s) => ({
      key: s.key,
      source: s.source,
      status: s.status,
      recordCount: s.records.length,
      fetchedAt: s.fetchedAt,
      error: s.error || null,
    })),
    events,
    methodology: [
      'Events are grouped by matching disease keyword and country/region extracted from report titles.',
      'Corroboration level reflects whether two or more independent sources report the same event.',
      'Near-duplicate titles across sources are flagged as potentially syndicated.',
      'Events with only one source are labelled single-source.',
      'No case counts, severity estimates, or outbreak declarations are generated automatically.',
      'Location coordinates are country-centroid approximations derived from text, not precise incident locations.',
    ],
  }

  eventsCache = { expiresAt: Date.now() + CACHE_TTL_MS, payload }
  return payload
}

// ── Routes ───────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({ message: 'EpidemicPulse API is running' })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', project: 'EpidemicPulse' })
})

// Legacy / compatibility WHO reports endpoint
app.get('/api/reports', async (req, res) => {
  try {
    const payload = await fetchReports(parseRefreshFlag(req.query.refresh))
    res.status(200).json(payload)
  } catch (error) {
    const payload = unavailableResponse(error)
    res.status(error.statusCode || 503).json(payload)
  }
})

// Sources status endpoint
app.get('/api/sources', async (req, res) => {
  try {
    const forceRefresh = parseRefreshFlag(req.query.refresh)
    const sources = await fetchAllSources(forceRefresh)
    const availableCount = sources.filter((s) => s.status === 'available').length
    res.status(200).json({
      schemaVersion: '1.0',
      dataMode: availableCount === sources.length ? 'live' : availableCount ? 'partial' : 'unavailable',
      fetchedAt: new Date().toISOString(),
      sources,
    })
  } catch (error) {
    res.status(error.statusCode || 400).json({
      schemaVersion: '1.0',
      dataMode: 'unavailable',
      fetchedAt: new Date().toISOString(),
      sources: [],
      error: { code: 'SOURCE_REQUEST_INVALID', message: error.message },
    })
  }
})

// Dashboard endpoint (schema 2.0 with embedded events for full backward compatibility)
app.get('/api/dashboard', async (req, res) => {
  try {
    const forceRefresh = parseRefreshFlag(req.query.refresh)
    const [whoPayload, eventsData] = await Promise.allSettled([
      fetchReports(forceRefresh),
      handleEvents(forceRefresh),
    ])

    const payload = whoPayload.status === 'fulfilled' ? whoPayload.value : null
    const eventsPayload = eventsData.status === 'fulfilled' ? eventsData.value : null
    const events = eventsPayload?.events || []

    if (!payload) {
      throw whoPayload.reason || new Error('WHO source unavailable')
    }

    res.status(200).json({
      schemaVersion: '2.0',
      dataMode: payload.dataMode,
      source: payload.source,
      sourceUrl: payload.sourceUrl,
      fetchedAt: payload.fetchedAt,
      summary: {
        retrievedPublications: payload.reports.length,
        sourceStatus: 'live',
        dataFreshness: payload.fetchedAt,
        corroboratedEventsCount: events.filter((e) => e.corroborationLevel === 'independent').length,
      },
      trend: null,
      locations: [],
      reports: payload.reports,
      events,
      alerts: events, // backward compatibility
      limitations: [
        'Publication volume is not a case count or disease-incidence measure.',
        'Location is shown only when supported by the source response.',
        'Correlated events represent automated keyword/country groupings, not verified clinical diagnoses.',
      ],
    })
  } catch (error) {
    const payload = unavailableResponse(error)
    res.status(error.statusCode || 503).json({
      schemaVersion: '2.0',
      ...payload,
      summary: { retrievedPublications: 0, sourceStatus: 'unavailable', dataFreshness: null, corroboratedEventsCount: 0 },
      trend: null,
      locations: [],
      reports: [],
      events: [],
      alerts: [],
      limitations: ['WHO data could not be retrieved.'],
    })
  }
})

// Multi-source intelligence feed
app.get('/api/intelligence', async (req, res) => {
  try {
    const forceRefresh = parseRefreshFlag(req.query.refresh)
    const sources = await fetchAllSources(forceRefresh)
    const availableCount = sources.filter((s) => s.status === 'available').length

    const allRecords = sources.flatMap((s) =>
      s.records.map((r) => ({
        ...r,
        sourceKey: s.key,
        sourceName: s.source,
        sourceUrl: s.sourceUrl,
      }))
    )

    allRecords.sort((a, b) => Date.parse(b.publicationDate || '') - Date.parse(a.publicationDate || ''))

    res.status(200).json({
      schemaVersion: '1.0',
      dataMode: availableCount > 0 ? (availableCount === sources.length ? 'live' : 'partial') : 'unavailable',
      fetchedAt: new Date().toISOString(),
      totalRecords: allRecords.length,
      sources: sources.map((s) => ({
        key: s.key,
        source: s.source,
        sourceUrl: s.sourceUrl,
        status: s.status,
        recordCount: s.records.length,
        fetchedAt: s.fetchedAt,
        error: s.error || null,
      })),
      records: allRecords,
      limitations: [
        'Record counts are not case counts or epidemiological measures.',
        'Publication volume from any source does not indicate severity or outbreak status.',
        'Location is derived from text when not provided by the source; precision is limited.',
      ],
    })
  } catch (error) {
    res.status(error.statusCode || 400).json({
      schemaVersion: '1.0',
      dataMode: 'unavailable',
      fetchedAt: new Date().toISOString(),
      totalRecords: 0,
      sources: [],
      records: [],
      error: { code: 'INTELLIGENCE_REQUEST_FAILED', message: error.message },
      limitations: [],
    })
  }
})

// Correlated outbreak events endpoint (+ aliases for /api/alerts and /api/investigations)
async function eventsRouteHandler(req, res) {
  try {
    const forceRefresh = parseRefreshFlag(req.query.refresh)
    const payload = await handleEvents(forceRefresh)
    res.status(200).json(payload)
  } catch (error) {
    res.status(error.statusCode || 400).json({
      schemaVersion: '1.0',
      dataMode: 'unavailable',
      fetchedAt: new Date().toISOString(),
      totalEvents: 0,
      sourcesSummary: [],
      events: [],
      error: { code: 'EVENTS_REQUEST_FAILED', message: error.message },
      methodology: [],
    })
  }
}

app.get('/api/events', eventsRouteHandler)
app.get('/api/events/', eventsRouteHandler)
app.get('/api/alerts', eventsRouteHandler)
app.get('/api/alerts/', eventsRouteHandler)
app.get('/api/investigations', eventsRouteHandler)
app.get('/api/investigations/', eventsRouteHandler)

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`EpidemicPulse API running on http://localhost:${PORT}`)
    console.log(`Configured source adapters: ${sourceAdapters.map((a) => a.key).join(', ')}`)
  })
}

module.exports = app
