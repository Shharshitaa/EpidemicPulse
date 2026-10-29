// Correlation engine: groups normalized records from multiple sources into outbreak events.
// Matching strategy:
//   1. Extract a canonical "disease token" from the record title using keyword rules.
//   2. Extract a canonical "location token" using known country/region aliases.
//   3. Group records that share both tokens.
//   4. Detect likely syndication (same or near-identical title from multiple sources → mark as "syndicated").
//   5. Flag events where all records come from a single source (no independent corroboration).
//   6. Never infer case counts, severity, or outbreak status.

// ── Disease extraction rules ──────────────────────────────────────────────────
const DISEASE_RULES = [
  { label: 'Mpox', pattern: /\bmpox\b|monkeypox/i },
  { label: 'Ebola', pattern: /\bebola\b/i },
  { label: 'Marburg virus disease', pattern: /\bmarburg\b/i },
  { label: 'Cholera', pattern: /\bcholera\b/i },
  { label: 'Dengue', pattern: /\bdengue\b/i },
  { label: 'Rift Valley fever', pattern: /rift valley/i },
  { label: 'Yellow fever', pattern: /yellow fever/i },
  { label: 'Lassa fever', pattern: /lassa/i },
  { label: 'Nipah virus disease', pattern: /\bnipah\b/i },
  { label: 'MERS-CoV', pattern: /mers|middle east respiratory syndrome/i },
  { label: 'Avian influenza', pattern: /avian influenza|bird flu|h5n1|h7n9/i },
  { label: 'Plague', pattern: /\bplague\b/i },
  { label: 'Hantavirus', pattern: /\bhantavirus\b/i },
  { label: 'Meningitis', pattern: /\bmeningitis\b/i },
  { label: 'Measles', pattern: /\bmeasles\b/i },
  { label: 'Polio', pattern: /\bpolio\b|\bpoliovirus\b/i },
  { label: 'Rabies', pattern: /\brabies\b/i },
  { label: 'COVID-19', pattern: /covid-19|covid19|sars-cov-2/i },
  { label: 'Pneumonia (unknown cause)', pattern: /pneumonia of undetermined|pneumonia of unknown/i },
]

