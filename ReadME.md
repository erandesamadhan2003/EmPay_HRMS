# EmPay HRMS

HR + payroll web app (React/Vite + Express/PostgreSQL). API lives under `/api/*`; **Swagger UI**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs) when the backend is running.

**Team:** Samadhan Erande · Harsha Agarwal · Shantanu Sawant · Atharva Patil

## Prerequisites

- [Bun](https://bun.sh)
- PostgreSQL (see `backend/.env`)

## Run

```bash
# backend
cd backend && bun install && bun run start
# API docs: /api/docs
# optional: bun run seed   # demo tenant; every seeded user → password `samadhan` (bcrypt in DB)
# optional: bun run test:api

# frontend (new terminal)
cd frontend && bun install && bun run dev
```

Point `frontend/.env` `VITE_API_BASE_URL` at your API (e.g. `http://localhost:3000/api/`).
