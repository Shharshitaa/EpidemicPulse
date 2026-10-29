EpidemicPulse
Detect Signals. Understand Risk. Act Earlier.

EpidemicPulse is a public-health intelligence prototype that brings
together outbreak-related reports, groups potential signals, highlights
evidence gaps, and supports human-led investigation. It helps analysts
review available information; it does not diagnose disease, confirm
outbreaks, or provide validated real-world predictions.
Problem Statement
Public-health teams and analysts must often review outbreak-related information published across multiple sources, formats, and reporting timelines. Relevant signals can be scattered across official disease-outbreak notices, public-health updates, and other reporting channels. Manually checking each source and connecting reports can take time, while inconsistent metadata, delayed publication, and incomplete geographic or disease details make comparison difficult.

This creates several practical challenges:
- Fragmented information: Analysts may need to move between multiple source websites and reporting systems to build a broader picture.
- Slow initial triage: Reviewing many reports manually can make it harder to spot items that may deserve closer investigation.
- Uncertain or incomplete evidence: A report may lack clear disease, location, date, or corroborating-source information. A cluster of related reports does not automatically establish that an outbreak is occurring.
- Limited visibility into source coverage: Users need to understand which sources are available and where evidence is thin, rather than treating missing data as proof that no risk exists.
- Difficulty exploring scenarios: Teams may want to reason about hypothetical situations, but simulated outcomes must be clearly separated from observed reports and validated forecasts.
EpidemicPulse addresses these workflow challenges by organizing available reporting into a shared interface for exploration and human review. It is an investigation-support prototype, not an automated outbreak-confirmation or diagnosis system.
Proposed Solution
EpidemicPulse provides a public-health intelligence dashboard that aggregates available outbreak-related reports, organizes potential signals into event groups where possible, and helps users inspect the supporting evidence and its limitations.

The solution is built around the following capabilities:
1. Multi-source report collection: Backend adapters collect information from configured public-health and reporting sources, including WHO, ECDC, Africa CDC, ProMED, CDC, GDELT, and IDSP India where available. Source availability and data coverage can vary.
2. Centralized overview: The dashboard summarizes available reports and potential event clusters so users can begin from one place instead of checking every source separately.
3. Signal exploration: Map-based monitoring and filters help users explore potential signals by location and disease when reliable metadata is available.
4. Evidence-led investigation: Investigation dossiers, source evidence, checklists, and analyst notes support a structured human review process.
5. Source transparency: Source-status information and visible evidence gaps help users interpret results cautiously. Single-source items and incomplete metadata should remain unverified until corroborated.
6. Hypothetical scenario exploration: The Simulation Lab supports exploration of hypothetical scenarios. Its outputs are simulations, not confirmed events or validated real-world epidemiological predictions.
Intended Workflow
- Collect available reports from configured sources.
- Normalize and display report information where supported by the source data.
- Group potentially related reports when the available metadata allows it.
- Let analysts inspect the original evidence, review gaps, and record investigation notes.
- Use source status and corroboration information to judge how much confidence the evidence warrants.
- Keep hypothetical simulation results distinct from observed reporting.
Expected Value
EpidemicPulse aims to reduce the effort required for initial information triage, make potentially relevant reports easier to explore together, and encourage transparent, evidence-based investigation. Its value is in helping people organize and review information—not in replacing expert judgment or public-health authority decisions.
Features
- Overview dashboard for a high-level view of available reports
  and event clusters.
- Live Intelligence to review outbreak-related reporting from
  supported sources.
- Signal Monitoring with a map and filters to explore potential
  signals by location and disease.
- Alerts & Investigations with investigation dossiers, evidence
  review, and checklists.
- Investigation Notes for analyst working notes.
- Simulation Lab for hypothetical scenarios. Simulation outputs
  are not validated real-world forecasts.
- Source Status to review the state of supported data sources.
- Multi-source ingestion through adapters for sources including
  WHO, ECDC, Africa CDC, ProMED, CDC, GDELT, and IDSP India where
  configured and available.
