/**
 * Align Postgres ENUMs with `schema.sql`.
 */

export async function up(pool) {
	await pool.query(`
		DO $$ BEGIN
			CREATE TYPE attendance_status AS ENUM ('present','absent','on_leave','half_day');
		EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	`);

	try {
		await pool.query(
			`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'hr_officer'`,
		);
	} catch (e) {
		console.warn("[007_types_compat] user_role hr_officer:", e.message);
	}

	try {
		await pool.query(
			`ALTER TYPE gender_type ADD VALUE IF NOT EXISTS 'prefer_not_to_say'`,
		);
	} catch {
		/* optional type */
	}
}
