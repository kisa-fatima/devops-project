# DevOps A1 – LLM Prompts

SQLite-backed API and React frontend for viewing LLM prompts.

## Setup

```bash
npm install
cd client && npm install && cd ..
```

Seed the database (once):

```bash
npm run seed
```

## Run

**Terminal 1 – backend (port 3001):**
```bash
npm run server
```

**Terminal 2 – frontend (Vite dev server):**
```bash
npm run client
```

Open http://localhost:5173. The React app proxies `/api` to the backend.

## Structure

- `server/db.js` – SQLite DB and `prompts` table
- `server/seed.js` – Seeds 3 sample LLM prompts
- `server/index.js` – Express API: `GET /api/prompts`, `GET /api/prompts/:id`
- `client/` – Vite + React app that fetches and displays prompts
