export async function createCompanyRequest(db, { companyId, adminUserId }) {
    const { rows } = await db.query(
        'INSERT INTO company_requests(company_id, admin_user_id) VALUES($1,$2) RETURNING *',
        [companyId, adminUserId]
    );
    return rows[0];
}

export async function findCompanyRequestByCompanyId(db, companyId) {
    const { rows } = await db.query('SELECT * FROM company_requests WHERE company_id = $1', [companyId]);
    return rows[0] || null;
}

export async function listCompanyRequests(db, { page = 1, limit = 10, status } = {}) {
    const offset = (page - 1) * limit;
    const params = [];
    let where = '';
    if (status) {
        params.push(status);
        where = `WHERE status = $1`;
    }
    params.push(limit, offset);
    const q = `SELECT * FROM company_requests ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const { rows } = await db.query(q, params);
    return rows;
}

export async function findCompanyRequestById(db, requestId) {
    const { rows } = await db.query('SELECT * FROM company_requests WHERE id = $1', [requestId]);
    return rows[0] || null;
}

export async function reviewCompanyRequest(db, { requestId, reviewerId, status, reviewerNotes }) {
    const { rows } = await db.query(
        'UPDATE company_requests SET status = $1, reviewed_by = $2, reviewed_at = NOW(), reviewer_notes = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
        [status, reviewerId, reviewerNotes || null, requestId]
    );
    return rows[0] || null;
}
