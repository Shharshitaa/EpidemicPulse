# EpidemicPulse 🦠

EpidemicPulse is a public-health intelligence dashboard that brings disease reports together to help users monitor potential outbreak signals, explore reported events, and support outbreak investigation.

## 1. Problem Statement

Disease outbreak information is scattered across multiple sources, making it difficult to monitor emerging signals, understand potential risks, and assess the reliability of available information.

## 2. Solution

EpidemicPulse combines disease reports in one dashboard, visualizes reported events on a map, groups potential signals, and supports investigations through evidence checklists and source monitoring. The Simulation Lab allows users to explore hypothetical outbreak scenarios.

**Disclaimer:** Potential signals are not confirmed outbreaks. Simulations are not validated predictions.

## 3. Tech Stack

- **Frontend:** React, Vite, JavaScript
- **Backend:** Node.js, Express
- **Maps:** Leaflet
- **Data sources:** WHO, CDC, ECDC, Africa CDC, ProMED, GDELT, and IDSP India

## 4. Prerequisites

Before running the project on a laptop, install:

1. **Node.js (LTS):** https://nodejs.org/
2. **Git:** https://git-scm.com/downloads
3. **A code editor (optional):** https://code.visualstudio.com/

After installation, open a terminal or PowerShell and check:

```bash
node --version
npm --version
git --version
```

If these commands return version numbers, the tools are available. If not, install them and reopen the terminal.

## 5. Download the Project

Open a terminal and run:

```bash
git clone https://github.com/Shharshitaa/EpidemicPulse.git
cd EpidemicPulse
```

Optionally, open the project in VS Code:

```bash
code .
```

If the `code` command is unavailable, open VS Code manually and select **File → Open Folder**.

## 6. Install Dependencies

From the project root directory, run:

```bash
npm install
```

This installs the dependencies defined in the project's `package.json`.

If the backend has its own `package.json`, open a separate terminal, navigate to the backend directory, and run `npm install` there too. Use the actual backend directory configured in the repository.

## 7. Run the Backend

Open **Terminal 1** in the project root.

If the backend entry point is `server/server.js`, run:

```bash
node server/server.js
```

Keep this terminal open while using the application. The backend serves API data to the frontend.

If this command does not match the project structure, check the backend's `package.json` for its start script or inspect the `server` directory to find the correct entry point.

## 8. Run the Frontend

Open **Terminal 2** in the project root. Run:

```bash
npm run dev
```

Vite will display a local URL, usually:

```text
http://localhost:5173
```

Open the URL in your browser. Keep both terminals running: one for the backend and one for the frontend.

## 9. Backend Configuration

The frontend must connect to the correct backend URL and port.

- Check the backend configuration to identify its listening port.
- Check the frontend API configuration to see which backend URL it uses.
- If the project uses an environment file such as `.env`, create it using the required variable names documented in the project. Do not commit secrets or private credentials.
- If the frontend and backend use different ports, ensure the backend permits requests from the frontend origin.

Do not assume a particular backend port or environment variable name without checking the project's configuration.

## 10. Verify the Application

Once both services are running:

1. Open the frontend URL displayed by Vite.
2. Navigate through the dashboard sections.
3. Check whether reports and source information load.
4. Confirm that the map and investigation features work.
5. Check the backend health endpoint, if available, at `/api/health` using the backend's actual local URL and port.

## 11. Optional Validation

From the project root, run:

```bash
npm run lint
npm run build
```

These commands check code quality and build the frontend, provided the corresponding scripts are defined in `package.json`.

## 12. Troubleshooting

- **`node` or `npm` not recognized:** Install Node.js and reopen the terminal.
- **`git` not recognized:** Install Git and reopen the terminal.
- **`npm run dev` fails:** Confirm you are in the frontend project directory and have installed dependencies.
- **Backend command fails:** Verify the backend entry point and its dependencies.
- **Dashboard cannot load data:** Confirm both services are running and the frontend's API URL matches the backend configuration.
- **Port already in use:** Stop the other process or configure the application to use an available port.
- **Map or reports are empty:** Check the browser console, backend terminal, network connection, and external data-source availability.

## 13. Project Status

EpidemicPulse currently runs locally and is not deployed. Each user must clone the repository, install its dependencies, configure any required environment variables, and start the backend and frontend separately.

## Disclaimer

EpidemicPulse is an informational and investigative support tool. It does not replace official public-health guidance, expert assessment, or medical advice.
