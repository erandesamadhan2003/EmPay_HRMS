export async function up(pool) {
    const sql = `
-- Employee Profiles
CREATE TABLE IF NOT EXISTS employee_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id          UUID NOT NULL REFERENCES companies(id),
  department_id       UUID REFERENCES departments(id),
  manager_id          UUID REFERENCES users(id),
  designation         VARCHAR(100),
  location            VARCHAR(100),
  date_of_birth       DATE,
  date_of_joining     DATE NOT NULL,
  gender              gender_type,
  nationality         VARCHAR(100),
  personal_email      VARCHAR(255),
  marital_status      VARCHAR(50),
  bank_account_number VARCHAR(30),
  bank_name           VARCHAR(100),
  ifsc_code           VARCHAR(20),
  pan_number          VARCHAR(20),
  uan_number          VARCHAR(20),
  esic_number         VARCHAR(20),
  about               TEXT,
  skills              TEXT[],
  certifications      TEXT[],
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes related to employee profiles
CREATE INDEX IF NOT EXISTS idx_employee_profiles_company_id ON employee_profiles(company_id);
`;
    await pool.query(sql);
}