Source availability, metadata quality, and coverage can vary. A report
or cluster is a signal for review, not proof of an outbreak. Independent
corroboration may be limited.
Technology Stack
- Frontend: React, Vite
- Backend: Node.js, Express
- Mapping: Leaflet
- Data: Public-health reporting sources and source adapters
Live Demo
- Frontend: https://epidemic-pulse.vercel.app
- Backend: Use the public Render URL shown in the Render
  dashboard.
The frontend uses the VITE_API_BASE_URL environment variable in Vercel
to reach the backend. If the dashboard cannot load data, verify that
this variable points to the current Render service URL and redeploy the
frontend.
Run Locally
Prerequisites
- Node.js (LTS recommended)
- npm
- Git
1. Clone the repository
git clone https://github.com/Shharshitaa/EpidemicPulse.git
cd EpidemicPulse
2. Install dependencies
From the repository root, install frontend/root dependencies:
npm install
Install backend dependencies:
npm install --prefix server
3. Start the backend
From the repository root, run:
npm run server
4. Start the frontend
Open a second terminal in the repository root and run:
npm run dev
Vite usually serves the frontend at http://localhost:5173. Keep both
terminals running while testing locally.
5. Configure the frontend API URL if needed
The frontend reads VITE_API_BASE_URL. If the frontend and backend are
not served through the same origin, create a .env.local file in the
repository root:
VITE_API_BASE_URL=http://localhost:YOUR_BACKEND_PORT
Replace YOUR_BACKEND_PORT with the port printed by the backend. Do not
append /api. Restart the Vite development server after changing
environment variables. If a Vite proxy is configured or the API is
served from the same origin, this variable may be left empty.
Deployment
Backend --- Render
The backend is deployed as a Render Web Service from the GitHub
repository.

Recommended settings for the current repository layout:
- Repository: Shharshitaa/EpidemicPulse
- Branch: main
- Root Directory: leave blank (repository root)
- Build Command: npm install --prefix server
- Start Command: npm run server
The root package.json should include the server script used by the
Start Command. If that script changes, update the Render Start Command
accordingly.

After deployment, copy the actual public service URL from Render and
test its health endpoint:
https://YOUR-RENDER-SERVICE-URL/api/health
Replace the placeholder with your real Render URL.
Frontend --- Vercel
Import Shharshitaa/EpidemicPulse into Vercel and use:
- Framework Preset: Vite
- Root Directory: ./
- Build Command: npm run build
- Output Directory: dist
In Project Settings → Environment Variables, set:
VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE-URL
Use the actual Render URL without a trailing slash. Apply it to
Production, save, and redeploy the frontend so the variable is
included in the Vite build.

Because VITE_ variables are exposed to browser-side code, only put
public configuration such as the API base URL in this variable. Never
store private API keys or secrets in a VITE_ variable.

If the frontend deploys but API requests fail, verify that the Render
service is Live, the URL is correct, and the backend permits requests
from the Vercel domain through its CORS configuration.
API Endpoints
The backend includes routes such as:
- GET /api/health
- GET /api/reports
- GET /api/dashboard
- GET /api/sources
- GET /api/events
The frontend may also request /api/intelligence and /api/alerts,
depending on the view and fallback logic. Available endpoints depend on
the deployed code version.
Validation
Run these commands from the repository root:
npm run lint
npm run build
These commands check frontend linting and create the production frontend
build.
Responsible Use & Limitations
- EpidemicPulse is a prototype for information triage and
  investigation support.
- It does not confirm outbreaks, diagnose patients, or replace
  public-health authorities.
- Clusters may be based on a single source and should be treated as
  unverified until corroborated.
- Data sources may be delayed, unavailable, incomplete, or
  inconsistent.
- Simulation Lab results are hypothetical and should not be
  interpreted as validated epidemiological forecasts.
- Analysts should inspect source evidence and verify claims with
  authoritative sources before making decisions.
Contributing
1. Fork the repository or create a branch.
2. Make focused changes.
3. Run linting and the production build.
4. Open a pull request with a clear description of the changes.
License
See the LICENSE file in this repository.

EpidemicPulse currently runs locally and is not deployed. Each user must clone the repository, install its dependencies, configure any required environment variables, and start the backend and frontend separately.

## Disclaimer

EpidemicPulse is an informational and investigative support tool. It does not replace official public-health guidance, expert assessment, or medical advice.
