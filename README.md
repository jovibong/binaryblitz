## Local Development

### Install

From the repo root:

- Install backend deps: `npm install`
- Install frontend deps: `npm run install-client`

### Configure env

This repo has two separate env files:

- Backend env (root): create `.env` (see `.env.example`)
- Frontend env (client): create `client/.env` (see `client/.env.example`)

Important:

- Do NOT put database credentials in `client/.env`. Vite env vars are shipped to the browser.

### Run

- Run both together: `npm run dev`

Or separately in two terminals:

- Backend: `npm run server` (defaults to http://localhost:3001)
- Frontend: `npm run client` (defaults to http://localhost:5173)

### URLs

- Players: `http://localhost:5173/game`
- Game master (admin): `http://localhost:5173/game/<ADMIN_SECRET>`

The server verifies the secret using `ADMIN_SECRET`.

## Deployment Notes (Vercel + Render)

### WebSockets

- Deploy the frontend (Vite/React) to Vercel.
- Deploy the backend (Node + socket.io) to Render (or another long-running host).

Vercel serverless functions are not a good fit for long-lived Socket.IO connections.

### Frontend env on Vercel

Set:

- `VITE_SERVER_URL=https://<your-render-service>.onrender.com`

### Backend env on Render

Set CORS + admin secret:

- `ADMIN_SECRET=...` (used by the admin URL)
- `CORS_ORIGIN=https://<your-vercel-app>.vercel.app` (or comma-separated list)

This backend is schemaless/in-memory only:

- Scores and player lists are kept in server memory and reset on restart.
- If Render sleeps/restarts mid-game, the current test will reset.

### Render keep-alive

When the admin page is open, the frontend pings the backend `/health` every ~45s to reduce Render cold-start downtime.

## Database

No database is required for this version.
