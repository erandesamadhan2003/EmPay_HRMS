export async function up(pool) {
    const sql = `
-- Company Requests
CREATE TABLE IF NOT EXISTS company_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID UNIQUE NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  admin_user_id   UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          request_status NOT NULL DEFAULT 'pending',
  reviewed_by     UUID REFERENCES users(id),
  reviewed_at     TIMESTAMPTZ,
  reviewer_notes  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes related to company requests
CREATE INDEX IF NOT EXISTS idx_company_requests_status ON company_requests(status);
`;
    await pool.query(sql);
}
