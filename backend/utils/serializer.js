export function serializePagination(items, meta) {
	return { items, pagination: meta };
}

export function serializeDepartment(row) {
	if (!row) return null;
	return {
		id: row.id,
		companyId: row.company_id,
		name: row.name,
		createdAt: row.created_at,
	};
}

export function serializeEmployeeDirectoryItem(row) {
	const dept =
		row.department_id ?
			{ id: row.department_id, name: row.department_name ?? null }
		:	null;
	const mgr =
		row.manager_id ? { id: row.manager_id, name: row.manager_name ?? null } : null;

	const attendanceStatus = row.today_attendance_status || "absent";

	return {
		id: row.id,
		loginId: row.login_id,
		name: row.name,
		email: row.email,
		role: row.role,
		isActive: row.is_active,
		avatarUrl: row.avatar_url,
		profile: {
			designation: row.designation,
			department: dept,
			location: row.location,
			dateOfJoining: row.date_of_joining,
			manager: mgr,
		},
		attendanceStatus,
	};
}

export function serializeUserProfile(row) {
	if (!row) return null;

	const dept =
		row.department_id ?
			{ id: row.department_id, name: row.department_name ?? null }
		:	null;

	const mgr =
		row.manager_id ? { id: row.manager_id, name: row.manager_name ?? null } : null;

	return {
		id: row.id,
		loginId: row.login_id,
		name: row.name,
		email: row.email,
		phone: row.phone,
		role: row.role,
		isActive: row.is_active,
		avatarUrl: row.avatar_url,
		mustChangePwd: row.must_change_pwd,
		profile: {
			designation: row.designation,
			department: dept,
			location: row.location,
			dateOfBirth: row.date_of_birth,
			dateOfJoining: row.date_of_joining,
			gender: row.gender,
			nationality: row.nationality,
			personalEmail: row.personal_email,
			maritalStatus: row.marital_status,
			manager: mgr,
			bankAccountNumber: row.bank_account_number,
			bankName: row.bank_name,
			ifscCode: row.ifsc_code,
			panNumber: row.pan_number,
			uanNumber: row.uan_number,
			esicNumber: row.esic_number,
			about: row.about,
			skills: row.skills,
			certifications: row.certifications,
		},
	};
}

const SELF_PROFILE_KEYS = new Set([
	"personal_email",
	"about",
	"skills",
	"certifications",
	"nationality",
	"marital_status",
]);

/** Fields an employee may edit on their own profile (see routes reference). */

export function normalizeSelfProfilePATCH(bodyProfile) {
	const full = normalizeProfilePATCH(bodyProfile);
	const filtered = {};
	for (const [k, v] of Object.entries(full)) {
		if (SELF_PROFILE_KEYS.has(k)) filtered[k] = v;
	}
	return filtered;
}

export function normalizeProfilePATCH(bodyProfile) {
	if (!bodyProfile || typeof bodyProfile !== "object") return {};
	const snake = {};

	const map = {
		designation: "designation",
		departmentId: "department_id",
		location: "location",
		dateOfBirth: "date_of_birth",
		dateOfJoining: "date_of_joining",
		gender: "gender",
		nationality: "nationality",
		personalEmail: "personal_email",
		maritalStatus: "marital_status",
		managerId: "manager_id",
		bankAccountNumber: "bank_account_number",
		bankName: "bank_name",
		ifscCode: "ifsc_code",
		panNumber: "pan_number",
		uanNumber: "uan_number",
		esicNumber: "esic_number",
		about: "about",
		skills: "skills",
		certifications: "certifications",
	};
	for (const [camel, col] of Object.entries(map)) {
		if (bodyProfile[camel] !== undefined) snake[col] = bodyProfile[camel];
	}

	return snake;
}
