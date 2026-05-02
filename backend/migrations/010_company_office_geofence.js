/** Optional office GPS for check-in geofence (nullable = geofence off). */
export async function up(pool) {
	await pool.query(`
		ALTER TABLE companies
		ADD COLUMN IF NOT EXISTS office_latitude NUMERIC(10, 7),
		ADD COLUMN IF NOT EXISTS office_longitude NUMERIC(10, 7);
	`);
}
