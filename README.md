# EpidemicPulse
### Global Epidemic Intelligence & Early Warning Dashboard

🌐 **Live Website:** [https://epidemic-pulse.vercel.app](https://epidemic-pulse.vercel.app)

💻 **GitHub Repository:** [https://github.com/Shharshitaa/EpidemicPulse](https://github.com/Shharshitaa/EpidemicPulse)

EpidemicPulse is a public-health intelligence dashboard designed to bring epidemic-related information into one place. It helps users monitor disease reports, explore geographic patterns, review potential emerging signals, and support timely, data-informed public-health investigations.

## 1. Problem Statement

Infectious disease outbreaks can spread across geographic boundaries before their full impact is understood. Early awareness of unusual disease activity is important for public-health authorities, researchers, healthcare professionals, and communities working to reduce the impact of epidemics.

However, epidemic-related information is distributed across multiple sources, including international health organizations, national surveillance agencies, outbreak-reporting services, and news feeds. Collecting and comparing these reports manually can be time-consuming and makes it difficult to develop a consolidated view of emerging public-health concerns.

The major challenges include:

- **Fragmented information:** Disease reports and public-health updates are published across different platforms and organizations.
- **Delayed awareness:** Manually checking multiple sources can slow the identification of potentially important developments.
- **Limited geographic visibility:** Understanding where reports originate and how signals are distributed often requires additional analysis.
- **Difficulty prioritizing signals:** Analysts need practical tools to review alerts, compare reports, and identify items that may require further investigation.
- **Lack of a unified monitoring interface:** Users may need to switch between multiple websites and tools to understand the current reporting landscape.
- **Uncertainty in early reports:** Initial reports may be incomplete, duplicated, delayed, or unverified, so potential warning signals must be distinguished from confirmed outbreaks.

EpidemicPulse addresses these challenges by providing a centralized interface for epidemic intelligence, source monitoring, geographic exploration, alerts, and investigation workflows.

## 2. Proposed Solution

EpidemicPulse combines a web-based dashboard with a backend service that retrieves and organizes information from configured public-health and related data sources.

The application presents available information through interactive dashboard views, helping users explore reported events, monitor source availability, review alerts, and investigate potentially significant signals.

The platform is designed to support situational awareness and human-led investigation. It does not replace official public-health guidance, epidemiological assessment, laboratory confirmation, or professional decision-making.

## 3. Key Features

### Overview Dashboard
Provides a consolidated view of available epidemic intelligence, including reported events, alert summaries, and other indicators supported by the current data.

### Live Intelligence
Allows users to review available disease-related reports and intelligence items from configured sources.

### Signal Monitoring
Supports the monitoring and exploration of emerging reports and potential patterns that may warrant further review.

### Alerts & Investigations
Provides an interface for reviewing alerts and organizing investigation-related information.

### Investigation Notes
Helps users record contextual observations and organize information during the review of potential events.

### Simulation Lab
Provides an area for exploring hypothetical scenarios and simulation-related workflows. Simulation results are illustrative and should not be interpreted as predictions of actual disease spread.

### Source Status
Helps users inspect the availability and status of configured data sources, providing context about the information accessible to the application.

### Geographic Visualization
Uses an interactive map to help users explore geographic information associated with available reports and events.

### Centralized Backend API
Provides HTTP endpoints for the frontend to retrieve dashboard information, source status, intelligence items, events, and alerts.

## 4. How It Works

1. **Data collection:** The backend retrieves information from configured public-health, outbreak-reporting, and related data sources.
2. **Data processing:** Retrieved information is organized into application-friendly structures.
3. **API delivery:** The backend exposes data through HTTP API endpoints.
4. **Dashboard visualization:** The React frontend displays available information through dashboard views, lists, alerts, and interactive maps.
5. **Signal review:** Users explore reports, review potential patterns, and identify items that may require further investigation.
6. **Investigation support:** Users organize their observations and follow-up considerations using the available investigation tools.

Data availability and freshness depend on the configured sources, network connectivity, source APIs, and backend implementation.

## 5. Data Sources

The project is designed to work with configured public-health and outbreak-intelligence sources. Depending on the active adapters and their availability, these may include:

- World Health Organization (WHO)
- European Centre for Disease Prevention and Control (ECDC)
- Africa Centres for Disease Control and Prevention (Africa CDC)
- ProMED
- United States Centers for Disease Control and Prevention (CDC)
- GDELT-related news intelligence
- India's Integrated Disease Surveillance Programme (IDSP)

**Note:** This list describes intended or supported integrations, not a guarantee that every source is active in the current deployment. Actual coverage depends on the adapters configured in the repository.

## 6. Technology Stack

### Frontend
- React
- Vite
- JavaScript
- Leaflet for interactive geographic visualization

### Backend
- Node.js
- Express.js
- CORS
- dotenv for environment configuration

### Deployment and Version Control
- Vercel — frontend hosting
- Render — backend hosting
- Git and GitHub — version control

## 7. Project Structure

The repository includes a frontend application and a backend service. The following is a representative structure:

```text
EpidemicPulse/
├── server/
│   ├── package.json
│   └── server.js
├── src/
│   └── App.jsx
├── public/
├── package.json
├── README.md
└── vite.config.js
```

Additional components, source files, assets, and configuration files may be present in the repository.

## 8. Getting Started

### Prerequisites

Install the following:

- Node.js
- npm
- Git
- Visual Studio Code or another code editor

### Step 1: Clone the Repository

```bash
git clone https://github.com/Shharshitaa/EpidemicPulse.git
cd EpidemicPulse
```

### Step 2: Install Frontend Dependencies

From the project root:

```bash
npm install
```

### Step 3: Install Backend Dependencies

```bash
npm install --prefix server
```

### Step 4: Configure Environment Variables

Configure the frontend backend URL using a Vite environment variable.

For local development, create or update the root `.env` file:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Replace the example URL if your backend uses a different port.

For production, use the actual deployed Render backend URL. Do not include a trailing slash in the base URL if the application constructs API paths by appending them.

Add any other required backend variables to the appropriate environment file. Never commit secrets, API keys, or credentials to GitHub.

### Step 5: Start the Backend

If the root `package.json` defines the `server` script, run:

```bash
npm run server
```

Alternatively, if the backend package defines a `start` script, run:

```bash
npm start --prefix server
```

Use the command that matches the scripts configured in the repository. Run the backend in a separate terminal from the frontend.

### Step 6: Start the Frontend

From the project root:

```bash
npm run dev
```

Open the local URL displayed by Vite in the terminal, commonly:

`http://localhost:5173`

## 9. API Endpoints

The frontend is designed to communicate with backend endpoints including:

| Endpoint | Purpose |
|---|---|
| `/api/health` | Check backend health, if implemented |
| `/api/dashboard` | Retrieve dashboard data |
| `/api/sources` | Retrieve source status information |
| `/api/intelligence` | Retrieve intelligence items |
| `/api/events` | Retrieve event data |
| `/api/alerts` | Retrieve alert data or provide a fallback route, depending on the implementation |

The exact response structures and availability of individual endpoints depend on the current backend implementation.

## 10. Deployment

### Backend Deployment — Render

Configure the Render web service as follows:

- **Repository:** `Shharshitaa/EpidemicPulse`
- **Root Directory:** Leave blank to use the repository root.
- **Build Command:**

```bash
npm install --prefix server
```

- **Start Command:**

```bash
npm run server
```

The start command assumes that the root `package.json` defines the `server` script to start the backend. If the repository scripts change, update the command accordingly.

Ensure the backend listens on the port provided by the hosting platform and configure any required environment variables in Render.

After deployment, test the health endpoint if it is implemented by the server.

### Frontend Deployment — Vercel

1. Import the EpidemicPulse GitHub repository into Vercel.
2. Select Vite as the framework if it is not detected automatically.
3. Set the project root to the repository root.
4. Use the appropriate install and build commands from the root `package.json`.
5. Add the following environment variable in Vercel:

```env
VITE_API_BASE_URL=https://YOUR-RENDER-BACKEND-URL
```

6. Replace the placeholder with the actual Render backend URL, without a trailing slash.
7. Enable the variable for the Production environment.
8. Redeploy the frontend after saving the variable.

Vite environment variables are incorporated into the frontend during the build, so changes require a new deployment.

### Live Application Links

- 🌐 **Open EpidemicPulse:** [https://epidemic-pulse.vercel.app](https://epidemic-pulse.vercel.app)
- 💻 **View Source Code:** [https://github.com/Shharshitaa/EpidemicPulse](https://github.com/Shharshitaa/EpidemicPulse)
- 🚀 **Vercel Dashboard:** [https://vercel.com/dashboard](https://vercel.com/dashboard)

If the frontend URL differs from the production domain shown in your Vercel dashboard, replace it with the verified URL.

## 11. Validation and Responsible Interpretation

EpidemicPulse is an intelligence-monitoring and investigation-support tool. Its outputs must be interpreted carefully.

- A reported event does not automatically indicate a confirmed outbreak.
- An unusual pattern or cluster should be treated as a signal for review, not proof of transmission.
- News reports may be incomplete, duplicated, delayed, or unverified.
- Missing source data does not mean that no disease activity exists.
- Simulation results depend on assumptions and should not be treated as forecasts.
- Official public-health announcements and expert assessments should be consulted before making decisions.

The platform supports situational awareness. It does not replace clinical diagnosis, formal epidemiological analysis, or official outbreak confirmation.

## 12. Future Enhancements

Potential future improvements include:

- Additional public-health data integrations
- Improved source normalization and duplicate detection
- Advanced filtering by disease, geography, date, and source
- Historical trend analysis and reporting
- Enhanced alert prioritization and investigation workflows
- Improved source freshness and ingestion monitoring
- Automated testing and deployment checks
- Better documentation of data provenance and limitations

These are possible future directions and should not be interpreted as features already implemented.

## 13. Contributing

Contributions, suggestions, and improvements are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes and test them locally.
4. Commit your changes with a descriptive message.
5. Open a pull request describing your changes.

Please avoid committing credentials, private information, or environment files containing secrets.

## 14. License

No license is specified in this README. Unless a license is added to the repository, reuse and redistribution remain subject to applicable copyright rules. Add an appropriate `LICENSE` file if you intend to distribute the project under an open-source license.

## Acknowledgements

EpidemicPulse builds on the work of public-health organizations, surveillance initiatives, open-data providers, and open-source software communities whose resources help improve access to epidemic-related information.

---

**EpidemicPulse — bringing epidemic intelligence together to support timely awareness and informed investigation.**

