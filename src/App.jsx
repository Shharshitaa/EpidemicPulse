import { useCallback, useEffect, useState } from 'react'
import './App.css'

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

const topicRules = [
  { label: 'Respiratory', keywords: ['respiratory', 'pneumonia', 'influenza', 'coronavirus', 'covid'] },
  { label: 'Viral', keywords: ['virus', 'viral', 'ebola', 'nipah', 'measles'] },
  { label: 'Vector-borne', keywords: ['malaria', 'dengue', 'yellow fever', 'mosquito'] },
  { label: 'Food/water', keywords: ['cholera', 'foodborne', 'waterborne'] },
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

function extractedKeywords(title) {
  const normalizedTitle = title.toLowerCase()
  return topicRules.filter((rule) => rule.keywords.some((keyword) => normalizedTitle.includes(keyword))).map((rule) => rule.label)
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

function OverviewView({ data, state, error, onRefresh }) {
  const freshLabel = data.fetchedAt ? `${formatTimestamp(data.fetchedAt)} · source fetch time` : 'Waiting for source response'
  return <><section className="welcome-row"><div><h2>Public-health source overview.</h2><p>WHO publications are shown as source documents, not epidemiological measurements.</p></div><span className="live-tag">LIVE SOURCE DATA</span></section><Notice state={state} error={error} /><section className="stats-grid" aria-label="WHO source metrics"><StatCard label="WHO PUBLICATIONS" value={data.summary.retrievedPublications} detail="retrieved reports" icon="▤" /><StatCard label="SOURCE STATUS" value={state === 'success' ? 'Live' : 'Offline'} detail="WHO endpoint" icon="◉" tone={state === 'success' ? 'green' : 'amber'} /><StatCard label="DATA FRESHNESS" value={data.fetchedAt ? 'Current' : '—'} detail={freshLabel} icon="◷" tone="blue" /><StatCard label="CASE COUNTS" value="Not used" detail="publication count ≠ cases" icon="✓" tone="slate" /></section><section className="section-grid view-grid"><article className="panel view-card"><span className="section-kicker">SOURCE HEALTH</span><h3>WHO Disease Outbreak News</h3><p>Official reports covering confirmed and potential acute public-health events. EpidemicPulse does not infer incidence, severity, or outbreak status from the number of publications.</p><a className="source-link" href={data.sourceUrl} target="_blank" rel="noreferrer">Open official source <span>↗</span></a></article><article className="panel view-card"><span className="section-kicker">DATA FRESHNESS</span><h3>{data.fetchedAt ? 'Last successful retrieval' : 'No successful retrieval yet'}</h3><p className="freshness-value">{freshLabel}</p><button className="primary-button" onClick={onRefresh} disabled={state === 'loading'}>Refresh WHO data</button></article></section></>
}

function LiveIntelligenceView({ reports, state, error, sourceUrl }) {
  return <><section className="view-heading"><div><span className="section-kicker">LIVE INTELLIGENCE</span><h2>WHO Disease Outbreak News</h2><p>Official publication metadata only. Open each report at WHO for the authoritative content.</p></div><span className="live-tag">LIVE SOURCE DATA</span></section>{state !== 'success' ? <Notice state={state} error={error} /> : reports.length === 0 ? <div className="panel empty-state large">WHO returned no publications in the current response. <a href={sourceUrl} target="_blank" rel="noreferrer">Check the official source.</a></div> : <div className="report-grid">{reports.map((report) => <article className="panel report-card" key={report.url}><div className="report-card-top"><span className="report-date">{formatDate(report.publicationDate)}</span><span className="source-chip">WHO DON</span></div><h3>{report.title}</h3><p>{report.location || 'Location not provided by source'}</p><a className="source-link" href={report.url} target="_blank" rel="noreferrer">Read official publication <span>↗</span></a></article>)}</div>}</>
}

function SignalMonitoringView({ reports, state, error, sourceUrl }) {
  const [search, setSearch] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('All topics')
  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.title.toLowerCase().includes(search.trim().toLowerCase())
    const keywords = extractedKeywords(report.title)
    return matchesSearch && (selectedTopic === 'All topics' || keywords.includes(selectedTopic))
  })
  const topicOptions = ['All topics', ...topicRules.map((rule) => rule.label)]

  return <><section className="view-heading"><div><span className="section-kicker">SIGNAL MONITORING</span><h2>Search source evidence</h2><p>Filter real WHO publication titles without inferring incidence, severity, or outbreak status.</p></div><span className="live-tag">LIVE SOURCE DATA</span></section><div className="panel monitoring-panel"><div className="monitoring-controls"><label htmlFor="report-search">Search titles<input id="report-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try a disease or topic keyword" /></label><label htmlFor="topic-filter">Topic filter<select id="topic-filter" value={selectedTopic} onChange={(event) => setSelectedTopic(event.target.value)}>{topicOptions.map((topic) => <option key={topic}>{topic}</option>)}</select></label></div><p className="filter-note"><strong>Extracted keywords are title-based labels, not confirmed facts.</strong> Showing {filteredReports.length} of {reports.length} WHO publications.</p></div>{state !== 'success' ? <Notice state={state} error={error} /> : reports.length === 0 ? <div className="panel empty-state large">WHO returned no publications. <a href={sourceUrl} target="_blank" rel="noreferrer">Check the official source.</a></div> : filteredReports.length === 0 ? <div className="panel empty-state large">No WHO publication titles match the current search and topic filter.</div> : <div className="report-grid">{filteredReports.map((report) => <article className="panel report-card" key={report.url}><div className="report-card-top"><span className="report-date">{formatDate(report.publicationDate)}</span><span className="source-chip">WHO DON</span></div><h3>{report.title}</h3><p>Location: {report.location || 'Not provided by source'}</p><div className="keyword-area"><span className="keyword-label">EXTRACTED KEYWORDS</span>{extractedKeywords(report.title).length ? extractedKeywords(report.title).map((keyword) => <span className="keyword-chip" key={keyword}>{keyword}</span>) : <span className="keyword-none">No recognized title keyword</span>}</div><a className="source-link" href={report.url} target="_blank" rel="noreferrer">Read official publication <span>↗</span></a></article>)}</div>}<div className="framework-grid monitoring-framework"><article className="panel framework-card"><span className="framework-number">01</span><h3>Source evidence</h3><p>Review the publication title, available date, and official URL before forming a question.</p></article><article className="panel framework-card"><span className="framework-number">02</span><h3>Context check</h3><p>Topic labels are derived only from words in the title; they are not independent classifications.</p></article><article className="panel framework-card"><span className="framework-number">03</span><h3>Human review</h3><p>Record uncertainty and limitations. This view does not create alerts or epidemiological estimates.</p></article></div></>
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

function App() {
  const [activePage, setActivePage] = useState('Overview')
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

  const renderView = () => {
    if (activePage === 'Live Intelligence') return <LiveIntelligenceView reports={dashboard.reports} state={requestState} error={requestError} sourceUrl={dashboard.sourceUrl} />
    if (activePage === 'Signal Monitoring') return <SignalMonitoringView reports={dashboard.reports} state={requestState} error={requestError} sourceUrl={dashboard.sourceUrl} />
    if (activePage === 'Alerts & Investigations') return <AlertsView />
    if (activePage === 'Simulation Lab') return <SimulationView />
    if (activePage === 'About') return <AboutView />
    return <OverviewView data={dashboard} state={requestState} error={requestError} onRefresh={() => loadDashboard(true)} />
  }

  return <div className="app-shell"><aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}><div className="brand"><BrandMark /><span>Epidemic<span className="brand-accent">Pulse</span></span></div><div className="workspace-label">WORKSPACE</div><nav aria-label="Primary navigation">{navigation.map((item) => <button key={item.label} className={`nav-item ${activePage === item.label ? 'active' : ''}`} onClick={() => { setActivePage(item.label); setMenuOpen(false) }}><span className="nav-icon">{item.icon}</span><span>{item.label}</span></button>)}</nav><div className="sidebar-bottom"><div className="demo-note"><span className="demo-dot" /> SOURCE-AWARE CONSOLE<div>WHO data is never presented as case counts</div></div><div className="user-row"><div className="avatar">AR</div><div><strong>Analyst workspace</strong><small>Public health team</small></div><span className="more">•••</span></div></div></aside><main className="main-content"><header className="topbar"><button className="mobile-menu" aria-label="Open navigation" onClick={() => setMenuOpen(!menuOpen)}>☰</button><div><div className="eyebrow">INTELLIGENCE CONSOLE</div><h1>{activePage}</h1></div><div className="topbar-actions"><span className={`status-pill ${requestState === 'success' ? 'source-live' : 'source-offline'}`}><span className="live-dot" /> {requestState === 'success' ? 'WHO source available' : requestState === 'loading' ? 'Connecting to WHO' : 'WHO source unavailable'}</span><span className="topbar-divider" /><span className="refresh-time">{lastRefreshed ? `Checked ${formatTimestamp(lastRefreshed)}` : 'Not checked'}</span><button className="refresh-button" onClick={() => loadDashboard(true)} disabled={requestState === 'loading'} aria-label="Refresh WHO reports">↻ <span>Refresh</span></button></div></header><div className="content">{renderView()}<footer><span>© 2025 EpidemicPulse</span><span><span className="footer-dot" /> Source-aware demo · Not for clinical decision-making</span><span>Privacy <i>·</i> Documentation</span></footer></div></main></div>
}

export default App
