/** Attendance table aligned with `backend/temp/schema.sql`. */

export async function up(pool) {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS attendance (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			company_id UUID NOT NULL REFERENCES companies(id),
			date DATE NOT NULL,
			check_in TIMESTAMPTZ,
			check_out TIMESTAMPTZ,
			work_hours NUMERIC(5,2) GENERATED ALWAYS AS (
				CASE WHEN check_out IS NOT NULL AND check_in IS NOT NULL
				THEN EXTRACT(EPOCH FROM (check_out - check_in)) / 3600
				ELSE NULL END
			) STORED,
			extra_hours NUMERIC(5,2),
			status attendance_status NOT NULL DEFAULT 'present',
			notes TEXT,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE (user_id, date)
		);
	`);
	await pool.query(
		`CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);`,
	);
	await pool.query(
		`CREATE INDEX IF NOT EXISTS idx_attendance_company_date ON attendance(company_id, date);`,
	);
}
