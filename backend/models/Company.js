export async function createCompany(db, { name, logoUrl }) {
    const { rows } = await db.query('INSERT INTO companies(name, logo_url) VALUES($1,$2) RETURNING *', [name, logoUrl || null]);
    return rows[0];
}

export async function findCompanyById(db, companyId) {
    const { rows } = await db.query('SELECT id, name, logo_url FROM companies WHERE id = $1', [companyId]);
    return rows[0] || null;
}
