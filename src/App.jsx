import { useCallback, useEffect, useState } from 'react'
import { CircleMarker, MapContainer, Pane, Popup, TileLayer } from 'react-leaflet'
import './App.css'
import 'leaflet/dist/leaflet.css'
import RedesignedLandingPage from './components/LandingPage'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const DASHBOARD_ENDPOINT = `${API_BASE_URL}/api/dashboard`
const SOURCES_ENDPOINT = `${API_BASE_URL}/api/sources`
const INTELLIGENCE_ENDPOINT = `${API_BASE_URL}/api/intelligence`
const EVENTS_ENDPOINT = `${API_BASE_URL}/api/events`
const DOSSIER_CHECKLIST_STORAGE_KEY = 'epidemicpulse:dossier-checklists:v1'

const DEFAULT_DOSSIER_TASKS = [
  { id: 't1', label: 'Review primary bulletin and confirm official agency URL', done: true },
  { id: 't2', label: 'Cross-reference national Ministry of Health official situation portal', done: false },
  { id: 't3', label: 'Reconcile conflicting case figures, dates, or regional spellings', done: false },
  { id: 't4', label: 'Verify laboratory confirmation status (RT-PCR / genomic sequencing)', done: false },
]

function readDossierChecklist(eventId) {
  const defaults = DEFAULT_DOSSIER_TASKS.map((task) => ({ ...task }))
  if (typeof window === 'undefined') return defaults

  try {
    const stored = JSON.parse(window.localStorage.getItem(DOSSIER_CHECKLIST_STORAGE_KEY) || '{}')
    const saved = stored && !Array.isArray(stored) && stored[eventId] && typeof stored[eventId] === 'object'
      ? stored[eventId]
      : {}
    return defaults.map((task) => ({
      ...task,
      done: Object.prototype.hasOwnProperty.call(saved, task.id) ? saved[task.id] === true : task.done,
    }))
  } catch {
    return defaults
  }
}

function persistDossierChecklist(eventId, tasks) {
  if (typeof window === 'undefined') return

  try {
    const stored = JSON.parse(window.localStorage.getItem(DOSSIER_CHECKLIST_STORAGE_KEY) || '{}')
    const next = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}
    next[eventId] = Object.fromEntries(tasks.map((task) => [task.id, task.done === true]))
    window.localStorage.setItem(DOSSIER_CHECKLIST_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Keep the dossier usable when browser storage is unavailable or full.
  }
}

// ── Navigation Configuration ──────────────────────────────────────────────────
const navigation = [
  { label: 'Overview', icon: '◈', tag: 'DASHBOARD', group: 'SURVEILLANCE' },
  { label: 'Live Intelligence', icon: '◉', tag: 'FEED', group: 'SURVEILLANCE' },
  { label: 'Signal Monitoring', icon: '⌁', tag: 'MAP', group: 'SURVEILLANCE' },
  { label: 'Alerts & Investigations', icon: '!', tag: 'WORKSPACE', group: 'ANALYSIS' },
  { label: 'Simulation Lab', icon: '◇', tag: 'SANDBOX', group: 'ANALYSIS' },
  { label: 'Source Status', icon: '⎔', tag: 'ADAPTERS', group: 'SYSTEM' },
  { label: 'About', icon: 'i', tag: 'DOCS', group: 'SYSTEM' },
]

const pageRoutes = Object.fromEntries(navigation.map(({ label }) => [label, label.toLowerCase().replace(/[^a-z]+/g, '-')]))
const routePages = Object.fromEntries(Object.entries(pageRoutes).map(([label, slug]) => [slug, label]))

function readRoute() {
  if (typeof window === 'undefined') return { type: 'landing', page: 'Overview' }
  if (window.location.pathname !== '/dashboard' && window.location.pathname !== '/dashboard/') return { type: 'landing', page: 'Overview' }
  const requestedPage = new URLSearchParams(window.location.search).get('view') || 'overview'
  return { type: 'dashboard', page: routePages[requestedPage] || 'Overview' }
}

// ── Pathogen & Jurisdiction Rules ─────────────────────────────────────────────
const topicRules = [
  { label: 'Respiratory', keywords: ['respiratory', 'pneumonia', 'influenza', 'coronavirus', 'covid', 'mers', 'avian influenza', 'bird flu', 'h5n1', 'h7n9'] },
  { label: 'Viral Hemorrhagic', keywords: ['ebola', 'marburg', 'lassa', 'rift valley', 'crimean-congo', 'hemorrhagic'] },
  { label: 'Vector-Borne', keywords: ['dengue', 'malaria', 'yellow fever', 'chikungunya', 'zika', 'mosquito', 'tick'] },
  { label: 'Waterborne & Enteric', keywords: ['cholera', 'typhoid', 'shigella', 'diarrhea', 'foodborne', 'waterborne', 'salmonella'] },
  { label: 'Zoonotic & Other', keywords: ['mpox', 'monkeypox', 'nipah', 'rabies', 'plague', 'anthrax', 'hantavirus', 'polio'] },
]

const diseaseRules = [
  { label: 'Mpox', pattern: /\bmpox\b|monkeypox/i, category: 'Zoonotic' },
  { label: 'Ebola virus disease', pattern: /\bebola\b/i, category: 'Viral Hemorrhagic' },
  { label: 'Marburg virus disease', pattern: /\bmarburg\b/i, category: 'Viral Hemorrhagic' },
  { label: 'Cholera', pattern: /\bcholera\b/i, category: 'Waterborne & Enteric' },
  { label: 'Dengue', pattern: /\bdengue\b/i, category: 'Vector-Borne' },
  { label: 'Rift Valley fever', pattern: /rift valley/i, category: 'Vector-Borne' },
  { label: 'Yellow fever', pattern: /yellow fever/i, category: 'Vector-Borne' },
  { label: 'Lassa fever', pattern: /lassa/i, category: 'Viral Hemorrhagic' },
  { label: 'Nipah virus disease', pattern: /\bnipah\b/i, category: 'Zoonotic' },
  { label: 'MERS-CoV', pattern: /mers|middle east respiratory syndrome/i, category: 'Respiratory' },
  { label: 'Avian influenza', pattern: /avian influenza|bird flu|h5n1|h7n9/i, category: 'Respiratory' },
  { label: 'Plague', pattern: /\bplague\b/i, category: 'Zoonotic' },
  { label: 'Hantavirus', pattern: /\bhantavirus\b/i, category: 'Zoonotic' },
  { label: 'Meningitis', pattern: /\bmeningitis\b/i, category: 'Bacterial' },
  { label: 'Measles', pattern: /\bmeasles\b/i, category: 'Viral' },
  { label: 'Polio', pattern: /\bpolio\b|\bpoliovirus\b/i, category: 'Enteric' },
  { label: 'COVID-19', pattern: /covid-19|covid19|sars-cov-2/i, category: 'Respiratory' },
  { label: 'Pneumonia (Undetermined)', pattern: /pneumonia of undetermined|pneumonia of unknown/i, category: 'Respiratory' },
]

const countryRules = [
  { label: 'Democratic Republic of the Congo', aliases: ['democratic republic of the congo', 'drc', 'dr congo', 'congo, dem'], coordinates: [-2.5, 23.5] },
  { label: 'Kingdom of Saudi Arabia', aliases: ['kingdom of saudi arabia', 'saudi arabia'], coordinates: [23.886, 45.079] },
  { label: 'Russian Federation', aliases: ['russian federation', 'russia'], coordinates: [61.524, 105.318] },
  { label: 'Kenya', aliases: ['kenya'], coordinates: [-0.023, 37.906] },
  { label: 'Nigeria', aliases: ['nigeria'], coordinates: [9.082, 8.675] },
  { label: 'Uganda', aliases: ['uganda'], coordinates: [1.373, 32.290] },
  { label: 'India', aliases: ['india'], coordinates: [22.973, 78.656] },
  { label: 'China', aliases: ['china', "people's republic of china"], coordinates: [35.861, 104.195] },
  { label: 'Ethiopia', aliases: ['ethiopia'], coordinates: [9.145, 40.489] },
  { label: 'Tanzania', aliases: ['tanzania'], coordinates: [-6.369, 34.889] },
  { label: 'South Africa', aliases: ['south africa'], coordinates: [-30.559, 22.937] },
  { label: 'Ghana', aliases: ['ghana'], coordinates: [7.946, -1.023] },
  { label: 'Zambia', aliases: ['zambia'], coordinates: [-13.133, 27.849] },
  { label: 'Rwanda', aliases: ['rwanda'], coordinates: [-1.940, 29.874] },
  { label: 'Sudan', aliases: ['sudan'], coordinates: [12.862, 30.217] },
  { label: 'Indonesia', aliases: ['indonesia'], coordinates: [-0.789, 113.921] },
  { label: 'Philippines', aliases: ['philippines'], coordinates: [12.879, 121.774] },
  { label: 'Vietnam', aliases: ['viet nam', 'vietnam'], coordinates: [14.058, 108.277] },
  { label: 'Pakistan', aliases: ['pakistan'], coordinates: [30.375, 69.344] },
  { label: 'Bangladesh', aliases: ['bangladesh'], coordinates: [23.685, 90.356] },
  { label: 'Egypt', aliases: ['egypt'], coordinates: [26.820, 30.802] },
  { label: 'Yemen', aliases: ['yemen'], coordinates: [15.552, 48.516] },
  { label: 'Brazil', aliases: ['brazil'], coordinates: [-14.235, -51.925] },
  { label: 'Haiti', aliases: ['haiti'], coordinates: [18.971, -72.285] },
  { label: 'Colombia', aliases: ['colombia'], coordinates: [4.570, -74.297] },
  { label: 'United States', aliases: ['united states', 'usa', 'u.s.'], coordinates: [37.090, -95.712] },
]

