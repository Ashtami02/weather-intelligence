# Weather Intelligence

A local weather dashboard built for an AI Engineer Intern assessment. Search for a city, view its current conditions and five-day forecast, and revisit saved searches from PostgreSQL.

## Features

- City suggestions with state and country when available
- Current conditions, temperature, feels-like temperature, humidity, wind, and precipitation
- Five-day forecast with highs, lows, conditions, precipitation, sunrise, and sunset
- Temperature and precipitation charts
- Interactive city map with a location marker and OpenStreetMap tiles
- Side-by-side comparison of two cities, including the temperature difference
- Search history with revisit and delete actions
- CSV and JSON downloads of all saved searches

Built by Ashtami Choudhary. The dashboard includes an About section for [PM Accelerator](https://www.linkedin.com/school/pmaccelerator/).

## Stack and structure

- **Frontend** — React, TypeScript, Vite, Tailwind CSS, Recharts, Leaflet
- **Backend** — FastAPI, SQLAlchemy, Pydantic, psycopg, httpx
- **Data** — PostgreSQL, Open-Meteo, OpenStreetMap

```text
backend/
  app/                API routes, database, models, schemas, and weather service
  requirements.txt    Python dependencies
  .env.example        Backend environment template
frontend/
  src/                Dashboard, search, comparison, map, and charts
  package.json        Frontend scripts and dependencies
  .env.example        Frontend environment template
```

## Local setup

Install Python 3.10 or newer, Node.js 22.12 or newer, and PostgreSQL.

### PostgreSQL

Start PostgreSQL. Create an empty database named `weather_intelligence` in pgAdmin or run the following if `psql` is available. Skip creation if the database already exists.

```powershell
psql -U postgres -c "CREATE DATABASE weather_intelligence;"
```

If `backend/.env` is missing, copy `backend/.env.example` and replace the placeholders with your PostgreSQL user and password. Keep the existing file if it already works. URL-encode reserved characters in the username or password. The backend creates the history table on startup.

```dotenv
DATABASE_URL=postgresql+psycopg://YOUR_USER:YOUR_PASSWORD@localhost:5432/weather_intelligence
```

### Backend

Run from the repository root in PowerShell. The explicit Python path avoids PowerShell activation-policy issues.

```powershell
cd backend
python -m venv .venv-local
.\.venv-local\Scripts\python.exe -m pip install -r requirements.txt
.\.venv-local\Scripts\python.exe -m uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs` for interactive API documentation.

### Frontend

Run in a second terminal from the repository root.

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Open `http://localhost:5173`. Vite development defaults to `http://127.0.0.1:8000`. To use another API origin, set `VITE_API_URL` in `frontend/.env.local` and restart Vite.

```dotenv
VITE_API_URL=http://127.0.0.1:8000
```

## API summary

| Method and path | Behavior |
| --- | --- |
| `GET /health` | Checks that the API is running. |
| `GET /api/locations/search?name=London` | Returns matching places and coordinates. |
| `GET /api/weather/current?latitude=51.51&longitude=-0.13` | Returns current Open-Meteo readings. |
| `GET /api/weather/forecast?latitude=51.51&longitude=-0.13` | Returns five days of daily Open-Meteo readings. |
| `POST /api/history` | Saves city, country, latitude, longitude, and temperature. |
| `GET /api/history` | Lists saved searches. |
| `GET /api/history/export/csv` | Downloads all searches as CSV. An empty database returns the column headers. |
| `GET /api/history/export/json` | Downloads all searches as JSON. An empty database returns `[]`. |
| `GET /api/history/{id}` | Reads a saved search. |
| `PUT /api/history/{id}` | Replaces the editable fields of a saved search. |
| `DELETE /api/history/{id}` | Deletes a saved search and returns HTTP 204. |

## Testing

Use **Download CSV** or **Download JSON** in **Recent searches**. Both files include ID, city, country, latitude, longitude, temperature, and search timestamp. Exports contain every saved record in ID order.

From `frontend`, run a production build against the local backend and preview it.

```powershell
$env:VITE_API_URL = 'http://127.0.0.1:8000'
npm.cmd run typecheck
npm.cmd run build
npm.cmd run preview
```

Search for a real city, select a suggestion, and check the current readings, five forecast days, charts, and map. Select another city and check that the marker moves. In **Compare cities**, select two cities and confirm the temperature difference matches their readings. Reload to check history persistence, revisit a city, then delete the test entries. Try an empty search and a city name with no matches. Repeat on a narrow viewport. Use FastAPI’s `/docs` to check individual history routes and missing IDs.

## Deployment

1. Create a PostgreSQL database and a Python Web Service on Render in the same region. Set the service root directory to `backend`, its build command to `pip install -r requirements.txt`, and its start command to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Set the health check path to `/health`.
2. Set Render’s `DATABASE_URL` to the internal database URL. Set `CORS_ORIGINS` to the exact frontend origin, currently `https://weather-intelligence-omega.vercel.app`. Use a comma-separated list for additional trusted origins. If keeping the FastAPI backend on Vercel, set its project root to `backend` and use a PostgreSQL endpoint that is reachable from Vercel with the database provider's required TLS settings.
3. In Vercel, select the Vite preset, use `npm run build`, and set the output directory to `dist`. Use the directory containing the frontend's `package.json` as the root. In the current GitHub repository it is the repository root. In a checkout with the frontend under `frontend/`, use that directory. Set `VITE_API_URL` to the public FastAPI HTTPS origin in the Production environment, then redeploy so Vite includes the new value. Keep `DATABASE_URL` on the backend.
4. Check `/health` and `/api/history` on the FastAPI origin. If startup fails, check the backend logs and confirm that PostgreSQL is reachable from the host. Use the database's internal connection URL only if the backend can reach its private network. If FastAPI works directly but the browser blocks it, check the exact Vercel origin in `CORS_ORIGINS` and restart the backend after changing it. Open the redeployed frontend and try both downloads.

[Render FastAPI guide](https://render.com/docs/deploy-fastapi) · [Render PostgreSQL guide](https://render.com/docs/postgresql-creating-connecting) · [Vercel Vite guide](https://vercel.com/docs/frameworks/frontend/vite)

## Limitations and future improvements

- Live weather and map tiles require internet access. The map uses the public OpenStreetMap tile service and its [usage policy](https://operations.osmfoundation.org/policies/tiles/).
- History is shared by all users of a deployment. Use a dedicated demo database and keep personal data out of it. Authentication and per-user history are future improvements.
- A weather assistant grounded in the retrieved forecast is a future improvement.
