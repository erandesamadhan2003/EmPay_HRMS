export async function up(pool) {
    const sql = `
-- Users
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID REFERENCES companies(id) ON DELETE CASCADE,
  login_id          VARCHAR(60) UNIQUE NOT NULL,
  name              VARCHAR(255) NOT NULL,
  email             VARCHAR(255) UNIQUE NOT NULL,
  phone             VARCHAR(20),
  password_hash     TEXT NOT NULL,
  role              user_role NOT NULL DEFAULT 'employee',
  is_active         BOOLEAN NOT NULL DEFAULT FALSE,
  must_change_pwd   BOOLEAN NOT NULL DEFAULT TRUE,
  avatar_url        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes related to users
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`;
    await pool.query(sql);
}
