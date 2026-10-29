import { useState, useEffect } from 'react'
import './LandingPage.css'

// ── Custom SVG Icons ──────────────────────────────────────────────────────────

function PulseBrandIcon() {
  return (
    <svg className="pulse-brand-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="#101B2D" stroke="#00D6C9" strokeWidth="2" />
      <path
        d="M6 16h4l2.5-5.5 4 11 3.5-8 2 4.5 2-2h4"
        stroke="#00D6C9"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="13.5" r="2" fill="#FF6B6B" />
      <circle cx="12.5" cy="10.5" r="1.5" fill="#C7F464" />
    </svg>
  )
}

function RadarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="step-icon-svg" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 10 10" />
      <path d="M12 6a6 6 0 1 0 6 6" />
      <path d="M12 10a2 2 0 1 0 2 2" />
      <line x1="12" y1="12" x2="20.5" y2="3.5" stroke="#00D6C9" strokeWidth="2.5" />
    </svg>
  )
}

function ConnectIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="step-icon-svg" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="#C7F464" strokeWidth="2.2" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="#00D6C9" strokeWidth="2.2" />
    </svg>
  )
}

function FlagReviewIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="step-icon-svg" aria-hidden="true">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill="rgba(255, 107, 107, 0.15)" />
      <line x1="4" y1="22" x2="4" y2="15" />
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke="#FF6B6B" strokeWidth="2.2" />
    </svg>
  )
}

function ShieldCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#00D6C9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feat-icon-svg" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" stroke="#C7F464" strokeWidth="2.5" />
    </svg>
  )
}

function NetworkMeshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#B8A5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feat-icon-svg" aria-hidden="true">
      <rect x="2" y="2" width="6" height="6" rx="1" />
      <rect x="16" y="2" width="6" height="6" rx="1" />
      <rect x="9" y="16" width="6" height="6" rx="1" />
      <path d="M5 8v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
      <path d="M12 12v4" stroke="#00D6C9" strokeWidth="2.5" />
    </svg>
  )
}

function HumanDossierIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feat-icon-svg" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function SignalMapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="feat-icon-svg" aria-hidden="true">
      <path d="M3 6.5 8.5 4l7 2.5L21 4v13.5L15.5 20l-7-2.5L3 20z" />
      <path d="M8.5 4v13.5M15.5 6.5V20" />
      <circle cx="12" cy="11" r="2" />
      <path d="M12 13v2" />
    </svg>
  )
}

function SimulationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="feat-icon-svg" aria-hidden="true">
      <path d="M9 3h6M10 3v6l-5.2 8.4A2.4 2.4 0 0 0 6.8 21h10.4a2.4 2.4 0 0 0 2-3.6L14 9V3" />
      <path d="M8 15h8M10 12h4" />
    </svg>
  )
}

// ── Hero Living Intelligence Network Component ────────────────────────────────

const HERO_NODES = [
  {
    id: 'node-alpha',
    cx: 410,
    cy: 140,
    region: 'Sample Region Alpha',
    sub: 'East Africa Hub',
    symptom: 'Respiratory Symptom Surge (+42%)',
    status: 'Needs Review',
    statusTone: 'coral',
    evidence: 'ER syndromic intake spike + 2 provincial wire notes',
  },
  {
    id: 'node-beta',
    cx: 460,
    cy: 280,
    region: 'Sample Region Beta',
    sub: 'Southeast Asia Hub',
    symptom: 'Febrile Rash Cluster (+28%)',
    status: 'Active Review',
    statusTone: 'teal',
    evidence: 'Regional sentinel clinic alerts; 3 health bulletins',
  },
  {
    id: 'node-gamma',
    cx: 190,
    cy: 110,
    region: 'Sample Region Gamma',
    sub: 'Central Europe Hub',
    symptom: 'Atypical Enteric Trend (+19%)',
    status: 'Monitored',
    statusTone: 'lavender',
    evidence: 'Syndromic wastewater anomaly detected',
  },
  {
    id: 'node-delta',
    cx: 140,
    cy: 270,
    region: 'Sample Region Delta',
    sub: 'South America Hub',
    symptom: 'Arboviral Vector Anomaly (+35%)',
    status: 'Needs Review',
    statusTone: 'coral',
    evidence: 'Over-the-counter analgesic demand surge',
  },
]