const emptyDashboard = {
  schemaVersion: '2.0',
  dataMode: 'unavailable',
  source: 'WHO Disease Outbreak News',
  sourceUrl: 'https://www.who.int/emergencies/disease-outbreak-news',
  fetchedAt: null,
  summary: { retrievedPublications: 0, sourceStatus: 'unavailable', dataFreshness: null, corroboratedEventsCount: 0 },
  trend: null,
  locations: [],
  reports: [],
  events: [],
  alerts: [],
  limitations: [],
}

// ── Text / Domain Helpers ─────────────────────────────────────────────────────

function formatDate(value) {
  if (!value) return 'Date not provided'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date not provided' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTimestamp(value) {
  if (!value) return 'Not yet retrieved'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not yet retrieved' : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function formatRelativeTime(value) {
  if (!value) return 'Just now'
  const diff = Date.now() - new Date(value).getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

function latestPublicationDate(reports = []) {
  const timestamps = reports.map((r) => Date.parse(r.publicationDate || '')).filter((t) => !Number.isNaN(t))
  return timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null
}

function isOfficialWhoUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'www.who.int'
  } catch {
    return false
  }
}

function isValidUrl(value) {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

function extractedKeywords(title = '') {
  const lower = title.toLowerCase()
  return topicRules.filter((r) => r.keywords.some((kw) => lower.includes(kw))).map((r) => r.label)
}

function extractDisease(title = '') {
  return diseaseRules.find((r) => r.pattern.test(title))?.label || null
}

function extractCountries(report) {
  const text = [report.title, report.location].filter(Boolean).join(' ').toLowerCase()
  return countryRules.filter((c) => c.aliases.some((alias) => text.includes(alias)))
}

function buildDiseaseLocationGroups(reports) {
  const groups = new Map()
  reports.forEach((report) => {
    const disease = extractDisease(report.title)
    if (!disease) return
    extractCountries(report).forEach((country) => {
      const key = `${disease}|${country.label}`
      if (!groups.has(key)) {
        groups.set(key, { key, disease, country: country.label, coordinates: country.coordinates, reports: [], reportUrls: new Set() })
      }
      const group = groups.get(key)
      if (!group.reportUrls.has(report.url)) {
        group.reportUrls.add(report.url)
        group.reports.push(report)
      }
    })
  })
  return [...groups.values()].map((g) => ({
    key: g.key,
    disease: g.disease,
    country: g.country,
    coordinates: g.coordinates,
    reportCount: g.reports.length,
    reports: [...g.reports].sort((a, b) => Date.parse(b.publicationDate || '') - Date.parse(a.publicationDate || '')),
  }))
}

// ── Client-side Correlation Fallback ─────────────────────────────────────────
function titleFingerprint(title = '') {
  return title.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80)
}

function correlateReportsLocally(records = []) {
  const groups = new Map()
  records.forEach((r) => {
    const disease = extractDisease(r.title)
    if (!disease) return
    const countries = extractCountries(r)
    const matchedCountries = countries.length ? countries : [{ label: 'Regional / Multilateral', coordinates: null }]
    matchedCountries.forEach((c) => {
      const key = `${disease}|${c.label}`
      if (!groups.has(key)) {
        groups.set(key, { disease, country: c.label, coordinates: c.coordinates || null, records: [] })
      }
      groups.get(key).records.push(r)
    })
  })

  let idx = 0
  const events = []
  groups.forEach((group, key) => {
    idx++
    const seenUrls = new Set()
    const unique = group.records.filter((r) => {
      if (seenUrls.has(r.url)) return false
      seenUrls.add(r.url)
      return true
    })

    const sourceMap = new Map()
    unique.forEach((r) => {
      const s = r.sourceKey || r.source || 'who'
      sourceMap.set(s, (sourceMap.get(s) || 0) + 1)
    })
    const distinctSources = [...sourceMap.keys()]

    // Near-duplicate syndication check
    const fps = unique.map((r) => titleFingerprint(r.title))
    const syndicationPairs = []
    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        if (unique[i].source !== unique[j].source && fps[i] && fps[j] && (fps[i] === fps[j] || fps[i].includes(fps[j]) || fps[j].includes(fps[i]))) {
          syndicationPairs.push([unique[i].source, unique[j].source])
        }
      }
    }

    let corroborationLevel = 'single-source'
    let evidenceNote = 'Single source reporting. Awaiting independent health system corroboration.'
    if (distinctSources.length >= 2 && syndicationPairs.length === 0) {
      corroborationLevel = 'independent'
      evidenceNote = `Corroborated by ${distinctSources.length} independent surveillance systems.`
    } else if (distinctSources.length >= 2 && syndicationPairs.length > 0) {
      corroborationLevel = 'syndicated'
      evidenceNote = 'Reported by multiple systems; shared phrasing indicates probable syndicated news wire.'
    }

    const evidenceGaps = []
    if (distinctSources.length < 2) evidenceGaps.push('No secondary independent public-health authority has confirmed this event.')
    if (!group.coordinates) evidenceGaps.push('Specific coordinates not available; location inferred at national level.')
    if (unique.every((r) => !r.summary)) evidenceGaps.push('Official clinical summary text missing from feed metadata.')

    events.push({
      id: `ev-${idx}-${key.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`,
      disease: group.disease,
      country: group.country,
      coordinates: group.coordinates,
      reportCount: unique.length,
      distinctSourceCount: distinctSources.length,
      sources: distinctSources,
      corroborationLevel,
      evidenceNote,
      conflicts: [],
      evidenceGaps,
      syndicationPairs,
      latestDate: unique[0]?.publicationDate || null,
      records: unique,
    })
  })

  return events.sort((a, b) => b.distinctSourceCount - a.distinctSourceCount || b.reportCount - a.reportCount)
}

// ── Source Label & Chip Helpers ──────────────────────────────────────────────
const SOURCE_INFO = {
  who: { label: 'WHO DON', name: 'WHO Disease Outbreak News', tone: 'emerald' },
  ecdc: { label: 'ECDC', name: 'ECDC Weekly Threat Reports', tone: 'blue' },
  africacdc: { label: 'Africa CDC', name: 'Africa CDC Surveillance', tone: 'amber' },
  promed: { label: 'ProMED', name: 'ProMED Emerging Diseases', tone: 'purple' },
  cdc: { label: 'CDC Notices', name: 'CDC Outbreak Notices', tone: 'cyan' },
  gdelt: { label: 'GDELT', name: 'GDELT Global News Discovery', tone: 'rose' },
  idsp: { label: 'IDSP India', name: 'India NCDC / IDSP Surveillance', tone: 'slate' },
}

function sourceChipLabel(sourceKey, sourceName) {
  if (sourceKey && SOURCE_INFO[sourceKey]) return SOURCE_INFO[sourceKey].label
  return (sourceName || 'Unknown').slice(0, 14)
}

function SourceChip({ sourceKey, source }) {
  const key = sourceKey || (isOfficialWhoUrl(source) ? 'who' : 'who')
  return <span className={`source-chip source-chip-${key}`}>{sourceChipLabel(key, source)}</span>
}

function CorroborationBadge({ level }) {
  const config = {
    independent: { label: 'INDEPENDENTLY CORROBORATED', className: 'corr-independent', icon: '✓' },
    syndicated: { label: 'POSSIBLY SYNDICATED', className: 'corr-syndicated', icon: '⚠' },
    'single-source': { label: 'SINGLE SOURCE REPORT', className: 'corr-single', icon: '○' },
  }
  const item = config[level] || config['single-source']
  return (
    <span className={`corr-badge ${item.className}`}>
      <span className="corr-icon">{item.icon}</span> {item.label}
    </span>
  )
}

// ── Resilient Data Fetchers ──────────────────────────────────────────────────

async function fetchDashboard(forceRefresh = false) {
  const endpoint = forceRefresh ? `${DASHBOARD_ENDPOINT}?refresh=1` : DASHBOARD_ENDPOINT
  const response = await fetch(endpoint)
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(payload?.error?.message || `Dashboard request failed (${response.status})`)
  if (!payload || payload.schemaVersion !== '2.0' || !Array.isArray(payload.reports)) {
    throw new Error('Dashboard response did not match expected schema')
  }
  return payload
}

