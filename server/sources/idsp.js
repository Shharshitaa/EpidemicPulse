// India NCDC / IDSP (Integrated Disease Surveillance Programme) Adapter
// Official portal: https://idsp.mohfw.gov.in/
// Status: Requires authenticated session / PDF reports; no public machine-readable RSS endpoint published
const IDSP_SOURCE_URL = 'https://idsp.mohfw.gov.in/'

async function fetchIdspReports() {
  // IDSP does not publish an open CORS-accessible JSON/RSS feed without session auth.
  // We document this honestly rather than inventing fake data.
  const err = new Error('NCDC/IDSP India does not provide an open machine-readable API; outbreak weekly reports require authenticated portal retrieval and manual PDF parsing.')
  err.code = 'IDSP_REQUIRES_CONFIG'
  throw err
}

module.exports = { IDSP_SOURCE_URL, fetchIdspReports }