function LivingNetwork() {
  const [activeIdx, setActiveIdx] = useState(0)
  const [autoRotate, setAutoRotate] = useState(true)

  useEffect(() => {
    if (!autoRotate) return
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % HERO_NODES.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [autoRotate])

  const currentNode = HERO_NODES[activeIdx]

  return (
    <div
      className="living-network-wrapper"
      onMouseEnter={() => setAutoRotate(false)}
      onMouseLeave={() => setAutoRotate(true)}
      aria-label="Interactive Living Intelligence Network Visualisation"
    >
      <div className="network-status-badge">
        <span className="live-pulse-dot" />
        <span>LIVING INTELLIGENCE NETWORK · SIMULATED</span>
      </div>

      <svg
        className="network-canvas-svg"
        viewBox="0 0 600 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Gradients */}
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00D6C9" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#101B2D" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="streamGradTeal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D6C9" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#C7F464" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="streamGradCoral" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#B8A5FF" stopOpacity="0.3" />
          </linearGradient>
          {/* Node Glow */}
          <filter id="glowEffect" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient Grid Lines */}
        <g className="network-ambient-grid" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1">
          <line x1="60" y1="0" x2="60" y2="420" />
          <line x1="180" y1="0" x2="180" y2="420" />
          <line x1="300" y1="0" x2="300" y2="420" />
          <line x1="420" y1="0" x2="420" y2="420" />
          <line x1="540" y1="0" x2="540" y2="420" />
          <line x1="0" y1="80" x2="600" y2="80" />
          <line x1="0" y1="200" x2="600" y2="200" />
          <line x1="0" y1="320" x2="600" y2="320" />
        </g>

        {/* Core Radial Atmosphere */}
        <circle cx="300" cy="200" r="140" fill="url(#coreGlow)" />

        {/* Expanding Pulse Rings from Signal Core */}
        <circle cx="300" cy="200" r="50" className="pulse-ring ring-1" stroke="#00D6C9" strokeWidth="1" strokeOpacity="0.4" fill="none" />
        <circle cx="300" cy="200" r="85" className="pulse-ring ring-2" stroke="#00D6C9" strokeWidth="1" strokeOpacity="0.25" fill="none" />
        <circle cx="300" cy="200" r="125" className="pulse-ring ring-3" stroke="#B8A5FF" strokeWidth="1" strokeOpacity="0.15" fill="none" />

        {/* Connecting Curved Pathways */}
        <path d="M 300 200 Q 360 150 410 140" className="signal-pathway" stroke="rgba(0, 214, 201, 0.35)" strokeWidth="2" strokeDasharray="4 4" fill="none" />
        <path d="M 300 200 Q 390 250 460 280" className="signal-pathway" stroke="rgba(0, 214, 201, 0.35)" strokeWidth="2" strokeDasharray="4 4" fill="none" />
        <path d="M 300 200 Q 230 140 190 110" className="signal-pathway" stroke="rgba(184, 165, 255, 0.35)" strokeWidth="2" strokeDasharray="4 4" fill="none" />
        <path d="M 300 200 Q 200 245 140 270" className="signal-pathway" stroke="rgba(255, 107, 107, 0.35)" strokeWidth="2" strokeDasharray="4 4" fill="none" />

        {/* Traveling Particles along Connections */}
        <circle className="stream-particle stream-p1" r="3.5" fill="#00D6C9" filter="url(#glowEffect)">
          <animateMotion path="M 300 200 Q 360 150 410 140" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle className="stream-particle stream-p2" r="3.5" fill="#C7F464" filter="url(#glowEffect)">
          <animateMotion path="M 300 200 Q 390 250 460 280" dur="2.8s" repeatCount="indefinite" />
        </circle>
        <circle className="stream-particle stream-p3" r="3" fill="#B8A5FF" filter="url(#glowEffect)">
          <animateMotion path="M 300 200 Q 230 140 190 110" dur="3.1s" repeatCount="indefinite" />
        </circle>
        <circle className="stream-particle stream-p4" r="3.5" fill="#FF6B6B" filter="url(#glowEffect)">
          <animateMotion path="M 300 200 Q 200 245 140 270" dur="2.6s" repeatCount="indefinite" />
        </circle>

        {/* Central Intelligence Core */}
        <circle cx="300" cy="200" r="26" fill="#101B2D" stroke="#00D6C9" strokeWidth="2.5" filter="url(#glowEffect)" />
        <circle cx="300" cy="200" r="14" fill="#00D6C9" fillOpacity="0.25" />
        <circle cx="300" cy="200" r="6" fill="#00D6C9" />

        {/* Core Label */}
        <text x="300" y="240" textAnchor="middle" fill="#00D6C9" fontSize="11" fontWeight="700" letterSpacing="0.08em" fontFamily="sans-serif">
          SIGNAL CORE
        </text>

        {/* Regional Nodes */}
        {HERO_NODES.map((node, i) => {
          const isSelected = i === activeIdx
          return (
            <g
              key={node.id}
              className={`network-node-group ${isSelected ? 'is-active' : ''}`}
              onClick={() => {
                setActiveIdx(i)
                setAutoRotate(false)
              }}
              cursor="pointer"
              tabIndex="0"
              role="button"
              aria-label={`Select ${node.region}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveIdx(i)
                  setAutoRotate(false)
                }
              }}
            >
              {/* Outer selection ring */}
              {isSelected && (
                <circle
                  cx={node.cx}
                  cy={node.cy}
                  r="24"
                  fill="none"
                  stroke={node.statusTone === 'coral' ? '#FF6B6B' : node.statusTone === 'lavender' ? '#B8A5FF' : '#00D6C9'}
                  strokeWidth="1.5"
                  className="node-active-ring"
                />
              )}
              {/* Node background */}
              <circle
                cx={node.cx}
                cy={node.cy}
                r={isSelected ? "15" : "12"}
                fill="#101B2D"
                stroke={node.statusTone === 'coral' ? '#FF6B6B' : node.statusTone === 'lavender' ? '#B8A5FF' : '#00D6C9'}
                strokeWidth={isSelected ? "2.5" : "1.8"}
                filter="url(#glowEffect)"
              />
              {/* Node center pip */}
              <circle
                cx={node.cx}
                cy={node.cy}
                r="4.5"
                fill={node.statusTone === 'coral' ? '#FF6B6B' : node.statusTone === 'lavender' ? '#B8A5FF' : '#00D6C9'}
              />
              {/* Node Name */}
              <text
                x={node.cx}
                y={node.cy + 26}
                textAnchor="middle"
                fill={isSelected ? '#FFFFFF' : '#A0B2C6'}
                fontSize="11"
                fontWeight={isSelected ? '700' : '500'}
                fontFamily="sans-serif"
              >
                {node.sub}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Dynamic Floating Intelligence Card */}
      <div className={`floating-node-card tone-${currentNode.statusTone}`} role="status">
        <div className="card-flag-row">
          <span className="flag-dot" />
          <span className="flag-label">SIGNAL FLAGGED (SIMULATED)</span>
          <span className="flag-status">{currentNode.status}</span>
        </div>
        <div className="card-region-title">{currentNode.region}</div>
        <div className="card-symptom-line">
          <strong>Pattern:</strong> {currentNode.symptom}
        </div>
        <div className="card-evidence-line">
          <strong>Evidence:</strong> {currentNode.evidence}
        </div>
        <div className="card-footer-action">
          <span className="hint-text">Click node to inspect signal details</span>
        </div>
      </div>
    </div>
  )
}

// ── Live Intelligence Strip ───────────────────────────────────────────────────

function LiveMetricsStrip() {
  return (
    <section className="live-strip-section" aria-label="Simulated intelligence metrics summary">
      <div className="strip-container">
        <div className="strip-header-pill">
          <span className="pill-pulse" />
          <span>SIMULATED DEMO DATA · INDICATIVE BENCHMARK</span>
        </div>

        <div className="strip-metrics-grid">
          <div className="strip-metric-card">
            <span className="metric-numeral">24</span>
            <div className="metric-info">
              <strong className="metric-label">Regions Monitored</strong>
              <span className="metric-sub">Active syndromic sentinel zones</span>
            </div>
          </div>

          <div className="strip-divider" aria-hidden="true" />

          <div className="strip-metric-card">
            <span className="metric-numeral coral-highlight">08</span>
            <div className="metric-info">
              <strong className="metric-label">Signals Flagged</strong>
              <span className="metric-sub">Awaiting human epidemiological review</span>
            </div>
          </div>

          <div className="strip-divider" aria-hidden="true" />

          <div className="strip-metric-card">
            <span className="metric-numeral teal-highlight">06</span>
            <div className="metric-info">
              <strong className="metric-label">Sources Connected</strong>
              <span className="metric-sub">Cross-referenced surveillance feeds</span>
            </div>
          </div>

          <div className="strip-divider" aria-hidden="true" />

          <div className="strip-metric-card">
            <span className="metric-numeral mono-num">2m</span>
            <div className="metric-info">
              <strong className="metric-label">Last Refresh</strong>
              <span className="metric-sub">Automated pipeline ingestion cycle</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Interactive Intelligence Map Section ──────────────────────────────────────

const SAMPLE_LOCATIONS = [
  {
    id: 'loc-1',
    name: 'East Africa Corridor',
    territory: 'Coastal Kenya / Uganda',
    flag: '📍',
    category: 'Acute Respiratory Anomaly',
    syndrome: 'respiratory',
    trendPct: '+44%',
    timeframe: 'Last 14 Days',
    baselineText: '110 expected / 158 observed',
    evidence: [
      '38 syndromic outpatient admissions above seasonal baseline',
      'Regional clinical bulletin reporting atypical presentation',
      'Over-the-counter antipyretic sales +31% in port districts',
    ],
    status: 'Needs Review',
    statusTone: 'coral',
    limitations: 'High mobility trade corridor; surveillance density uneven between urban and rural centers.',
    mapX: 58,
    mapY: 54,
  },
  {
    id: 'loc-2',
    name: 'Mekong River Basin',
    territory: 'Southeast Asia Hub',
    flag: '📍',
    category: 'Febrile Hemorrhagic Cluster',
    syndrome: 'febrile',
    trendPct: '+29%',
    timeframe: 'Last 7 Days',
    baselineText: '45 expected / 62 observed',
    evidence: [
      'Provincial hospital reports 17 pediatric admissions with fever & rash',
      'Vector habitat index heightened due to early monsoon precipitation',
      'Cross-corroborated by independent regional surveillance alert',
    ],
    status: 'Active Review',
    statusTone: 'teal',
    limitations: 'Laboratory PCR confirmation still pending; cross-border reporting delay of 48-72h.',
    mapX: 74,
    mapY: 50,
  },
  {
    id: 'loc-3',
    name: 'Central European Basin',
    territory: 'Germany / Austria Corridor',
    flag: '📍',
    category: 'Gastrointestinal Cluster',
    syndrome: 'gastro',
    trendPct: '+18%',
    timeframe: 'Last 30 Days',
    baselineText: '320 expected / 378 observed',
    evidence: [
      'Municipal wastewater monitoring flagged elevated norovirus/rotavirus RNA',
      'School absenteeism reported in two adjacent administrative districts',
      'Early clinical notes indicate foodborne distribution possibility',
    ],
    status: 'Monitored',
    statusTone: 'lavender',
    limitations: 'High baseline testing frequency; potential reporting artifact from holiday gatherings.',
    mapX: 49,
    mapY: 34,
  },
  {
    id: 'loc-4',
    name: 'Amazonian Border Basin',
    territory: 'Brazil / Peru Boundary',
    flag: '📍',
    category: 'Arboviral Vector Anomaly',
    syndrome: 'febrile',
    trendPct: '+37%',
    timeframe: 'Last 14 Days',
    baselineText: '60 expected / 82 observed',
    evidence: [
      'Community health worker sentinel logs reflect sudden onset fevers',
      'Remote satellite imagery confirms localized river overflow pockets',
      'Secondary pharmacy distributor reports supply exhaustion of analgesics',
    ],
    status: 'Needs Review',
    statusTone: 'coral',
    limitations: 'Sparse telecommunications coverage; relies on periodic batch telemetry uploads.',
    mapX: 30,
    mapY: 62,
  },
  {
    id: 'loc-5',
    name: 'North American Great Lakes',
    territory: 'US / Canada Transit Hub',
    flag: '📍',
    category: 'Atypical Influenza-Like Illness',
    syndrome: 'respiratory',
    trendPct: '+21%',
    timeframe: 'Last 7 Days',
    baselineText: '410 expected / 496 observed',
    evidence: [
      'Emergency room chief complaint data indicates surge in dry cough & fatigue',
      'Genomic sequencing sentinel network awaiting preliminary viral typing',
      'Telehealth intake triage trends +25% week-over-week',
    ],
    status: 'Active Review',
    statusTone: 'teal',
    limitations: 'Broad syndromic overlap with seasonal rhinovirus and pollen indices.',
    mapX: 24,
    mapY: 36,
  },
]

function InteractiveSignalMap() {
  const [selectedId, setSelectedId] = useState('loc-1')
  const [syndromeFilter, setSyndromeFilter] = useState('all')
  const [timeRange, setTimeRange] = useState('14d')

  const filteredLocations = SAMPLE_LOCATIONS.filter((loc) => {
    if (syndromeFilter !== 'all' && loc.syndrome !== syndromeFilter) return false
    return true
  })

  // Selected location details (fallback to first filtered if current is filtered out)
  const activeLocation =
    filteredLocations.find((l) => l.id === selectedId) || filteredLocations[0] || SAMPLE_LOCATIONS[0]

  return (
    <section className="signal-map-section" id="signals-map">
      <div className="section-header-block">
        <span className="section-kicker">SPATIAL PATTERN RECOGNITION</span>
        <h2 className="section-title">See the signals. Understand the patterns.</h2>
        <p className="section-subtext">
          Select sample surveillance sectors to inspect symptom trajectories, contributing multi-source indicators, and transparent evidence gaps.
        </p>
      </div>

      {/* Filter and Time Range Toolbar */}
      <div className="map-controls-toolbar">
        <div className="filter-group">
          <span className="filter-group-label">Syndrome Category:</span>
          <button
            className={`filter-chip ${syndromeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSyndromeFilter('all')}
          >
            All Syndromes
          </button>
          <button
            className={`filter-chip ${syndromeFilter === 'respiratory' ? 'active' : ''}`}
            onClick={() => setSyndromeFilter('respiratory')}
          >
            Respiratory
          </button>
          <button
            className={`filter-chip ${syndromeFilter === 'febrile' ? 'active' : ''}`}
            onClick={() => setSyndromeFilter('febrile')}
          >
            Febrile Rash
          </button>
          <button
            className={`filter-chip ${syndromeFilter === 'gastro' ? 'active' : ''}`}
            onClick={() => setSyndromeFilter('gastro')}
          >
            Gastrointestinal
          </button>
        </div>

        <div className="filter-group">
          <span className="filter-group-label">Time Window:</span>
          <div className="segmented-control">
            <button
              className={`segment-btn ${timeRange === '7d' ? 'active' : ''}`}
              onClick={() => setTimeRange('7d')}
            >
              7 Days
            </button>
            <button
              className={`segment-btn ${timeRange === '14d' ? 'active' : ''}`}
              onClick={() => setTimeRange('14d')}
            >
              14 Days
            </button>
            <button
              className={`segment-btn ${timeRange === '30d' ? 'active' : ''}`}
              onClick={() => setTimeRange('30d')}
            >
              30 Days
            </button>
          </div>
        </div>
      </div>

      {/* Map Workbench Grid */}
      <div className="map-workbench-container">
        {/* Left: Stylized Interactive SVG Map View */}
        <div className="map-canvas-card">
          <div className="map-card-topbar">
            <div className="map-title-tag">
              <span className="canvas-dot" />
              <span>GLOBAL SURVEILLANCE SECTOR OVERVIEW</span>
            </div>
            <span className="demo-data-pill">SIMULATED DATA</span>
          </div>

          <div className="map-view-wrapper">
            <svg
              className="world-map-svg"
              viewBox="0 0 1000 560"
              preserveAspectRatio="xMidYMid meet"
              aria-label="Stylized map showing sample outbreak signal nodes"
            >
              {/* Background Geo Landforms (simplified stylized polygons) */}
              <g className="map-landmasses" fill="#172437" stroke="#22334b" strokeWidth="1">
                {/* North America */}
                <path d="M120 110 L280 100 L320 160 L280 230 L220 250 L190 280 L160 250 L140 190 Z" />
                {/* South America */}
                <path d="M260 290 L340 310 L370 380 L340 470 L290 490 L260 410 L250 330 Z" />
                {/* Europe */}
                <path d="M440 100 L560 90 L580 160 L540 210 L470 200 L440 150 Z" />
                {/* Africa */}
                <path d="M450 220 L580 220 L610 320 L570 440 L500 450 L460 360 L440 280 Z" />
                {/* Asia */}
                <path d="M580 90 L850 80 L880 180 L820 280 L730 290 L670 240 L590 180 Z" />
                {/* Australia */}
                <path d="M750 360 L870 350 L880 430 L800 450 L750 410 Z" />
              </g>

              {/* Connecting Global Flight/Trade Telemetry Lines */}
              <g className="telemetry-lines" stroke="rgba(0, 214, 201, 0.15)" strokeWidth="1.2" strokeDasharray="3 3">
                <path d="M 240 200 Q 360 160 490 190" />
                <path d="M 490 190 Q 530 250 580 300" />
                <path d="M 580 300 Q 660 260 740 280" />
                <path d="M 300 350 Q 380 320 580 300" />
              </g>

              {/* Location Markers */}
              {SAMPLE_LOCATIONS.map((loc) => {
                const isSelected = activeLocation.id === loc.id
                const isFilteredOut = syndromeFilter !== 'all' && loc.syndrome !== syndromeFilter
                const posX = loc.mapX * 10
                const posY = loc.mapY * 5.6

                return (
                  <g
                    key={loc.id}
                    className={`map-node-pin ${isSelected ? 'selected' : ''} ${isFilteredOut ? 'dimmed' : ''}`}
                    onClick={() => setSelectedId(loc.id)}
                    cursor="pointer"
                    tabIndex="0"
                    role="button"
                    aria-label={`Select location ${loc.name}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setSelectedId(loc.id)
                    }}
                  >
                    {/* Outer pulse wave */}
                    <circle
                      cx={posX}
                      cy={posY}
                      r={isSelected ? 20 : 12}
                      className={isSelected ? 'beacon-pulse active' : 'beacon-pulse'}
                      fill={loc.statusTone === 'coral' ? 'rgba(255, 107, 107, 0.25)' : 'rgba(0, 214, 201, 0.25)'}
                    />
                    {/* Node Core Pin */}
                    <circle
                      cx={posX}
                      cy={posY}
                      r={isSelected ? 9 : 6.5}
                      fill={loc.statusTone === 'coral' ? '#FF6B6B' : loc.statusTone === 'lavender' ? '#B8A5FF' : '#00D6C9'}
                      stroke="#101B2D"
                      strokeWidth="2.5"
                    />
                    {/* Location Name Label */}
                    <text
                      x={posX}
                      y={posY + 22}
                      textAnchor="middle"
                      fill={isSelected ? '#00D6C9' : '#C4D5E5'}
                      fontSize="12"
                      fontWeight={isSelected ? '700' : '600'}
                      fontFamily="sans-serif"
                    >
                      {loc.name}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          <div className="map-card-footer">
            <span className="map-legend-item">
              <span className="legend-pip coral" /> Coral: Urgent Signal
            </span>
            <span className="map-legend-item">
              <span className="legend-pip teal" /> Teal: Active Pattern
            </span>
            <span className="map-legend-item">
              <span className="legend-pip lavender" /> Lavender: Monitored
            </span>
          </div>
        </div>

        {/* Right: Connected Evidence & Symptom Panel */}
        <aside className="map-detail-panel" aria-live="polite">
          <div className="panel-badge-row">
            <span className={`status-capsule tone-${activeLocation.statusTone}`}>
              ● {activeLocation.status}
            </span>
            <span className="timeframe-tag">{activeLocation.timeframe}</span>
          </div>

          <h3 className="panel-location-name">{activeLocation.name}</h3>
          <p className="panel-territory-text">{activeLocation.territory}</p>

          <div className="panel-category-box">
            <span className="box-label">SIGNAL CATEGORY</span>
            <strong className="box-val">{activeLocation.category}</strong>
          </div>

          {/* Illustrative Trend Graph Sparkline */}
          <div className="panel-trend-block">
            <div className="trend-top-row">
              <span className="trend-label">SYMPTOM TRAJECTORY</span>
              <span className="trend-stat coral">{activeLocation.trendPct} vs baseline</span>
            </div>

            <div className="sparkline-wrapper">
              <svg className="trend-sparkline-svg" viewBox="0 0 280 60" preserveAspectRatio="none">
                {/* Expected baseline (dashed line) */}
                <line x1="0" y1="45" x2="280" y2="45" stroke="#486581" strokeWidth="1.5" strokeDasharray="4 4" />
                {/* Observed curve */}
                <path
                  d="M 0 45 Q 60 44, 120 40 T 180 32 T 230 20 T 280 12"
                  fill="none"
                  stroke={activeLocation.statusTone === 'coral' ? '#FF6B6B' : '#00D6C9'}
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
                {/* Area fill */}
                <path
                  d="M 0 45 Q 60 44, 120 40 T 180 32 T 230 20 T 280 12 L 280 58 L 0 58 Z"
                  fill={activeLocation.statusTone === 'coral' ? 'rgba(255, 107, 107, 0.12)' : 'rgba(0, 214, 201, 0.12)'}
                />
              </svg>
            </div>
            <div className="trend-sub-note">
              <span>Baseline: {activeLocation.baselineText}</span>
              <span>Source: Syndromic Sentinel</span>
            </div>
          </div>

          {/* Contributing Multi-Source Evidence */}
          <div className="panel-evidence-block">
            <span className="evidence-header">CONTRIBUTING EVIDENCE ({activeLocation.evidence.length})</span>
            <ul className="evidence-bullets-list">
              {activeLocation.evidence.map((item, idx) => (
                <li key={idx} className="evidence-bullet-item">
                  <span className="bullet-pip" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Data Limitations Disclosure */}
          <div className="panel-limitations-box">
            <strong>Data Limitation Note:</strong> {activeLocation.limitations}
          </div>

          <div className="panel-disclaimer-tag">
            SIMULATED DEMONSTRATION DATA · NOT A DIAGNOSTIC CONCLUSION
          </div>
        </aside>
      </div>
    </section>
  )
}

// ── How It Works (3 Connected Steps with ECG Signal Path) ──────────────────────

function HowItWorks() {
  return (
    <section className="how-it-works-section" id="how-it-works">
      <div className="section-header-block text-center">
        <span className="section-kicker">SYSTEMATIC METHODOLOGY</span>
        <h2 className="section-title">How Epidemic Pulse Works</h2>
        <p className="section-subtext">
          A three-stage pipeline that transforms fragmented symptom reports and health publications into prioritized, evidence-backed signals.
        </p>
      </div>

      <div className="how-pipeline-wrapper">
        {/* Animated ECG connecting line running across cards */}
        <div className="ecg-track-line" aria-hidden="true">
          <svg className="ecg-track-svg" viewBox="0 0 1000 40" preserveAspectRatio="none">
            <path
              d="M 0 20 L 260 20 L 275 8 L 290 32 L 305 12 L 320 20 L 590 20 L 605 6 L 620 34 L 635 14 L 650 20 L 920 20 L 935 4 L 950 36 L 965 16 L 980 20 L 1000 20"
              fill="none"
              stroke="#00D6C9"
              strokeWidth="2.5"
              className="ecg-pulse-stroke"
            />
          </svg>
        </div>

        <div className="how-steps-grid">
          {/* Step 01 */}
          <article className="step-card">
            <div className="step-card-header">
              <span className="step-numeral">01</span>
              <div className="step-icon-box">
                <RadarIcon />
              </div>
            </div>
            <h3 className="step-title">COLLECT</h3>
            <p className="step-body">
              Bring together relevant public-health information and structured symptom reports across clinical alerts, hospital syndromic intake, and regional publications.
            </p>
            <div className="step-feature-tag">
              <span>● Multi-source normalization</span>
            </div>
          </article>

          {/* Step 02 */}
          <article className="step-card featured-step">
            <div className="step-card-header">
              <span className="step-numeral highlight-teal">02</span>
              <div className="step-icon-box">
                <ConnectIcon />
              </div>
            </div>
            <h3 className="step-title">CONNECT</h3>
            <p className="step-body">
              Compare trends across sources, identify unusual changes against historical baselines, and account for duplicated or conflicting information to eliminate wire syndication echoes.
            </p>
            <div className="step-feature-tag">
              <span>● De-syndication & baseline matching</span>
            </div>
          </article>

          {/* Step 03 */}
          <article className="step-card">
            <div className="step-card-header">
              <span className="step-numeral highlight-coral">03</span>
              <div className="step-icon-box">
                <FlagReviewIcon />
              </div>
            </div>
            <h3 className="step-title">FLAG</h3>
            <p className="step-body">
              Present potential signals with supporting evidence, explicit uncertainty tags, and actionable dossiers for human epidemiologist investigation.
            </p>
            <div className="step-feature-tag">
              <span>● Human-in-the-loop review</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

// ── Realistic Product Preview Section ─────────────────────────────────────────

function ProductPreview({ onOpenConsole }) {
  const [activeTab, setActiveTab] = useState('signals')

  return (
    <section className="product-preview-section" id="intelligence">
      <div className="section-header-block">
        <span className="section-kicker">ANALYST WORKBENCH</span>
        <h2 className="section-title">Built for Evidence-Led Investigation</h2>
        <p className="section-subtext">
          Experience how public health analysts triage emerging signals, evaluate laboratory gaps, and review multi-source intelligence in a single interface.
        </p>
      </div>

      <div className="preview-showcase-frame">
        {/* Mock Window Top Bar */}
        <div className="showcase-chrome-bar">
          <div className="chrome-dots">
            <span className="chrome-dot red" />
            <span className="chrome-dot yellow" />
            <span className="chrome-dot green" />
          </div>
          <div className="chrome-address-pill">
            <span className="lock-icon">🔒</span>
            <span>https://epidemicpulse.intelligence/console/workspace</span>
          </div>
          <button className="open-console-header-btn" onClick={onOpenConsole}>
            Open Live Console ↗
          </button>
        </div>

        <div className="preview-data-note">
          Illustrative interface · sample values, not live surveillance output
        </div>

        {/* Tab Navigation inside Preview */}
        <div className="preview-nav-tabs">
          <button
            className={`preview-tab-btn ${activeTab === 'signals' ? 'active' : ''}`}
            onClick={() => setActiveTab('signals')}
          >
            Flagged Signals (08)
          </button>
          <button
            className={`preview-tab-btn ${activeTab === 'trends' ? 'active' : ''}`}
            onClick={() => setActiveTab('trends')}
          >
            Syndromic Trajectory
          </button>
          <button
            className={`preview-tab-btn ${activeTab === 'evidence' ? 'active' : ''}`}
            onClick={() => setActiveTab('evidence')}
          >
            Evidence & Dossiers
          </button>
        </div>

        {/* Dynamic Simulated Preview Screen */}
        <div className="preview-screen-content">
          {activeTab === 'signals' && (
            <div className="preview-table-wrapper">
              <table className="preview-mock-table">
                <thead>
                  <tr>
                    <th>SIGNAL CLUSTER</th>
                    <th>JURISDICTION</th>
                    <th>CONFIDENCE</th>
                    <th>SOURCE NETWORKS</th>
                    <th>CORROBORATION</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong className="signal-cell-name">Acute Respiratory Cluster</strong>
                      <span className="signal-cell-sub">Viral pneumonia markers (+42%)</span>
                    </td>
                    <td>Mombasa Coastal Corridor</td>
                    <td><span className="confidence-pill high">88%</span></td>
                    <td>WHO DON · Regional ER · MoH Wire</td>
                    <td><span className="corr-tag independent">Independent (2 Sources)</span></td>
                    <td><span className="table-status-pill coral">Needs Review</span></td>
                  </tr>
                  <tr>
                    <td>
                      <strong className="signal-cell-name">Febrile Hemorrhagic Alert</strong>
                      <span className="signal-cell-sub">Thrombocytopenia symptoms</span>
                    </td>
                    <td>Mekong Delta Hub</td>
                    <td><span className="confidence-pill high">91%</span></td>
                    <td>ProMED · Local Sentinel Clinic</td>
                    <td><span className="corr-tag independent">Independent (2 Sources)</span></td>
                    <td><span className="table-status-pill teal">Active Review</span></td>
                  </tr>
                  <tr>
                    <td>
                      <strong className="signal-cell-name">Gastrointestinal Water Anomaly</strong>
                      <span className="signal-cell-sub">Enteric pathogen cluster</span>
                    </td>
                    <td>Central Rhine Catchment</td>
                    <td><span className="confidence-pill med">64%</span></td>
                    <td>ECDC Weekly · Wastewater Lab</td>
                    <td><span className="corr-tag syndicated">Syndicated Wire Reprint</span></td>
                    <td><span className="table-status-pill lavender">Monitored</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="preview-trends-canvas">
              <div className="trends-top-summary">
                <div>
                  <span className="kicker">SYNDROMIC DEVIATION MODEL</span>
                  <h4>Multi-Week Anomaly Deviation (Simulated Baseline vs Observed)</h4>
                </div>
                <span className="alert-delta-badge">+38.4% above seasonal expected</span>
              </div>
              <div className="mock-chart-graphic">
                <svg viewBox="0 0 700 160" className="chart-svg">
                  {/* Grid Lines */}
                  <line x1="40" y1="20" x2="680" y2="20" stroke="#22334b" strokeWidth="1" />
                  <line x1="40" y1="60" x2="680" y2="60" stroke="#22334b" strokeWidth="1" />
                  <line x1="40" y1="100" x2="680" y2="100" stroke="#22334b" strokeWidth="1" />
                  <line x1="40" y1="140" x2="680" y2="140" stroke="#22334b" strokeWidth="1" />

                  {/* Baseline curve */}
                  <path d="M 40 120 C 140 115, 260 122, 380 110 S 520 115, 680 110" fill="none" stroke="#627D98" strokeWidth="2" strokeDasharray="5 5" />
                  {/* Actual curve with breakout */}
                  <path d="M 40 120 C 140 116, 260 120, 380 102 S 500 50, 680 30" fill="none" stroke="#00D6C9" strokeWidth="3" />
                  {/* Breakout highlight dot */}
                  <circle cx="560" cy="62" r="5" fill="#FF6B6B" />
                  <text x="570" y="58" fill="#FF6B6B" fontSize="11" fontWeight="700">ANOMALY DETECTED (Day 18)</text>
                </svg>
              </div>
            </div>
          )}

          {activeTab === 'evidence' && (
            <div className="preview-dossier-layout">
              <div className="dossier-card-sim">
                <div className="dossier-sim-head">
                  <span className="dossier-id">DOSSIER #EP-2026-0814</span>
                  <span className="dossier-badge">Cross-Verified</span>
                </div>
                <h5>Surveillance Provenance & Audit Trail</h5>
                <p>Primary records linked to canonical WHO Dispatches and regional laboratory manifests. Identical syndication strings eliminated.</p>
                <div className="evidence-checklist">
                  <label className="checked">☑ Multi-source corroboration confirmed (2 independent institutions)</label>
                  <label className="checked">☑ Symptom trend exceeds standard threshold (p &lt; 0.01)</label>
                  <label className="pending">☐ Laboratory RT-PCR genomic subtype confirmation pending</label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Banner with Live CTA */}
        <div className="preview-bottom-cta-strip">
          <div className="cta-left-text">
            <strong>Ready to investigate the real public-health feeds?</strong>
            <span>Explore live WHO and ECDC data in our full operational workstation.</span>
          </div>
          <button className="open-console-primary-btn" onClick={onOpenConsole}>
            Open Intelligence Console →
          </button>
        </div>
      </div>
    </section>
  )
}

// ── Features Section ──────────────────────────────────────────────────────────
function FeatureCards() {
  return (
    <section className="features-section" id="features">
      <div className="section-header-block text-center">
        <span className="section-kicker">ONE CONNECTED WORKSPACE</span>
        <h2 className="section-title">From public reports to human review</h2>
        <p className="section-subtext">
          Follow a potential signal from its first report through source checks, geographic context, and an analyst-led investigation.
        </p>
      </div>

      <div className="features-cards-grid">
        <article className="feature-card">
          <div className="feature-icon-wrapper teal">
            <ShieldCheckIcon />
          </div>
          <h3 className="feature-title">Live Intelligence</h3>
          <p className="feature-body">
            Review incoming public-health bulletins with their publication details, location, and original source link in one searchable feed.
          </p>
          <div className="feature-highlight-row">
            <span className="feature-tag">Search and filter</span>
            <span className="feature-tag">Source citations</span>
          </div>
        </article>

        <article className="feature-card">
          <div className="feature-icon-wrapper teal">
            <SignalMapIcon />
          </div>
          <h3 className="feature-title">Signal Monitoring</h3>
          <p className="feature-body">
            Explore reported signals geographically, inspect contributing evidence, and see where surveillance coverage may be limited.
          </p>
          <div className="feature-highlight-row">
            <span className="feature-tag">Interactive map</span>
            <span className="feature-tag">Evidence context</span>
          </div>
        </article>

        <article className="feature-card">
          <div className="feature-icon-wrapper coral">
            <HumanDossierIcon />
          </div>
          <h3 className="feature-title">Alerts & Investigations</h3>
          <p className="feature-body">
            Triage potential signal clusters, track review status, examine cited reports, and work through a practical investigation checklist.
          </p>
          <div className="feature-highlight-row">
            <span className="feature-tag">Analyst-led review</span>
            <span className="feature-tag">Evidence gaps</span>
          </div>
        </article>

        <article className="feature-card">
          <div className="feature-icon-wrapper lavender">
            <SimulationIcon />
          </div>
          <h3 className="feature-title">Simulation Lab</h3>
          <p className="feature-body">
            Explore hypothetical scenarios with adjustable assumptions. Simulations are exploratory and are not validated forecasts of real-world outcomes.
          </p>
          <div className="feature-highlight-row">
            <span className="feature-tag">What-if scenarios</span>
            <span className="feature-tag">Assumptions visible</span>
          </div>
        </article>

        <article className="feature-card">
          <div className="feature-icon-wrapper teal">
            <NetworkMeshIcon />
          </div>
          <h3 className="feature-title">Sources & Provenance</h3>
          <p className="feature-body">
            Compare independent reporting with syndicated copies, inspect adapter availability, and trace each publication back to its source.
          </p>
          <div className="feature-highlight-row">
            <span className="feature-tag">Multi-source context</span>
            <span className="feature-tag">Feed diagnostics</span>
          </div>
        </article>
      </div>
    </section>
  )
}

// ── Final Call to Action Section ──────────────────────────────────────────────

function FinalCTA({ onOpenConsole }) {
  return (
    <section className="final-cta-section" aria-label="Closing call to action">
      {/* Animated Pulse Header Line */}
      <div className="cta-pulse-line-container" aria-hidden="true">
        <svg className="cta-pulse-svg" viewBox="0 0 1200 48" preserveAspectRatio="none">
          <path
            d="M 0 24 L 480 24 L 500 8 L 520 40 L 540 12 L 560 24 L 1200 24"
            fill="none"
            stroke="#00D6C9"
            strokeWidth="2.5"
            className="cta-ecg-path"
          />
        </svg>
      </div>

      <div className="final-cta-container">
        <div className="cta-badge">
          <span className="cta-dot" />
          <span>EARLY WARNING · SYSTEM SURVEILLANCE</span>
        </div>

        <h2 className="cta-main-heading">
          The earlier we see the signal,<br />
          the sooner we can investigate.
        </h2>

        <p className="cta-subtext">
          Explore how connected public-health intelligence can help make unusual disease patterns easier to recognise, cross-verify, and investigate before they escalate.
        </p>

        <div className="cta-buttons-row">
          <button className="cta-primary-btn" onClick={onOpenConsole}>
            Explore Epidemic Pulse →
          </button>
          <a className="cta-secondary-btn" href="#how-it-works">
            Explore Features ↓
          </a>
        </div>

        <div className="cta-trust-note">
          <span>✓ Independent Cross-Corroboration</span>
          <span>✓ Transparent Evidence Gaps</span>
          <span>✓ Human Epidemiologist Control</span>
        </div>
      </div>
    </section>
  )
}

// ── Landing Footer ────────────────────────────────────────────────────────────

function LandingFooter({ onOpenConsole }) {
  return (
    <footer className="landing-footer-root">
      <div className="footer-content-grid">
        <div className="footer-brand-col">
          <div className="footer-brand-lockup">
            <PulseBrandIcon />
            <span className="brand-name">
              Epidemic<span className="teal-accent">Pulse</span>
            </span>
          </div>
          <p className="footer-brand-desc">
            Public-health intelligence and early-warning platform designed to identify unusual disease activity by analysing symptom trends and information across independent sources.
          </p>
          <span className="footer-version-tag">Version 2.4 · National Hackathon Edition</span>
        </div>

        <div className="footer-links-col">
          <strong className="footer-col-header">Platform</strong>
          <a href="#signals-map">Interactive Signals Map</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#intelligence">Intelligence Console</a>
          <a href="#features">Platform Features</a>
        </div>

        <div className="footer-links-col">
          <strong className="footer-col-header">Surveillance Data</strong>
          <a href="https://www.who.int/emergencies/disease-outbreak-news" target="_blank" rel="noreferrer">
            WHO Outbreak News ↗
          </a>
          <a href="https://www.ecdc.europa.eu" target="_blank" rel="noreferrer">
            ECDC Threat Reports ↗
          </a>
          <a href="https://africacdc.org" target="_blank" rel="noreferrer">
            Africa CDC Dispatches ↗
          </a>
          <a href="https://promedmail.org" target="_blank" rel="noreferrer">
            ProMED Mail ↗
          </a>
        </div>

        <div className="footer-links-col">
          <strong className="footer-col-header">Console Access</strong>
          <button className="footer-link-btn" onClick={onOpenConsole}>
            Open Intelligence Dashboard →
          </button>
          <p className="footer-sub-disclaimer">
            Academic & hackathon demonstration prototype. Does not replace accredited national public health incident management systems.
          </p>
        </div>
      </div>

      <div className="footer-bottom-legal-row">
        <span>© 2026 Epidemic Pulse · Evidence-Led Outbreak Intelligence</span>
        <span className="disclaimer-highlight">
          Disclaimer: This system identifies potential epidemiological signals and does not confirm disease diagnoses or declare official outbreaks.
        </span>
      </div>
    </footer>
  )
}

// ── Top Navigation Bar ────────────────────────────────────────────────────────

function LandingNavbar({ onOpenConsole }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`landing-nav-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        {/* Left: Brand Logo */}
        <a className="nav-brand-link" href="#top" aria-label="Epidemic Pulse home">
          <PulseBrandIcon />
          <span className="brand-title">
            Epidemic<span className="teal-accent">Pulse</span>
          </span>
        </a>

        {/* Center: Desktop Navigation Links */}
        <nav className="nav-links-center" aria-label="Main Navigation">
          <a href="#top" className="nav-link">Home</a>
          <a href="#how-it-works" className="nav-link">How It Works</a>
          <a href="#signals-map" className="nav-link">Intelligence</a>
          <a href="#features" className="nav-link">Features</a>
        </nav>

        {/* Right: Primary Action Button */}
        <div className="nav-action-right">
          <button className="nav-primary-cta" onClick={onOpenConsole}>
            Explore Intelligence →
          </button>

          {/* Mobile Hamburger Button */}
          <button
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className={`bar ${mobileMenuOpen ? 'open-1' : ''}`} />
            <span className={`bar ${mobileMenuOpen ? 'open-2' : ''}`} />
            <span className={`bar ${mobileMenuOpen ? 'open-3' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-menu" role="dialog" aria-modal="true">
          <a href="#top" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>Home</a>
          <a href="#how-it-works" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
          <a href="#signals-map" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>Intelligence</a>
          <a href="#features" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>Features</a>
          <button
            className="mobile-cta-btn"
            onClick={() => {
              setMobileMenuOpen(false)
              onOpenConsole()
            }}
          >
            Explore Intelligence →
          </button>
        </div>
      )}
    </header>
  )
}

// ── Root Landing Page Component ───────────────────────────────────────────────

export default function RedesignedLandingPage({ onEnterDashboard }) {
  return (
    <div className="redesigned-landing-root" id="top">
      {/* Sticky Responsive Navigation Bar */}
      <LandingNavbar onOpenConsole={onEnterDashboard} />

      <main>
        {/* Hero Section */}
        <section className="hero-landing-section">
          <div className="hero-content-container">
            {/* Left Column: Headline, Storytelling & CTAs */}
            <div className="hero-copy-column">
              <div className="hero-eyebrow-pill">
                <span className="eyebrow-dot" />
                <span>PUBLIC HEALTH INTELLIGENCE · EARLY WARNING</span>
              </div>

              <h1 className="hero-main-heading">
                Detect Signals. Understand Risk. Act Earlier.
              </h1>

              <p className="hero-supporting-copy">
                EpidemicPulse aggregates public-health reports, groups potential signals, highlights evidence gaps, and supports human-led investigation.
              </p>

              <div className="hero-action-buttons-row">
                <button className="hero-cta-primary" onClick={onEnterDashboard}>
                  Explore Intelligence →
                </button>
                <a className="hero-cta-secondary" href="#features">
                  Explore Features ↓
                </a>
              </div>

              <div className="hero-trust-row">
                <span className="trust-item"><span className="pip-teal" /> Evidence-led insights</span>
                <span className="trust-item"><span className="pip-coral" /> Transparent signals</span>
                <span className="trust-item"><span className="pip-lime" /> Human review</span>
              </div>

              <div className="hero-disclaimer-box">
                <span className="warn-icon">ℹ</span>
                <span>
                  Epidemic Pulse highlights potential epidemiological signals for investigative review. It does not confirm outbreaks or provide medical diagnoses.
                </span>
              </div>
            </div>

            {/* Right Column: Animated Living Intelligence Network */}
            <div className="hero-visual-column">
              <LivingNetwork />
            </div>
          </div>
        </section>

        {/* Live Metrics Strip */}
        <LiveMetricsStrip />

        {/* Interactive Signals Map */}
        <InteractiveSignalMap />

        {/* Systematic Methodology: How It Works */}
        <HowItWorks />

        {/* Product Preview */}
        <ProductPreview onOpenConsole={onEnterDashboard} />

        {/* Platform Principles / Features */}
        <FeatureCards />

        {/* Closing Call to Action */}
        <FinalCTA onOpenConsole={onEnterDashboard} />
      </main>

      {/* Public Footer */}
      <LandingFooter onOpenConsole={onEnterDashboard} />
    </div>
  )
}
