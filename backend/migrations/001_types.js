export async function up(pool) {
    const sql = `
-- Extensions and types
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('superadmin','admin','employee','payroll_officer');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('pending','approved','rejected');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE gender_type AS ENUM ('male','female','other');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
`;
    await pool.query(sql);
}
