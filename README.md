# CONFRA — Event Networking and Management Platform

Reusable platform for events and event organizers.

## Structure

- `apps/attendee-mobile/` — Attendee mobile app (React Native + CLI)
- `apps/admin-web/` — Admin web app (React + Vite + TypeScript)
- `apps/backend/` — Shared API (Node.js + Express, port 5000)
- `docs/` — Project documentation

## Development

Backend:

```bash
cd apps/backend
npm install
npm run dev        # starts on http://localhost:5000
```

Health check: `GET http://localhost:5000/api/health`

Admin web:

```bash
cd apps/admin-web
npm install
npm run dev        # starts on http://localhost:5173
```

Attendee mobile (CLI):

```bash
cd apps/attendee-mobile
npm install
npx CLI start
```