async function fetchSources(forceRefresh = false) {
  const endpoint = forceRefresh ? `${SOURCES_ENDPOINT}?refresh=1` : SOURCES_ENDPOINT
  const response = await fetch(endpoint)
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(payload?.error?.message || `Source request failed (${response.status})`)
  if (!payload || !Array.isArray(payload.sources)) {
    throw new Error('Sources response did not match expected schema')
  }
  return payload
}

async function fetchIntelligence(forceRefresh = false) {
  const endpoint = forceRefresh ? `${INTELLIGENCE_ENDPOINT}?refresh=1` : INTELLIGENCE_ENDPOINT
  const response = await fetch(endpoint)
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(payload?.error?.message || `Intelligence request failed (${response.status})`)
  return payload
}

async function fetchEvents(forceRefresh = false, fallbackRecords = []) {
  try {
    const endpoint = forceRefresh ? `${EVENTS_ENDPOINT}?refresh=1` : EVENTS_ENDPOINT
    const response = await fetch(endpoint)
    if (response.ok) {
      const payload = await response.json()
      if (payload && Array.isArray(payload.events)) return payload
    }
    const altResponse = await fetch(`${API_BASE_URL}/api/alerts`)
    if (altResponse.ok) {
      const payload = await altResponse.json()
      if (payload && Array.isArray(payload.events)) return payload
    }
  } catch (err) {
    console.warn('Events endpoint unreachable, using client correlation fallback', err)
  }

  if (fallbackRecords.length > 0) {
    const localEvents = correlateReportsLocally(fallbackRecords)
    return {
      schemaVersion: '1.0',
      dataMode: 'live',
      fetchedAt: new Date().toISOString(),
      totalEvents: localEvents.length,
      events: localEvents,
      methodology: ['Correlated client-side from available records.'],
    }
  }

  throw new Error('Events endpoint returned 404 and no local records were available for correlation.')
}

// ── Common UI Components ──────────────────────────────────────────────────────

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  )
}

function StatTile({ label, value, subtext, statusPill, tone = 'green' }) {
  return (
    <article className={`stat-tile stat-tile-${tone}`}>
      <div className="stat-tile-top">
        <span className="stat-tile-label">{label}</span>
        {statusPill && <span className={`stat-tile-pill ${tone}`}>{statusPill}</span>}
      </div>
      <div className="stat-tile-val">{value}</div>
      <div className="stat-tile-sub">{subtext}</div>
    </article>
  )
}

function Notice({ state, error, title, message }) {
  if (state === 'loading') {
    return (
      <div className="api-notice loading" role="status">
        <span className="notice-spinner" /> Connecting to verified public-health endpoints…
      </div>
    )
  }
  if (state === 'error') {
    return (
      <div className="api-notice error" role="alert">
        <strong>{title || 'SOURCE DATA UNAVAILABLE.'}</strong> {error || message || 'Upstream sources could not be reached.'}
      </div>
    )
  }
  return (
    <div className="api-notice success" role="status">
      <strong>{title || 'OPERATIONAL SURVEILLANCE.'}</strong> {message || 'Retrieved from verified public-health feeds. Publication volume does not reflect infection incidence.'}
    </div>
  )
}

function ReportCard({ report, compact = false }) {
  const urlOk = isValidUrl(report.url)
  return (
    <article className={`report-feed-card ${compact ? 'compact' : ''}`}>
      <div className="card-top-bar">
        <span className="card-pub-date">{formatDate(report.publicationDate)}</span>
        <SourceChip sourceKey={report.sourceKey} source={report.source} />
      </div>
      <h3 className="card-headline">{report.title}</h3>
      {report.summary && !compact && (
        <p className="card-summary-snippet">{report.summary.slice(0, 190)}{report.summary.length > 190 ? '…' : ''}</p>
      )}
      <div className="card-meta-bar">
        <span className="card-loc-tag">
          {report.location ? `📍 ${report.location}` : '🌐 Regional/Multilateral'}
        </span>
        {urlOk ? (
          <a className="canonical-link" href={report.url} target="_blank" rel="noreferrer">
            Primary Document <span>↗</span>
          </a>
        ) : (
          <span className="link-muted">Link unavailable</span>
        )}
      </div>
    </article>
  )
}

// ── Overview View ─────────────────────────────────────────────────────────────

