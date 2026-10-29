async function runSourceAdapter(adapter, forceRefresh = false) {
  try {
    const payload = await adapter.fetch(forceRefresh)
    const fetchedAt = payload.fetchedAt || new Date().toISOString()
    const rawRecords = Array.isArray(payload.records) ? payload.records : Array.isArray(payload.reports) ? payload.reports : []
    const records = rawRecords.map((record) => ({
      ...record,
      sourceKey: record.sourceKey || adapter.key,
      source: record.source || adapter.name,
      summary: record.summary || null,
      eventDate: record.eventDate || null,
      retrievedAt: record.retrievedAt || fetchedAt,
      sourceRecordId: record.sourceRecordId || record.id || record.url,
      evidenceStatus: record.evidenceStatus || 'source-published',
    }))
    return {
      key: adapter.key,
      source: adapter.name,
      sourceUrl: adapter.sourceUrl,
      dataMode: payload.dataMode || 'live',
      status: 'available',
      fetchedAt,
      records,
      error: null,
    }
  } catch (error) {
    const errorCode = error.code || `${adapter.key.toUpperCase()}_SOURCE_UNAVAILABLE`
    return {
      key: adapter.key,
      source: adapter.name,
      sourceUrl: adapter.sourceUrl,
      dataMode: 'unavailable',
      status: 'unavailable',
      fetchedAt: new Date().toISOString(),
      records: [],
      error: { code: errorCode, message: error instanceof Error ? error.message : 'Source is unavailable' },
    }
  }
}

module.exports = { runSourceAdapter }
