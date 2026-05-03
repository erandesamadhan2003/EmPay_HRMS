export async function findAttendanceByUserAndDate(db, userId, date) {
	const { rows } = await db.query(
		`SELECT * FROM attendance WHERE user_id = $1 AND date = $2`,
		[userId, date],
	);
	return rows[0] || null;
}

export async function insertAttendance(db, { userId, companyId, date, checkIn, status = 'present' }) {
	const { rows } = await db.query(
		`INSERT INTO attendance (user_id, company_id, date, check_in, status)
		 VALUES ($1,$2,$3,$4,$5)
		 RETURNING *`,
		[userId, companyId, date, checkIn || new Date(), status],
	);
	return rows[0] || null;
}

export async function updateCheckOut(db, attendanceId, checkOutAt, extraHours = null) {
	const { rows } = await db.query(
		`UPDATE attendance SET check_out = $1, extra_hours = COALESCE($2, extra_hours), updated_at = NOW()
		 WHERE id = $3 RETURNING *`,
		[checkOutAt, extraHours, attendanceId],
	);
	return rows[0] || null;
}

export async function findAttendanceById(db, id) {
	const { rows } = await db.query(`SELECT * FROM attendance WHERE id = $1`, [id]);
	return rows[0] || null;
}

export async function updateAttendanceManual(db, id, { check_in, check_out, status, notes }) {
	const { rows } = await db.query(
		`UPDATE attendance SET
			check_in = COALESCE($1, check_in),
			check_out = COALESCE($2, check_out),
			status = COALESCE($3, status),
			notes = COALESCE($4, notes),
			updated_at = NOW()
		 WHERE id = $5
		 RETURNING *`,
		[check_in, check_out, status, notes, id],
	);
	return rows[0] || null;
}

/** Inclusive `[startStr,endStr]` for calendar month `YYYY-MM` (UTC date math). */
function monthBounds(monthStr) {
	const [sy, sm] = monthStr.split("-");
	const y = parseInt(sy, 10);
	const m = parseInt(sm, 10);
	const startStr = `${sy}-${sm}-01`;
	const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
	const endStr = `${sy}-${sm}-${String(lastDay).padStart(2, "0")}`;
	return { startStr, endStr, daysInMonth: lastDay };
}

/** Count weekdays (Mon–Fri) inclusive between two YYYY-MM-DD strings (simple locale). */
export function weekdaysInMonthRange(startStr, endStr) {
	const s = new Date(`${startStr}T12:00:00Z`);
	const e = new Date(`${endStr}T12:00:00Z`);
	let n = 0;
	const cur = new Date(s);
	while (cur <= e) {
		const d = cur.getUTCDay();
		if (d !== 0 && d !== 6) n++;
		cur.setUTCDate(cur.getUTCDate() + 1);
	}
	return n;
}

export async function countUserAttendanceMonth(db, userId, monthStr) {
	const { startStr, endStr } = monthBounds(monthStr);
	const { rows } = await db.query(
		`SELECT COUNT(*) AS c FROM attendance WHERE user_id = $1 AND date >= $2 AND date <= $3`,
		[userId, startStr, endStr],
	);
	return parseInt(rows[0]?.c ?? "0", 10);
}

export async function listUserAttendanceMonth(db, userId, monthStr, page, limit) {
	const { startStr, endStr } = monthBounds(monthStr);
	const offset = (page - 1) * limit;
	const { rows } = await db.query(
		`SELECT * FROM attendance
		 WHERE user_id = $1 AND date >= $2 AND date <= $3
		 ORDER BY date DESC
		 LIMIT $4 OFFSET $5`,
		[userId, startStr, endStr, limit, offset],
	);
	return rows;
}

export async function aggregateUserAttendanceMonth(db, userId, monthStr) {
	const { startStr, endStr } = monthBounds(monthStr);
	const { rows } = await db.query(
		`SELECT
			COUNT(*) FILTER (WHERE status = 'present') AS days_present,
			COUNT(*) FILTER (WHERE status = 'on_leave') AS leaves_taken,
			COALESCE(SUM(extra_hours), 0)::float AS extra_hours_total
		 FROM attendance WHERE user_id = $1 AND date >= $2 AND date <= $3`,
		[userId, startStr, endStr],
	);
	return rows[0] || { days_present: 0, leaves_taken: 0, extra_hours_total: 0 };
}

export async function countOrgAttendanceDay(db, companyId, dateStr, search, status) {
	const params = [companyId, dateStr];
	let where =
		`WHERE u.company_id = $1 AND u.is_active = TRUE
		 AND u.role::text <> 'superadmin'
		 AND EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = u.id)`;

	if (search) {
		params.push(`%${search}%`);
		where += ` AND (u.name ILIKE $${params.length} OR u.login_id ILIKE $${params.length})`;
	}

	let statusFrag = "";
	if (status === "absent") {
		statusFrag = ` AND (a.id IS NULL OR a.status::text = 'absent')`;
	} else if (status) {
		params.push(status);
		statusFrag = ` AND a.status::text = $${params.length}`;
	}

	const q = `
		SELECT COUNT(*)::int AS c
		FROM users u
		LEFT JOIN attendance a ON a.user_id = u.id AND a.date = $2::date
		${where}
		${statusFrag}
	`;
	const { rows } = await db.query(q, params);
	return rows[0]?.c ?? 0;
}

export async function listOrgAttendanceDay(db, companyId, dateStr, page, limit, search, status) {
	const params = [companyId, dateStr];
	let where =
		`WHERE u.company_id = $1 AND u.is_active = TRUE
		 AND u.role::text <> 'superadmin'
		 AND EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = u.id)`;

	if (search) {
		params.push(`%${search}%`);
		where += ` AND (u.name ILIKE $${params.length} OR u.login_id ILIKE $${params.length})`;
	}

	let statusFrag = "";
	if (status === "absent") {
		statusFrag = ` AND (a.id IS NULL OR a.status::text = 'absent')`;
	} else if (status) {
		params.push(status);
		statusFrag = ` AND a.status::text = $${params.length}`;
	}

	const offset = (page - 1) * limit;
	params.push(limit, offset);
	const iLim = params.length - 1;
	const iOff = params.length;

	const q = `
		SELECT u.id AS user_id, u.name, u.login_id, u.avatar_url,
			e.designation,
			d.name AS department_name,
			row_to_json(a.*) AS attendance_row
		FROM users u
		LEFT JOIN attendance a ON a.user_id = u.id AND a.date = $2::date
		LEFT JOIN employee_profiles e ON e.user_id = u.id
		LEFT JOIN departments d ON d.id = e.department_id
		${where}
		${statusFrag}
		ORDER BY u.name ASC
		LIMIT $${iLim} OFFSET $${iOff}
	`;

	const { rows } = await db.query(q, params);
	return rows;
}

export async function listOrgAttendanceMonth(db, companyId, monthStr) {
	const { startStr, endStr } = monthBounds(monthStr);
	const { rows } = await db.query(
		`SELECT * FROM attendance
		 WHERE company_id = $1 AND date >= $2 AND date <= $3`,
		[companyId, startStr, endStr],
	);
	return rows;
}

export async function countUserAttendanceEntriesMonth(db, userId, monthStr) {
	const { startStr, endStr } = monthBounds(monthStr);
	const { rows } = await db.query(
		`SELECT COUNT(*)::int AS c FROM attendance
		 WHERE user_id = $1 AND date BETWEEN $2 AND $3`,
		[userId, startStr, endStr],
	);
	return rows[0]?.c ?? 0;
}