// ── Country extraction rules ──────────────────────────────────────────────────
const COUNTRY_RULES = [
  { label: 'Democratic Republic of the Congo', aliases: ['democratic republic of the congo', 'drc', 'congo, dem.', 'dr congo'], coordinates: [-2.5, 23.5] },
  { label: 'Republic of the Congo', aliases: ['republic of the congo', 'congo, rep.'], coordinates: [-0.228, 15.827] },
  { label: 'Nigeria', aliases: ['nigeria'], coordinates: [9.082, 8.675] },
  { label: 'Kenya', aliases: ['kenya'], coordinates: [-0.023, 37.906] },
  { label: 'Uganda', aliases: ['uganda'], coordinates: [1.373, 32.290] },
  { label: 'Tanzania', aliases: ['tanzania'], coordinates: [-6.369, 34.889] },
  { label: 'Ethiopia', aliases: ['ethiopia'], coordinates: [9.145, 40.489] },
  { label: 'Somalia', aliases: ['somalia'], coordinates: [5.152, 46.199] },
  { label: 'Ghana', aliases: ['ghana'], coordinates: [7.946, -1.023] },
  { label: 'South Africa', aliases: ['south africa'], coordinates: [-30.559, 22.937] },
  { label: 'Cameroon', aliases: ['cameroon'], coordinates: [7.369, 12.354] },
  { label: 'Guinea', aliases: ['guinea', 'republic of guinea'], coordinates: [9.945, -11.336] },
  { label: 'Sierra Leone', aliases: ['sierra leone'], coordinates: [8.460, -11.779] },
  { label: 'Liberia', aliases: ['liberia'], coordinates: [6.428, -9.429] },
  { label: 'Zambia', aliases: ['zambia'], coordinates: [-13.133, 27.849] },
  { label: 'Zimbabwe', aliases: ['zimbabwe'], coordinates: [-19.015, 29.154] },
  { label: 'Mozambique', aliases: ['mozambique'], coordinates: [-18.665, 35.529] },
  { label: 'Rwanda', aliases: ['rwanda'], coordinates: [-1.940, 29.874] },
  { label: 'Burundi', aliases: ['burundi'], coordinates: [-3.373, 29.918] },
  { label: 'Sudan', aliases: ['sudan'], coordinates: [12.862, 30.217] },
  { label: 'South Sudan', aliases: ['south sudan'], coordinates: [7.863, 29.694] },
  { label: 'Chad', aliases: ['chad'], coordinates: [15.454, 18.732] },
  { label: 'Niger', aliases: ['niger'], coordinates: [17.607, 8.082] },
  { label: 'Mali', aliases: ['mali'], coordinates: [17.570, -3.996] },
  { label: 'Senegal', aliases: ['senegal'], coordinates: [14.497, -14.452] },
  { label: 'India', aliases: ['india'], coordinates: [22.973, 78.656] },
  { label: 'Pakistan', aliases: ['pakistan'], coordinates: [30.375, 69.344] },
  { label: 'Bangladesh', aliases: ['bangladesh'], coordinates: [23.685, 90.356] },
  { label: 'Indonesia', aliases: ['indonesia'], coordinates: [-0.789, 113.921] },
  { label: 'Philippines', aliases: ['philippines'], coordinates: [12.879, 121.774] },
  { label: 'Vietnam', aliases: ['vietnam', 'viet nam'], coordinates: [14.058, 108.277] },
  { label: 'Thailand', aliases: ['thailand'], coordinates: [15.870, 100.992] },
  { label: 'China', aliases: ['china', "people's republic of china"], coordinates: [35.861, 104.195] },
  { label: 'Saudi Arabia', aliases: ['saudi arabia', 'kingdom of saudi arabia'], coordinates: [23.886, 45.079] },
  { label: 'Yemen', aliases: ['yemen'], coordinates: [15.552, 48.516] },
  { label: 'Iraq', aliases: ['iraq'], coordinates: [33.223, 43.679] },
  { label: 'Lebanon', aliases: ['lebanon'], coordinates: [33.854, 35.862] },
  { label: 'Syria', aliases: ['syria', 'syrian arab republic'], coordinates: [34.802, 38.996] },
  { label: 'Egypt', aliases: ['egypt'], coordinates: [26.820, 30.802] },
  { label: 'Libya', aliases: ['libya'], coordinates: [26.335, 17.228] },
  { label: 'Brazil', aliases: ['brazil'], coordinates: [-14.235, -51.925] },
  { label: 'Colombia', aliases: ['colombia'], coordinates: [4.570, -74.297] },
  { label: 'Peru', aliases: ['peru'], coordinates: [-9.189, -75.015] },
  { label: 'Bolivia', aliases: ['bolivia'], coordinates: [-16.290, -63.588] },
  { label: 'Haiti', aliases: ['haiti'], coordinates: [18.971, -72.285] },
  { label: 'United States', aliases: ['united states', 'usa', 'u.s.'], coordinates: [37.090, -95.712] },
  { label: 'Mexico', aliases: ['mexico'], coordinates: [23.634, -102.552] },
  { label: 'Russian Federation', aliases: ['russian federation', 'russia'], coordinates: [61.524, 105.318] },
  { label: 'Ukraine', aliases: ['ukraine'], coordinates: [48.379, 31.165] },
  { label: 'Multiple countries', aliases: ['multi-country', 'multiple countries', 'several countries', 'international'], coordinates: [20, 0] },
]

function extractDisease(title) {
  for (const rule of DISEASE_RULES) {
    if (rule.pattern.test(title)) return rule.label
  }
  return null
}

function extractCountries(text) {
  const lower = text.toLowerCase()
  return COUNTRY_RULES.filter((c) => c.aliases.some((alias) => lower.includes(alias)))
}

// Compute a simple normalized title fingerprint for near-duplicate detection
function titleFingerprint(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

// Levenshtein-based similarity (capped at 80 chars for performance)
function stringSimilarity(a, b) {
  if (a === b) return 1
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  let prev = [...Array(b.length + 1).keys()]
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    prev = curr
  }
  return 1 - prev[b.length] / maxLen
}

function areNearDuplicates(titleA, titleB) {
  const fpA = titleFingerprint(titleA)
  const fpB = titleFingerprint(titleB)
  return stringSimilarity(fpA, fpB) >= 0.82
}

/**
 * Build correlated outbreak events from an array of normalized records.
 * @param {Array} allRecords - records with {id, title, url, publicationDate, location, source, sourceKey, summary}
 * @returns {Array} events
 */
