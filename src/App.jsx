import { useCallback, useEffect, useState } from 'react'
import { CircleMarker, MapContainer, Pane, Popup, TileLayer } from 'react-leaflet'
import './App.css'
import 'leaflet/dist/leaflet.css'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const DASHBOARD_ENDPOINT = `${API_BASE_URL}/api/dashboard`

const navigation = [
  { label: 'Overview', icon: '⌂' },
  { label: 'Live Intelligence', icon: '◉' },
  { label: 'Signal Monitoring', icon: '⌁' },
  { label: 'Alerts & Investigations', icon: '!' },
  { label: 'Simulation Lab', icon: '◇' },
  { label: 'About', icon: 'i' },
]

const pageRoutes = Object.fromEntries(navigation.map(({ label }) => [label, label.toLowerCase().replace(/[^a-z]+/g, '-')]))
const routePages = Object.fromEntries(Object.entries(pageRoutes).map(([label, slug]) => [slug, label]))

function readRoute() {
  if (window.location.pathname !== '/dashboard' && window.location.pathname !== '/dashboard/') return { type: 'landing', page: 'Overview' }
  const requestedPage = new URLSearchParams(window.location.search).get('view') || 'overview'
  return { type: 'dashboard', page: routePages[requestedPage] || 'Overview' }
}

const topicRules = [
  { label: 'Respiratory', keywords: ['respiratory', 'pneumonia', 'influenza', 'coronavirus', 'covid'] },
  { label: 'Viral', keywords: ['virus', 'viral', 'ebola', 'nipah', 'measles'] },
  { label: 'Vector-borne', keywords: ['malaria', 'dengue', 'yellow fever', 'mosquito'] },
  { label: 'Food/water', keywords: ['cholera', 'foodborne', 'waterborne'] },
]

const diseaseRules = [
  { label: 'Ebola disease caused by Bundibugyo virus', pattern: /ebola disease caused by bundibugyo virus/i },
  { label: 'Middle East respiratory syndrome coronavirus', pattern: /middle east respiratory syndrome coronavirus/i },
  { label: 'Pneumonia of undetermined etiology', pattern: /pneumonia of undetermined etiology/i },
  { label: 'Hantavirus', pattern: /hantavirus/i },
  { label: 'Nipah virus disease', pattern: /nipah virus disease/i },
  { label: 'Yellow fever', pattern: /yellow fever/i },
]

const countryRules = [
  { label: 'Democratic Republic of the Congo', aliases: ['democratic republic of the congo'], coordinates: [-2.5, 23.5] },
  { label: 'Kingdom of Saudi Arabia', aliases: ['kingdom of saudi arabia', 'saudi arabia'], coordinates: [23.8859, 45.0792] },
  { label: 'Russian Federation', aliases: ['russian federation'], coordinates: [61.524, 105.3188] },
  { label: 'Kenya', aliases: ['kenya'], coordinates: [-0.0236, 37.9062] },
  { label: 'Nigeria', aliases: ['nigeria'], coordinates: [9.082, 8.6753] },
  { label: 'Uganda', aliases: ['uganda'], coordinates: [1.3733, 32.2903] },
  { label: 'India', aliases: ['india'], coordinates: [22.9734, 78.6569] },
]

const emptyDashboard = {
  schemaVersion: '2.0', dataMode: 'unavailable', source: 'WHO Disease Outbreak News', sourceUrl: 'https://www.who.int/emergencies/disease-outbreak-news', fetchedAt: null,
  summary: { retrievedPublications: 0, sourceStatus: 'unavailable', dataFreshness: null }, trend: null, locations: [], reports: [], alerts: [], limitations: [],
}

