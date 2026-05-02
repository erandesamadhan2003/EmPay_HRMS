import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import superAdminRoutes from './routes/superAdmin.routes.js';
import departmentsRoutes from './routes/departments.routes.js';
import employeesRoutes from './routes/employees.routes.js';
import { run as runMigrations } from './migrations/index.js';
import pool from './config/db.js';
import bcrypt from 'bcrypt';
import cors from 'cors';
dotenv.config();

const app = express();
app.use(express.json());
app.use((req, res, next) => {
    req.db = pool;
    next();
});

app.use(cors());

app.use('/api', authRoutes);
app.use('/api', superAdminRoutes);
app.use('/api', departmentsRoutes);
app.use('/api', employeesRoutes);

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
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (err) {
        console.error('Startup failed', err);
        process.exit(1);
    }
}

start();