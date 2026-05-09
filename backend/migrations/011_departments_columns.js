export async function up(pool) {
    // Forward-only patch: older DBs may already have the departments table
    // without the columns used by the application code.
    const sql = `
ALTER TABLE departments
	ADD COLUMN IF NOT EXISTS description TEXT,
	ADD COLUMN IF NOT EXISTS manager_id UUID;
`;
    await pool.query(sql);
}