function formatDate(value) {
  if (!value) return 'Not provided by source'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not provided by source' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTimestamp(value) {
  if (!value) return 'Unavailable'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function latestPublicationDate(reports = []) {
  const timestamps = reports.map((report) => Date.parse(report.publicationDate || '')).filter((timestamp) => !Number.isNaN(timestamp))
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

function extractedKeywords(title) {
  const normalizedTitle = title.toLowerCase()
  return topicRules.filter((rule) => rule.keywords.some((keyword) => normalizedTitle.includes(keyword))).map((rule) => rule.label)
}

function extractDisease(title) {
  return diseaseRules.find((rule) => rule.pattern.test(title))?.label || null
}

function extractCountries(report) {
  const sourceText = [report.title, report.location].filter(Boolean).join(' ').toLowerCase()
  return countryRules.filter((country) => country.aliases.some((alias) => sourceText.includes(alias)))
}

function buildDiseaseLocationGroups(reports) {
  const groups = new Map()
  reports.forEach((report) => {
    const disease = extractDisease(report.title)
    if (!disease) return
    extractCountries(report).forEach((country) => {
      const key = `${disease}|${country.label}`
      if (!groups.has(key)) groups.set(key, { key, disease, country: country.label, coordinates: country.coordinates, reports: [], reportUrls: new Set() })
      const group = groups.get(key)
      if (!group.reportUrls.has(report.url)) {
        group.reportUrls.add(report.url)
        group.reports.push(report)
      }
    })
  })
  return [...groups.values()].map((group) => ({ key: group.key, disease: group.disease, country: group.country, coordinates: group.coordinates, reportCount: group.reports.length, reports: [...group.reports].sort((a, b) => Date.parse(b.publicationDate || '') - Date.parse(a.publicationDate || '')) }))
}

async function fetchDashboard(forceRefresh = false) {
  const endpoint = forceRefresh ? `${DASHBOARD_ENDPOINT}?refresh=1` : DASHBOARD_ENDPOINT
  const response = await fetch(endpoint)
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(payload?.error?.message || `Dashboard request failed (${response.status})`)
  if (!payload || payload.schemaVersion !== '2.0' || !Array.isArray(payload.reports) || !payload.summary) throw new Error('Dashboard response did not match the expected contract')
  return payload
}

function BrandMark() { return <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span> }

function StatCard({ label, value, detail, icon, tone = 'green' }) {
  return <article className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-footer"><span className={`change ${tone}`}>{tone === 'amber' ? 'Source' : 'WHO'}</span><span>{detail}</span></div></article>
}

function Notice({ state, error }) {
  if (state === 'loading') return <div className="api-notice loading" role="status">Loading live WHO Disease Outbreak News…</div>
  if (state === 'error') return <div className="api-notice error" role="alert"><strong>LIVE SOURCE DATA UNAVAILABLE.</strong> {error} No fabricated reports are being shown.</div>
  return <div className="api-notice success" role="status"><strong>LIVE SOURCE DATA.</strong> Retrieved directly from WHO Disease Outbreak News. Publication volume is not a case count.</div>
}

function ReportCard({ report, compact = false }) {
  const hasOfficialUrl = isOfficialWhoUrl(report.url)
  return <article className={`panel report-card ${compact ? 'compact' : ''}`}><div className="report-card-top"><span className="report-date">{formatDate(report.publicationDate)}</span><span className="source-chip">WHO DON</span></div><h3>{report.title}</h3><p>{report.location ? `Location: ${report.location}` : 'Location not provided by source'}</p>{hasOfficialUrl ? <a className="source-link" href={report.url} target="_blank" rel="noreferrer">Read official publication <span>↗</span></a> : <span className="source-unavailable">Official link not available</span>}</article>
}

function RiskMap({ groups, state, totalReports }) {
  const [selectedGroup, setSelectedGroup] = useState(null)
  const recurringGroups = groups.filter((group) => group.reportCount >= 2)
  const handleMarkerClick = (group) => setSelectedGroup(group)
  return <section className="panel risk-map-panel"><div className="risk-map-heading"><div><span className="section-kicker">WHO REPORT LOCATIONS</span><h3>Reported outbreak locations</h3><p>Approximate country-level markers are derived only from clearly named countries in WHO report titles.</p></div><span className="map-status">{groups.length} groups mapped</span></div><div className="risk-map-layout"><div className="map-frame"><MapContainer center={[20, 0]} zoom={2} minZoom={2} maxZoom={7} scrollWheelZoom={false} className="risk-map"><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Pane name="diseaseMarkers" style={{ zIndex: 650, pointerEvents: 'auto' }}>{groups.map((group) => <CircleMarker key={group.key} center={group.coordinates} pane="diseaseMarkers" interactive bubblingMouseEvents={false} radius={group.reportCount >= 2 ? Math.min(10 + group.reportCount, 18) : 6} pathOptions={{ color: group.reportCount >= 2 ? '#1b7956' : '#3d9cad', fillColor: group.reportCount >= 2 ? '#50c28b' : '#69c9d4', fillOpacity: .82, weight: 2 }} eventHandlers={{ click: () => handleMarkerClick(group), mouseover: (event) => event.target.bringToFront() }} />)}</Pane>{selectedGroup ? <Popup position={selectedGroup.coordinates} eventHandlers={{ remove: () => setSelectedGroup(null) }}><strong>{selectedGroup.disease}</strong><br />{selectedGroup.country} · approximate country-level location<br />{selectedGroup.reportCount} distinct WHO reports{selectedGroup.reports.map((report) => <div key={report.url}>{formatDate(report.publicationDate)}{isOfficialWhoUrl(report.url) ? <><br /><a href={report.url} target="_blank" rel="noreferrer">Read official WHO report ↗</a></> : null}</div>)}</Popup> : null}</MapContainer>{state === 'loading' ? <div className="map-overlay" role="status">Loading WHO report locations…</div> : state === 'error' ? <div className="map-overlay" role="alert">WHO source unavailable. No markers are shown.</div> : groups.length === 0 ? <div className="map-overlay"><strong>No mappable disease-location groups</strong><span>The current response did not contain a clearly recognized disease and country pairing. State-level markers are deferred because no state dataset is available.</span></div> : null}</div><aside className="risk-map-summary"><div className="map-summary-value">{recurringGroups.length}</div><div className="map-summary-label">RECURRING GROUPS</div><p>{totalReports} WHO publications are available to review. Recurrence means distinct source publications sharing a normalized disease and country; it is not validated outbreak risk.</p><div className="map-legend"><span className="map-legend-dot recurring" /> 2+ distinct reports</div><div className="map-legend"><span className="map-legend-dot single" /> 1 distinct report</div><small>Map tiles © OpenStreetMap contributors. Country locations are approximate. No user location is used.</small></aside></div></section>
}

function OverviewView({ data, reports = [], state, error, onRefresh, onExplore }) {
  const freshLabel = state === 'success' && data.fetchedAt ? `${formatTimestamp(data.fetchedAt)} · source fetch time` : state === 'loading' ? 'Waiting for source response' : 'Unavailable until source responds'
  const latestDate = state === 'success' ? latestPublicationDate(reports) : null
  const sourceLabel = state === 'success' ? 'Live' : state === 'loading' ? 'Checking' : 'Unavailable'
  return <><section className="welcome-row"><div><span className="section-kicker">OVERVIEW</span><h2>Outbreak Intelligence Overview</h2><p>Inspect authoritative WHO publications and source freshness without turning publication metadata into epidemiological measurements.</p></div><span className={`live-tag ${state !== 'success' ? 'tag-muted' : ''}`}>{state === 'success' ? 'LIVE SOURCE DATA' : state === 'loading' ? 'CHECKING SOURCE' : 'SOURCE UNAVAILABLE'}</span></section><Notice state={state} error={error} /><section className="stats-grid" aria-label="WHO source metrics"><StatCard label="WHO PUBLICATIONS" value={state === 'success' ? data.summary.retrievedPublications : '—'} detail="retrieved reports" icon="▤" /><StatCard label="SOURCE STATUS" value={sourceLabel} detail="WHO endpoint" icon="◉" tone={state === 'success' ? 'green' : 'amber'} /><StatCard label="LATEST PUBLICATION" value={latestDate ? formatDate(latestDate) : '—'} detail={latestDate ? 'date from source' : 'no reliable date'} icon="◷" tone="blue" /><StatCard label="CASE COUNTS" value="Not used" detail="publication count ≠ cases" icon="✓" tone="slate" /></section><section className="section-grid view-grid"><article className="panel view-card"><span className="section-kicker">SOURCE HEALTH</span><h3>WHO Disease Outbreak News</h3><p>Official reports covering confirmed and potential acute public-health events. EpidemicPulse does not infer incidence, severity, or outbreak status from publication volume.</p><a className="source-link" href={data.sourceUrl} target="_blank" rel="noreferrer">Open official source <span>↗</span></a></article><article className="panel view-card"><span className="section-kicker">DATA FRESHNESS</span><h3>{state === 'success' ? 'Last successful retrieval' : 'No successful retrieval'}</h3><p className="freshness-value">{freshLabel}</p><button className="primary-button" onClick={onRefresh} disabled={state === 'loading'}>Refresh WHO data</button></article></section><section className="panel overview-reports"><div className="recent-reports-header"><div><span className="section-kicker">RECENT REPORTS</span><h3>Latest WHO publications</h3><p>Source titles and available metadata only; publication count is not a case count.</p></div><button className="text-button" onClick={onExplore} disabled={state !== 'success'}>Explore Live Intelligence <span>→</span></button></div>{state !== 'success' ? null : reports.length === 0 ? <div className="empty-state">WHO returned no publications in the current response.</div> : <div className="recent-report-list">{reports.slice(0, 5).map((report) => <ReportCard key={report.url} report={report} compact />)}</div>}</section></>
}

function LiveIntelligenceView({ reports, state, error, sourceUrl }) {
  return <><section className="view-heading"><div><span className="section-kicker">LIVE INTELLIGENCE</span><h2>WHO Disease Outbreak News</h2><p>Official publication metadata only. Open each report at WHO for the authoritative content.</p></div><span className="live-tag">LIVE SOURCE DATA</span></section>{state !== 'success' ? <Notice state={state} error={error} /> : reports.length === 0 ? <div className="panel empty-state large">WHO returned no publications in the current response. <a href={sourceUrl} target="_blank" rel="noreferrer">Check the official source.</a></div> : <div className="report-grid">{reports.map((report) => <ReportCard key={report.url} report={report} />)}</div>}</>
}

function SignalMonitoringView({ reports = [], state, error, sourceUrl }) {
  const [search, setSearch] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('All topics')
  const [selectedDisease, setSelectedDisease] = useState('All diseases')
  const [recurrenceFilter, setRecurrenceFilter] = useState('All reports')
  const searchedReports = reports.filter((report) => {
    const searchableText = [report.title, report.location, report.source, report.id].filter(Boolean).join(' ').toLowerCase()
    const matchesSearch = searchableText.includes(search.trim().toLowerCase())
    const keywords = extractedKeywords(report.title)
    const matchesDisease = selectedDisease === 'All diseases' || extractDisease(report.title) === selectedDisease
    return matchesSearch && (selectedTopic === 'All topics' || keywords.includes(selectedTopic)) && matchesDisease
  })
  const searchedGroups = buildDiseaseLocationGroups(searchedReports)
  const recurringKeys = new Set(searchedGroups.filter((group) => group.reportCount >= 2).map((group) => group.key))
  const filteredReports = recurrenceFilter === '2+ reports' ? searchedReports.filter((report) => extractCountries(report).some((country) => recurringKeys.has(`${extractDisease(report.title)}|${country.label}`))) : searchedReports
  const topicOptions = ['All topics', ...topicRules.map((rule) => rule.label)]
  const diseaseOptions = ['All diseases', ...new Set(reports.map((report) => extractDisease(report.title)).filter(Boolean))]
  const hasFilters = search.trim().length > 0 || selectedTopic !== 'All topics' || selectedDisease !== 'All diseases' || recurrenceFilter !== 'All reports'
  const resetFilters = () => { setSearch(''); setSelectedTopic('All topics'); setSelectedDisease('All diseases'); setRecurrenceFilter('All reports') }
  const mapGroups = buildDiseaseLocationGroups(filteredReports).filter((group) => recurrenceFilter !== '2+ reports' || group.reportCount >= 2)

  return <><section className="view-heading"><div><span className="section-kicker">SIGNAL MONITORING</span><h2>Search source evidence</h2><p>Explore real WHO publication metadata without inferring incidence, severity, transmission, or geographic risk.</p></div><span className="live-tag">LIVE SOURCE DATA</span></section><div className="panel monitoring-panel"><div className="monitoring-controls"><label htmlFor="report-search">Search available report text<input id="report-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, source, or location" /></label><label htmlFor="topic-filter">Inferred topic filter<select id="topic-filter" value={selectedTopic} onChange={(event) => setSelectedTopic(event.target.value)}>{topicOptions.map((topic) => <option key={topic}>{topic}</option>)}</select></label><label htmlFor="disease-filter">Disease filter<select id="disease-filter" value={selectedDisease} onChange={(event) => setSelectedDisease(event.target.value)}>{diseaseOptions.map((disease) => <option key={disease}>{disease}</option>)}</select></label><label htmlFor="recurrence-filter">Recurrence<select id="recurrence-filter" value={recurrenceFilter} onChange={(event) => setRecurrenceFilter(event.target.value)}><option>All reports</option><option>2+ reports</option></select></label></div><div className="filter-summary"><p className="filter-note"><strong>Inferred keywords are title-based labels, not confirmed classifications.</strong> Showing {filteredReports.length} of {reports.length} WHO publications.</p><button className="reset-button" onClick={resetFilters} disabled={!hasFilters}>Reset filters</button></div></div><RiskMap groups={mapGroups} state={state} totalReports={filteredReports.length} />{state !== 'success' ? <Notice state={state} error={error} /> : reports.length === 0 ? <div className="panel empty-state large">WHO returned no publications. <a href={sourceUrl} target="_blank" rel="noreferrer">Check the official source.</a></div> : filteredReports.length === 0 ? <div className="panel empty-state large">No WHO publications match the current filters. <button className="text-button" onClick={resetFilters}>Reset filters</button></div> : <div className="report-grid">{filteredReports.map((report) => <article className="panel report-card" key={report.url}><div className="report-card-top"><span className="report-date">{formatDate(report.publicationDate)}</span><span className="source-chip">WHO DON</span></div><h3>{report.title}</h3><p>{report.location ? `Location: ${report.location}` : 'Location not provided by source'}</p><div className="keyword-area"><span className="keyword-label">INFERRED KEYWORDS FROM TITLE</span>{extractedKeywords(report.title).length ? extractedKeywords(report.title).map((keyword) => <span className="keyword-chip" key={keyword}>{keyword}</span>) : <span className="keyword-none">No recognized title keyword</span>}</div>{isOfficialWhoUrl(report.url) ? <a className="source-link" href={report.url} target="_blank" rel="noreferrer">Read official publication <span>↗</span></a> : <span className="source-unavailable">Official link not available</span>}</article>)}</div>}<div className="framework-grid monitoring-framework"><article className="panel framework-card"><span className="framework-number">01</span><h3>Source evidence</h3><p>Review the publication title, available date, and official URL before forming a question.</p></article><article className="panel framework-card"><span className="framework-number">02</span><h3>Context check</h3><p>Search matches and publication frequency help exploration only; they do not establish severity, incidence, transmission, or geographic risk.</p></article><article className="panel framework-card"><span className="framework-number">03</span><h3>Human review</h3><p>Record uncertainty and competing explanations. Inferred keywords are not confirmed facts.</p></article></div></>
}

function AlertsView() {
  const [step, setStep] = useState(1)
  return <><section className="view-heading"><div><span className="section-kicker">ALERTS & INVESTIGATIONS</span><h2>Investigation workspace</h2><p>A structured place to record questions for review; no live alerts are generated here.</p></div><span className="demo-tag">DEMO DATA</span></section><div className="workflow"><div className={`workflow-step ${step >= 1 ? 'active' : ''}`}><span>1</span><strong>Frame question</strong><small>Define what needs review</small></div><div className={`workflow-step ${step >= 2 ? 'active' : ''}`}><span>2</span><strong>Review evidence</strong><small>Open official sources</small></div><div className={`workflow-step ${step >= 3 ? 'active' : ''}`}><span>3</span><strong>Record outcome</strong><small>Capture uncertainty</small></div></div><div className="section-grid view-grid"><article className="panel view-card demo-record"><div className="card-row"><span className="demo-tag">DEMO DATA</span><span className="record-status">Needs review</span></div><h3>Example investigation record</h3><p>This placeholder demonstrates workflow only. It is not an observed alert, outbreak, case count, or public-health finding.</p><button className="primary-button" onClick={() => setStep((current) => current === 3 ? 1 : current + 1)}>Advance workflow</button></article><article className="panel view-card"><span className="section-kicker">EVIDENCE RULE</span><h3>Keep source and interpretation separate</h3><p>Every investigation note should link to the underlying official publication and distinguish what the source says from what the analyst is asking.</p><button className="text-button" onClick={() => setStep(2)}>Mark evidence reviewed <span>→</span></button></article></div></> 
}

function SimulationView() {
  const [scenario, setScenario] = useState('One illustrative location')
  const [horizon, setHorizon] = useState('14')
  const [ran, setRan] = useState(false)
  return <><section className="view-heading"><div><span className="section-kicker">SIMULATION LAB</span><h2>Explore a hypothetical scenario</h2><p>Sandbox output is isolated from WHO publications and all source metrics.</p></div><span className="simulation-tag">SIMULATION</span></section><div className="section-grid view-grid"><article className="panel simulator"><label htmlFor="scenario">Scenario label</label><select id="scenario" value={scenario} onChange={(event) => setScenario(event.target.value)}><option>One illustrative location</option><option>Two illustrative locations</option><option>Uncertain source signal</option></select><label htmlFor="horizon">Time horizon</label><select id="horizon" value={horizon} onChange={(event) => setHorizon(event.target.value)}><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select><button className="primary-button" onClick={() => setRan(true)}>Run isolated simulation</button></article><article className="panel simulation-output"><span className="simulation-tag">SIMULATION</span>{ran ? <><h3>Illustrative scenario ready</h3><p><strong>{scenario}</strong> over a hypothetical {horizon}-day horizon.</p><div className="simulation-placeholder">No real-world forecast, case estimate, or WHO data is used in this output.</div></> : <div className="empty-state large">Configure a scenario to generate isolated placeholder output.</div>}</article></div></>
}

function AboutView() {
  return <><section className="view-heading"><div><span className="section-kicker">ABOUT EPIDEMICPULSE</span><h2>Public-health intelligence, with provenance.</h2><p>A product shell for reviewing authoritative publications and documenting the questions they raise.</p></div></section><div className="framework-grid"><article className="panel framework-card"><span className="section-kicker">PURPOSE</span><h3>Make evidence easier to inspect</h3><p>The dashboard organizes source publications, freshness, provenance, and review workflows without turning publication metadata into epidemiological claims.</p></article><article className="panel framework-card"><span className="section-kicker">DATA SOURCE</span><h3>World Health Organization</h3><p>Live reports come from the official WHO Disease Outbreak News structured endpoint and link back to the official publication.</p><a className="source-link" href="https://www.who.int/emergencies/disease-outbreak-news" target="_blank" rel="noreferrer">Visit WHO Disease Outbreak News <span>↗</span></a></article><article className="panel framework-card"><span className="section-kicker">METHODOLOGY</span><h3>Fetch, validate, cache, disclose</h3><p>The server validates titles and WHO URLs, deduplicates by stable URL, applies a short cache, and reports source failures explicitly.</p></article></div><div className="panel limitation-panel"><span className="section-kicker">LIMITATIONS</span><h3>Important context</h3><p>WHO Disease Outbreak News is not an exhaustive list of all events WHO responds to. This application does not provide clinical advice, independent verification, case estimates, or automated outbreak detection.</p></div></>
}

function LandingPage({ onEnterDashboard }) {
  return <div className="landing-page">
    <header className="landing-header"><a className="landing-brand" href="#top" aria-label="EpidemicPulse home"><BrandMark /><span>Epidemic<span className="brand-accent">Pulse</span></span></a><nav className="landing-nav" aria-label="Landing page navigation"><a href="#top">Home</a><a href="#capabilities">Capabilities</a><a href="#methodology">Methodology</a><a href="#sources">Sources</a></nav><button className="landing-header-cta" onClick={onEnterDashboard}>Explore Intelligence <span>↗</span></button></header>
    <main id="top">
      <section className="landing-hero"><div className="hero-copy"><div className="hero-kicker"><span className="hero-kicker-line" /> GLOBAL OUTBREAK INTELLIGENCE</div><h1>See the signals.<br /><em>Understand the outbreaks.</em></h1><p className="hero-lede">Explore authoritative outbreak reports, identify signals worth reviewing, and keep source evidence separate from interpretation.</p><div className="hero-actions"><button className="hero-primary" onClick={onEnterDashboard}>Explore Intelligence <span>→</span></button><a className="hero-secondary" href="#methodology">How It Works <span>↓</span></a></div><p className="hero-note"><span className="note-dot" /> A research interface for source review — not a clinical decision tool.</p></div><div className="hero-visual" aria-label="Illustrative global intelligence visualization" role="img"><div className="visual-caption"><span className="live-pulse" /> ILLUSTRATIVE VIEW <small>NOT LIVE MAP DATA</small></div><div className="globe-grid" /><div className="globe-land land-one" /><div className="globe-land land-two" /><div className="globe-land land-three" /><svg className="network-lines" viewBox="0 0 560 490" aria-hidden="true"><path d="M105 254 C165 170 245 155 321 226 S430 288 493 185" /><path d="M142 335 C225 284 268 220 360 172 S438 140 489 235" /><path d="M178 126 C252 178 285 304 396 358" /></svg><span className="signal-marker marker-one" /><span className="signal-marker marker-two" /><span className="signal-marker marker-three" /><span className="signal-marker marker-four" /><div className="globe-sheen" /></div></section>
      <section className="landing-trust"><span>DESIGNED FOR CAREFUL REVIEW</span><span className="trust-rule" /><span>WHO DISEASE OUTBREAK NEWS</span><span className="trust-rule" /><span>PROVENANCE-FIRST WORKFLOW</span></section>
      <section className="landing-section capability-section" id="capabilities"><div className="section-intro"><span className="landing-kicker">A CALMER WAY TO LOOK CLOSER</span><h2>From publication to perspective.</h2><p>The console is built around the difference between what a source says and what an analyst still needs to understand.</p></div><div className="capability-grid"><article><span className="capability-index">01</span><h3>Read the source</h3><p>Review current WHO publication metadata with the official document always one click away.</p><a href="#sources">View provenance <span>↗</span></a></article><article><span className="capability-index">02</span><h3>Frame the question</h3><p>Use explainable topic labels and a structured workflow without turning volume into incidence.</p><a href="#methodology">See the method <span>↗</span></a></article><article><span className="capability-index">03</span><h3>Keep uncertainty visible</h3><p>Separate source evidence, analyst notes, and isolated simulations at every step.</p><a href="#methodology">Read the principles <span>↗</span></a></article></div></section>
      <section className="landing-section methodology-section" id="methodology"><div className="methodology-copy"><span className="landing-kicker">THE EVIDENCE LOOP</span><h2>Useful because it knows what it does not know.</h2><p>EpidemicPulse is intentionally transparent: it retrieves, validates, and presents source material. It does not estimate cases, assign severity, or replace public-health guidance.</p><button className="outline-dark-button" onClick={onEnterDashboard}>Explore Intelligence <span>→</span></button></div><div className="methodology-steps"><div><span>01</span><strong>Retrieve</strong><p>Fetch source publications through a server-side, cached connection.</p></div><div><span>02</span><strong>Validate</strong><p>Preserve official titles, available dates, and canonical links.</p></div><div><span>03</span><strong>Disclose</strong><p>Label live source data, demo records, and simulation output distinctly.</p></div></div></section>
      <section className="landing-source-section" id="sources"><div><span className="landing-kicker">SOURCE TRANSPARENCY</span><h2>One authoritative starting point.</h2><p>Live publication metadata is retrieved from the World Health Organization Disease Outbreak News source. Counts shown in the console refer to retrieved publications, never confirmed cases.</p></div><a className="source-card" href="https://www.who.int/emergencies/disease-outbreak-news" target="_blank" rel="noreferrer"><span className="source-card-label">OFFICIAL SOURCE</span><strong>WHO Disease Outbreak News</strong><span>Open source ↗</span></a></section>
    </main>
    <footer className="landing-footer"><span><BrandMark /> Epidemic<span className="brand-accent">Pulse</span></span><span>Source-aware demo · Not for clinical decision-making</span><span>© 2025 EpidemicPulse</span></footer>
  </div>
}

function App() {
  const [route, setRoute] = useState(readRoute)
  const [activePage, setActivePage] = useState(() => readRoute().page)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dashboard, setDashboard] = useState(emptyDashboard)
  const [requestState, setRequestState] = useState('loading')
  const [requestError, setRequestError] = useState('')
  const [lastRefreshed, setLastRefreshed] = useState(null)

  const loadDashboard = useCallback(async (forceRefresh = false) => {
    setRequestState('loading')
    setRequestError('')
    try {
      const payload = await fetchDashboard(forceRefresh)
      setDashboard(payload)
      setRequestState(payload.dataMode === 'live' ? 'success' : 'error')
      if (payload.error) setRequestError(payload.error.message)
      setLastRefreshed(new Date())
    } catch (error) {
      setDashboard(emptyDashboard)
      setRequestState('error')
      setRequestError(error instanceof Error ? error.message : 'The WHO source could not be reached.')
      setLastRefreshed(new Date())
    }
  }, [])

  useEffect(() => { const timeoutId = window.setTimeout(() => loadDashboard(), 0); return () => window.clearTimeout(timeoutId) }, [loadDashboard])

  useEffect(() => {
    const handlePopState = () => { const nextRoute = readRoute(); setRoute(nextRoute); setActivePage(nextRoute.page) }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigateTo = (path) => {
    window.history.pushState({}, '', path)
    const nextRoute = readRoute()
    setRoute(nextRoute)
    setActivePage(nextRoute.page)
    setMenuOpen(false)
  }

  if (route.type === 'landing') return <LandingPage onEnterDashboard={() => navigateTo('/dashboard')} />

  const renderView = () => {
    if (activePage === 'Live Intelligence') return <LiveIntelligenceView reports={dashboard.reports} state={requestState} error={requestError} sourceUrl={dashboard.sourceUrl} />
    if (activePage === 'Signal Monitoring') return <SignalMonitoringView reports={dashboard.reports} state={requestState} error={requestError} sourceUrl={dashboard.sourceUrl} />
    if (activePage === 'Alerts & Investigations') return <AlertsView />
    if (activePage === 'Simulation Lab') return <SimulationView />
    if (activePage === 'About') return <AboutView />
    return <OverviewView data={dashboard} reports={dashboard.reports} state={requestState} error={requestError} onRefresh={() => loadDashboard(true)} onExplore={() => navigateTo(`/dashboard?view=${pageRoutes['Live Intelligence']}`)} />
  }

  return <div className="app-shell"><aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}><a className="brand" href="/" onClick={(event) => { event.preventDefault(); navigateTo('/') }} aria-label="Return to EpidemicPulse home"><BrandMark /><span>Epidemic<span className="brand-accent">Pulse</span></span></a><div className="workspace-label">WORKSPACE</div><nav aria-label="Primary navigation"><a className="nav-home" href="/" onClick={(event) => { event.preventDefault(); navigateTo('/') }}>Home</a>{navigation.map((item) => <button key={item.label} className={`nav-item ${activePage === item.label ? 'active' : ''}`} onClick={() => navigateTo(`/dashboard?view=${pageRoutes[item.label]}`)}><span className="nav-icon">{item.icon}</span><span>{item.label}</span></button>)}</nav><div className="sidebar-bottom"><div className="demo-note"><span className="demo-dot" /> SOURCE-AWARE DASHBOARD<div>WHO data is never presented as case counts</div></div><div className="user-row"><div className="avatar">AR</div><div><strong>Analyst workspace</strong><small>Public health team</small></div><span className="more">•••</span></div></div></aside><main className="main-content"><header className="topbar"><button className="mobile-menu" aria-label="Open navigation" onClick={() => setMenuOpen(!menuOpen)}>☰</button><div><div className="eyebrow">INTELLIGENCE DASHBOARD</div><h1>{activePage}</h1></div><div className="topbar-actions"><span className={`status-pill ${requestState === 'success' ? 'source-live' : 'source-offline'}`}><span className="live-dot" /> {requestState === 'success' ? 'WHO source available' : requestState === 'loading' ? 'Connecting to WHO' : 'WHO source unavailable'}</span><span className="topbar-divider" /><span className="refresh-time">{lastRefreshed ? `Checked ${formatTimestamp(lastRefreshed)}` : 'Not checked'}</span><button className="refresh-button" onClick={() => loadDashboard(true)} disabled={requestState === 'loading'} aria-label="Refresh WHO reports">↻ <span>Refresh</span></button></div></header><div className="content">{renderView()}<footer><span>© 2025 EpidemicPulse</span><span><span className="footer-dot" /> Source-aware demo · Not for clinical decision-making</span><span>Privacy <i>·</i> Documentation</span></footer></div></main></div>
}

export default App
