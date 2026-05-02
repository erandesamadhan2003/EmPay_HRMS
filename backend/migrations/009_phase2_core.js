export async function up(pool) {
	const sql = `
DO $$ BEGIN
	CREATE TYPE leave_type AS ENUM ('paid_time_off', 'sick_leave', 'unpaid_leave');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
	CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
	CREATE TYPE payrun_status AS ENUM ('draft', 'validated', 'paid', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
	CREATE TYPE wage_type AS ENUM ('fixed_wage', 'hourly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS salary_structures (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	company_id UUID NOT NULL REFERENCES companies(id),
	name VARCHAR(100) NOT NULL,
	wage_type wage_type NOT NULL DEFAULT 'fixed_wage',
	pf_rate NUMERIC(5,2) NOT NULL DEFAULT 12.00,
	professional_tax NUMERIC(10,2) NOT NULL DEFAULT 200.00,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salary_components (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	salary_structure_id UUID NOT NULL REFERENCES salary_structures(id) ON DELETE CASCADE,
	name VARCHAR(100) NOT NULL,
	component_type VARCHAR(50) NOT NULL,
	computation_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
	value NUMERIC(10,2) NOT NULL,
	sort_order INT NOT NULL DEFAULT 0,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_salary_info (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	salary_structure_id UUID NOT NULL REFERENCES salary_structures(id),
	monthly_wage NUMERIC(12,2) NOT NULL,
	yearly_wage NUMERIC(14,2) GENERATED ALWAYS AS (monthly_wage * 12) STORED,
	working_hours_per_day NUMERIC(4,2) NOT NULL DEFAULT 8.00,
	working_days_per_week INT NOT NULL DEFAULT 5,
	effective_from DATE NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS time_off_allocations (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	company_id UUID NOT NULL REFERENCES companies(id),
	leave_type leave_type NOT NULL,
	validity_start DATE NOT NULL,
	validity_end DATE NOT NULL,
	allocated_days NUMERIC(5,2) NOT NULL,
	used_days NUMERIC(5,2) NOT NULL DEFAULT 0,
	notes TEXT,
	created_by UUID NOT NULL REFERENCES users(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS time_off_requests (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	allocation_id UUID NOT NULL REFERENCES time_off_allocations(id),
	company_id UUID NOT NULL REFERENCES companies(id),
	leave_type leave_type NOT NULL,
	start_date DATE NOT NULL,
	end_date DATE NOT NULL,
	days_requested NUMERIC(5,2) NOT NULL,
	reason TEXT,
	status leave_status NOT NULL DEFAULT 'pending',
	reviewed_by UUID REFERENCES users(id),
	reviewed_at TIMESTAMPTZ,
	reviewer_note TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payruns (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	company_id UUID NOT NULL REFERENCES companies(id),
	period_start DATE NOT NULL,
	period_end DATE NOT NULL,
	status payrun_status NOT NULL DEFAULT 'draft',
	generated_by UUID NOT NULL REFERENCES users(id),
	validated_by UUID REFERENCES users(id),
	validated_at TIMESTAMPTZ,
	paid_at TIMESTAMPTZ,
	total_cost NUMERIC(14,2),
	employee_count INT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (company_id, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS payslips (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	payrun_id UUID NOT NULL REFERENCES payruns(id) ON DELETE CASCADE,
	user_id UUID NOT NULL REFERENCES users(id),
	company_id UUID NOT NULL REFERENCES companies(id),
	salary_structure_id UUID NOT NULL REFERENCES salary_structures(id),
	period_start DATE NOT NULL,
	period_end DATE NOT NULL,
	pay_date DATE,
	total_working_days INT NOT NULL,
	attendance_days NUMERIC(5,2) NOT NULL,
	paid_leave_days NUMERIC(5,2) NOT NULL DEFAULT 0,
	unpaid_leave_days NUMERIC(5,2) NOT NULL DEFAULT 0,
	payable_days NUMERIC(5,2) NOT NULL,
	basic_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
	hra NUMERIC(12,2) NOT NULL DEFAULT 0,
	standard_allowance NUMERIC(12,2) NOT NULL DEFAULT 0,
	performance_bonus NUMERIC(12,2) NOT NULL DEFAULT 0,
	leave_travel_allowance NUMERIC(12,2) NOT NULL DEFAULT 0,
	fixed_allowance NUMERIC(12,2) NOT NULL DEFAULT 0,
	gross_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
	pf_employee NUMERIC(12,2) NOT NULL DEFAULT 0,
	pf_employer NUMERIC(12,2) NOT NULL DEFAULT 0,
	professional_tax NUMERIC(12,2) NOT NULL DEFAULT 0,
	tds_deduction NUMERIC(12,2) NOT NULL DEFAULT 0,
	total_deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
	net_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
	employer_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
	employee_name VARCHAR(255) NOT NULL,
	employee_code VARCHAR(30) NOT NULL,
	department VARCHAR(100),
	designation VARCHAR(100),
	location VARCHAR(100),
	date_of_joining DATE,
	pan_number VARCHAR(20),
	uan_number VARCHAR(20),
	bank_account VARCHAR(30),
	status VARCHAR(20) NOT NULL DEFAULT 'draft',
	pdf_url TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (payrun_id, user_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	company_id UUID REFERENCES companies(id),
	actor_id UUID REFERENCES users(id),
	action VARCHAR(100) NOT NULL,
	entity_type VARCHAR(50),
	entity_id UUID,
	payload JSONB,
	ip_address INET,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salary_structures_company ON salary_structures(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_salary_user ON employee_salary_info(user_id);
CREATE INDEX IF NOT EXISTS idx_tor_user ON time_off_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_tor_company_status ON time_off_requests(company_id, status);
CREATE INDEX IF NOT EXISTS idx_payruns_company_period ON payruns(company_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payslips_payrun ON payslips(payrun_id);
CREATE INDEX IF NOT EXISTS idx_payslips_user ON payslips(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_company ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
`;
	await pool.query(sql);
}
