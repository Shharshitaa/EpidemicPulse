// Tests for correlator.js — run with: node server/correlator.test.js
// No test framework required; uses Node built-in assert.
'use strict'

const assert = require('assert')
const { correlateEvents, extractDisease, extractCountries } = require('./correlator')

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`  ✓  ${name}`)
    passed++
  } catch (err) {
    console.error(`  ✗  ${name}`)
    console.error(`     ${err.message}`)
    failed++
  }
}

// ── extractDisease ────────────────────────────────────────────────────────────
console.log('\nextractDisease')

test('matches Ebola', () => {
  assert.strictEqual(extractDisease('Ebola disease outbreak in Uganda'), 'Ebola')
})
test('matches Mpox', () => {
  assert.strictEqual(extractDisease('Mpox multi-country outbreak update'), 'Mpox')
})
test('returns null for unrecognised disease', () => {
  assert.strictEqual(extractDisease('WHO launches new initiative'), null)
})
test('case-insensitive', () => {
  assert.strictEqual(extractDisease('CHOLERA outbreak reported'), 'Cholera')
})

// ── extractCountries ──────────────────────────────────────────────────────────
console.log('\nextractCountries')

test('finds Nigeria', () => {
  const result = extractCountries('Ebola outbreak in Nigeria')
  assert.ok(result.some((c) => c.label === 'Nigeria'), 'Expected Nigeria')
})
test('finds multiple countries', () => {
  const result = extractCountries('Dengue in India and Bangladesh')
  assert.ok(result.some((c) => c.label === 'India'), 'Expected India')
  assert.ok(result.some((c) => c.label === 'Bangladesh'), 'Expected Bangladesh')
})
test('returns empty array when no country found', () => {
  const result = extractCountries('Generic health bulletin')
  assert.deepStrictEqual(result, [])
})

// ── correlateEvents ───────────────────────────────────────────────────────────
console.log('\ncorrelateEvents')

const makeRecord = (overrides = {}) => ({
  id: Math.random().toString(36).slice(2),
  title: 'Ebola outbreak in Uganda',
  url: `https://example.com/${Math.random()}`,
  source: 'WHO Disease Outbreak News',
  sourceKey: 'who',
  publicationDate: '2025-01-15T00:00:00.000Z',
  retrievedAt: new Date().toISOString(),
  location: null,
  summary: null,
  evidenceStatus: 'source-published',
  ...overrides,
})

test('groups two records with same disease+country into one event', () => {
  const records = [
    makeRecord({ title: 'Ebola outbreak in Uganda', url: 'https://who.int/a' }),
    makeRecord({ title: 'Ebola cases confirmed Uganda', url: 'https://ecdc.org/b', source: 'ECDC', sourceKey: 'ecdc' }),
  ]
  const events = correlateEvents(records)
  assert.strictEqual(events.length, 1)
  assert.strictEqual(events[0].disease, 'Ebola')
  assert.strictEqual(events[0].country, 'Uganda')
})

test('separates records with different diseases into distinct events', () => {
  const records = [
    makeRecord({ title: 'Cholera outbreak in Nigeria', url: 'https://who.int/c1' }),
    makeRecord({ title: 'Ebola outbreak in Nigeria', url: 'https://who.int/c2' }),
  ]
  const events = correlateEvents(records)
  assert.ok(events.length >= 2, `Expected >= 2 events, got ${events.length}`)
  const diseases = events.map((e) => e.disease)
  assert.ok(diseases.includes('Cholera'), 'Missing Cholera')
  assert.ok(diseases.includes('Ebola'), 'Missing Ebola')
})

test('marks single-source event as single-source', () => {
  const records = [
    makeRecord({ url: 'https://who.int/d1' }),
    makeRecord({ url: 'https://who.int/d2', title: 'More on Ebola in Uganda' }),
  ]
  const events = correlateEvents(records)
  const ugandaEbola = events.find((e) => e.disease === 'Ebola' && e.country === 'Uganda')
  assert.ok(ugandaEbola, 'Event not found')
  assert.strictEqual(ugandaEbola.corroborationLevel, 'single-source')
})

test('marks multi-source event with independent corroboration', () => {
  const records = [
    makeRecord({ url: 'https://who.int/e1', source: 'WHO Disease Outbreak News', sourceKey: 'who' }),
    makeRecord({ url: 'https://promed.org/e2', title: 'Uganda: Ebola confirmed', source: 'ProMED', sourceKey: 'promed' }),
  ]
  const events = correlateEvents(records)
  const ev = events.find((e) => e.disease === 'Ebola' && e.country === 'Uganda')
  assert.ok(ev, 'Event not found')
  assert.strictEqual(ev.corroborationLevel, 'independent')
})

