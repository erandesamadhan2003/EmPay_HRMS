import express from 'express';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import companiesRoutes from './routes/companies.routes.js';
import superAdminRoutes from './routes/superAdmin.routes.js';
import superAdminPortalRoutes from './routes/superAdminPortal.routes.js';

import departmentsRoutes from './routes/departments.routes.js';
import employeesRoutes from './routes/employees.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import timeOffRoutes from './routes/timeOff.routes.js';
import salaryStructuresRoutes from './routes/salaryStructures.routes.js';
import payrunsRoutes from './routes/payruns.routes.js';
import payslipsRoutes from './routes/payslips.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import auditLogsRoutes from './routes/auditLogs.routes.js';
import agentRoutes from './routes/agent.routes.js';
import { run as runMigrations } from './migrations/index.js';
import pool from './config/db.js';
import redisClient from './config/redis.js';
import { scheduleAutoAbsentCron } from './services/autoAbsentCron.service.js';
import bcrypt from 'bcrypt';
import cors from 'cors';
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const openApiSpec = JSON.parse(readFileSync(join(__dirname, 'docs/openapi.json'), 'utf8'));

const app = express();
app.use(express.json());
app.use((req, res, next) => {
    req.db = pool;
    req.redis = redisClient;
    next();
});

app.use(cors());

// Swagger UI (`serve` is an array — spread it; do not add a separate /api/docs redirect or static + slash fight causes ERR_TOO_MANY_REDIRECTS)
app.use(
    "/api/docs",
    ...swaggerUi.serve,
    swaggerUi.setup(openApiSpec, { customSiteTitle: "EmPay API" }),
);

app.use('/api/auth', authRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/company-requests', superAdminRoutes);
app.use('/api/superadmin', superAdminPortalRoutes);

app.use('/api/departments', departmentsRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/time-off', timeOffRoutes);
app.use('/api/salary-structures', salaryStructuresRoutes);
app.use('/api/payruns', payrunsRoutes);
app.use('/api/payslips', payslipsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/agent', agentRoutes);

const PORT = process.env.PORT || 3000;

console.log(`Postgres config: host=${process.env.DB_HOST || 'localhost'} port=${process.env.DB_PORT || 5432} user=${process.env.DB_USER || 'postgres'} db=${process.env.DB_NAME || ''}`);

async function ensureSuperadmin() {
    const { rows } = await pool.query("SELECT * FROM users WHERE role = 'superadmin' LIMIT 1");
    if (!rows.length) {
        const pw = await bcrypt.hash('samadhan', 10);
        await pool.query("INSERT INTO users(login_id, name, email, password_hash, role, is_active, must_change_pwd) VALUES($1,$2,$3,$4,$5,$6,$7)", ['superadmin', 'Super Admin', 'superadmin@local', pw, 'superadmin', true, true]);
        console.log('Default superadmin created (email: superadmin@local, password: samadhan)');
    }
}

async function start() {
    try {
        try {
            const { rows } = await pool.query('SELECT NOW()');
            console.log('Postgres connected:', rows[0].now);
        } catch (dbErr) {
            console.error('Postgres connection test failed:', dbErr.message || dbErr);
            throw dbErr;
        }

        await runMigrations();
        await ensureSuperadmin();

        // Initialize auto-absent cron job
        scheduleAutoAbsentCron(pool, redisClient);

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Startup failed', err);
        process.exit(1);
    }
}

start();
