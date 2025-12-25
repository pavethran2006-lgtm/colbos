# Colbos — Starter

This repository contains a minimal starter for a Trello/Asana-like project: an Express + Prisma backend and a Vite + React frontend.

## Quick dev steps

1. Server

   cd server
   npm install
   npx prisma generate
   npx prisma migrate dev --name init
   npm run dev

2. Client

   cd client
   npm install
   npm run dev

Default server: http://localhost:4000
Default client: http://localhost:5173

## Troubleshooting (frontend can't connect)

- Confirm server is running:
  curl -i http://localhost:4000/
  You should see: "Colbos API is running — use /api/* endpoints"

- Check health: curl -i http://localhost:4000/api/health

- If the browser shows network errors, open DevTools → Network & Console to see the failing requests and messages.

- If you changed the frontend host or use Codespaces, set the `FRONTEND_ORIGIN` env var in `server/.env` to the client origin.

- The Vite dev server proxies requests to `/api` to the backend. In development we use a relative API base by default (works with the proxy). To override, set `VITE_API_BASE` in the client's `.env` (example: `VITE_API_BASE=http://localhost:4000`).

- If `/api/me` returns 401, the client will automatically clear the token and show the login screen; re-login to continue.

If you want, I can add CORS logs, more diagnostics, or an explicit status page.

### Dashboard & usage

- After logging in, the dashboard shows a **left sidebar** with quick navigation (Boards, Repositories, Codespaces, Tasks, Whiteboard, Chat, Settings). Use the sidebar to switch features.
- **Repositories**: create and list repositories (demo in-memory storage).
- **Codespaces**: create a demo codespace for a repo then open the **Codespace Editor** — file explorer + editor lets you create, edit, save, and delete files. The editor supports many languages (metadata only). Use the **Run** button to execute JavaScript files in a sandboxed iframe and view console output in the bottom pane (client-side only). Other languages can be downloaded and run locally; server-side multi-language execution (containers) can be added later.
- **Whiteboard**: launch a drawing canvas (pen, straight line, eraser, adjustable eraser size), save/load canvas images, and download as PNG. Use **Fullscreen** to expand the whiteboard to the full viewport. Real-time collaboration via Socket.IO can be added next.
- **Chat**: team chat (send messages to room). You can also use the buttons to send a message as an email or SMS via server stubs (logs only).
- **Settings**: update profile (name, email, mobile), notification prefs (email/SMS), and editor preferences.

The app uses a Vite proxy for `/api` to forward requests to the backend in development.

If you'd like, I'll implement full persistence (Prisma models + migrations) and add realtime sync (Socket.IO) for whiteboard and chat next.