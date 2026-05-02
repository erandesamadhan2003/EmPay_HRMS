# EmPay – Smart HRMS: Complete Technical Documentation

> **Stack:** React + Vite · Node.js (Express) · PostgreSQL (Railway) · TanStack Query · Tailwind CSS · Kafka (Upstash) · Redis (Railway)
> **Version:** 1.0.0 | **Last Updated:** May 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Decisions & Rationale](#3-technology-decisions--rationale)
4. [Roles & Permissions Matrix](#4-roles--permissions-matrix)
5. [Database Schema](#5-database-schema)
6. [API Design Standard](#6-api-design-standard)
7. [Pagination, Search & Filters](#7-pagination-search--filters)
8. [Module-by-Module Specification](#8-module-by-module-specification)
   - 8.1 [Auth & User Management](#81-auth--user-management)
   - 8.2 [Employee Profiles](#82-employee-profiles)
   - 8.3 [Attendance](#83-attendance)
   - 8.4 [Time Off (Leave)](#84-time-off-leave)
   - 8.5 [Payroll & Payrun](#85-payroll--payrun)
   - 8.6 [Reports](#86-reports)
   - 8.7 [Settings](#87-settings)
   - 8.8 [Dashboard & Analytics](#88-dashboard--analytics)
9. [Kafka Event Architecture](#9-kafka-event-architecture)
10. [Redis Caching Strategy](#10-redis-caching-strategy)
11. [TanStack Query — State Management (No Zustand)](#11-tanstack-query--state-management-no-zustand)
12. [Folder Structure](#12-folder-structure)
13. [Setup Commands](#13-setup-commands)
14. [Environment Variables](#14-environment-variables)
15. [UI/UX Flows from Mockups](#15-uiux-flows-from-mockups)

---

## 1. Project Overview

**EmPay** is an all-in-one Human Resource Management System aimed at startups, SMEs, and institutions. It streamlines employee lifecycle management covering onboarding, attendance tracking, leave management, payroll processing, payslip generation, and HR analytics — all from a unified platform.

### Core Goals

- Eliminate manual HR processes through automation
- Role-gated access ensuring data integrity and privacy
- Payroll driven entirely by attendance — no magic numbers
- Real-time event processing via Kafka for audit trails and notifications
- Fast reads via Redis caching on frequently queried data
- Efficient list rendering via offset-based pagination (10 records per page)
- Powerful search and filter support on all list views

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT (React)                      │
│  TanStack Query · Tailwind · React Router · Axios        │
│  (No Zustand — all server state in TanStack Query,       │
│   auth/session state persisted via React Context +       │
│   localStorage token, synced from Redis on server)       │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / REST
┌──────────────────────▼──────────────────────────────────┐
│               BACKEND (Node.js / Express)                │
│  JWT Auth · Role Middleware · Controllers · Services     │
│                                                          │
│   ┌──────────────┐    ┌──────────────┐                  │
│   │  Redis Cache │    │  Kafka Prod. │                   │
│   └──────────────┘    └──────────────┘                   │
└──────────┬───────────────────────┬──────────────────────┘
           │                       │
┌──────────▼──────────┐  ┌─────────▼────────────────────┐
│  PostgreSQL (Railway)│  │  Kafka (Upstash — serverless) │
│  Primary Data Store  │  │  Event Streaming & Audit      │
└─────────────────────┘  └──────────────────────────────┘
```

### Infrastructure Choice: Railway + Upstash

**Railway** hosts PostgreSQL and Redis on a single dashboard with unified billing, automatic TLS, and simple env injection. **Upstash Kafka** (serverless, pay-per-message, HTTP-based) pairs naturally — no broker cluster to manage.

---

## 3. Technology Decisions & Rationale

| Technology | Role | Why |
|---|---|---|
| **React + Vite** | Frontend SPA | Fast HMR, modern ESM bundling |
| **TanStack Query** | All server state + cache | Cache invalidation, background refetch, optimistic updates. Replaces Zustand for server state. |
| **React Context** | Auth state (token, role, user) | Lightweight, no extra library. Bootstrapped from localStorage on app load. |
| **Tailwind CSS** | Styling | Utility-first, design system consistency |
| **Node.js + Express** | REST API | Lightweight, large ecosystem |
| **PostgreSQL** | Primary database | ACID compliance, complex joins for payroll calculations |
| **Railway** | Hosting (DB + Redis) | Single-platform, fast setup, generous free tier |
| **Upstash Kafka** | Event streaming | Serverless, no broker management, HTTP-based |
| **Redis (Railway)** | Caching + refresh token store | Sub-millisecond reads for dashboards, attendance lookups, session management |
| **JWT** | Authentication | Stateless, scalable, role payload embedded. Single access token (15 min). Refresh token stored in Redis. |
| **bcrypt** | Password hashing | Industry standard, configurable cost factor |
| **Nodemailer** | Email delivery | Login credential emails on employee creation |
| **pdfkit** | Payslip PDF generation | Server-side PDF, consistent formatting |

> **Why no Zustand?**
> TanStack Query handles all server-derived state (employees, attendance, payroll, etc.) with built-in caching. Auth state (userId, role, token) is stored in `localStorage` and read into React Context on bootstrap — no Zustand needed. Redis on the server acts as the source of truth for refresh tokens and session validity.

---

## 4. Roles & Permissions Matrix

> Four roles: **Admin**, **HR Officer**, **Payroll Officer**, **Employee**

| Module / Action | Admin | HR Officer | Payroll Officer | Employee |
|---|:---:|:---:|:---:|:---:|
| **Employees** | | | | |
| View directory | ✅ | ✅ | ✅ | ✅ (read-only) |
| Create employee | ✅ | ✅ | ❌ | ❌ |
| Edit employee profile | ✅ | ✅ | ❌ | ❌ |
| Delete employee | ✅ | ❌ | ❌ | ❌ |
| Edit own profile | ✅ | ✅ | ✅ | ✅ |
| View Salary Info tab | ✅ | ❌ | ✅ | ❌ |
| **Attendance** | | | | |
| Mark own Check-In/Out | ✅ | ✅ | ✅ | ✅ |
| View own records | ✅ | ✅ | ✅ | ✅ |
| View all employees | ✅ | ✅ | ✅ | ❌ |
| Edit attendance records | ✅ | ❌ | ❌ | ❌ |
| **Time Off** | | | | |
| Apply for leave | ✅ | ✅ | ✅ | ✅ |
| View own requests | ✅ | ✅ | ✅ | ✅ |
| Allocate leaves to employees | ✅ | ✅ | ❌ | ❌ |
| Approve / Reject requests | ✅ | ❌ | ✅ | ❌ |
| **Payroll** | | | | |
| View payroll dashboard | ✅ | ❌ | ✅ | ❌ |
| Generate payrun | ✅ | ❌ | ✅ | ❌ |
| Validate payrun | ✅ | ❌ | ✅ | ❌ |
| View own payslip | ✅ | ✅ | ✅ | ✅ |
| Print/Download payslip | ✅ | ❌ | ✅ | ✅ (own) |
| **Reports** | | | | |
| Salary Statement Report | ✅ | ❌ | ✅ | ❌ |
| **Settings** | | | | |
| User Settings (role mgmt) | ✅ | ❌ | ❌ | ❌ |
| Change own password | ✅ | ✅ | ✅ | ✅ |

---

## 5. Database Schema

```sql
-- ============================================================
-- EmPay HRMS - PostgreSQL Schema
-- Database: empay_db
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'hr_officer', 'payroll_officer', 'employee');
CREATE TYPE leave_type AS ENUM ('paid_time_off', 'sick_leave', 'unpaid_leave');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE payrun_status AS ENUM ('draft', 'validated', 'paid', 'cancelled');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'on_leave', 'half_day');
CREATE TYPE wage_type AS ENUM ('fixed_wage', 'hourly');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

-- ============================================================
-- COMPANIES (Multi-tenant)
-- ============================================================

CREATE TABLE companies (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  logo_url      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DEPARTMENTS
-- ============================================================

CREATE TABLE departments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  login_id          VARCHAR(30) UNIQUE NOT NULL,
  name              VARCHAR(255) NOT NULL,
  email             VARCHAR(255) UNIQUE NOT NULL,
  phone             VARCHAR(20),
  password_hash     TEXT NOT NULL,
  role              user_role NOT NULL DEFAULT 'admin',
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  must_change_pwd   BOOLEAN NOT NULL DEFAULT TRUE,
  avatar_url        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EMPLOYEE PROFILES
-- ============================================================

CREATE TABLE employee_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id          UUID NOT NULL REFERENCES companies(id),
  department_id       UUID REFERENCES departments(id),
  manager_id          UUID REFERENCES users(id),
  designation         VARCHAR(100),
  location            VARCHAR(100),
  date_of_birth       DATE,
  date_of_joining     DATE NOT NULL,
  gender              gender_type,
  nationality         VARCHAR(100),
  personal_email      VARCHAR(255),
  marital_status      VARCHAR(50),
  bank_account_number VARCHAR(30),
  bank_name           VARCHAR(100),
  ifsc_code           VARCHAR(20),
  pan_number          VARCHAR(20),
  uan_number          VARCHAR(20),
  esic_number         VARCHAR(20),
  about               TEXT,
  skills              TEXT[],
  certifications      TEXT[],
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SALARY STRUCTURES (Templates)
-- ============================================================

CREATE TABLE salary_structures (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id),
  name            VARCHAR(100) NOT NULL,
  wage_type       wage_type NOT NULL DEFAULT 'fixed_wage',
  pf_rate         NUMERIC(5,2) NOT NULL DEFAULT 12.00,
  professional_tax NUMERIC(10,2) NOT NULL DEFAULT 200.00,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SALARY COMPONENTS
-- ============================================================

CREATE TABLE salary_components (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salary_structure_id   UUID NOT NULL REFERENCES salary_structures(id) ON DELETE CASCADE,
  name                  VARCHAR(100) NOT NULL,
  component_type        VARCHAR(50) NOT NULL,
  computation_type      VARCHAR(20) NOT NULL DEFAULT 'percentage',
  value                 NUMERIC(10,2) NOT NULL,
  sort_order            INT NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EMPLOYEE SALARY INFO
-- ============================================================

CREATE TABLE employee_salary_info (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  salary_structure_id   UUID NOT NULL REFERENCES salary_structures(id),
  monthly_wage          NUMERIC(12,2) NOT NULL,
  yearly_wage           NUMERIC(14,2) GENERATED ALWAYS AS (monthly_wage * 12) STORED,
  working_hours_per_day NUMERIC(4,2) NOT NULL DEFAULT 8.00,
  working_days_per_week INT NOT NULL DEFAULT 5,
  effective_from        DATE NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ATTENDANCE
-- ============================================================

CREATE TABLE attendance (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id),
  date            DATE NOT NULL,
  check_in        TIMESTAMPTZ,
  check_out       TIMESTAMPTZ,
  work_hours      NUMERIC(5,2) GENERATED ALWAYS AS (
                    EXTRACT(EPOCH FROM (check_out - check_in)) / 3600
                  ) STORED,
  extra_hours     NUMERIC(5,2),
  status          attendance_status NOT NULL DEFAULT 'present',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

-- ============================================================
-- TIME OFF ALLOCATIONS
-- ============================================================

CREATE TABLE time_off_allocations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id),
  leave_type      leave_type NOT NULL,
  validity_start  DATE NOT NULL,
  validity_end    DATE NOT NULL,
  allocated_days  NUMERIC(5,2) NOT NULL,
  used_days       NUMERIC(5,2) NOT NULL DEFAULT 0,
  notes           TEXT,
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TIME OFF REQUESTS
-- ============================================================

CREATE TABLE time_off_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  allocation_id   UUID NOT NULL REFERENCES time_off_allocations(id),
  company_id      UUID NOT NULL REFERENCES companies(id),
  leave_type      leave_type NOT NULL,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  days_requested  NUMERIC(5,2) NOT NULL,
  reason          TEXT,
  status          leave_status NOT NULL DEFAULT 'pending',
  reviewed_by     UUID REFERENCES users(id),
  reviewed_at     TIMESTAMPTZ,
  reviewer_note   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PAYRUNS
-- ============================================================

CREATE TABLE payruns (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id),
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  status          payrun_status NOT NULL DEFAULT 'draft',
  generated_by    UUID NOT NULL REFERENCES users(id),
  validated_by    UUID REFERENCES users(id),
  validated_at    TIMESTAMPTZ,
  paid_at         TIMESTAMPTZ,
  total_cost      NUMERIC(14,2),
  employee_count  INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, period_start, period_end)
);

-- ============================================================
-- PAYSLIPS
-- ============================================================

CREATE TABLE payslips (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payrun_id             UUID NOT NULL REFERENCES payruns(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES users(id),
  company_id            UUID NOT NULL REFERENCES companies(id),
  salary_structure_id   UUID NOT NULL REFERENCES salary_structures(id),
  period_start          DATE NOT NULL,
  period_end            DATE NOT NULL,
  pay_date              DATE,
  total_working_days    INT NOT NULL,
  attendance_days       NUMERIC(5,2) NOT NULL,
  paid_leave_days       NUMERIC(5,2) NOT NULL DEFAULT 0,
  unpaid_leave_days     NUMERIC(5,2) NOT NULL DEFAULT 0,
  payable_days          NUMERIC(5,2) NOT NULL,
  basic_salary          NUMERIC(12,2) NOT NULL DEFAULT 0,
  hra                   NUMERIC(12,2) NOT NULL DEFAULT 0,
  standard_allowance    NUMERIC(12,2) NOT NULL DEFAULT 0,
  performance_bonus     NUMERIC(12,2) NOT NULL DEFAULT 0,
  leave_travel_allowance NUMERIC(12,2) NOT NULL DEFAULT 0,
  fixed_allowance       NUMERIC(12,2) NOT NULL DEFAULT 0,
  gross_salary          NUMERIC(12,2) NOT NULL DEFAULT 0,
  pf_employee           NUMERIC(12,2) NOT NULL DEFAULT 0,
  pf_employer           NUMERIC(12,2) NOT NULL DEFAULT 0,
  professional_tax      NUMERIC(12,2) NOT NULL DEFAULT 0,
  tds_deduction         NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_deductions      NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_salary            NUMERIC(12,2) NOT NULL DEFAULT 0,
  employer_cost         NUMERIC(12,2) NOT NULL DEFAULT 0,
  employee_name         VARCHAR(255) NOT NULL,
  employee_code         VARCHAR(30) NOT NULL,
  department            VARCHAR(100),
  designation           VARCHAR(100),
  location              VARCHAR(100),
  date_of_joining       DATE,
  pan_number            VARCHAR(20),
  uan_number            VARCHAR(20),
  bank_account          VARCHAR(30),
  status                VARCHAR(20) NOT NULL DEFAULT 'draft',
  pdf_url               TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (payrun_id, user_id)
);

-- ============================================================
-- AUDIT LOG (written by Kafka consumers)
-- ============================================================

CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID REFERENCES companies(id),
  actor_id      UUID REFERENCES users(id),
  action        VARCHAR(100) NOT NULL,
  entity_type   VARCHAR(50),
  entity_id     UUID,
  payload       JSONB,
  ip_address    INET,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_name ON users(name);             -- for search

CREATE INDEX idx_employee_profiles_dept ON employee_profiles(department_id);
CREATE INDEX idx_employee_profiles_designation ON employee_profiles(designation);

CREATE INDEX idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX idx_attendance_company_date ON attendance(company_id, date);

CREATE INDEX idx_tor_user ON time_off_requests(user_id);
CREATE INDEX idx_tor_company_status ON time_off_requests(company_id, status);

CREATE INDEX idx_payslips_payrun ON payslips(payrun_id);
CREATE INDEX idx_payslips_user ON payslips(user_id);
CREATE INDEX idx_payslips_company_period ON payslips(company_id, period_start);

CREATE INDEX idx_audit_company ON audit_logs(company_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

-- ============================================================
-- TRIGGERS — auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_employee_profiles_updated BEFORE UPDATE ON employee_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_attendance_updated BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_time_off_requests_updated BEFORE UPDATE ON time_off_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payruns_updated BEFORE UPDATE ON payruns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payslips_updated BEFORE UPDATE ON payslips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 6. API Design Standard

### Standard Response Format

Every endpoint returns:

```json
{
  "status": "success" | "error" | "fail",
  "message": "Human-readable description",
  "data": { } | [ ] | null
}
```

For paginated list responses, `data` wraps with pagination metadata:

```json
{
  "status": "success",
  "message": "Employees fetched",
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 87,
      "totalPages": 9,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | OK — GET, PUT, PATCH success |
| 201 | Created — POST success |
| 204 | No Content — DELETE success |
| 400 | Bad Request — validation failure |
| 401 | Unauthorized — missing/invalid JWT |
| 403 | Forbidden — insufficient role |
| 404 | Not Found |
| 409 | Conflict — duplicate record |
| 422 | Unprocessable Entity — business logic failure |
| 500 | Internal Server Error |

### Auth Headers

All protected routes require:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

The access token is a short-lived JWT (15 min). The refresh token (7-day TTL) is stored server-side in Redis and sent as an `httpOnly` cookie.

---

## 7. Pagination, Search & Filters

### Pagination Standard

All list endpoints use **offset-based pagination** with a default page size of **10 records**. The client fetches page 1 on load; clicking "Next" fetches page 2, and so on.

**Query parameters (all list endpoints):**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | 1 | Current page number |
| `limit` | integer | 10 | Records per page (max 50) |

**Example request:**
```
GET /api/v1/employees?page=2&limit=10
```

**Backend implementation pattern:**

```javascript
// utils/pagination.js
function getPagination(page = 1, limit = 10) {
  const parsedPage  = Math.max(1, parseInt(page));
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit)));
  const offset      = (parsedPage - 1) * parsedLimit;
  return { page: parsedPage, limit: parsedLimit, offset };
}

function buildPaginationMeta(page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
}
```

**TanStack Query on frontend:**

```javascript
// hooks/useEmployees.js
export function useEmployees({ page = 1, search = '', department = '', role = '' }) {
  return useQuery({
    queryKey: ['employees', { page, search, department, role }],
    queryFn: () => employeesApi.getAll({ page, limit: 10, search, department, role }),
    keepPreviousData: true,   // don't flash loading state on page change
    staleTime: 1000 * 60 * 2 // 2 minutes
  });
}
```

### Search & Filter Standard

Every list view supports `search` (full-text, case-insensitive) and specific filter params. Filters are AND-combined on the server.

**Backend pattern (employees example):**

```sql
SELECT u.*, ep.*
FROM users u
LEFT JOIN employee_profiles ep ON ep.user_id = u.id
WHERE u.company_id = $1
  AND u.is_active = TRUE
  AND (
    $2 = '' OR
    u.name ILIKE '%' || $2 || '%' OR
    u.login_id ILIKE '%' || $2 || '%' OR
    u.email ILIKE '%' || $2 || '%' OR
    ep.designation ILIKE '%' || $2 || '%'
  )
  AND ($3 = '' OR ep.department_id::text = $3)
  AND ($4 = '' OR u.role::text = $4)
ORDER BY u.name ASC
LIMIT $5 OFFSET $6;
```

### Supported Filters Per Module

**Employees:**
| Param | Description |
|---|---|
| `search` | Name, login ID, email, designation |
| `department` | Department UUID |
| `role` | `admin`, `hr_officer`, `payroll_officer`, `employee` |
| `status` | `active`, `inactive` |

**Attendance:**
| Param | Description |
|---|---|
| `date` | Specific date `YYYY-MM-DD` |
| `month` | `YYYY-MM` (returns full month for employee) |
| `user_id` | Filter by specific employee (Admin/HR/Payroll) |
| `status` | `present`, `absent`, `on_leave`, `half_day` |

**Time Off Requests:**
| Param | Description |
|---|---|
| `status` | `pending`, `approved`, `rejected`, `cancelled` |
| `leave_type` | `paid_time_off`, `sick_leave`, `unpaid_leave` |
| `user_id` | Filter by employee (Admin/Payroll) |
| `from_date` | Start range filter |
| `to_date` | End range filter |

**Payruns:**
| Param | Description |
|---|---|
| `status` | `draft`, `validated`, `paid`, `cancelled` |
| `year` | Filter by year (e.g., `2025`) |

**Payslips:**
| Param | Description |
|---|---|
| `payrun_id` | Filter by payrun |
| `user_id` | Filter by employee |
| `search` | Employee name or code |

---

## 8. Module-by-Module Specification

### 8.1 Auth & User Management

#### Business Logic

1. **Admin Registration**: First user creates the company. Auto-assigned `admin` role.
2. **Employee Creation**: Only HR Officer or Admin can create employees. System auto-generates:
   - **Login ID** — format: `{2-letter company code}{2-letter first name}{2-letter last name}{joining year}{4-digit serial}`
     - Example: `OI` + `JO` + `DO` + `2022` + `0001` → `OIJODO20220001`
   - **Password** — random 10-char, emailed via Nodemailer
   - `must_change_pwd = true` forces password change on first login
3. **JWT Payload**: `{ userId, companyId, role, name }`
4. **Access token**: 15 min expiry, sent in response body, stored in `localStorage` by client
5. **Refresh token**: 7-day TTL, stored in Redis under key `refresh:{userId}`, sent as `httpOnly` cookie
6. **Logout**: Deletes refresh token from Redis

#### Login ID Generation

```javascript
function generateLoginId(companyName, firstName, lastName, joiningYear, serialNumber) {
  const companyCode = companyName.replace(/\s+/g, '').slice(0, 2).toUpperCase();
  const nameCode    = (firstName.slice(0, 2) + lastName.slice(0, 2)).toUpperCase();
  const serial      = String(serialNumber).padStart(4, '0');
  return `${companyCode}${nameCode}${joiningYear}${serial}`;
}
```

#### Endpoints

```
POST   /api/v1/auth/register          — Admin/company registration
POST   /api/v1/auth/login             — Login with loginId + password
POST   /api/v1/auth/refresh           — Refresh access token (uses httpOnly cookie)
POST   /api/v1/auth/logout            — Invalidate refresh token in Redis
POST   /api/v1/auth/change-password   — Change own password (all roles)
POST   /api/v1/auth/reset-password    — Admin resets another user's password
```

---

### 8.2 Employee Profiles

#### Business Logic

- Profile has 4 tabs: **Resume**, **Private Info**, **Salary Info**, **Security**
- **Salary Info tab** only rendered for Admin and Payroll Officer
- Employee directory uses card grid — paginated (10 cards/page) with search and filters
- Profile opens view-only from directory; edit mode only for own profile or HR/Admin editing
- Status dots: green = present (checked in today), red = absent, yellow = on approved leave

#### Endpoints

```
GET    /api/v1/employees              — List (paginated + search + filters)
POST   /api/v1/employees              — Create employee (Admin/HR)
GET    /api/v1/employees/me           — Own profile
PUT    /api/v1/employees/me           — Update own profile
GET    /api/v1/employees/:id          — Single employee profile
PUT    /api/v1/employees/:id          — Update profile (Admin/HR)
DELETE /api/v1/employees/:id          — Soft delete (Admin only)
GET    /api/v1/employees/:id/salary   — Salary info (Admin/Payroll Officer)
PUT    /api/v1/employees/:id/salary   — Update salary info (Admin/Payroll Officer)
```

#### Salary Computation Logic

```
monthly_wage = user-defined (e.g., ₹50,000)
yearly_wage  = monthly_wage × 12 (auto-computed by DB)

For each salary_component in salary_structure:
  if computation_type = 'percentage':
    component_amount = (value / 100) × monthly_wage
  if computation_type = 'fixed':
    component_amount = value

fixed_allowance  = monthly_wage - sum_of_all_other_components (balancing component)
gross            = sum of all components = monthly_wage ✓
```

---

### 8.3 Attendance

#### Business Logic

- Employees mark check-in / check-out from dashboard
- Work hours computed as `(check_out - check_in)` in hours (stored DB column)
- Extra hours = work_hours − standard_daily_hours (from `employee_salary_info`)
- Admin/HR/Payroll see all employees' attendance (paginated table, daily view, date-navigable)
- Employees see only their own monthly view (paginated by day rows)
- Attendance is the **direct basis for payslip payable days**

#### Endpoints

```
POST   /api/v1/attendance/check-in            — Mark check-in (own)
POST   /api/v1/attendance/check-out           — Mark check-out (own)
GET    /api/v1/attendance/me                  — Own attendance (month filter, paginated)
GET    /api/v1/attendance                     — All employees (Admin/HR/Payroll, paginated)
GET    /api/v1/attendance/:userId             — Specific employee (Admin/HR/Payroll)
PUT    /api/v1/attendance/:id                 — Edit record (Admin only)
GET    /api/v1/attendance/summary/:userId     — Monthly summary stats
```

---

### 8.4 Time Off (Leave)

#### Business Logic

1. HR Officer/Admin creates a **Time Off Allocation** for an employee (e.g., 24 days PTO for 2025)
2. Employee submits a **Time Off Request** against an allocation
3. Payroll Officer/Admin approves or rejects the request
4. Approval: `used_days` incremented in `time_off_allocations`; attendance row for each leave day marked `on_leave`
5. Rejection: days returned to available balance
6. Unpaid leaves reduce payable days; paid leaves count toward payable days

#### Endpoints

```
GET    /api/v1/time-off/allocations              — All (Admin/HR, paginated + filters)
POST   /api/v1/time-off/allocations              — Create allocation (Admin/HR)
GET    /api/v1/time-off/allocations/me           — Own allocations (all roles)
PUT    /api/v1/time-off/allocations/:id          — Update allocation (Admin/HR)
DELETE /api/v1/time-off/allocations/:id          — Delete allocation (Admin)

GET    /api/v1/time-off/requests                 — All (Admin/Payroll, paginated + filters)
POST   /api/v1/time-off/requests                 — Submit request (all roles)
GET    /api/v1/time-off/requests/me              — Own requests (paginated)
GET    /api/v1/time-off/requests/:id             — Single request
PUT    /api/v1/time-off/requests/:id/approve     — Approve (Admin/Payroll Officer)
PUT    /api/v1/time-off/requests/:id/reject      — Reject (Admin/Payroll Officer)
PUT    /api/v1/time-off/requests/:id/cancel      — Cancel own pending request
```

---

### 8.5 Payroll & Payrun

#### Business Logic — Payroll Calculation

```
Step 1: Determine payable days
  total_working_days = working days (Mon–Fri) in the period
  attendance_days    = days with check_in in period
  paid_leave_days    = approved PTO + Sick Leave days in period
  unpaid_leave_days  = approved Unpaid Leave days in period
  payable_days       = attendance_days + paid_leave_days

Step 2: Pro-rate wage
  daily_wage   = monthly_wage / total_working_days
  earned_wage  = daily_wage × payable_days

Step 3: Compute components (on earned_wage)
  basic            = 50% of earned_wage  (or % from structure)
  hra              = 50% of basic
  standard_allow   = fixed or % as defined
  perf_bonus       = % of basic
  lta              = % of basic
  fixed_allowance  = earned_wage − (basic + hra + standard_allow + perf_bonus + lta)
  gross            = earned_wage ✓

Step 4: Deductions
  pf_employee      = 12% of basic
  pf_employer      = 12% of basic  (employer cost, shown separately)
  professional_tax = ₹200 flat (from salary_structure config)
  tds              = 0 (configurable)
  total_deductions = pf_employee + professional_tax + tds

Step 5: Net
  net_salary    = gross − total_deductions
  employer_cost = gross + pf_employer
```

#### Payrun State Machine

```
[draft] → validate → [validated] → mark paid → [paid]
        → cancel  → [cancelled]
```

- Validated: payslips locked (no regeneration)
- Paid: PDFs auto-generated via Kafka consumer, stored in `pdf_url`

#### Endpoints

```
GET    /api/v1/salary-structures              — List (paginated)
POST   /api/v1/salary-structures              — Create (Admin/Payroll)
GET    /api/v1/salary-structures/:id          — Single
PUT    /api/v1/salary-structures/:id          — Update
DELETE /api/v1/salary-structures/:id          — Delete

GET    /api/v1/payruns                        — List (paginated + status/year filters)
POST   /api/v1/payruns                        — Generate payrun for period
GET    /api/v1/payruns/:id                    — Single payrun + payslip list (paginated)
POST   /api/v1/payruns/:id/validate           — Validate payrun
POST   /api/v1/payruns/:id/pay               — Mark paid + trigger PDF generation
POST   /api/v1/payruns/:id/cancel            — Cancel payrun

GET    /api/v1/payslips                       — All payslips (paginated + filters)
GET    /api/v1/payslips/me                    — Own payslips (paginated)
GET    /api/v1/payslips/:id                   — Single payslip detail
GET    /api/v1/payslips/:id/pdf               — Download PDF payslip
POST   /api/v1/payslips/:payrunId/regenerate  — Regenerate specific payslip (draft only)
```

---

### 8.6 Reports

#### Business Logic

- Accessible only to Admin and Payroll Officer
- **Salary Statement Report**: Select employee + year → monthly breakdown table
- Columns: Salary Components | Monthly Amount | Yearly Amount
- Sections: Earnings (Basic, HRA, ...) and Deductions (PF, PT, ...)
- Downloadable as PDF

#### Endpoints

```
GET    /api/v1/reports/salary-statement       — ?employee_id=&year=
GET    /api/v1/reports/payroll-summary        — Monthly payroll cost summary
GET    /api/v1/reports/employee-count         — Headcount over time
```

---

### 8.7 Settings

#### Business Logic

- Only accessible by Admin
- User Settings: table of all users (paginated) with role dropdown per user
- Module-level access is role-governed (not per-user configurable in v1)

#### Endpoints

```
GET    /api/v1/settings/users                 — List all users with roles (paginated)
PUT    /api/v1/settings/users/:id/role        — Update user role (Admin)
GET    /api/v1/settings/company               — Get company info
PUT    /api/v1/settings/company               — Update company info/logo
```

---

### 8.8 Dashboard & Analytics

#### Business Logic

- All roles see the dashboard on login
- Default landing page: employee directory (card grid, 10 per page, searchable)
- Cards: avatar, name, designation, status dot
- Check In / Check Out button on dashboard
- Admin/Payroll Officer also see:
  - Warnings: employees without bank A/c, employees without manager
  - Upcoming payruns
  - Employer cost chart (monthly/annual toggle)
  - Employee count chart

#### Endpoints

```
GET    /api/v1/dashboard/stats               — Summary metrics (cached in Redis 3 min)
GET    /api/v1/dashboard/employer-cost       — Monthly cost data for chart
GET    /api/v1/dashboard/employee-count      — Headcount data for chart
GET    /api/v1/dashboard/warnings            — Compliance warnings (Admin/Payroll)
```

---

## 9. Kafka Event Architecture

> Using **Upstash Kafka** — serverless, HTTP-based, no broker to manage.

### Topics

| Topic | Producer | Consumer | Purpose |
|---|---|---|---|
| `empay.auth.events` | Auth service | Audit logger | Login, logout, password change |
| `empay.attendance.events` | Attendance service | Audit logger, Notifier | Check-in/out events |
| `empay.leave.events` | Time Off service | Audit logger, Notifier | Requests, approvals, rejections |
| `empay.payroll.events` | Payroll service | Audit logger, Email sender | Payrun generated, validated, paid |
| `empay.employee.events` | Employee service | Audit logger, Email sender | Employee created, updated, deleted |

### Event Schema

```json
{
  "eventId": "uuid",
  "topic": "empay.payroll.events",
  "eventType": "payrun.paid",
  "companyId": "uuid",
  "actorId": "uuid",
  "entityType": "payrun",
  "entityId": "uuid",
  "payload": { },
  "timestamp": "2025-10-22T10:00:00Z"
}
```

### Consumer Actions

| Event | Consumer Action |
|---|---|
| `employee.created` | Send welcome email with login ID and password |
| `payrun.paid` | Generate PDF payslips, email to each employee |
| `leave.approved` | Notify employee via email |
| `leave.rejected` | Notify employee via email |
| All events | Write to `audit_logs` table |

### Producer Pattern (Node.js)

```javascript
// kafka/producers/payroll.producer.js
import { Kafka } from '@upstash/kafka';

const kafka = new Kafka({
  url:      process.env.KAFKA_URL,
  username: process.env.KAFKA_USERNAME,
  password: process.env.KAFKA_PASSWORD,
});

const producer = kafka.producer();

export async function publishPayrollEvent(eventType, entityId, payload, actorId, companyId) {
  await producer.produce('empay.payroll.events', {
    eventId:    crypto.randomUUID(),
    topic:      'empay.payroll.events',
    eventType,
    companyId,
    actorId,
    entityType: 'payrun',
    entityId,
    payload,
    timestamp:  new Date().toISOString()
  });
}
```

---

## 10. Redis Caching Strategy

> Redis hosted on **Railway** (same platform as PostgreSQL).

### Cache Key Patterns

| Cache Key | TTL | Data Cached |
|---|---|---|
| `company:{id}:info` | 1 hour | Company name, logo |
| `user:{id}:profile` | 15 min | User + employee profile |
| `company:{id}:employees:p{page}:q{search}:d{dept}:r{role}` | 5 min | Paginated employee list |
| `company:{id}:attendance:{date}:p{page}` | 2 min | Daily attendance list (paginated) |
| `user:{id}:attendance:{month}` | 5 min | Monthly attendance summary |
| `company:{id}:dashboard:stats` | 3 min | Dashboard summary |
| `payslip:{id}:pdf` | 24 hours | PDF URL |
| `refresh:{userId}` | 7 days | Refresh token (session store) |

> **Pagination + filters included in cache keys** — different page/filter combos are cached independently.

### Cache Helper

```javascript
// utils/cache.js
import redis from '../config/redis.js';

export async function getCache(key) {
  const val = await redis.get(key);
  return val ? JSON.parse(val) : null;
}

export async function setCache(key, data, ttlSeconds) {
  await redis.setex(key, ttlSeconds, JSON.stringify(data));
}

export async function deleteCache(...keys) {
  if (keys.length) await redis.del(...keys);
}

export async function deleteCachePattern(pattern) {
  const keys = await redis.keys(pattern);
  if (keys.length) await redis.del(...keys);
}
```

### Invalidation Rules

| Trigger | Keys Invalidated |
|---|---|
| `PUT /employees/:id` | `user:{id}:profile`, `company:{id}:employees:*` |
| `POST /attendance/check-in` | `company:{id}:attendance:{today}:*`, `user:{id}:attendance:{month}` |
| `PUT /time-off/requests/:id/approve` | `user:{id}:attendance:{month}`, attendance pattern |
| Payrun `paid` | `company:{id}:dashboard:stats` |
| `PUT /settings/company` | `company:{id}:info` |

---

## 11. TanStack Query — State Management (No Zustand)

### Why No Zustand

All data that would have gone into Zustand stores is now managed by:

- **TanStack Query** — all server-derived state (employees, payroll, attendance, etc.). Provides caching, background refetching, and stale-while-revalidate out of the box.
- **React Context (`AuthContext`)** — auth state (token, userId, role, name) is stored in `localStorage` and loaded into context on app boot. No polling needed — JWT is self-contained.

### Auth Context Pattern

```javascript
// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('access_token');
    const user  = localStorage.getItem('user');
    return token && user ? { token, user: JSON.parse(user) } : null;
  });

  const login = (token, user) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuth({ token, user });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setAuth(null);
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### TanStack Query Client Config

```javascript
// lib/queryClient.js
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          1000 * 60 * 2,   // 2 minutes
      cacheTime:          1000 * 60 * 10,  // 10 minutes
      refetchOnWindowFocus: false,
      retry:              1,
    },
  },
});
```

### Axios Interceptor (auto-attach token)

```javascript
// api/client.js
import axios from 'axios';

const client = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      // Attempt token refresh
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }   // sends httpOnly cookie with refresh token
        );
        localStorage.setItem('access_token', data.data.access_token);
        err.config.headers.Authorization = `Bearer ${data.data.access_token}`;
        return client(err.config);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default client;
```

---

## 12. Folder Structure

### Backend

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js               # PostgreSQL pool (pg)
│   │   ├── redis.js            # Redis client (ioredis)
│   │   ├── kafka.js            # Upstash Kafka client
│   │   ├── mailer.js           # Nodemailer transporter
│   │   └── env.js              # Validated env vars (zod)
│   │
│   ├── middleware/
│   │   ├── authenticate.js     # JWT verification → req.user
│   │   ├── authorize.js        # Role-based guard factory
│   │   ├── rateLimiter.js      # express-rate-limit config
│   │   ├── errorHandler.js     # Global error middleware
│   │   └── requestLogger.js    # Morgan + Winston logger
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.validator.js
│   │   ├── employees/
│   │   │   ├── employees.routes.js
│   │   │   ├── employees.controller.js
│   │   │   ├── employees.service.js
│   │   │   └── employees.validator.js
│   │   ├── attendance/
│   │   │   ├── attendance.routes.js
│   │   │   ├── attendance.controller.js
│   │   │   ├── attendance.service.js
│   │   │   └── attendance.validator.js
│   │   ├── time-off/
│   │   │   ├── timeoff.routes.js
│   │   │   ├── timeoff.controller.js
│   │   │   ├── timeoff.service.js
│   │   │   └── timeoff.validator.js
│   │   ├── payroll/
│   │   │   ├── payroll.routes.js
│   │   │   ├── payroll.controller.js
│   │   │   ├── payroll.service.js
│   │   │   ├── payslip.service.js   # PDF generation
│   │   │   └── payroll.validator.js
│   │   ├── reports/
│   │   │   ├── reports.routes.js
│   │   │   ├── reports.controller.js
│   │   │   └── reports.service.js
│   │   ├── settings/
│   │   │   ├── settings.routes.js
│   │   │   ├── settings.controller.js
│   │   │   └── settings.service.js
│   │   └── dashboard/
│   │       ├── dashboard.routes.js
│   │       ├── dashboard.controller.js
│   │       └── dashboard.service.js
│   │
│   ├── kafka/
│   │   ├── producers/
│   │   │   ├── auth.producer.js
│   │   │   ├── attendance.producer.js
│   │   │   ├── leave.producer.js
│   │   │   ├── payroll.producer.js
│   │   │   └── employee.producer.js
│   │   └── consumers/
│   │       ├── audit.consumer.js        # Writes to audit_logs
│   │       ├── email.consumer.js        # Sends emails via Nodemailer
│   │       └── notification.consumer.js
│   │
│   ├── utils/
│   │   ├── response.js          # sendSuccess(), sendFail(), sendError()
│   │   ├── generateLoginId.js
│   │   ├── generatePassword.js
│   │   ├── payrollEngine.js     # Payslip calculation
│   │   ├── pdfGenerator.js      # pdfkit payslip builder
│   │   ├── cache.js             # Redis get/set/del helpers
│   │   ├── pagination.js        # getPagination(), buildPaginationMeta()
│   │   └── logger.js            # Winston logger
│   │
│   ├── db/
│   │   ├── schema.sql
│   │   └── seeds/
│   │       └── admin.seed.js
│   │
│   └── app.js
│
├── server.js
├── .env.example
├── .env
├── package.json
└── README.md
```

### Frontend

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.js                   # Axios instance + interceptors
│   │   └── endpoints/
│   │       ├── auth.api.js
│   │       ├── employees.api.js
│   │       ├── attendance.api.js
│   │       ├── timeoff.api.js
│   │       ├── payroll.api.js
│   │       ├── reports.api.js
│   │       ├── settings.api.js
│   │       └── dashboard.api.js
│   │
│   ├── context/
│   │   └── AuthContext.jsx             # Auth state (token, role, user) — replaces Zustand
│   │
│   ├── hooks/                          # TanStack Query hooks
│   │   ├── useAuth.js
│   │   ├── useEmployees.js             # Accepts { page, search, department, role }
│   │   ├── useAttendance.js
│   │   ├── useTimeOff.js
│   │   ├── usePayroll.js
│   │   ├── useReports.js
│   │   ├── useDashboard.js
│   │   └── useSettings.js
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── ChangePasswordPage.jsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.jsx
│   │   ├── employees/
│   │   │   ├── EmployeesPage.jsx        # Card grid, search bar, dept filter, role filter
│   │   │   ├── EmployeeDetailPage.jsx
│   │   │   └── CreateEmployeePage.jsx
│   │   ├── attendance/
│   │   │   └── AttendancePage.jsx
│   │   ├── time-off/
│   │   │   └── TimeOffPage.jsx
│   │   ├── payroll/
│   │   │   ├── PayrollPage.jsx
│   │   │   ├── PayrunDetailPage.jsx
│   │   │   └── PayslipDetailPage.jsx
│   │   ├── reports/
│   │   │   └── ReportsPage.jsx
│   │   └── settings/
│   │       └── SettingsPage.jsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Topbar.jsx
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── SearchInput.jsx          # Debounced search box
│   │   │   ├── Modal.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Avatar.jsx
│   │   │   ├── StatusDot.jsx
│   │   │   ├── Tabs.jsx
│   │   │   ├── Dropdown.jsx
│   │   │   ├── FilterBar.jsx            # Reusable filter row (select dropdowns)
│   │   │   ├── Pagination.jsx           # Prev/Next + page count
│   │   │   ├── DatePicker.jsx
│   │   │   ├── Loader.jsx
│   │   │   └── EmptyState.jsx
│   │   ├── charts/
│   │   │   ├── BarChart.jsx
│   │   │   └── LineChart.jsx
│   │   ├── employee/
│   │   │   ├── EmployeeCard.jsx
│   │   │   ├── EmployeeForm.jsx
│   │   │   └── SalaryInfoForm.jsx
│   │   ├── attendance/
│   │   │   ├── CheckInOutButton.jsx
│   │   │   └── AttendanceTable.jsx
│   │   ├── time-off/
│   │   │   ├── TimeOffForm.jsx
│   │   │   └── TimeOffTable.jsx
│   │   └── payroll/
│   │       ├── PayslipCard.jsx
│   │       └── PayrunTable.jsx
│   │
│   ├── guards/
│   │   ├── AuthGuard.jsx               # Redirect to /login if no token
│   │   └── RoleGuard.jsx               # Redirect if insufficient role
│   │
│   ├── lib/
│   │   ├── queryClient.js
│   │   └── constants.js                # ROLES, LEAVE_TYPES, PAGE_SIZE = 10
│   │
│   ├── utils/
│   │   ├── formatCurrency.js
│   │   ├── formatDate.js
│   │   └── roleHelpers.js              # canAccess(role, module)
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── public/
├── .env
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 13. Setup Commands

### Step 1: Backend — Install Dependencies

```bash
cd backend
npm install express pg ioredis nodemailer bcryptjs jsonwebtoken \
  uuid zod morgan winston express-rate-limit multer \
  @upstash/kafka pdfkit cors dotenv cookie-parser express-async-errors

npm install -D nodemon
```

### Step 2: Create Schema File

```bash
mkdir -p src/db
# Paste schema from Section 5 into:
touch src/db/schema.sql
```

### Step 3: Railway + Upstash Setup

```bash
npm install -g @railway/cli
railway login
railway new empay-hrms
railway add --plugin postgresql
railway add --plugin redis
# Upstash Kafka: Sign up at https://upstash.com → create Kafka cluster → copy credentials
```

### Step 4: Run Schema

```bash
psql $DATABASE_URL -f src/db/schema.sql
```

### Step 5: Frontend — Install Dependencies

```bash
cd frontend
npm install @tanstack/react-query @tanstack/react-query-devtools \
  axios react-router-dom recharts react-hook-form \
  @hookform/resolvers zod date-fns clsx tailwind-merge lucide-react

npm install -D @types/react @types/react-dom
```

---

## 14. Environment Variables

### Backend `.env`

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# PostgreSQL
DATABASE_URL=postgresql://user:password@host:5432/railway

# Redis
REDIS_URL=redis://default:password@host:6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_chars
JWT_REFRESH_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=EmPay HRMS <noreply@empay.com>

# Upstash Kafka
KAFKA_URL=https://xxx.upstash.io
KAFKA_USERNAME=your_kafka_username
KAFKA_PASSWORD=your_kafka_password

# PDF Storage
PDF_STORAGE_PATH=./storage/payslips

# Cookie
COOKIE_SECRET=your_cookie_secret
```

### Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_APP_NAME=EmPay
```

---

## 15. UI/UX Flows from Mockups

### Auth Flow

```
First time → Register Page (Company Name, Name, Email, Phone, Password)
           → Auto-login → Dashboard

Employee created by HR/Admin:
  System generates loginId + random password
  → Email sent: "Your loginId is OIJODO20220001, temp password: Xy#9m2Kz1p"
  → Employee logs in → Forced Change Password page → Dashboard

Return login → Login Page (loginId or email + password) → Dashboard
```

### Employee Directory Flow

```
Dashboard / Sidebar "Employees" →
  Card grid (10 cards/page)
  Search bar (name, email, login ID, designation)
  Filter: Department | Role | Status
  Pagination: Prev / Next (page X of Y)

Click card → Employee Profile (view-only for others)
  Tabs: Resume | Private Info | Salary Info* | Security
  (* Only for Admin/Payroll Officer)
  Click "Edit" (own profile, or HR/Admin for others) → form mode
```

### Attendance Flow

```
Dashboard → Check In → POST /attendance/check-in → green dot
         → Check Out → POST /attendance/check-out

Sidebar → Attendance
  Employee: monthly table (Date | Check In | Check Out | Work Hours | Extra)
    Header: Month nav | Days Present | Leaves | Total Working Days
    Paginated: 10 rows/page

  Admin/HR/Payroll: all employees daily view
    Search by name | Filter by status | Date navigation
    Paginated: 10 rows/page
```

### Time Off Flow

```
Sidebar → Time Off

HR Officer/Admin:
  "Allocations" tab → list (paginated, filter by employee/type)
  "NEW" → Create Allocation: Employee | Leave Type | Validity | Days | Note

All roles:
  "My Leaves" tab → own allocations + balance
  "Request Leave" → pick allocation, date range, reason → Submit

Payroll Officer/Admin:
  "Requests" tab → pending list → Approve / Reject (with note)
```

### Payroll Flow

```
Sidebar → Payroll (Admin/Payroll Officer only)

Dashboard tab: Warnings | Upcoming payruns

Payrun tab:
  List (paginated) | Filter by status/year
  → "Generate Payrun" → select period → status: draft
  → Payslip list (paginated, search by employee name/code)
  → Click row → Payslip detail:
      "Worked Days" tab: Attendance | PTO | Payable days | Salary
      "Salary Computation" tab: All components (earnings + deductions)
  → "Validate" → locked
  → "Pay" → PDFs generated, emails sent via Kafka consumer
```

---

## Appendix: Key Business Rules

| Rule | Detail |
|---|---|
| Login ID format | `{2-letter company}{2-letter first}{2-letter last}{join year}{4-digit serial}` |
| Auto password | Random 10-char, emailed on creation |
| First login | `must_change_pwd = true` → forced password change |
| Pagination default | 10 records per page, max 50 |
| Payable days | `attendance_days + paid_leave_days` |
| Pro-rated wage | `daily_wage × payable_days` |
| PF rate | 12% of basic (employee + employer) |
| Professional Tax | ₹200 flat/month |
| Fixed Allowance | Balancing component = `earned_wage − sum_of_other_components` |
| Payrun lock | Payslips locked after `validated` status |
| Salary Info tab | Admin and Payroll Officer only |
| Employee creation | HR Officer and Admin only |
| Leave approval | Payroll Officer and Admin only |
| Attendance edit | Admin only |
| Reports | Admin and Payroll Officer only |
| Settings | Admin only |
| Redis cache keys | Include page + filter params to cache per-combination |
| Zustand | Not used — TanStack Query for server state, AuthContext for auth |