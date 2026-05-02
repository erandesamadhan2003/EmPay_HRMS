const PROFILE_COLUMNS = [
	"designation",
	"department_id",
	"location",
	"date_of_birth",
	"date_of_joining",
	"gender",
	"nationality",
	"personal_email",
	"marital_status",
	"manager_id",
	"bank_account_number",
	"bank_name",
	"ifsc_code",
	"pan_number",
	"uan_number",
	"esic_number",
	"about",
	"skills",
	"certifications",
];

export async function createEmployeeProfile(db, payload) {
	const {
		userId,
		companyId,
		dateOfJoining,
		designation,
		departmentId,
		location,
		managerId,
	} = payload;

	const fields = ["user_id", "company_id", "date_of_joining"];
	const values = [userId, companyId, dateOfJoining];
	let i = fields.length;

	if (designation !== undefined) {
		i++;
		fields.push("designation");
		values.push(designation);
	}
	if (departmentId !== undefined) {
		i++;
		fields.push("department_id");
		values.push(departmentId);
	}
	if (location !== undefined) {
		i++;
		fields.push("location");
		values.push(location);
	}
	if (managerId !== undefined) {
		i++;
		fields.push("manager_id");
		values.push(managerId);
	}

	const placeholders = fields.map((_, idx) => `$${idx + 1}`).join(", ");
	const { rows } = await db.query(
		`INSERT INTO employee_profiles (${fields.join(", ")}) VALUES (${placeholders}) RETURNING *`,
		values,
	);
	return rows[0];
}

export async function findEmployeeProfileByUserId(db, userId) {
	const { rows } = await db.query(
		`SELECT * FROM employee_profiles WHERE user_id = $1`,
		[userId],
	);
	return rows[0] || null;
}

export async function updateEmployeeProfilePartial(db, userId, patch) {
	const cols = PROFILE_COLUMNS.filter((c) => patch[c] !== undefined);
	if (!cols.length) return findEmployeeProfileByUserId(db, userId);

	const fragments = cols.map((c, idx) => `${c} = $${idx + 1}`);
	const params = cols.map((c) => patch[c]);
	params.push(userId);

	const { rows } = await db.query(
		`UPDATE employee_profiles SET ${fragments.join(", ")}, updated_at = NOW()
		 WHERE user_id = $${params.length} RETURNING *`,
		params,
	);
	return rows[0] || null;
}

export async function countEmployeesInDepartment(db, departmentId) {
	const { rows } = await db.query(
		`SELECT COUNT(*)::int AS c FROM employee_profiles WHERE department_id = $1`,
		[departmentId],
	);
	return rows[0]?.c ?? 0;
}