test('detects near-duplicate titles as syndicated', () => {
  const records = [
    makeRecord({ title: 'Ebola outbreak in Uganda — situation update', url: 'https://who.int/f1', source: 'WHO Disease Outbreak News', sourceKey: 'who' }),
    makeRecord({ title: 'Ebola outbreak in Uganda situation update', url: 'https://ecdc.org/f2', source: 'ECDC', sourceKey: 'ecdc' }),
  ]
  const events = correlateEvents(records)
  const ev = events.find((e) => e.disease === 'Ebola' && e.country === 'Uganda')
  assert.ok(ev, 'Event not found')
  assert.strictEqual(ev.corroborationLevel, 'syndicated')
})

test('deduplicates by URL within a group', () => {
  const sharedUrl = 'https://who.int/g1'
  const records = [
    makeRecord({ url: sharedUrl }),
    makeRecord({ url: sharedUrl }),
  ]
  const events = correlateEvents(records)
  const ev = events.find((e) => e.disease === 'Ebola')
  assert.strictEqual(ev?.records.length, 1, 'Expected 1 unique record after dedup')
})

test('returns empty array for records with no recognized disease', () => {
  const records = [
    { ...makeRecord(), title: 'WHO announces new committee', url: 'https://who.int/h1' },
  ]
  const events = correlateEvents(records)
  assert.strictEqual(events.length, 0)
})

test('does not throw on empty input', () => {
  assert.doesNotThrow(() => correlateEvents([]))
})

test('does not throw on malformed records', () => {
  assert.doesNotThrow(() => correlateEvents([null, undefined, {}, { title: null }].filter(Boolean)))
})

// ── Adapter failure isolation ─────────────────────────────────────────────────
console.log('\nrunSourceAdapter (failure isolation)')

const { runSourceAdapter } = require('./sources')

async function testAsync(name, fn) {
  try {
    await fn()
    console.log(`  âœ“  ${name}`)
    passed++
  } catch (err) {
    console.error(`  âœ—  ${name}`)
    console.error(`     ${err.message}`)
    failed++
  }
}

async function runAdapterTests() {
  await testAsync('returns unavailable status when adapter throws', async () => {
    const adapter = {
      key: 'test',
      name: 'Test Source',
      sourceUrl: 'https://example.com',
      fetch: async () => { throw new Error('Network error') },
    }
    const result = await runSourceAdapter(adapter)
    assert.strictEqual(result.status, 'unavailable')
    assert.strictEqual(result.records.length, 0)
    assert.ok(result.error?.message?.includes('Network error'), 'Expected error message')
  })

  await testAsync('returns available status with normalized records on success', async () => {
    const adapter = {
      key: 'test2',
      name: 'Test Source 2',
      sourceUrl: 'https://example.com',
      fetch: async () => ({
        dataMode: 'live',
        fetchedAt: new Date().toISOString(),
        records: [{ id: '1', title: 'Test', url: 'https://example.com/1', source: 'Test Source 2' }],
      }),
    }
    const result = await runSourceAdapter(adapter)
    assert.strictEqual(result.status, 'available')
    assert.strictEqual(result.records.length, 1)
    assert.ok(result.records[0].evidenceStatus, 'Expected evidenceStatus')
  })

  await testAsync('CDC adapter reports unavailable with code when fetch fails or blocked', async () => {
    const { CDC_SOURCE_URL, fetchCdcReports } = require('./sources/cdc')
    const adapter = { key: 'cdc', name: 'CDC', sourceUrl: CDC_SOURCE_URL, fetch: fetchCdcReports }
    const originalFetch = global.fetch
    try {
      global.fetch = async () => ({ status: 403, ok: false })
      const result = await runSourceAdapter(adapter)
      assert.strictEqual(result.status, 'unavailable')
      assert.strictEqual(result.error?.code, 'CDC_ACCESS_RESTRICTED')
    } finally {
      global.fetch = originalFetch
    }
  })

  await testAsync('IDSP adapter reports unavailable with honest reason', async () => {
    const { IDSP_SOURCE_URL, fetchIdspReports } = require('./sources/idsp')
    const adapter = { key: 'idsp', name: 'IDSP', sourceUrl: IDSP_SOURCE_URL, fetch: fetchIdspReports }
    const result = await runSourceAdapter(adapter)
    assert.strictEqual(result.status, 'unavailable')
    assert.strictEqual(result.error?.code, 'IDSP_REQUIRES_CONFIG')
  })
}

runAdapterTests()
  .then(() => {
    console.log(`\n${'─'.repeat(48)}`)
    console.log(`Results: ${passed} passed, ${failed} failed`)
    if (failed > 0) process.exit(1)
  })
  .catch((err) => {
    console.error('Test runner error:', err)
    process.exit(1)
  })
