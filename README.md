# scenario-backend

Express + TypeScript API for the scenario frontend. Runs on port **4000** by default.

## Setup

1. **Install dependencies**
   ```bash
   cd scenario-backend
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env`.
   - Optional: set `PORT` (default `4000`), `FRONTEND_ORIGIN` (default `http://localhost:3001`).

3. **Run**
   - Development (with reload): `npm run dev`
   - Build: `npm run build`
   - Production: `npm run start`

## Frontend connection

- In **scenario-frontend**, copy `env.example` to `.env.local` and set:
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:4000
  ```
- Start backend (`npm run dev` in scenario-backend) and frontend (`npm run dev` in scenario-frontend). The frontend uses `NEXT_PUBLIC_API_URL` to call this API.

## API routes (stubs)

- `GET /api/health` – health check
- `GET /api/authorizer/tasks` – authorizer tasks
- `GET /api/admin/reports` – admin reports
- `GET /api/system-admin/users` – system admin user list
- `GET/PUT /api/system-admin/integration/database`
- `GET/PUT /api/system-admin/integration/server`
- `GET/PUT /api/system-admin/integration/config`
- `POST /api/system-admin/integration/database/test`

Replace stub responses with real logic and persistence as needed.
