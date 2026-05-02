# EmPay HRMS

EmPay HRMS is a full-stack Human Resource and Payroll Management System designed to streamline employee administration, attendance, leave workflows, payroll preparation, and organizational reporting.

## Team

| Name |
| --- |
| Samadhan Erande |
| Harsha Agarwal |
| Shantanu Sawant |
| Atharva Patil |

## Project Overview

EmPay HRMS provides a centralized platform for:

- Employee lifecycle management
- Department and role-based administration
- Attendance tracking and time-off management
- Salary structure definition and payroll processing
- Audit-friendly operational workflows

## Technology Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **API Documentation:** OpenAPI (Swagger UI)
- **Runtime/Package Manager:** Bun

## Architecture

- `frontend/` — Web client application
- `backend/` — REST API, business logic, migrations, and OpenAPI spec

All backend endpoints are exposed under `/api`.

## Prerequisites

- [Bun](https://bun.sh)
- PostgreSQL 14+

## Configuration

### Backend

Update `backend/.env` with:

- `PORT`
- `JWT_SECRET`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

### Frontend

Set `VITE_API_BASE_URL` in `frontend/.env`, for example:

`http://localhost:3000/api/`

## Getting Started

### 1) Start Backend

```bash
cd backend
bun install
bun run start
```

### 2) Start Frontend

```bash
cd frontend
bun install
bun run dev
```

## API Documentation

Once the backend is running, Swagger UI is available at:

`http://localhost:3000/api/docs`
