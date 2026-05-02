import pool from '../config/db.js';
import { up as typesUp } from './001_types.js';
import { up as companiesUp } from './002_companies.js';
import { up as departmentsUp } from './003_departments.js';
import { up as usersUp } from './004_users.js';
import { up as companyRequestsUp } from './005_company_requests.js';
import { up as employeeProfilesUp } from './006_employee_profiles.js';
import { up as typesCompatUp } from './007_types_compat.js';
import { up as attendanceUp } from './008_attendance.js';
import { up as phase2CoreUp } from './009_phase2_core.js';

const migrations = [
    typesUp,
    companiesUp,
    departmentsUp,
    usersUp,
    companyRequestsUp,
    employeeProfilesUp,
    typesCompatUp,
    attendanceUp,
    phase2CoreUp,
];

export async function run() {
    try {
        console.log('Running migrations (multi-file)...');
        for (const m of migrations) {
            await m(pool);
        }
        console.log('All migrations applied');
    } catch (err) {
        console.error('Migration runner error', err);
        throw err;
    }
}

if (process.argv[1] && process.argv[1].endsWith('/migrations/index.js')) {
    run().then(() => process.exit(0)).catch(() => process.exit(1));
}
