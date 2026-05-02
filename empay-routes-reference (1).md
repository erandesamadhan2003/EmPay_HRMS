# EmPay – Complete API Routes Reference

> All routes prefixed with `/api/v1` (implementations without a gateway may expose `/api`; keep paths identical after the prefix).
> All protected routes require: `Authorization: Bearer <access_token>`
> JWT access tokens carry **`user_role`** (PostgreSQL ENUM) claims; see [#schema-aligned-domain-model](#schema-aligned-domain-model-postgresql).
> Canonical API envelopes: `{ "success": true|false, "message": string, "data": … }`. Error bodies use the same shape with `success: false`.

---

## Schema-aligned domain model (PostgreSQL)

Values below match **`schema.sql`** (EmPay Postgres definitions). Columns in JSON examples use camelCase unless noted.

| ENUM / concept | Allowed values |
|----------------|----------------|
| **`user_role`** | `superadmin`, `admin`, `hr_officer`, `payroll_officer`, `employee` |
| **`request_status`** (`company_requests.status`) | `pending`, `approved`, `rejected` |
| **`leave_type`** | `paid_time_off`, `sick_leave`, `unpaid_leave` |
| **`leave_status`** | `pending`, `approved`, `rejected`, `cancelled` |
| **`payrun_status`** | `draft`, `validated`, `paid`, `cancelled` |
| **`attendance_status`** | `present`, `absent`, `on_leave`, `half_day` |
| **`wage_type`** | `fixed_wage`, `hourly` |
| **`gender_type`** (`employee_profiles.gender`) | `male`, `female`, `other`, `prefer_not_to_say` |

**Core tables referenced by routes:** `companies` → `departments`; `users` (FK `company_id` nullable only for seeded `superadmin`); `company_requests` (one row per onboarding company linking `company_id` + `admin_user_id`, `request_status`); `employee_profiles` (mandatory `date_of_joining`, optional `department_id`, `gender` as ENUM); salary, attendance, time off, payruns/payslips, `audit_logs`.

**Onboarding invariant:** registering the first admin for a company creates a `company_requests` row (`pending`). The admin **`users.is_active`** remains **`false`** until a **`superadmin`** approves the request (`approved`), which activates that user. Rejection sets status `rejected` and keeps the admin inactive unless business rules dictate otherwise.

---

## Table of Contents

0. [Schema-aligned domain model](#schema-aligned-domain-model-postgresql) _(see above)_
1. [Auth Routes](#1-auth-routes)
1b. [Company onboarding and company_requests](#1b-company-onboarding--company_requests)
2. [Department Routes](#2-department-routes)
3. [Employee Routes](#3-employee-routes)
4. [Attendance Routes](#4-attendance-routes)
5. [Time Off — Allocation Routes](#5-time-off--allocation-routes)
6. [Time Off — Request Routes](#6-time-off--request-routes)
7. [Salary Structure Routes](#7-salary-structure-routes)
8. [Payrun Routes](#8-payrun-routes)
9. [Payslip Routes](#9-payslip-routes)
10. [Reports Routes](#10-reports-routes)
11. [Settings Routes](#11-settings-routes)
12. [Dashboard Routes](#12-dashboard-routes)
13. [Audit Logs](#13-audit-logs-superadmin--admin)

---

## Notation

```
🔓 Public           — No token required
🔐 Protected        — Requires Bearer token (any logged-in role)
🔱 Superadmin only  — `user_role = superadmin`
👑 Admin only        — Company `admin` (not superadmin shell user)
🧑‍💼 Admin | HR Officer
💰 Admin | Payroll Officer
🔑 Admin only (specific action)
```

---

## 1. Auth Routes

---

### `POST /auth/login`

**Access:** 🔓 Public  
**Purpose:** Authenticate with **`loginId`** OR **`login_id`** (accepted aliases; maps to DB `users.login_id`) plus password  
**Frontend:** `LoginPage.jsx`

**Request Body:**
```json
{
  "loginId": "OIJODO20220001",
  "password": "Xy#9m2Kz1p"
}
```
> Alternate key accepted for clients using snake_case: `"login_id"`.

**Response `200`:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@odooindia.com",
      "role": "employee"
    }
  }
}
```
> Typical expansion of `user` payload (recommended): `loginId`, `companyId`, `mustChangePwd`, `isActive`.

**Response `403` (`users.is_active = false`, pending onboarding):**
```json
{
  "success": false,
  "message": "Account not active yet",
  "data": null
}
```

**Response `401`:** Invalid credentials / user not found.

---

### `POST /auth/register` _(optional combined flow)_

**Access:** 🔓 Public  
**Purpose:** Single-shot “company + admin” signup when **`company_requests`** is not used — creates `companies`, first `admin`, active user, and skips pending review. Omit this route if onboarding is strictly **[#1b](#1b-company-onboarding--company_requests)** only.

**(When enabled)** request/response shapes remain product-defined; enforce unique `users.email`, `users.login_id`, and FK to `companies`.

---

## 1b. Company onboarding & `company_requests`

Flows here map to **`companies`**, **`users`** (stub admin, `role = admin`, `is_active = false` until approval), **`employee_profiles`** (`date_of_joining` NOT NULL), and **`company_requests`** (`status` ENUM **`request_status`**).

---

### `POST /companies` _(alias: `POST /auth/company`)_

**Access:** 🔓 Public _(or 🔱 Superadmin only if product closes self-serve signup)_  
**Purpose:** Insert a **`companies`** row (`name`, optional `logoUrl` / DB `logo_url`). Returns `company.id` consumed by **`POST /auth/register-admin`**.

**Request Body:**
```json
{
  "name": "Odoo India",
  "logoUrl": null
}
```

**Response `200` / `201`:**
```json
{
  "success": true,
  "message": "Company created",
  "data": {
    "id": "uuid",
    "name": "Odoo India",
    "logoUrl": null,
    "createdAt": "2026-05-02T12:00:00.000Z",
    "updatedAt": "2026-05-02T12:00:00.000Z"
  }
}
```

---

### `POST /auth/register-admin` _(alias: `/auth/register` with body below)_

**Access:** 🔓 Public  
**Purpose:** Creates the first **company admin** **`users`** row + **`employee_profiles`** stub + **`company_requests`** (`pending`). `login_id` is generated server-side from company + names. Default temp password policy is product-defined; **`must_change_pwd`** should be **`true`**. **`is_active`** is **`false`** until superadmin approval.

**Request Body:**
```json
{
  "companyId": "uuid",
  "name": "John Doe",
  "email": "john@odooindia.com",
  "phone": "9876543210",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfJoining": "2026-05-02"
}
```
> Alternate keys aligned with Postgres: `company_id`, `first_name`, `last_name`, `date_of_joining`.

**Response `200`:**
```json
{
  "success": true,
  "message": "User registered - pending approval",
  "data": {
    "id": "uuid",
    "loginId": "OIJODO20260001",
    "companyRequestId": "uuid"
  }
}
```

---

### `POST /company-requests/:id/review` _(alias: `/auth/company-request/:id/review`)_

**Access:** 🔱 Superadmin only  
**Purpose:** **`UPDATE company_requests`**: sets `reviewed_by`, `reviewed_at`, `reviewer_notes`, `status ∈ { approved, rejected }`. On **`approved`**, set target admin **`users.is_active = true`**.

**Request Body:**
```json
{
  "action": "approve",
  "reviewerNotes": "Welcome onboard"
}
```
> **`action`** values: `approve` \| `reject` (maps to **`request_status`**).

**Response `200`:**
```json
{
  "success": true,
  "message": "Company request approved",
  "data": null
}
```

---

### `GET /company-requests`

**Access:** 🔱 Superadmin only  
**Purpose:** Paginated queue of onboarding rows (join **`companies`** + admin **`users`**, filter by **`request_status`**).

**Query Params:** `page`, `limit`, `status` (`pending` \| `approved` \| `rejected`)

---

### `POST /auth/refresh`

**Access:** 🔓 Public (uses httpOnly cookie)  
**Purpose:** Get a new access token using the refresh token cookie  
**Frontend:** `api/client.js` Axios interceptor (called automatically on 401)

**Request:** No body. Sends `refresh_token` cookie automatically.

**Response `200`:**
```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "token": "<new_jwt>"
  }
}
```

**Response `401`:**
```json
{
  "success": false,
  "message": "Refresh token expired or invalid. Please log in again.",
  "data": null
}
```

---

### `POST /auth/logout`

**Access:** 🔐 Protected  
**Purpose:** Invalidate refresh token in Redis, clear cookie  
**Frontend:** Topbar avatar dropdown → "Log Out"

**Request:** No body. Sends Bearer token.

**Response `200`:**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

---

### `POST /auth/change-password`

**Access:** 🔐 Protected (all roles)  
**Purpose:** Change own password. Required on first login when `mustChangePwd = true`.  
**Frontend:** `ChangePasswordPage.jsx`, Employee Profile → Security tab

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "Xy#9m2Kz1p",
  "newPassword": "MyNewPass@456",
  "confirmPassword": "MyNewPass@456"
}
```
> On first login, `currentPassword` is the system-generated temp password.

**Response `200`:**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": null
}
```

**Response `400`:**
```json
{
  "success": false,
  "message": "Current password is incorrect",
  "data": null
}
```

---

### `POST /auth/reset-password`

**Access:** 👑 Admin only  
**Purpose:** Admin resets another user's password (sends new temp password via email)  
**Frontend:** Settings → User table → "Reset Password" action

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "userId": "uuid-of-target-user"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Password reset. New credentials sent to employee email.",
  "data": null
}
```

---

## 2. Department Routes

Maps to **`departments`** (`id`, **`company_id`**, **`name`**, **`created_at`**). Departments are scoped to the caller **`company_id`** from the JWT unless **`superadmin`**.

---

### `GET /departments`

**Access:** 🔐 Protected _(any role in-company)_  
**Purpose:** List departments for the current company (paginated optionally).

**Query Params:** `page`, `limit`, `search`

**Response `200` (`data.items`):**
```json
{
  "id": "uuid",
  "companyId": "uuid",
  "name": "Engineering",
  "createdAt": "2026-01-10T00:00:00.000Z"
}
```

---

### `POST /departments`

**Access:** 👑 Admin or 🧑‍💼 HR Officer  
**Purpose:** **`INSERT`** into **`departments`** (`company_id` from token, **`name`** unique per company recommended).

---

### `PUT /departments/:id`

**Access:** 👑 Admin or 🧑‍💼 HR Officer  
**Purpose:** Rename department; FK **`employee_profiles.department_id`** continues to resolve.

---

### `DELETE /departments/:id`

**Access:** 👑 Admin only _(recommended)_  
**Purpose:** Delete if no employees reference **`department_id`**, or set **`employee_profiles.department_id`** null first.

---

## 3. Employee Routes

---

### `GET /employees`

**Access:** 🔐 Protected (all roles)  
**Purpose:** Get paginated list of employees with search and filters  
**Frontend:** `EmployeesPage.jsx` (card grid)

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | 1 | Page number |
| `limit` | integer | 10 | Records per page (max 50) |
| `search` | string | — | Searches name, loginId, email, designation |
| `department` | UUID | — | Filter by department ID |
| `role` | string | — | `admin`, `hr_officer`, `payroll_officer`, `employee` (`superadmin` omitted from company directories) |
| `status` | string | `active` | `active` or `inactive` (`users.is_active`) |

**Example:**
```
GET /employees?page=1&limit=10&search=john&department=uuid&role=employee
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Employees fetched",
  "data": {
    "items": [
      {
        "id": "uuid",
        "loginId": "OIJODO20220001",
        "name": "John Doe",
        "email": "john@company.com",
        "role": "employee",
        "isActive": true,
        "avatarUrl": null,
        "profile": {
          "designation": "Software Engineer",
          "department": { "id": "uuid", "name": "Engineering" },
          "location": "Pune",
          "dateOfJoining": "2022-01-15",
          "manager": { "id": "uuid", "name": "Jane Smith" }
        },
        "attendanceStatus": "present"
      }
    ],
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
> `attendanceStatus` is `"present"`, `"absent"`, or `"on_leave"` — computed from today's attendance record.

---

### `POST /employees`

**Access:** 🧑‍💼 Admin | HR Officer  
**Purpose:** Create a new employee. System generates loginId, temp password, sends email.  
**Frontend:** `CreateEmployeePage.jsx`

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@company.com",
  "phone": "9876543210",
  "role": "employee",
  "designation": "Product Manager",
  "departmentId": "uuid",
  "dateOfJoining": "2024-02-01",
  "location": "Mumbai"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Employee created. Login credentials sent to jane.smith@company.com",
  "data": {
    "id": "uuid",
    "loginId": "OIJASM20240001",
    "name": "Jane Smith",
    "email": "jane.smith@company.com",
    "role": "employee"
  }
}
```

**Response `409`:**
```json
{
  "success": false,
  "message": "An employee with this email already exists",
  "data": null
}
```

---

### `GET /employees/me`

**Access:** 🔐 Protected (all roles)  
**Purpose:** Get own full profile  
**Frontend:** Profile page (own), Topbar avatar → "My Profile"

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Profile fetched",
  "data": {
    "id": "uuid",
    "loginId": "OIJODO20220001",
    "name": "John Doe",
    "email": "john@company.com",
    "phone": "9876543210",
    "role": "employee",
    "avatarUrl": null,
    "profile": {
      "designation": "Software Engineer",
      "department": { "id": "uuid", "name": "Engineering" },
      "location": "Pune",
      "dateOfBirth": "1995-06-15",
      "dateOfJoining": "2022-01-15",
      "gender": "male",
      "nationality": "Indian",
      "personalEmail": "john.personal@gmail.com",
      "maritalStatus": "single",
      "manager": { "id": "uuid", "name": "Jane Smith" },
      "bankAccountNumber": "XXXX1234",
      "bankName": "HDFC Bank",
      "ifscCode": "HDFC0001234",
      "panNumber": "ABCDE1234F",
      "uanNumber": "100123456789",
      "esicNumber": null,
      "about": "Passionate developer...",
      "skills": ["React", "Node.js", "PostgreSQL"],
      "certifications": ["AWS Cloud Practitioner"]
    }
  }
}
```

---

### `PUT /employees/me`

**Access:** 🔐 Protected (all roles — own profile fields only)  
**Purpose:** Update own profile  
**Frontend:** Employee Profile → edit mode (own)

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body** (any subset of updatable fields):
```json
{
  "phone": "9998887776",
  "avatarUrl": "https://storage.url/avatar.jpg",
  "profile": {
    "personalEmail": "john.new@gmail.com",
    "about": "Updated bio",
    "skills": ["React", "TypeScript"],
    "certifications": ["AWS Solutions Architect"]
  }
}
```
> Employees cannot update: `role`, `email`, `designation`, `departmentId`, `dateOfJoining`, `salary info`.

**Response `200`:**
```json
{
  "success": true,
  "message": "Profile updated",
  "data": { "id": "uuid", "name": "John Doe" }
}
```

---

### `GET /employees/:id`

**Access:** 🔐 Protected (all roles — view-only for non-HR/Admin)  
**Purpose:** Get a specific employee's full profile  
**Frontend:** `EmployeeDetailPage.jsx` (opened from directory card click)

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response `200`:** Same structure as `GET /employees/me`

**Response `404`:**
```json
{
  "success": false,
  "message": "Employee not found",
  "data": null
}
```

---

### `PUT /employees/:id`

**Access:** 🧑‍💼 Admin | HR Officer  
**Purpose:** Update any employee profile  
**Frontend:** `EmployeeDetailPage.jsx` → edit mode (HR/Admin)

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "phone": "9998887776",
  "profile": {
    "designation": "Senior Software Engineer",
    "departmentId": "uuid",
    "location": "Bangalore",
    "managerId": "uuid",
    "bankAccountNumber": "987654321",
    "bankName": "ICICI Bank",
    "ifscCode": "ICIC0001234",
    "panNumber": "ABCDE1234F",
    "uanNumber": "100123456789"
  }
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Employee profile updated",
  "data": { "id": "uuid" }
}
```

---

### `DELETE /employees/:id`

**Access:** 👑 Admin only  
**Purpose:** Soft-delete employee (sets `is_active = false`)  
**Frontend:** Employee detail → Admin actions → "Deactivate Employee"

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Employee deactivated",
  "data": null
}
```

---

### `GET /employees/:id/salary`

**Access:** 💰 Admin | Payroll Officer  
**Purpose:** Get employee salary info (structure + wage)  
**Frontend:** `EmployeeDetailPage.jsx` → Salary Info tab (only rendered for Admin/Payroll Officer)

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Salary info fetched",
  "data": {
    "userId": "uuid",
    "salaryStructure": {
      "id": "uuid",
      "name": "Regular Pay",
      "wageType": "fixed_wage",
      "pfRate": 12,
      "professionalTax": 200,
      "components": [
        { "name": "Basic Salary", "componentType": "basic", "computationType": "percentage", "value": 50 },
        { "name": "HRA", "componentType": "hra", "computationType": "percentage", "value": 50 },
        { "name": "Standard Allowance", "componentType": "standard_allowance", "computationType": "fixed", "value": 1500 }
      ]
    },
    "monthlyWage": 50000,
    "yearlyWage": 600000,
    "workingHoursPerDay": 8,
    "workingDaysPerWeek": 5,
    "effectiveFrom": "2022-01-15"
  }
}
```

---

### `PUT /employees/:id/salary`

**Access:** 💰 Admin | Payroll Officer  
**Purpose:** Set or update employee salary info  
**Frontend:** `EmployeeDetailPage.jsx` → Salary Info tab → save

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "salaryStructureId": "uuid",
  "monthlyWage": 55000,
  "workingHoursPerDay": 8,
  "workingDaysPerWeek": 5,
  "effectiveFrom": "2024-04-01"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Salary info updated",
  "data": {
    "userId": "uuid",
    "monthlyWage": 55000,
    "yearlyWage": 660000
  }
}
```

---

## 4. Attendance Routes

---

### `POST /attendance/check-in`

**Access:** 🔐 Protected (all roles — own only)  
**Purpose:** Mark check-in for today  
**Frontend:** Dashboard → "Check In" button

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:** None (userId and date inferred from token + server time)

**Response `201`:**
```json
{
  "success": true,
  "message": "Check-in marked",
  "data": {
    "id": "uuid",
    "date": "2025-10-22",
    "checkIn": "2025-10-22T09:00:00Z",
    "status": "present"
  }
}
```

**Response `409` (already checked in):**
```json
{
  "success": false,
  "message": "You have already checked in today",
  "data": null
}
```

---

### `POST /attendance/check-out`

**Access:** 🔐 Protected (all roles — own only)  
**Purpose:** Mark check-out for today  
**Frontend:** Dashboard → "Check Out" button

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:** None

**Response `200`:**
```json
{
  "success": true,
  "message": "Check-out marked",
  "data": {
    "id": "uuid",
    "date": "2025-10-22",
    "checkIn": "2025-10-22T09:00:00Z",
    "checkOut": "2025-10-22T18:00:00Z",
    "workHours": 9.0,
    "extraHours": 1.0,
    "status": "present"
  }
}
```

**Response `422` (no check-in found):**
```json
{
  "success": false,
  "message": "No check-in found for today",
  "data": null
}
```

---

### `GET /attendance/me`

**Access:** 🔐 Protected (all roles — own only)  
**Purpose:** Get own attendance records, filtered by month, paginated  
**Frontend:** `AttendancePage.jsx` → Employee view (monthly table)

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `month` | string | current | Format `YYYY-MM` |
| `page` | integer | 1 | — |
| `limit` | integer | 10 | — |

**Response `200`:**
```json
{
  "success": true,
  "message": "Attendance fetched",
  "data": {
    "items": [
      {
        "id": "uuid",
        "date": "2025-10-01",
        "checkIn": "2025-10-01T09:05:00Z",
        "checkOut": "2025-10-01T18:10:00Z",
        "workHours": 9.08,
        "extraHours": 1.08,
        "status": "present",
        "notes": null
      }
    ],
    "summary": {
      "month": "October 2025",
      "daysPresent": 18,
      "leavesTaken": 2,
      "totalWorkingDays": 23,
      "extraHoursTotal": 6.5
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 23,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### `GET /attendance`

**Access:** 💰🧑‍💼 Admin | HR Officer | Payroll Officer  
**Purpose:** Get all employees' attendance, paginated with filters  
**Frontend:** `AttendancePage.jsx` → Admin/HR/Payroll view (daily table, date navigation)

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `date` | string | today | Format `YYYY-MM-DD` |
| `page` | integer | 1 | — |
| `limit` | integer | 10 | — |
| `search` | string | — | Employee name or loginId |
| `status` | string | — | `present`, `absent`, `on_leave`, `half_day` |

**Response `200`:**
```json
{
  "success": true,
  "message": "Attendance fetched",
  "data": {
    "date": "2025-10-22",
    "items": [
      {
        "userId": "uuid",
        "name": "John Doe",
        "loginId": "OIJODO20220001",
        "designation": "Software Engineer",
        "department": "Engineering",
        "avatarUrl": null,
        "attendance": {
          "id": "uuid",
          "checkIn": "2025-10-22T09:00:00Z",
          "checkOut": "2025-10-22T18:00:00Z",
          "workHours": 9.0,
          "extraHours": 1.0,
          "status": "present"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### `GET /attendance/:userId`

**Access:** 💰🧑‍💼 Admin | HR Officer | Payroll Officer  
**Purpose:** Get a specific employee's attendance by month  
**Frontend:** Attendance page → click employee row → detail

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:** `month` (YYYY-MM), `page`, `limit`

**Response `200`:** Same structure as `GET /attendance/me` but for the specified user.

---

### `PUT /attendance/:id`

**Access:** 👑 Admin only  
**Purpose:** Manually edit an attendance record  
**Frontend:** Admin attendance view → edit row action

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "checkIn": "2025-10-22T09:30:00Z",
  "checkOut": "2025-10-22T18:30:00Z",
  "status": "present",
  "notes": "Manual correction — system failure"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Attendance record updated",
  "data": {
    "id": "uuid",
    "date": "2025-10-22",
    "checkIn": "2025-10-22T09:30:00Z",
    "checkOut": "2025-10-22T18:30:00Z",
    "workHours": 9.0,
    "status": "present"
  }
}
```

---

### `GET /attendance/summary/:userId`

**Access:** 🔐 Protected (own or Admin/HR/Payroll for others)  
**Purpose:** Monthly attendance summary stats for a user  
**Frontend:** Attendance page header stats row

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:** `month` (YYYY-MM, default current)

**Response `200`:**
```json
{
  "success": true,
  "message": "Attendance summary fetched",
  "data": {
    "month": "October 2025",
    "daysPresent": 18,
    "leavesTaken": 2,
    "totalWorkingDays": 23,
    "extraHoursTotal": 6.5
  }
}
```

---

## 5. Time Off — Allocation Routes

---

### `GET /time-off/allocations`

**Access:** 🧑‍💼 Admin | HR Officer  
**Purpose:** List all leave allocations (paginated, filterable)  
**Frontend:** `TimeOffPage.jsx` → "Allocations" tab (Admin/HR view)

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | 1 | — |
| `limit` | integer | 10 | — |
| `user_id` | UUID | — | Filter by employee |
| `leave_type` | string | — | `paid_time_off`, `sick_leave`, `unpaid_leave` |

**Response `200`:**
```json
{
  "success": true,
  "message": "Allocations fetched",
  "data": {
    "items": [
      {
        "id": "uuid",
        "employee": { "id": "uuid", "name": "John Doe", "loginId": "OIJODO20220001" },
        "leaveType": "paid_time_off",
        "validityStart": "2025-01-01",
        "validityEnd": "2025-12-31",
        "allocatedDays": 24,
        "usedDays": 6,
        "availableDays": 18,
        "notes": "Annual PTO for 2025",
        "createdBy": { "id": "uuid", "name": "Jane HR" }
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 35, "totalPages": 4, "hasNextPage": true, "hasPrevPage": false }
  }
}
```

---

### `POST /time-off/allocations`

**Access:** 🧑‍💼 Admin | HR Officer  
**Purpose:** Allocate leave days to an employee  
**Frontend:** `TimeOffPage.jsx` → "NEW" button → Create Allocation modal

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "userId": "uuid",
  "leaveType": "paid_time_off",
  "validityStart": "2025-01-01",
  "validityEnd": "2025-12-31",
  "allocatedDays": 24,
  "notes": "Annual PTO for 2025"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Leave allocation created",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "leaveType": "paid_time_off",
    "allocatedDays": 24,
    "usedDays": 0,
    "validityStart": "2025-01-01",
    "validityEnd": "2025-12-31"
  }
}
```

---

### `GET /time-off/allocations/me`

**Access:** 🔐 Protected (all roles)  
**Purpose:** Get own leave allocations and remaining balance  
**Frontend:** `TimeOffPage.jsx` → "My Leaves" tab

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Your allocations fetched",
  "data": [
    {
      "id": "uuid",
      "leaveType": "paid_time_off",
      "validityStart": "2025-01-01",
      "validityEnd": "2025-12-31",
      "allocatedDays": 24,
      "usedDays": 6,
      "availableDays": 18
    },
    {
      "id": "uuid",
      "leaveType": "sick_leave",
      "validityStart": "2025-01-01",
      "validityEnd": "2025-12-31",
      "allocatedDays": 12,
      "usedDays": 2,
      "availableDays": 10
    }
  ]
}
```

---

### `PUT /time-off/allocations/:id`

**Access:** 🧑‍💼 Admin | HR Officer  
**Purpose:** Update an allocation  
**Frontend:** Allocation list → edit row

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "allocatedDays": 28,
  "notes": "Updated for senior employees"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Allocation updated",
  "data": { "id": "uuid", "allocatedDays": 28 }
}
```

---

### `DELETE /time-off/allocations/:id`

**Access:** 👑 Admin only  
**Purpose:** Delete an allocation (only if no approved requests against it)  
**Frontend:** Allocation list → delete action (Admin)

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Allocation deleted",
  "data": null
}
```

**Response `422` (has approved requests):**
```json
{
  "success": false,
  "message": "Cannot delete allocation with approved leave requests",
  "data": null
}
```

---

## 6. Time Off — Request Routes

---

### `GET /time-off/requests`

**Access:** 💰 Admin | Payroll Officer  
**Purpose:** All leave requests (paginated, filterable)  
**Frontend:** `TimeOffPage.jsx` → "Requests" tab (Payroll/Admin view)

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | 1 | — |
| `limit` | integer | 10 | — |
| `status` | string | — | `pending`, `approved`, `rejected`, `cancelled` |
| `leave_type` | string | — | `paid_time_off`, `sick_leave`, `unpaid_leave` |
| `user_id` | UUID | — | Filter by employee |
| `from_date` | string | — | `YYYY-MM-DD` start range |
| `to_date` | string | — | `YYYY-MM-DD` end range |

**Response `200`:**
```json
{
  "success": true,
  "message": "Requests fetched",
  "data": {
    "items": [
      {
        "id": "uuid",
        "employee": { "id": "uuid", "name": "John Doe", "loginId": "OIJODO20220001", "designation": "Software Engineer" },
        "leaveType": "paid_time_off",
        "startDate": "2025-10-20",
        "endDate": "2025-10-22",
        "daysRequested": 3,
        "reason": "Personal work",
        "status": "pending",
        "reviewedBy": null,
        "reviewedAt": null,
        "reviewerNote": null,
        "createdAt": "2025-10-15T10:00:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 12, "totalPages": 2, "hasNextPage": true, "hasPrevPage": false }
  }
}
```

---

### `POST /time-off/requests`

**Access:** 🔐 Protected (all roles)  
**Purpose:** Submit a leave request  
**Frontend:** `TimeOffPage.jsx` → "Request Leave" button → form modal

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "allocationId": "uuid",
  "startDate": "2025-10-20",
  "endDate": "2025-10-22",
  "daysRequested": 3,
  "reason": "Personal work"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Leave request submitted",
  "data": {
    "id": "uuid",
    "leaveType": "paid_time_off",
    "startDate": "2025-10-20",
    "endDate": "2025-10-22",
    "daysRequested": 3,
    "status": "pending"
  }
}
```

**Response `422` (insufficient balance):**
```json
{
  "success": false,
  "message": "Insufficient leave balance. Available: 2 days, requested: 3 days",
  "data": null
}
```

---

### `GET /time-off/requests/me`

**Access:** 🔐 Protected (all roles)  
**Purpose:** Get own leave requests (paginated)  
**Frontend:** `TimeOffPage.jsx` → "My Requests" list

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:** `page`, `limit`, `status`, `leave_type`

**Response `200`:**
```json
{
  "success": true,
  "message": "Your leave requests fetched",
  "data": {
    "items": [
      {
        "id": "uuid",
        "leaveType": "paid_time_off",
        "startDate": "2025-10-20",
        "endDate": "2025-10-22",
        "daysRequested": 3,
        "reason": "Personal work",
        "status": "approved",
        "reviewedBy": { "id": "uuid", "name": "Payroll Officer" },
        "reviewedAt": "2025-10-16T09:00:00Z",
        "reviewerNote": "Approved"
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 8, "totalPages": 1, "hasNextPage": false, "hasPrevPage": false }
  }
}
```

---

### `GET /time-off/requests/:id`

**Access:** 🔐 Protected (own request or Admin/Payroll Officer)  
**Purpose:** Single leave request detail  
**Frontend:** Request list → click row

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response `200`:** Single request object (same fields as list item).

---

### `PUT /time-off/requests/:id/approve`

**Access:** 💰 Admin | Payroll Officer  
**Purpose:** Approve a pending leave request. Updates `used_days` and creates attendance `on_leave` records.  
**Frontend:** `TimeOffPage.jsx` → Requests tab → "Approve" button

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "reviewerNote": "Approved. Enjoy your time off."
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Leave request approved",
  "data": {
    "id": "uuid",
    "status": "approved",
    "reviewedAt": "2025-10-16T09:00:00Z"
  }
}
```

**Response `422` (not pending):**
```json
{
  "success": false,
  "message": "Only pending requests can be approved",
  "data": null
}
```

---

### `PUT /time-off/requests/:id/reject`

**Access:** 💰 Admin | Payroll Officer  
**Purpose:** Reject a pending leave request. Restores days to allocation balance.  
**Frontend:** `TimeOffPage.jsx` → Requests tab → "Reject" button

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "reviewerNote": "Rejected due to project deadline"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Leave request rejected",
  "data": { "id": "uuid", "status": "rejected" }
}
```

---

### `PUT /time-off/requests/:id/cancel`

**Access:** 🔐 Protected (own pending requests only)  
**Purpose:** Cancel own pending leave request  
**Frontend:** "My Requests" list → "Cancel" action on pending request

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:** None

**Response `200`:**
```json
{
  "success": true,
  "message": "Leave request cancelled",
  "data": { "id": "uuid", "status": "cancelled" }
}
```

**Response `422` (already approved/rejected):**
```json
{
  "success": false,
  "message": "Only pending requests can be cancelled",
  "data": null
}
```

---

## 7. Salary Structure Routes

---

### `GET /salary-structures`

**Access:** 💰 Admin | Payroll Officer  
**Purpose:** List all salary structures (paginated)  
**Frontend:** Payroll → Salary Structures tab; also dropdown in `SalaryInfoForm.jsx`

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:** `page`, `limit`

**Response `200`:**
```json
{
  "success": true,
  "message": "Salary structures fetched",
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Regular Pay",
        "wageType": "fixed_wage",
        "pfRate": 12,
        "professionalTax": 200,
        "components": [
          { "id": "uuid", "name": "Basic Salary", "componentType": "basic", "computationType": "percentage", "value": 50, "sortOrder": 1 },
          { "id": "uuid", "name": "HRA", "componentType": "hra", "computationType": "percentage", "value": 50, "sortOrder": 2 },
          { "id": "uuid", "name": "Standard Allowance", "componentType": "standard_allowance", "computationType": "fixed", "value": 1500, "sortOrder": 3 }
        ]
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 3, "totalPages": 1, "hasNextPage": false, "hasPrevPage": false }
  }
}
```

---

### `POST /salary-structures`

**Access:** 💰 Admin | Payroll Officer  
**Purpose:** Create a salary structure with components  
**Frontend:** Payroll → Salary Structures → "New Structure"

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Regular Pay",
  "wageType": "fixed_wage",
  "pfRate": 12,
  "professionalTax": 200,
  "components": [
    { "name": "Basic Salary", "componentType": "basic", "computationType": "percentage", "value": 50, "sortOrder": 1 },
    { "name": "HRA", "componentType": "hra", "computationType": "percentage", "value": 50, "sortOrder": 2 },
    { "name": "Standard Allowance", "componentType": "standard_allowance", "computationType": "fixed", "value": 1500, "sortOrder": 3 }
  ]
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Salary structure created",
  "data": { "id": "uuid", "name": "Regular Pay" }
}
```

---

### `GET /salary-structures/:id`

**Access:** 💰 Admin | Payroll Officer  
**Purpose:** Get full structure with components  
**Frontend:** Salary structure edit page

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response `200`:** Single structure object with full components array.

---

### `PUT /salary-structures/:id`

**Access:** 💰 Admin | Payroll Officer  
**Purpose:** Update structure and components  
**Frontend:** Salary structure edit form

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:** Same shape as `POST /salary-structures`

**Response `200`:**
```json
{
  "success": true,
  "message": "Salary structure updated",
  "data": { "id": "uuid" }
}
```

---

### `DELETE /salary-structures/:id`

**Access:** 💰 Admin | Payroll Officer  
**Purpose:** Delete a structure (only if no employees are assigned to it)  
**Frontend:** Salary structures list → delete action

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Salary structure deleted",
  "data": null
}
```

**Response `422`:**
```json
{
  "success": false,
  "message": "Cannot delete structure assigned to employees",
  "data": null
}
```

---

## 8. Payrun Routes

---

### `GET /payruns`

**Access:** 💰 Admin | Payroll Officer  
**Purpose:** List all payruns (paginated, filterable by status/year)  
**Frontend:** `PayrollPage.jsx` → Payrun tab list

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | 1 | — |
| `limit` | integer | 10 | — |
| `status` | string | — | `draft`, `validated`, `paid`, `cancelled` |
| `year` | integer | — | e.g., `2025` |

**Response `200`:**
```json
{
  "success": true,
  "message": "Payruns fetched",
  "data": {
    "items": [
      {
        "id": "uuid",
        "periodStart": "2025-10-01",
        "periodEnd": "2025-10-31",
        "status": "draft",
        "employeeCount": 45,
        "totalCost": 2250000,
        "generatedBy": { "id": "uuid", "name": "Payroll Officer" },
        "createdAt": "2025-10-31T10:00:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 12, "totalPages": 2, "hasNextPage": true, "hasPrevPage": false }
  }
}
```

---

### `POST /payruns`

**Access:** 💰 Admin | Payroll Officer  
**Purpose:** Generate a payrun for a given period. Calculates payslips for all active employees with salary info.  
**Frontend:** `PayrollPage.jsx` → "Generate Payrun" button

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "periodStart": "2025-10-01",
  "periodEnd": "2025-10-31"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Payrun generated with 45 payslips",
  "data": {
    "id": "uuid",
    "periodStart": "2025-10-01",
    "periodEnd": "2025-10-31",
    "status": "draft",
    "employeeCount": 45,
    "totalCost": 2250000
  }
}
```

**Response `409` (period already exists):**
```json
{
  "success": false,
  "message": "A payrun for October 2025 already exists",
  "data": null
}
```

---

### `GET /payruns/:id`

**Access:** 💰 Admin | Payroll Officer  
**Purpose:** Single payrun details + paginated list of its payslips  
**Frontend:** `PayrunDetailPage.jsx`

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:** `page`, `limit`, `search` (employee name/code)

**Response `200`:**
```json
{
  "success": true,
  "message": "Payrun fetched",
  "data": {
    "payrun": {
      "id": "uuid",
      "periodStart": "2025-10-01",
      "periodEnd": "2025-10-31",
      "status": "draft",
      "employeeCount": 45,
      "totalCost": 2250000,
      "generatedBy": { "id": "uuid", "name": "Payroll Officer" },
      "validatedBy": null,
      "validatedAt": null,
      "paidAt": null
    },
    "payslips": {
      "items": [
        {
          "id": "uuid",
          "employeeName": "John Doe",
          "employeeCode": "OIJODO20220001",
          "department": "Engineering",
          "designation": "Software Engineer",
          "grossSalary": 50000,
          "netSalary": 43600,
          "employerCost": 56000,
          "payableDays": 23,
          "status": "draft"
        }
      ],
      "pagination": { "page": 1, "limit": 10, "total": 45, "totalPages": 5, "hasNextPage": true, "hasPrevPage": false }
    }
  }
}
```

---

### `POST /payruns/:id/validate`

**Access:** 💰 Admin | Payroll Officer  
**Purpose:** Validate a draft payrun. Locks all payslips (no more regeneration).  
**Frontend:** `PayrunDetailPage.jsx` → "Validate" button

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:** None

**Response `200`:**
```json
{
  "success": true,
  "message": "Payrun validated and locked",
  "data": {
    "id": "uuid",
    "status": "validated",
    "validatedAt": "2025-11-01T09:00:00Z"
  }
}
```

---

### `POST /payruns/:id/pay`

**Access:** 💰 Admin | Payroll Officer  
**Purpose:** Mark payrun as paid. Triggers Kafka event → PDF generation → email delivery.  
**Frontend:** `PayrunDetailPage.jsx` → "Mark as Paid" button

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "payDate": "2025-11-01"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Payrun marked as paid. Payslip PDFs are being generated and emailed.",
  "data": {
    "id": "uuid",
    "status": "paid",
    "paidAt": "2025-11-01T10:00:00Z"
  }
}
```

---

### `POST /payruns/:id/cancel`

**Access:** 💰 Admin | Payroll Officer  
**Purpose:** Cancel a draft or validated payrun  
**Frontend:** Payrun detail → "Cancel" action

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:** None

**Response `200`:**
```json
{
  "success": true,
  "message": "Payrun cancelled",
  "data": { "id": "uuid", "status": "cancelled" }
}
```

**Response `422` (already paid):**
```json
{
  "success": false,
  "message": "Paid payruns cannot be cancelled",
  "data": null
}
```

---

## 9. Payslip Routes

---

### `GET /payslips`

**Access:** 💰 Admin | Payroll Officer  
**Purpose:** All payslips across all payruns (paginated, filterable)  
**Frontend:** Payroll → Payslips overview tab

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:** `page`, `limit`, `payrun_id`, `user_id`, `search`

**Response `200`:**
```json
{
  "success": true,
  "message": "Payslips fetched",
  "data": {
    "items": [
      {
        "id": "uuid",
        "payrunId": "uuid",
        "periodStart": "2025-10-01",
        "periodEnd": "2025-10-31",
        "employeeName": "John Doe",
        "employeeCode": "OIJODO20220001",
        "grossSalary": 50000,
        "netSalary": 43600,
        "status": "draft"
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 135, "totalPages": 14, "hasNextPage": true, "hasPrevPage": false }
  }
}
```

---

### `GET /payslips/me`

**Access:** 🔐 Protected (all roles — own only)  
**Purpose:** Own payslips (paginated)  
**Frontend:** Employee profile → Payslips section; sidebar → "My Payslips"

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:** `page`, `limit`

**Response `200`:**
```json
{
  "success": true,
  "message": "Your payslips fetched",
  "data": {
    "items": [
      {
        "id": "uuid",
        "periodStart": "2025-10-01",
        "periodEnd": "2025-10-31",
        "payDate": "2025-11-01",
        "grossSalary": 50000,
        "netSalary": 43600,
        "status": "paid",
        "pdfUrl": "https://storage/payslips/uuid.pdf"
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 12, "totalPages": 2, "hasNextPage": true, "hasPrevPage": false }
  }
}
```

---

### `GET /payslips/:id`

**Access:** 🔐 Protected (own payslip, or Admin/Payroll Officer for any)  
**Purpose:** Full payslip detail for display  
**Frontend:** `PayslipDetailPage.jsx` (two tabs: Worked Days + Salary Computation)

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Payslip fetched",
  "data": {
    "id": "uuid",
    "periodStart": "2025-10-01",
    "periodEnd": "2025-10-31",
    "payDate": "2025-11-01",
    "employeeName": "John Doe",
    "employeeCode": "OIJODO20220001",
    "department": "Engineering",
    "designation": "Software Engineer",
    "location": "Pune",
    "dateOfJoining": "2022-01-15",
    "panNumber": "ABCDE1234F",
    "uanNumber": "100123456789",
    "bankAccount": "XXXX1234",
    "workedDays": {
      "totalWorkingDays": 23,
      "attendanceDays": 20,
      "paidLeaveDays": 2,
      "unpaidLeaveDays": 1,
      "payableDays": 22
    },
    "earnings": {
      "basicSalary": 20869.57,
      "hra": 10434.78,
      "standardAllowance": 1500,
      "performanceBonus": 2086.96,
      "leaveTravelAllowance": 1043.48,
      "fixedAllowance": 9848.78,
      "grossSalary": 45783.57
    },
    "deductions": {
      "pfEmployee": 2504.35,
      "pfEmployer": 2504.35,
      "professionalTax": 200,
      "tdsDeduction": 0,
      "totalDeductions": 2704.35
    },
    "netSalary": 43079.22,
    "employerCost": 48287.92,
    "status": "paid",
    "pdfUrl": "https://storage/payslips/uuid.pdf"
  }
}
```

> **`payslips.status`** is `VARCHAR` in **`schema.sql`** (default **`draft`**). Use values consistent with payrun lifecycle (**`draft`**, **`validated`**, **`paid`**) or extend with app-specific labels; avoid inventing values that never hit the DB constraint policy.

---

### `GET /payslips/:id/pdf`

**Access:** 🔐 Protected (own payslip, or Admin/Payroll Officer)  
**Purpose:** Download/stream the payslip PDF  
**Frontend:** Payslip detail → "Download PDF" / "Print" button

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response `200`:**
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="payslip-October-2025-OIJODO20220001.pdf"`
- Binary PDF stream

---

### `POST /payslips/:payrunId/regenerate`

**Access:** 💰 Admin | Payroll Officer  
**Purpose:** Regenerate a specific employee's payslip in a draft payrun  
**Frontend:** Payrun detail → payslip row → "Regenerate" (only if status = draft)

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "userId": "uuid"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Payslip regenerated",
  "data": { "id": "uuid", "netSalary": 43600 }
}
```

**Response `422` (payrun validated/paid):**
```json
{
  "success": false,
  "message": "Cannot regenerate payslip for a validated or paid payrun",
  "data": null
}
```

---

## 10. Reports Routes

---

### `GET /reports/salary-statement`

**Access:** 💰 Admin | Payroll Officer  
**Purpose:** Generate year-wise monthly salary breakdown for an employee  
**Frontend:** `ReportsPage.jsx` → select employee + year → view report

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `employee_id` | UUID | Yes | Target employee |
| `year` | integer | Yes | e.g., `2025` |

**Response `200`:**
```json
{
  "success": true,
  "message": "Salary statement generated",
  "data": {
    "employee": {
      "name": "John Doe",
      "loginId": "OIJODO20220001",
      "designation": "Software Engineer",
      "dateOfJoining": "2022-01-15"
    },
    "salaryStructure": { "name": "Regular Pay", "effectiveFrom": "2022-01-15" },
    "year": 2025,
    "months": [
      {
        "month": "January 2025",
        "periodStart": "2025-01-01",
        "periodEnd": "2025-01-31",
        "payableDays": 23,
        "grossSalary": 50000,
        "netSalary": 43600,
        "status": "paid"
      }
    ],
    "totals": {
      "grossSalary": 600000,
      "netSalary": 523200,
      "pfEmployee": 43200,
      "professionalTax": 2400
    }
  }
}
```

---

### `GET /reports/payroll-summary`

**Access:** 💰 Admin | Payroll Officer  
**Purpose:** Monthly payroll cost summary for the company  
**Frontend:** `ReportsPage.jsx` → Payroll Summary tab; also powers dashboard chart

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:** `year` (default current year)

**Response `200`:**
```json
{
  "success": true,
  "message": "Payroll summary fetched",
  "data": {
    "year": 2025,
    "months": [
      { "month": "Jan", "totalEmployerCost": 2800000, "employeeCount": 45, "status": "paid" },
      { "month": "Feb", "totalEmployerCost": 2850000, "employeeCount": 46, "status": "paid" }
    ]
  }
}
```

---

### `GET /reports/employee-count`

**Access:** 💰 Admin | Payroll Officer  
**Purpose:** Headcount over time  
**Frontend:** Dashboard chart → Employee Count widget

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:** `year`

**Response `200`:**
```json
{
  "success": true,
  "message": "Employee count report fetched",
  "data": {
    "year": 2025,
    "months": [
      { "month": "Jan", "count": 40 },
      { "month": "Feb", "count": 42 }
    ]
  }
}
```

---

## 11. Settings Routes

---

### `GET /settings/users`

**Access:** 👑 Admin only  
**Purpose:** List all users with their roles (paginated, searchable)  
**Frontend:** `SettingsPage.jsx` → User Settings table

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:** `page`, `limit`, `search` (name, email, loginId)

**Response `200`:**
```json
{
  "success": true,
  "message": "Users fetched",
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "John Doe",
        "loginId": "OIJODO20220001",
        "email": "john@company.com",
        "role": "employee",
        "isActive": true
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 50, "totalPages": 5, "hasNextPage": true, "hasPrevPage": false }
  }
}
```

---

### `PUT /settings/users/:id/role`

**Access:** 👑 Admin only  
**Purpose:** Update a user's role  
**Frontend:** Settings → User table → role dropdown → save

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "role": "hr_officer"
}
```
> Assignable values (must remain in **`user_role`** ENUM): `admin`, `hr_officer`, `payroll_officer`, `employee`. **`superadmin`** is never assigned via this route (platform seed / break-glass only).

**Response `200`:**
```json
{
  "success": true,
  "message": "User role updated to hr_officer",
  "data": { "id": "uuid", "role": "hr_officer" }
}
```

---

### `GET /settings/company`

**Access:** 👑 Admin only  
**Purpose:** Get company info (name, logo)  
**Frontend:** `SettingsPage.jsx` → Company Settings tab

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Company info fetched",
  "data": {
    "id": "uuid",
    "name": "Odoo India",
    "logoUrl": "https://storage/logos/company-uuid.png",
    "createdAt": "2022-01-01T00:00:00Z"
  }
}
```

---

### `PUT /settings/company`

**Access:** 👑 Admin only  
**Purpose:** Update company name and/or logo  
**Frontend:** Settings → Company tab → save

**Request Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body (multipart):**

| Field | Type | Description |
|---|---|---|
| `name` | string | Company name |
| `logo` | file | Logo image (jpg/png, max 2MB) |

**Response `200`:**
```json
{
  "success": true,
  "message": "Company info updated",
  "data": {
    "id": "uuid",
    "name": "Odoo India Pvt Ltd",
    "logoUrl": "https://storage/logos/new-logo.png"
  }
}
```

---

## 12. Dashboard Routes

---

### `GET /dashboard/stats`

**Access:** 🔐 Protected (all roles — Admin/Payroll get richer data)  
**Purpose:** Summary metrics card data. Cached in Redis for 3 minutes.  
**Frontend:** `DashboardPage.jsx` — stats cards at top

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response `200` (Admin/Payroll Officer):**
```json
{
  "success": true,
  "message": "Dashboard stats fetched",
  "data": {
    "totalEmployees": 50,
    "presentToday": 38,
    "onLeaveToday": 4,
    "absentToday": 8,
    "pendingLeaveRequests": 5,
    "upcomingPayrunDue": "2025-11-30",
    "lastPayrunStatus": "paid",
    "employeesWithoutBank": 3,
    "employeesWithoutManager": 7
  }
}
```

**Response `200` (Employee/HR Officer):**
```json
{
  "success": true,
  "message": "Dashboard stats fetched",
  "data": {
    "totalEmployees": 50,
    "presentToday": 38,
    "onLeaveToday": 4,
    "absentToday": 8,
    "pendingLeaveRequests": 5
  }
}
```

---

### `GET /dashboard/employer-cost`

**Access:** 💰 Admin | Payroll Officer  
**Purpose:** Monthly employer cost data for chart (bar chart)  
**Frontend:** `DashboardPage.jsx` → Employer Cost chart

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:** `year` (default current year), `view` (`monthly` | `annually`)

**Response `200`:**
```json
{
  "success": true,
  "message": "Employer cost data fetched",
  "data": {
    "year": 2025,
    "view": "monthly",
    "dataPoints": [
      { "label": "Jan", "amount": 2800000 },
      { "label": "Feb", "amount": 2850000 },
      { "label": "Mar", "amount": 2920000 }
    ]
  }
}
```

---

### `GET /dashboard/employee-count`

**Access:** 💰 Admin | Payroll Officer  
**Purpose:** Headcount trend data for chart  
**Frontend:** `DashboardPage.jsx` → Employee Count chart

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:** `year`, `view`

**Response `200`:**
```json
{
  "success": true,
  "message": "Employee count data fetched",
  "data": {
    "year": 2025,
    "view": "monthly",
    "dataPoints": [
      { "label": "Jan", "count": 40 },
      { "label": "Feb", "count": 42 },
      { "label": "Mar", "count": 45 }
    ]
  }
}
```

---

### `GET /dashboard/warnings`

**Access:** 💰 Admin | Payroll Officer  
**Purpose:** Compliance warnings (missing bank details, missing manager, etc.)  
**Frontend:** `DashboardPage.jsx` → Warnings section

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Dashboard warnings fetched",
  "data": {
    "employeesWithoutBank": [
      { "id": "uuid", "name": "Alice Ray", "loginId": "OIALRA20230001" }
    ],
    "employeesWithoutManager": [
      { "id": "uuid", "name": "Bob Singh", "loginId": "OIBOSI20230002" }
    ],
    "employeesWithoutSalaryInfo": [
      { "id": "uuid", "name": "Carol Jain", "loginId": "OICAJA20240001" }
    ]
  }
}
```

---

## 13. Audit logs (`audit_logs`)

**Table mapping:** `id`, **`company_id`**, **`actor_id`** (nullable), **`action`**, **`entity_type`**, **`entity_id`**, **`payload`** (`JSONB`), **`ip_address`**, **`created_at`**.

---

### `GET /audit-logs`

**Access:** 🔱 Superadmin _(full)_ or 👑 Company admin _(scoped to `company_id` from token)_  
**Purpose:** Immutable activity trail for compliance; filter by **`actor_id`**, **`entity_type`**, date range **`from`/`to`**.

**Query Params:** `page`, `limit`, `companyId` _(superadmin only)_, `actorId`, `entityType`, `from`, `to`

**Response `200` (`data.items` row shapes server-defined; align with columns above):**
```json
{
  "id": "uuid",
  "companyId": "uuid",
  "actorId": "uuid",
  "action": "payrun.validated",
  "entityType": "payruns",
  "entityId": "uuid",
  "payload": { "periodEnd": "2026-05-31" },
  "ipAddress": "192.0.2.10",
  "createdAt": "2026-05-02T09:15:00.000Z"
}
```

---

## Error Reference

All error responses follow this shape (aligned with **`successResponse` / `errorResponse`** helpers):

```json
{
  "success": false,
  "message": "Human-readable description",
  "data": null
}
```
> Historic clients may still expect `"status": "fail"`; converge on **`success`** boolean.

| Code | When |
|---|---|
| `400` | Missing/invalid request body fields |
| `401` | No Bearer token or expired token |
| `403` | Role not permitted for this action / account inactive (`is_active`) |
| `404` | Resource not found |
| `409` | Duplicate (`users.email`, `users.login_id`, payrun UNIQUE `(company_id, period_start, period_end)`, attendance UNIQUE `(user_id, date)`, etc.) |
| `422` | Business logic violation (insufficient leave balance, payrun locked, FK constraints) |
| `500` | Unexpected server error |

---

## Token Reference

There is **one token type** — the JWT access token (unless you add separate refresh handling).

| Property | Value |
|---|---|
| Format | `Bearer <jwt>` in `Authorization` header |
| TTL | Product-defined (backend sample uses 7d; short-lived access + refresh cookie is recommended) |
| Payload | At minimum `{ id, role, company_id }` (maps to **`users.id`**, **`user_role`**, **`users.company_id`**). Optional: `login_id`, `name`, `must_change_pwd`, `iat`, `exp`. |
| Storage | `localStorage` key e.g. **`token`** (client), user JSON in `AuthContext` on boot |
| Refresh | Optional: `httpOnly` refresh cookie + **`POST /auth/refresh`** returning `{ "data": { "token" } }` |
| Rotation | New JWT on each successful refresh |

> **Role** in the token must be one of **`user_role`** ENUM values. Middleware enforces **`superadmin`**-only paths and company-scoped **`company_id`** on all tenant queries.