function OverviewView({ reports = [], state, error, onRefresh, onExplore, sources, sourceState, events, eventsState }) {
  const latestDate = state === 'success' ? latestPublicationDate(reports) : null
  const liveCount = sources.filter((s) => s.status === 'available').length
  const independentCount = events.filter((e) => e.corroborationLevel === 'independent').length

  return (
    <div className="workspace-view">
      {/* Top Banner Ticker */}
      <div className="alert-ticker-strip">
        <span className="ticker-badge">CRITICAL SIGNALS</span>
        <div className="ticker-text">
          {events.length > 0
            ? `Active Outbreak Cluster: ${events[0].disease} (${events[0].country}) — ${events[0].reportCount} dispatches across ${events[0].distinctSourceCount} surveillance networks.`
            : 'Operational monitoring active across integrated public-health feeds.'}
        </div>
        <button className="ticker-action-btn" onClick={() => onExplore('Alerts & Investigations')}>
          Open Workspace →
        </button>
      </div>

      <Notice state={state} error={error} />

      {/* KPI Tiles Bar */}
      <section className="kpi-tiles-grid" aria-label="System Metrics">
        <StatTile
          label="MONITORED BULLETINS"
          value={state === 'success' ? reports.length : '—'}
          subtext="Source publications (not patient count)"
          statusPill="Active Ingestion"
          tone="green"
        />
        <StatTile
          label="INDEPENDENTLY CORROBORATED"
          value={eventsState === 'success' ? independentCount : '—'}
          subtext="Confirmed by 2+ distinct networks"
          statusPill="Cross-Verified"
          tone="blue"
        />
        <StatTile
          label="SOURCE CONNECTIVITY"
          value={sourceState === 'success' ? `${liveCount} / ${sources.length || 7}` : '—'}
          subtext="Live adapters | 3 restricted"
          statusPill={liveCount >= 3 ? 'Operational' : 'Partial'}
          tone={liveCount >= 3 ? 'green' : 'amber'}
        />
        <StatTile
          label="LATEST INGESTION"
          value={latestDate ? formatDate(latestDate) : '—'}
          subtext="Most recent official bulletin"
          statusPill="Fresh"
          tone="slate"
        />
      </section>

      {/* Main Workspace Section: Correlated Clusters Matrix */}
      <section className="workstation-panel">
        <div className="panel-header-row">
          <div>
            <span className="workstation-kicker">CROSS-SOURCE CORRELATION ENGINE</span>
            <h3 className="panel-title">Active Outbreak Event Clusters</h3>
            <p className="panel-subtext">
              Automated heuristics cluster dispatches by pathogen token and territory. Reports sharing identical syntax are marked as syndicated wire copies.
            </p>
          </div>
          <div className="panel-header-actions">
            {onRefresh && (
              <button className="workstation-btn secondary" onClick={onRefresh} title="Sync feeds and trigger correlation">
                ↻ Sync Data
              </button>
            )}
            <button className="workstation-btn primary" onClick={() => onExplore('Alerts & Investigations')}>
              Investigation Workspace →
            </button>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="empty-state-card">
            No correlated outbreak clusters currently identified. Awaiting fresh dispatches.
          </div>
        ) : (
          <div className="clusters-matrix-grid">
            {events.slice(0, 4).map((ev) => (
              <article className="cluster-tile-card" key={ev.id}>
                <div className="cluster-tile-header">
                  <span className="cluster-pathogen">{ev.disease}</span>
                  <CorroborationBadge level={ev.corroborationLevel} />
                </div>
                <h4 className="cluster-territory">📍 {ev.country}</h4>
                <p className="cluster-summary">{ev.evidenceNote}</p>
                <div className="cluster-meta-row">
                  <span className="meta-capsule"><strong>{ev.recordCount}</strong> reports</span>
                  <span className="meta-capsule"><strong>{ev.distinctSourceCount}</strong> networks</span>
                  <span className="meta-sources-list">{ev.sources.join(' · ')}</span>
                </div>
                {ev.evidenceGaps.length > 0 && (
                  <div className="cluster-gap-alert">
                    <span className="gap-label">GAP:</span> {ev.evidenceGaps[0]}
                  </div>
                )}
                <div className="cluster-tile-footer">
                  <button className="workstation-btn ghost" onClick={() => onExplore('Alerts & Investigations')}>
                    Investigate Signal →
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Two Column Split: Adapter Diagnostic Matrix vs. Latest Wire Feed */}
      <div className="dashboard-dual-column">
        {/* Left Column: Source Health */}
        <section className="workstation-panel">
          <div className="panel-header-row">
            <div>
              <span className="workstation-kicker">INFRASTRUCTURE STATUS</span>
              <h3 className="panel-title">Surveillance Feed Adapters</h3>
            </div>
            <button className="workstation-btn ghost" onClick={() => onExplore('Source Status')}>
              All Diagnostics →
            </button>
          </div>
          <div className="adapter-table-frame">
            <table className="adapter-dense-table">
              <thead>
                <tr>
                  <th>ADAPTER</th>
                  <th>RECORDS</th>
                  <th>STATUS</th>
                  <th>PORTAL</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.key} className={s.status}>
                    <td className="adapter-name-cell">
                      <span className={`status-pip ${s.status}`} />
                      <strong>{s.source}</strong>
                    </td>
                    <td>{s.status === 'available' ? (s.records?.length ?? s.recordCount ?? 0) : '0'}</td>
                    <td>
                      <span className={`adapter-badge ${s.status}`}>
                        {s.status === 'available' ? 'OPERATIONAL' : 'RESTRICTED'}
                      </span>
                    </td>
                    <td>
                      <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="table-portal-link">
                        Portal ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Column: Latest Wire Feed */}
        <section className="workstation-panel">
          <div className="panel-header-row">
            <div>
              <span className="workstation-kicker">DISPATCH WIRE</span>
              <h3 className="panel-title">Incoming Publications</h3>
            </div>
            <button className="workstation-btn ghost" onClick={() => onExplore('Live Intelligence')}>
              Full Wire →
            </button>
          </div>
          {reports.length === 0 ? (
            <div className="empty-state-card">No incoming dispatches currently loaded.</div>
          ) : (
            <div className="wire-feed-list">
              {reports.slice(0, 5).map((r) => (
                <div className="wire-item" key={r.url}>
                  <div className="wire-item-top">
                    <SourceChip sourceKey={r.sourceKey} source={r.source} />
                    <span className="wire-date">{formatDate(r.publicationDate)}</span>
                  </div>
                  <div className="wire-title">{r.title}</div>
                  <div className="wire-bottom">
                    <span className="wire-loc">{r.location || 'Jurisdiction unspecified'}</span>
                    {isValidUrl(r.url) && (
                      <a href={r.url} target="_blank" rel="noreferrer" className="wire-link">
                        Source ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Principles & Methodology Callout */}
      <section className="workstation-panel info-banner">
        <span className="workstation-kicker">EPIDEMIOLOGICAL SURVEILLANCE STANDARDS</span>
        <h4 className="info-title">Core Operating Principles</h4>
        <div className="principles-grid">
          <div className="principle-item">
            <strong>1. Provenance Preservation</strong>
            <p>Original publisher titles, canonical URLs, and timestamps remain permanently attached to all records.</p>
          </div>
          <div className="principle-item">
            <strong>2. De-Syndication Detection</strong>
            <p>Matching headlines are classified as wire syndication to avoid presenting reprints as independent corroboration.</p>
          </div>
          <div className="principle-item">
            <strong>3. Truth in Adapter Status</strong>
            <p>Upstream bot mitigation (CDC 403) and rate limits (GDELT 429) are reported with 100% honesty without fake data.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Live Intelligence View ────────────────────────────────────────────────────

function LiveIntelligenceView({ intelligence, intelligenceState, whoReports, onRefresh }) {
  const [selectedSources, setSelectedSources] = useState(new Set(['who', 'ecdc', 'africacdc', 'promed', 'cdc', 'gdelt', 'idsp']))
  const [selectedTopic, setSelectedTopic] = useState('All topics')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')

  const rawRecords = intelligenceState === 'success' && Array.isArray(intelligence?.records) && intelligence.records.length > 0
    ? intelligence.records
    : whoReports.map((r) => ({ ...r, sourceKey: 'who' }))

  const filteredRecords = rawRecords.filter((r) => {
    const key = r.sourceKey || 'who'
    if (!selectedSources.has(key)) return false

    if (selectedTopic !== 'All topics') {
      const keywords = extractedKeywords(r.title)
      if (!keywords.includes(selectedTopic)) return false
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const titleMatch = (r.title || '').toLowerCase().includes(q)
      const locMatch = (r.location || '').toLowerCase().includes(q)
      const srcMatch = (r.source || '').toLowerCase().includes(q)
      if (!titleMatch && !locMatch && !srcMatch) return false
    }

    return true
  })

  filteredRecords.sort((a, b) => {
    if (sortOrder === 'newest') return Date.parse(b.publicationDate || '') - Date.parse(a.publicationDate || '')
    if (sortOrder === 'oldest') return Date.parse(a.publicationDate || '') - Date.parse(b.publicationDate || '')
    if (sortOrder === 'source') return (a.source || '').localeCompare(b.source || '')
    return 0
  })

  const toggleSource = (key) => {
    setSelectedSources((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size > 1) next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const selectAllSources = () => setSelectedSources(new Set(['who', 'ecdc', 'africacdc', 'promed', 'cdc', 'gdelt', 'idsp']))

  return (
    <div className="workspace-view">
      <div className="view-header-strip">
        <div>
          <span className="workstation-kicker">CROSS-SOURCE SURVEILLANCE FEED</span>
          <h2 className="view-title">Live Intelligence</h2>
          <p className="view-desc">
            Normalized public-health publications from verified international authorities. Filter by originating agency, pathogen category, or jurisdiction.
          </p>
        </div>
        <button className="workstation-btn primary" onClick={() => onRefresh(true)}>
          ↻ Sync Feeds
        </button>
      </div>

      {/* Control Console */}
      <div className="workstation-panel controls-panel">
        <div className="controls-row-top">
          <div className="search-bar-frame">
            <span className="search-icon">🔍</span>
            <input
              type="search"
              placeholder="Filter headlines by disease, region, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button className="clear-btn" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>
          <div className="dropdowns-group">
            <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} className="select-control">
              <option>All topics</option>
              {topicRules.map((t) => <option key={t.label}>{t.label}</option>)}
            </select>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="select-control">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="source">Sort by source</option>
            </select>
          </div>
        </div>

        {/* Source Pills Toolbar */}
        <div className="sources-pills-row">
          <span className="pills-label">AGENCY FEEDS:</span>
          {Object.entries(SOURCE_INFO).map(([key, info]) => {
            const count = rawRecords.filter((r) => (r.sourceKey || 'who') === key).length
            return (
              <button
                key={key}
                className={`agency-pill ${selectedSources.has(key) ? 'active' : ''}`}
                onClick={() => toggleSource(key)}
              >
                <span className={`pill-dot ${info.tone}`} />
                {info.label} ({count})
              </button>
            )
          })}
          <button className="reset-filter-link" onClick={selectAllSources}>
            Reset All
          </button>
        </div>

        <div className="results-counter-bar">
          <span>Displaying <strong>{filteredRecords.length}</strong> of {rawRecords.length} normalized reports</span>
          <span className="counter-note">Pathogen keywords are inferred and require primary source clinical verification.</span>
        </div>
      </div>

      {/* Reports Feed Grid */}
      {filteredRecords.length === 0 ? (
        <div className="workstation-panel empty-state-card">
          No dispatches match the selected filters.
          <button className="workstation-btn ghost" onClick={() => { setSearchQuery(''); setSelectedTopic('All topics'); selectAllSources() }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="reports-cards-grid">
          {filteredRecords.map((record) => (
            <ReportCard key={record.url || record.id} report={record} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Signal Monitoring View ────────────────────────────────────────────────────

function SignalMonitoringView({ reports = [], events = [] }) {
  const [mapMode, setMapMode] = useState('events')
  const [selectedItem, setSelectedItem] = useState(null)
  const [filterDisease, setFilterDisease] = useState('All diseases')
  const [search, setSearch] = useState('')

  const reportGroups = buildDiseaseLocationGroups(reports).filter((g) => {
    if (filterDisease !== 'All diseases' && g.disease !== filterDisease) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      if (!g.disease.toLowerCase().includes(q) && !g.country.toLowerCase().includes(q)) return false
    }
    return true
  })

  const filteredEvents = events.filter((ev) => {
    if (!ev.coordinates) return false
    if (filterDisease !== 'All diseases' && ev.disease !== filterDisease) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      if (!ev.disease.toLowerCase().includes(q) && !ev.country.toLowerCase().includes(q)) return false
    }
    return true
  })

  const diseasesList = ['All diseases', ...new Set([...reports.map((r) => extractDisease(r.title)), ...events.map((e) => e.disease)].filter(Boolean))]

  return (
    <div className="workspace-view">
      <div className="view-header-strip">
        <div>
          <span className="workstation-kicker">GEOSPATIAL SIGNAL SURVEILLANCE</span>
          <h2 className="view-title">Signal Monitoring</h2>
          <p className="view-desc">
            Geographic outbreak signals mapped to national centroid approximations. Select any pin to inspect the underlying surveillance evidence.
          </p>
        </div>
        <div className="map-view-switcher">
          <button className={`switch-btn ${mapMode === 'events' ? 'active' : ''}`} onClick={() => { setMapMode('events'); setSelectedItem(null) }}>
            Correlated Clusters ({filteredEvents.length})
          </button>
          <button className={`switch-btn ${mapMode === 'reports' ? 'active' : ''}`} onClick={() => { setMapMode('reports'); setSelectedItem(null) }}>
            Individual Reports ({reportGroups.length})
          </button>
        </div>
      </div>

      {/* Map Filter Bar */}
      <div className="workstation-panel map-filter-strip">
        <input
          type="search"
          placeholder="Search by country, territory, or pathogen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="map-search-field"
        />
        <select value={filterDisease} onChange={(e) => setFilterDisease(e.target.value)} className="select-control">
          {diseasesList.map((d) => <option key={d}>{d}</option>)}
        </select>
        <button className="reset-filter-link" onClick={() => { setSearch(''); setFilterDisease('All diseases') }}>
          Reset
        </button>
      </div>

      {/* Main Map + Evidence Split Layout */}
      <div className="map-workbench-frame">
        <div className="leaflet-frame">
          <MapContainer center={[15, 20]} zoom={2} minZoom={2} maxZoom={7} scrollWheelZoom={false} className="leaflet-screen">
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            <Pane name="signalsMarkers" style={{ zIndex: 650 }}>
              {mapMode === 'events'
                ? filteredEvents.map((ev) => (
                  <CircleMarker
                    key={ev.id}
                    center={ev.coordinates}
                    pane="signalsMarkers"
                    interactive
                    radius={ev.distinctSourceCount >= 2 ? Math.min(10 + ev.recordCount, 18) : 8}
                    pathOptions={{
                      color: ev.corroborationLevel === 'independent' ? '#17825b' : ev.corroborationLevel === 'syndicated' ? '#d97706' : '#2563eb',
                      fillColor: ev.corroborationLevel === 'independent' ? '#50c28b' : ev.corroborationLevel === 'syndicated' ? '#f59e0b' : '#60a5fa',
                      fillOpacity: 0.85,
                      weight: 2,
                    }}
                    eventHandlers={{
                      click: () => setSelectedItem({ type: 'event', data: ev }),
                      mouseover: (e) => e.target.bringToFront(),
                    }}
                  />
                ))
                : reportGroups.map((g) => (
                  <CircleMarker
                    key={g.key}
                    center={g.coordinates}
                    pane="signalsMarkers"
                    interactive
                    radius={g.reportCount >= 2 ? Math.min(10 + g.reportCount, 18) : 7}
                    pathOptions={{
                      color: g.reportCount >= 2 ? '#17825b' : '#3d9cad',
                      fillColor: g.reportCount >= 2 ? '#50c28b' : '#67e8f9',
                      fillOpacity: 0.85,
                      weight: 2,
                    }}
                    eventHandlers={{
                      click: () => setSelectedItem({ type: 'reportGroup', data: g }),
                      mouseover: (e) => e.target.bringToFront(),
                    }}
                  />
                ))}
            </Pane>

            {selectedItem && (
              <Popup
                position={selectedItem.data.coordinates}
                eventHandlers={{ remove: () => setSelectedItem(null) }}
              >
                <div className="popup-card">
                  <strong>{selectedItem.data.disease}</strong>
                  <div>{selectedItem.data.country}</div>
                  <div className="popup-sub">
                    {selectedItem.type === 'event'
                      ? `${selectedItem.data.recordCount} reports · ${selectedItem.data.distinctSourceCount} sources`
                      : `${selectedItem.data.reportCount} reports`}
                  </div>
                </div>
              </Popup>
            )}
          </MapContainer>

          <div className="map-caption-banner">
            <span>📍 Country Centroids: Coordinates represent national geographic centroids and do not indicate exact case coordinates.</span>
          </div>
        </div>

        {/* Side Evidence Inspector */}
        <aside className="map-side-inspector">
          {selectedItem ? (
            <div className="inspector-body">
              <div className="inspector-head">
                <div>
                  <span className="workstation-kicker">SIGNAL DOSSIER</span>
                  <h3 className="inspector-title">{selectedItem.data.disease}</h3>
                  <div className="inspector-territory">📍 {selectedItem.data.country}</div>
                </div>
                <button className="inspector-close-btn" onClick={() => setSelectedItem(null)}>✕</button>
              </div>

              {selectedItem.type === 'event' && (
                <>
                  <div className="badge-wrapper">
                    <CorroborationBadge level={selectedItem.data.corroborationLevel} />
                  </div>
                  <p className="inspector-note-text">{selectedItem.data.evidenceNote}</p>

                  {selectedItem.data.evidenceGaps?.length > 0 && (
                    <div className="inspector-gaps-callout">
                      <strong>Surveillance Gaps:</strong>
                      <ul>
                        {selectedItem.data.evidenceGaps.map((gap, i) => <li key={i}>{gap}</li>)}
                      </ul>
                    </div>
                  )}

                  <h4 className="inspector-subhead">Cited Reports ({selectedItem.data.records?.length || 0})</h4>
                  <div className="inspector-list-scroll">
                    {selectedItem.data.records?.map((r) => (
                      <div className="inspector-item" key={r.url}>
                        <div className="inspector-item-top">
                          <SourceChip sourceKey={r.sourceKey} source={r.source} />
                          <span className="item-date">{formatDate(r.publicationDate)}</span>
                        </div>
                        <div className="item-title">{r.title}</div>
                        {isValidUrl(r.url) && (
                          <a href={r.url} target="_blank" rel="noreferrer" className="item-link">
                            Primary Bulletin ↗
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {selectedItem.type === 'reportGroup' && (
                <>
                  <p className="inspector-note-text">
                    {selectedItem.data.reportCount} bulletin{selectedItem.data.reportCount !== 1 ? 's' : ''} in this territory.
                  </p>
                  <h4 className="inspector-subhead">Associated Publications</h4>
                  <div className="inspector-list-scroll">
                    {selectedItem.data.reports?.map((r) => (
                      <div className="inspector-item" key={r.url}>
                        <div className="inspector-item-top">
                          <SourceChip sourceKey={r.sourceKey} source={r.source} />
                          <span className="item-date">{formatDate(r.publicationDate)}</span>
                        </div>
                        <div className="item-title">{r.title}</div>
                        {isValidUrl(r.url) && (
                          <a href={r.url} target="_blank" rel="noreferrer" className="item-link">
                            Primary Bulletin ↗
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="inspector-empty-state">
              <span className="empty-icon">🌐</span>
              <h4>Select A Signal Pin</h4>
              <p>Click any map marker to inspect its cited surveillance reports, corroboration status, and verified source provenance.</p>
              <div className="map-legend-box">
                <div className="legend-row"><span className="dot green" /> Independent Corroboration (2+ sources)</div>
                <div className="legend-row"><span className="dot amber" /> Wire Syndication Detected</div>
                <div className="legend-row"><span className="dot blue" /> Single Source Dispatch</div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

// ── Alerts & Investigations Workspace ─────────────────────────────────────────

function EventDetailModal({ event, onClose }) {
  const [tasks, setTasks] = useState(() => readDossierChecklist(event.id))
  const [analystNotes, setAnalystNotes] = useState('')

  const toggleTask = (id) => {
    setTasks((prev) => {
      const next = prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task))
      persistDossierChecklist(event.id, next)
      return next
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dossier-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top-bar">
          <div>
            <div className="modal-eyebrow">INVESTIGATION DOSSIER #{event.id?.slice(0, 8)}</div>
            <h2 className="modal-main-title">{event.disease} — {event.country}</h2>
          </div>
          <div className="modal-actions-right">
            <CorroborationBadge level={event.corroborationLevel} />
            <button className="modal-exit-btn" onClick={onClose} aria-label="Close dossier">✕</button>
          </div>
        </div>

        <div className="modal-scroll-body">
          {/* Section 1: Known Facts */}
          <section className="dossier-block">
            <h3 className="block-title">1. Established Source Evidence</h3>
            <p className="block-text">{event.evidenceNote}</p>
            <div className="dossier-facts-grid">
              <div className="fact-box">
                <span>Total Dispatches:</span> <strong>{event.recordCount}</strong>
              </div>
              <div className="fact-box">
                <span>Reporting Networks:</span> <strong>{event.distinctSourceCount} ({event.sources.join(', ')})</strong>
              </div>
              <div className="fact-box">
                <span>Latest Update:</span> <strong>{formatDate(event.latestDate)}</strong>
              </div>
            </div>
          </section>

          {/* Section 2: Gaps & Uncertainties */}
          <section className="dossier-block gaps">
            <h3 className="block-title">2. Surveillance Gaps & Ambiguities</h3>
            {event.evidenceGaps && event.evidenceGaps.length > 0 ? (
              <ul className="dossier-bullets">
                {event.evidenceGaps.map((gap, i) => (
                  <li key={i}>⚠️ {gap}</li>
                ))}
              </ul>
            ) : (
              <p className="block-text">No structural metadata gaps identified.</p>
            )}

            {event.syndicationPairs && event.syndicationPairs.length > 0 && (
              <div className="syndication-alert-box">
                <strong>Wire Syndication Detected:</strong> Multiple publications appear to be verbatim agency reprints:
                <ul>
                  {event.syndicationPairs.map((p, i) => (
                    <li key={i}>{p[0]} ↔ {p[1]}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Section 3: Verification Protocol */}
          <section className="dossier-block">
            <h3 className="block-title">3. Actionable Verification Protocol</h3>
            <div className="checklist-frame">
              {tasks.map((task) => (
                <label key={task.id} className={`task-checkbox-row ${task.done ? 'done' : ''}`}>
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(task.id)}
                  />
                  <span>{task.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Section 4: Analyst Notes */}
          <section className="dossier-block">
            <h3 className="block-title">4. Analyst Working Log (Session Only)</h3>
            <textarea
              className="analyst-textarea"
              placeholder="Record hypotheses, primary contact details, laboratory confirmation status, or peer findings..."
              value={analystNotes}
              onChange={(e) => setAnalystNotes(e.target.value)}
              rows={3}
            />
          </section>

          {/* Section 5: Cited Reports */}
          <section className="dossier-block">
            <h3 className="block-title">5. Primary Documents & Citations ({event.records?.length || 0})</h3>
            <div className="citations-stack">
              {event.records?.map((r) => (
                <div className="citation-card" key={r.url || r.id}>
                  <div className="citation-top">
                    <SourceChip sourceKey={r.sourceKey} source={r.source} />
                    <span className="cite-date">{formatDate(r.publicationDate)}</span>
                  </div>
                  <div className="cite-headline">{r.title}</div>
                  {r.summary && <p className="cite-summary">{r.summary}</p>}
                  {isValidUrl(r.url) && (
                    <a href={r.url} target="_blank" rel="noreferrer" className="canonical-link">
                      Open primary document ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="modal-bottom-bar">
          <p className="modal-disclaimer">
            Automated correlation groups reports by pathogen & location. This dossier does not constitute a clinical outbreak declaration or case estimate.
          </p>
          <button className="workstation-btn primary" onClick={onClose}>
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  )
}

function AlertsView({ events = [], eventsState, eventsError, onRefresh }) {
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [filterLevel, setFilterLevel] = useState('all')
  const [investigationStatus, setInvestigationStatus] = useState({})

  const setStatus = (id, st) => {
    setInvestigationStatus((prev) => ({ ...prev, [id]: st }))
  }

  const filtered = events.filter((ev) => {
    if (filterLevel === 'all') return true
    return ev.corroborationLevel === filterLevel
  })

  return (
    <div className="workspace-view">
      <div className="view-header-strip">
        <div>
          <span className="workstation-kicker">OPERATIONAL EPIDEMIOLOGY WORKSPACE</span>
          <h2 className="view-title">Alerts & Investigations</h2>
          <p className="view-desc">
            Correlated outbreak clusters requiring human cross-examination. Review corroboration levels, track active investigation state, and identify evidence gaps.
          </p>
        </div>
        <button className="workstation-btn primary" onClick={() => onRefresh(true)}>
          ↻ Refresh Investigations
        </button>
      </div>

      {/* Filter Tabs Bar */}
      <div className="investigations-filter-tabs">
        {[
          ['all', 'All Outbreak Clusters', events.length],
          ['independent', 'Independently Corroborated', events.filter((e) => e.corroborationLevel === 'independent').length],
          ['syndicated', 'Wire Syndication', events.filter((e) => e.corroborationLevel === 'syndicated').length],
          ['single-source', 'Single Source Dispatches', events.filter((e) => e.corroborationLevel === 'single-source').length],
        ].map(([level, label, count]) => (
          <button
            key={level}
            className={`tab-filter-btn ${filterLevel === level ? 'active' : ''}`}
            onClick={() => setFilterLevel(level)}
          >
            {label} <span className="tab-pill">{count}</span>
          </button>
        ))}
      </div>

      {eventsState === 'loading' && (
        <div className="api-notice loading" role="status">
          <span className="notice-spinner" /> Cross-correlating multi-source surveillance records…
        </div>
      )}

      {eventsState === 'error' && events.length === 0 && (
        <div className="api-notice error" role="alert">
          <strong>Correlation Data Warning:</strong> {eventsError || 'Unable to load server correlation.'}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="workstation-panel empty-state-card">
          No outbreak clusters found for this filter level.
          <button className="workstation-btn ghost" onClick={() => setFilterLevel('all')}>Show all clusters</button>
        </div>
      ) : (
        <div className="investigation-cards-matrix">
          {filtered.map((ev) => {
            const currentStatus = investigationStatus[ev.id] || 'Needs Review'
            return (
              <article className="investigation-desk-card" key={ev.id}>
                <div className="card-headline-bar">
                  <div>
                    <span className="card-pathogen-title">{ev.disease}</span>
                    <h3 className="card-territory-title">📍 {ev.country}</h3>
                  </div>
                  <CorroborationBadge level={ev.corroborationLevel} />
                </div>

                <p className="card-evidence-text">{ev.evidenceNote}</p>

                <div className="status-selector-row">
                  <span className="status-row-label">Investigation State:</span>
                  <div className="status-chips-wrap">
                    {['Needs Review', 'Under Investigation', 'Verified'].map((st) => (
                      <button
                        key={st}
                        className={`state-chip ${currentStatus === st ? 'active ' + st.toLowerCase().replace(/[^a-z]/g, '-') : ''}`}
                        onClick={() => setStatus(ev.id, st)}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {ev.evidenceGaps.length > 0 && (
                  <div className="card-gap-alert">
                    <span className="gap-alert-tag">GAP:</span> {ev.evidenceGaps[0]}
                  </div>
                )}

                <div className="card-action-bar">
                  <div className="card-sources-tag">
                    {ev.recordCount} reports · {ev.sources.join(', ')}
                  </div>
                  <button className="workstation-btn primary" onClick={() => setSelectedEvent(ev)}>
                    Inspect Evidence & Gaps →
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  )
}

// ── Source Status View ────────────────────────────────────────────────────────

function SourceStatusView({ sources = [], sourceState, sourceError, onRefresh }) {
  return (
    <div className="workspace-view">
      <div className="view-header-strip">
        <div>
          <span className="workstation-kicker">DATA PIPELINE HEALTH & PROVENANCE</span>
          <h2 className="view-title">Source Status</h2>
          <p className="view-desc">
            Real-time diagnostics for each integrated public-health adapter. Reflects verified fetch outcomes, rate limits, and authentication requirements without fabricated data.
          </p>
        </div>
        <button className="workstation-btn primary" onClick={() => onRefresh(true)} disabled={sourceState === 'loading'}>
          ↻ Query All Adapters
        </button>
      </div>

      {sourceState === 'loading' && (
        <div className="api-notice loading" role="status">
          <span className="notice-spinner" /> Testing adapter endpoints…
        </div>
      )}

      {sourceState === 'error' && (
        <div className="api-notice error" role="alert">
          <strong>Sources Check Failed:</strong> {sourceError}
        </div>
      )}

      <div className="source-cards-matrix">
        {sources.map((source) => (
          <article className="source-diagnostic-tile" key={source.key}>
            <div className="diagnostic-tile-top">
              <div>
                <span className="adapter-code-tag">ADAPTER: {source.key}</span>
                <h3 className="adapter-title-text">{source.source}</h3>
              </div>
              <span className={`adapter-badge ${source.status}`}>
                {source.status === 'available' ? '● OPERATIONAL' : '○ RESTRICTED'}
              </span>
            </div>

            <div className="diagnostic-specs-table">
              <div className="spec-row">
                <span>Adapter Key:</span>
                <code>{source.key}</code>
              </div>
              <div className="spec-row">
                <span>Retrieved Bulletins:</span>
                <strong>{source.status === 'available' ? (source.records?.length ?? source.recordCount ?? 0) : '0'}</strong>
              </div>
              <div className="spec-row">
                <span>Last Polled:</span>
                <span>{formatTimestamp(source.fetchedAt)}</span>
              </div>
              <div className="spec-row">
                <span>Cache TTL:</span>
                <span>5 minutes (Memory cache)</span>
              </div>
            </div>

            {source.status !== 'available' && (
              <div className="diagnostic-restriction-box">
                <span className="restriction-badge">ACCESS LIMITATION DISCLOSURE:</span>
                <p>{source.error?.message || 'Access blocked or requires authenticated portal access.'}</p>
                {source.error?.code && <div className="restriction-code">Code: {source.error.code}</div>}
              </div>
            )}

            <div className="diagnostic-tile-footer">
              <span className="provenance-label">Publisher Portal:</span>
              <a href={source.sourceUrl} target="_blank" rel="noreferrer" className="canonical-link">
                Open Official Endpoint <span>↗</span>
              </a>
            </div>
          </article>
        ))}
      </div>

      <section className="workstation-panel policy-box">
        <span className="workstation-kicker">RESEARCH INTEGRITY POLICY</span>
        <h4 className="info-title">Why EpidemicPulse Reports Blocked Sources Honestly</h4>
        <p className="policy-p">
          In public health informatics, fabricating synthetic outbreak alerts when an upstream API experiences rate-limiting (e.g., GDELT HTTP 429) or bot blocking (e.g., CDC Cloudflare HTTP 403) violates research ethics. EpidemicPulse isolates failures so working sources (WHO, ECDC, Africa CDC, ProMED) remain operational while blocked sources are transparently labeled with their exact error code and access requirements.
        </p>
      </section>
    </div>
  )
}

// ── Simulation Lab View ───────────────────────────────────────────────────────

function SimulationView() {
  const [scenario, setScenario] = useState('Cross-Border Spillover')
  const [pathogenModel, setPathogenModel] = useState('Viral Hemorrhagic')
  const [horizon, setHorizon] = useState('21')
  const [transmissionRate, setTransmissionRate] = useState('1.8')
  const [intervention, setIntervention] = useState('35')
  const [ran, setRan] = useState(false)

  // Deterministic illustrative calculation based on user inputs
  const r0Num = Number(transmissionRate)
  const horizonNum = Number(horizon)
  const interventionNum = Number(intervention) / 100
  const effectiveR = Math.max(0.6, (r0Num * (1 - interventionNum * 0.75))).toFixed(2)
  const peakDay = Math.min(horizonNum, Math.round(horizonNum * (1 / Math.max(0.8, r0Num))))
  const exposurePct = Math.min(95, Math.round((Math.max(0, r0Num - 1) / r0Num) * (1 - interventionNum * 0.6) * 100))

  return (
    <div className="workspace-view">
      <div className="view-header-strip">
        <div>
          <span className="workstation-kicker">EXPERIMENTAL EPIDEMIOLOGICAL SANDBOX</span>
          <h2 className="view-title">Simulation Lab</h2>
          <p className="view-desc">
            Illustrative compartmental modeling sandbox. Completely isolated from real-world WHO and ECDC surveillance data.
          </p>
        </div>
        <span className="sandbox-indicator">SANDBOX ISOLATED</span>
      </div>

      <div className="simulation-dual-grid">
        {/* Controls Frame */}
        <article className="workstation-panel sim-controls">
          <h3 className="panel-title">Model Configuration</h3>
          <p className="panel-subtext">Configure parameters to calculate illustrative transmission curves.</p>

          <label className="sim-input-row">
            <span>Scenario Archetype</span>
            <select value={scenario} onChange={(e) => setScenario(e.target.value)} className="select-control">
              <option>Cross-Border Spillover</option>
              <option>High-Density Urban Transmission</option>
              <option>Vector Habitat Expansion</option>
              <option>Delayed Detection Outbreak</option>
            </select>
          </label>

          <label className="sim-input-row">
            <span>Pathogen Archetype</span>
            <select value={pathogenModel} onChange={(e) => setPathogenModel(e.target.value)}>
              <option>Viral Hemorrhagic (Filovirus)</option>
              <option>Acute Respiratory (Coronavirus/Flu)</option>
              <option>Vector-borne (Flavivirus)</option>
              <option>Enteric Waterborne (Vibrio)</option>
            </select>
          </label>

          <label className="sim-input-row">
            <span>Projection Horizon (Days): {horizon} days</span>
            <input
              type="range"
              min="7"
              max="45"
              step="7"
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
            />
          </label>

          <label className="sim-input-row">
            <span>Basic Reproduction Number (R₀): {transmissionRate}</span>
            <input
              type="range"
              min="0.8"
              max="3.5"
              step="0.1"
              value={transmissionRate}
              onChange={(e) => setTransmissionRate(e.target.value)}
            />
          </label>

          <label className="sim-input-row">
            <span>Intervention Efficacy: {intervention}%</span>
            <input
              type="range"
              min="0"
              max="75"
              step="5"
              value={intervention}
              onChange={(e) => setIntervention(e.target.value)}
            />
          </label>

          <button className="workstation-btn primary full-width" onClick={() => setRan(true)}>
            Execute Simulation Model
          </button>
        </article>

        {/* Results Frame */}
        <article className="workstation-panel sim-results">
          <div className="results-top-strip">
            <h3 className="panel-title">Computational Output</h3>
            <span className="watermark-pill">SYNTHETIC RUN ONLY</span>
          </div>

          {ran ? (
            <div className="results-body">
              <div className="sim-banner-box">
                <strong>Model Calculated:</strong> {scenario} ({pathogenModel}) with R₀={transmissionRate} and {intervention}% intervention efficacy.
              </div>

              <div className="metrics-triad">
                <div className="triad-card">
                  <span className="triad-label">Effective R (R_eff)</span>
                  <strong className="triad-val">{effectiveR}</strong>
                  <span className="triad-note">{effectiveR < 1 ? 'Sub-critical decline' : 'Active community spread'}</span>
                </div>
                <div className="triad-card">
                  <span className="triad-label">Projected Peak</span>
                  <strong className="triad-val">Day {peakDay}</strong>
                  <span className="triad-note">Peak exposure window</span>
                </div>
                <div className="triad-card">
                  <span className="triad-label">Peak Exposure Rate</span>
                  <strong className="triad-val">{exposurePct}%</strong>
                  <span className="triad-note">Cumulative theoretical spread</span>
                </div>
              </div>

              <div className="sim-sandbox-alert">
                ⚠️ <strong>SANDBOX DISCLAIMER:</strong> This is a synthetic illustrative playground for algorithm testing. No real-world outbreak forecast, clinical prediction, or healthcare advice is represented.
              </div>
            </div>
          ) : (
            <div className="results-empty-state">
              <span className="sim-empty-icon">📊</span>
              <h4>Sandbox Ready</h4>
              <p>Configure model parameters and click "Execute Simulation Model" to visualize hypothetical trajectory curves.</p>
            </div>
          )}
        </article>
      </div>
    </div>
  )
}

// ── About View ────────────────────────────────────────────────────────────────

function AboutView() {
  return (
    <div className="workspace-view">
      <div className="view-header-strip">
        <div>
          <span className="workstation-kicker">SYSTEM SPECIFICATION & MISSION</span>
          <h2 className="view-title">About EpidemicPulse</h2>
          <p className="view-desc">
            Multi-source outbreak intelligence, evidence correlation, and provenance-first verification platform.
          </p>
        </div>
      </div>

      <div className="framework-cards-grid">
        <article className="workstation-panel framework-card">
          <span className="card-num">01</span>
          <h3 className="card-h">Provenance-First Architecture</h3>
          <p className="card-p">
            EpidemicPulse preserves the canonical headline, publication date, source identity, and direct URL for every bulletin. We never strip source attribution or synthesize artificial outbreak declarations.
          </p>
        </article>
        <article className="workstation-panel framework-card">
          <span className="card-num">02</span>
          <h3 className="card-h">Cross-Source Correlation</h3>
          <p className="card-p">
            Our correlation layer groups independent publications sharing pathogen keywords and geographic jurisdictions. It flags news syndication and distinguishes genuine corroboration from duplicate reporting.
          </p>
        </article>
        <article className="workstation-panel framework-card">
          <span className="card-num">03</span>
          <h3 className="card-h">Ethical Integrity & Limitations</h3>
          <p className="card-p">
            Publication volume is never presented as case incidence. Centroid coordinates are country-level approximations. When an upstream API is rate-limited or restricted, we disclose the restriction honestly.
          </p>
        </article>
      </div>

      <section className="workstation-panel arch-flow-panel">
        <span className="workstation-kicker">ENGINEERING SPECIFICATION</span>
        <h3 className="panel-title">Core Surveillance Architecture</h3>
        <div className="arch-pipeline-grid">
          <div className="pipeline-card">
            <span className="pipe-badge">Phase 1</span>
            <strong>Multi-Source Ingestion</strong>
            <p>Independent adapters poll WHO, ECDC, Africa CDC, and ProMED feeds with 8-second timeouts and 5-minute memory caching.</p>
          </div>
          <div className="pipeline-card">
            <span className="pipe-badge">Phase 2</span>
            <strong>Schema Normalization</strong>
            <p>Records are mapped into a unified schema preserving original source URLs, dates, summaries, and evidence status.</p>
          </div>
          <div className="pipeline-card">
            <span className="pipe-badge">Phase 3</span>
            <strong>Correlation & De-Syndication</strong>
            <p>Heuristics cluster matching pathogen and country tokens, cross-verifying independent sources versus news wire copies.</p>
          </div>
          <div className="pipeline-card">
            <span className="pipe-badge">Phase 4</span>
            <strong>Investigator Workspace</strong>
            <p>Surveillance officers inspect corroboration, review evidence gaps, and verify primary documents prior to escalation.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Landing Page ──────────────────────────────────────────────────────────────

function LandingPage({ onEnterDashboard }) {
  return <RedesignedLandingPage onEnterDashboard={onEnterDashboard} />
}

// ── Root Application Component ────────────────────────────────────────────────

function App() {
  const [route, setRoute] = useState(readRoute)
  const [activePage, setActivePage] = useState(() => readRoute().page)
  const [menuOpen, setMenuOpen] = useState(false)

  // Data states
  const [dashboard, setDashboard] = useState(emptyDashboard)
  const [requestState, setRequestState] = useState('loading')
  const [requestError, setRequestError] = useState('')
  const [lastRefreshed, setLastRefreshed] = useState(null)

  const [sources, setSources] = useState([])
  const [sourceState, setSourceState] = useState('loading')
  const [sourceError, setSourceError] = useState('')

  const [intelligence, setIntelligence] = useState(null)
  const [intelligenceState, setIntelligenceState] = useState('loading')

  const [events, setEvents] = useState([])
  const [eventsState, setEventsState] = useState('loading')
  const [eventsError, setEventsError] = useState('')

  const loadSources = useCallback(async (forceRefresh = false) => {
    setSourceState('loading')
    setSourceError('')
    try {
      const payload = await fetchSources(forceRefresh)
      setSources(payload.sources || [])
      setSourceState('success')
    } catch (err) {
      setSources([])
      setSourceState('error')
      setSourceError(err instanceof Error ? err.message : 'Unable to load source status.')
    }
  }, [])

  const loadIntelligence = useCallback(async (forceRefresh = false) => {
    setIntelligenceState('loading')
    try {
      const payload = await fetchIntelligence(forceRefresh)
      setIntelligence(payload)
      setIntelligenceState('success')
    } catch {
      setIntelligenceState('error')
    }
  }, [])

  const loadEvents = useCallback(async (forceRefresh = false, fallbackReports = []) => {
    setEventsState('loading')
    setEventsError('')
    try {
      const payload = await fetchEvents(forceRefresh, fallbackReports)
      setEvents(payload.events || [])
      setEventsState('success')
    } catch (err) {
      if (fallbackReports.length > 0) {
        const local = correlateReportsLocally(fallbackReports)
        setEvents(local)
        setEventsState('success')
      } else {
        setEvents([])
        setEventsState('error')
        setEventsError(err.message)
      }
    }
  }, [])

  const loadDashboard = useCallback(async (forceRefresh = false) => {
    setRequestState('loading')
    setRequestError('')
    loadSources(forceRefresh)
    loadIntelligence(forceRefresh)

    try {
      const payload = await fetchDashboard(forceRefresh)
      setDashboard(payload)
      setRequestState(payload.dataMode === 'live' ? 'success' : 'error')
      if (payload.error) setRequestError(payload.error.message)
      setLastRefreshed(new Date())

      if (Array.isArray(payload.events) && payload.events.length > 0) {
        setEvents(payload.events)
        setEventsState('success')
      } else {
        loadEvents(forceRefresh, payload.reports || [])
      }
    } catch (err) {
      setDashboard(emptyDashboard)
      setRequestState('error')
      setRequestError(err instanceof Error ? err.message : 'The WHO source could not be reached.')
      setLastRefreshed(new Date())
      loadEvents(forceRefresh, [])
    }
  }, [loadSources, loadIntelligence, loadEvents])

  useEffect(() => {
    const timer = window.setTimeout(() => loadDashboard(), 0)
    return () => window.clearTimeout(timer)
  }, [loadDashboard])

  useEffect(() => {
    const handlePop = () => {
      const r = readRoute()
      setRoute(r)
      setActivePage(r.page)
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  const navigateTo = (path) => {
    window.history.pushState({}, '', path)
    const r = readRoute()
    setRoute(r)
    setActivePage(r.page)
    setMenuOpen(false)
  }

  if (route.type === 'landing') {
    return <LandingPage onEnterDashboard={() => navigateTo('/dashboard')} />
  }

  const liveSourcesCount = sources.filter((s) => s.status === 'available').length

  const renderView = () => {
    if (activePage === 'Live Intelligence') {
      return (
        <LiveIntelligenceView
          intelligence={intelligence}
          intelligenceState={intelligenceState}
          whoReports={dashboard.reports}
          onRefresh={loadDashboard}
        />
      )
    }
    if (activePage === 'Signal Monitoring') {
      return (
        <SignalMonitoringView
          reports={dashboard.reports}
          events={events}
        />
      )
    }
    if (activePage === 'Alerts & Investigations') {
      return (
        <AlertsView
          events={events}
          eventsState={eventsState}
          eventsError={eventsError}
          onRefresh={loadDashboard}
        />
      )
    }
    if (activePage === 'Simulation Lab') {
      return <SimulationView />
    }
    if (activePage === 'Source Status') {
      return (
        <SourceStatusView
          sources={sources}
          sourceState={sourceState}
          sourceError={sourceError}
          onRefresh={loadSources}
        />
      )
    }
    if (activePage === 'About') {
      return <AboutView />
    }
    return (
      <OverviewView
        reports={dashboard.reports}
        state={requestState}
        error={requestError}
        onRefresh={() => loadDashboard(true)}
        onExplore={(page) => navigateTo(`/dashboard?view=${pageRoutes[page] || 'overview'}`)}
        sources={sources}
        sourceState={sourceState}
        events={events}
        eventsState={eventsState}
      />
    )
  }

  return (
    <div className="workstation-app">
      {/* Sidebar Navigation */}
      <aside className={`workstation-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand-box">
          <a className="sidebar-brand" href="/" onClick={(e) => { e.preventDefault(); navigateTo('/') }}>
            <BrandMark />
            <div className="brand-text-group">
              <span className="brand-primary">EPIDEMIC<span className="brand-accent">PULSE</span></span>
              <span className="brand-tagline">SURVEILLANCE DESK</span>
            </div>
          </a>
          <span className="badge-system-state">v2.4 MVP</span>
        </div>

        <nav className="sidebar-nav-tree" aria-label="Main Navigation">
          <a className="landing-return-link" href="/" onClick={(e) => { e.preventDefault(); navigateTo('/') }}>
            ← Public Landing Page
          </a>

          {['SURVEILLANCE', 'ANALYSIS', 'SYSTEM'].map((grp) => (
            <div key={grp} className="nav-group">
              <div className="nav-group-header">{grp}</div>
              {navigation.filter((n) => n.group === grp).map((item) => (
                <button
                  key={item.label}
                  className={`nav-button ${activePage === item.label ? 'active' : ''}`}
                  onClick={() => navigateTo(`/dashboard?view=${pageRoutes[item.label]}`)}
                >
                  <span className="button-icon">{item.icon}</span>
                  <span className="button-text">{item.label}</span>
                  <span className="button-tag">{item.tag}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer-card">
          <div className="adapter-capacity-meter">
            <div className="capacity-label">
              <span>ACTIVE ADAPTERS</span>
              <strong>{liveSourcesCount} / {sources.length || 7} Live</strong>
            </div>
            <div className="capacity-track">
              <div
                className="capacity-fill"
                style={{ width: `${Math.round((liveSourcesCount / (sources.length || 7)) * 100)}%` }}
              />
            </div>
          </div>
          <div className="integrity-note">
            <span className="status-pip available" /> PROVENANCE PROTOCOL ACTIVE
          </div>
        </div>
      </aside>

      {/* Main Workstation Screen */}
      <main className="workstation-main">
        <header className="workstation-topbar">
          <button className="mobile-toggle-btn" aria-label="Toggle navigation menu" onClick={() => setMenuOpen(!menuOpen)}>
            ☰
          </button>
          <div>
            <div className="topbar-context-tag">WORKSPACE / {activePage.toUpperCase()}</div>
            <h1 className="topbar-heading">{activePage}</h1>
          </div>
          <div className="topbar-controls">
            <div className="sources-status-capsule">
              <span className="pip-pulse green" />
              <span>{liveSourcesCount} Feeds Operational</span>
            </div>
            <span className="topbar-divider-line" />
            <span className="topbar-sync-text">
              {lastRefreshed ? `Polled ${formatRelativeTime(lastRefreshed)}` : 'Connecting…'}
            </span>
            <button
              className="sync-feeds-btn"
              onClick={() => loadDashboard(true)}
              disabled={requestState === 'loading'}
              aria-label="Synchronize all surveillance feeds"
            >
              ↻ <span>Sync Feeds</span>
            </button>
          </div>
        </header>

        <div className="workstation-scroll-content">
          {renderView()}

          <footer className="workstation-bottom-footer">
            <span>© 2026 EpidemicPulse · Cross-Source Outbreak Intelligence Platform</span>
            <span>
              <span className="footer-pip" /> Provenance-First Architecture · Real Multi-Source Data · Not Clinical Decision Software
            </span>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