function correlateEvents(allRecords) {
  // Step 1: Annotate each record with extracted disease + countries
  const annotated = allRecords.map((record) => ({
    ...record,
    _disease: extractDisease(record.title),
    _countries: extractCountries([record.title, record.location].filter(Boolean).join(' ')),
  }))

  // Step 2: Build groups keyed by disease|country
  const groups = new Map()
  for (const record of annotated) {
    if (!record._disease) continue
    const countries = record._countries.length ? record._countries : [{ label: 'Unknown location', coordinates: null }]
    for (const country of countries) {
      const key = `${record._disease}|${country.label}`
      if (!groups.has(key)) {
        groups.set(key, {
          disease: record._disease,
          country: country.label,
          coordinates: country.coordinates || null,
          records: [],
        })
      }
      groups.get(key).records.push(record)
    }
  }

  // Step 3: Build events from groups
  const events = []
  let eventIdx = 0

  for (const [key, group] of groups) {
    eventIdx++
    const { disease, country, coordinates, records } = group

    // De-duplicate by URL within group
    const seenUrls = new Set()
    const uniqueRecords = records.filter((r) => {
      if (seenUrls.has(r.url)) return false
      seenUrls.add(r.url)
      return true
    })

    // Group by source
    const sourceMap = new Map()
    for (const r of uniqueRecords) {
      const sk = r.sourceKey || r.source
      if (!sourceMap.has(sk)) sourceMap.set(sk, [])
      sourceMap.get(sk).push(r)
    }
    const distinctSources = [...sourceMap.keys()]

    // Detect near-duplicate titles across sources
    const fingerprints = uniqueRecords.map((r) => titleFingerprint(r.title))
    const duplicatePairs = []
    for (let i = 0; i < uniqueRecords.length; i++) {
      for (let j = i + 1; j < uniqueRecords.length; j++) {
        if (uniqueRecords[i].source !== uniqueRecords[j].source && areNearDuplicates(fingerprints[i], fingerprints[j])) {
          duplicatePairs.push([uniqueRecords[i].source, uniqueRecords[j].source])
        }
      }
    }

    const hasSyndication = duplicatePairs.length > 0
    const hasIndependentCorroboration = distinctSources.length >= 2 && !hasSyndication
    const hasPartialCorroboration = distinctSources.length >= 2 && hasSyndication

    // Sort records newest first
    const sortedRecords = [...uniqueRecords].sort(
      (a, b) => Date.parse(b.publicationDate || '') - Date.parse(a.publicationDate || ''),
    )

    // Determine evidence status for the event
    let evidenceNote
    let corroborationLevel
    if (hasIndependentCorroboration) {
      corroborationLevel = 'independent'
      evidenceNote = `${distinctSources.length} independent sources report this event.`
    } else if (hasPartialCorroboration) {
      corroborationLevel = 'syndicated'
      evidenceNote = 'Multiple sources found, but titles are similar — may be syndicated or reprinted news.'
    } else {
      corroborationLevel = 'single-source'
      evidenceNote = 'Only one source has reported this event so far. Independent corroboration has not been found.'
    }

    // Identification of conflicting facts (e.g. different dates within same source group)
    const dates = sortedRecords.map((r) => r.publicationDate).filter(Boolean)
    const locations = [...new Set(sortedRecords.map((r) => r.location).filter(Boolean))]

    const conflicts = []
    if (locations.length > 1) {
      conflicts.push(`Multiple location descriptions found across reports: ${locations.join(', ')}`)
    }

    // What's missing
    const evidenceGaps = []
    if (distinctSources.length < 2) evidenceGaps.push('No second independent source has confirmed this event.')
    if (!coordinates) evidenceGaps.push('No precise coordinates available — location is inferred from text only.')
    if (sortedRecords.every((r) => !r.summary)) evidenceGaps.push('No summary text available from any source.')

    events.push({
      id: `event-${eventIdx}-${key.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`,
      disease,
      country,
      coordinates,
      reportCount: sortedRecords.length,
      distinctSourceCount: distinctSources.length,
      sources: distinctSources,
      corroborationLevel,
      evidenceNote,
      conflicts,
      evidenceGaps,
      syndicationPairs: duplicatePairs,
      latestDate: dates[0] || null,
      records: sortedRecords.map((r) => ({
        id: r.id,
        title: r.title,
        url: r.url,
        source: r.source,
        sourceKey: r.sourceKey || r.source,
        publicationDate: r.publicationDate,
        retrievedAt: r.retrievedAt,
        location: r.location,
        summary: r.summary || null,
        evidenceStatus: r.evidenceStatus || 'source-published',
      })),
    })
  }

  // Sort events: most records first, then newest
  return events.sort((a, b) => {
    if (b.distinctSourceCount !== a.distinctSourceCount) return b.distinctSourceCount - a.distinctSourceCount
    if (b.reportCount !== a.reportCount) return b.reportCount - a.reportCount
    return Date.parse(b.latestDate || '') - Date.parse(a.latestDate || '')
  })
}

module.exports = { correlateEvents, extractDisease, extractCountries, DISEASE_RULES, COUNTRY_RULES }
