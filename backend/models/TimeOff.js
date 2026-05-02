export async function countAllocations(db, companyId, filters = {}) {
	const params = [companyId];
	let where = `WHERE a.company_id = $1`;
	if (filters.user_id) {
		params.push(filters.user_id);
		where += ` AND a.user_id = $${params.length}`;
	}
	if (filters.leave_type) {
		params.push(filters.leave_type);
		where += ` AND a.leave_type::text = $${params.length}`;
	}
	const { rows } = await db.query(
		`SELECT COUNT(*)::int AS c FROM time_off_allocations a ${where}`,
		params,
	);
	return rows[0]?.c ?? 0;
}

export async function listAllocations(db, companyId, page, limit, filters = {}) {
	const params = [companyId];
	let where = `WHERE a.company_id = $1`;
	if (filters.user_id) {
		params.push(filters.user_id);
		where += ` AND a.user_id = $${params.length}`;
	}
	if (filters.leave_type) {
		params.push(filters.leave_type);
		where += ` AND a.leave_type::text = $${params.length}`;
	}
	const offset = (page - 1) * limit;
	params.push(limit, offset);
	const iLim = params.length - 1;
	const iOff = params.length;
	const q = `
		SELECT a.*, u.name AS employee_name, u.login_id AS employee_login_id,
		       c.name AS creator_name
		FROM time_off_allocations a
		JOIN users u ON u.id = a.user_id
		LEFT JOIN users c ON c.id = a.created_by
		${where}
		ORDER BY a.created_at DESC
		LIMIT $${iLim} OFFSET $${iOff}
	`;
	const { rows } = await db.query(q, params);
	return rows;
}

export async function listMyAllocations(db, userId, companyId) {
	const { rows } = await db.query(
		`SELECT * FROM time_off_allocations WHERE user_id = $1 AND company_id = $2 ORDER BY validity_end DESC`,
		[userId, companyId],
	);
	return rows;
}

export async function createAllocation(db, payload) {
	const {
		userId,
		companyId,
		leaveType,
		validityStart,
		validityEnd,
		allocatedDays,
		notes,
		createdBy,
	} = payload;
	const { rows } = await db.query(
		`INSERT INTO time_off_allocations
		 (user_id, company_id, leave_type, validity_start, validity_end, allocated_days, notes, created_by)
		 VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
		[userId, companyId, leaveType, validityStart, validityEnd, allocatedDays, notes || null, createdBy],
	);
	return rows[0] || null;
}

export async function findAllocationById(db, id, companyId) {
	const { rows } = await db.query(
		`SELECT * FROM time_off_allocations WHERE id = $1 AND company_id = $2`,
		[id, companyId],
	);
	return rows[0] || null;
}

export async function updateAllocation(db, id, companyId, patch) {
	const { allocatedDays, notes } = patch;
	const { rows } = await db.query(
		`UPDATE time_off_allocations
		 SET allocated_days = COALESCE($1, allocated_days),
		     notes = COALESCE($2, notes),
		     updated_at = NOW()
		 WHERE id = $3 AND company_id = $4 RETURNING *`,
		[allocatedDays ?? null, notes ?? null, id, companyId],
	);
	return rows[0] || null;
}

export async function deleteAllocation(db, id, companyId) {
	const { rows } = await db.query(
		`DELETE FROM time_off_allocations WHERE id = $1 AND company_id = $2 RETURNING id`,
		[id, companyId],
	);
	return rows[0] || null;
}

export async function countApprovedRequestsForAllocation(db, allocationId) {
	const { rows } = await db.query(
		`SELECT COUNT(*)::int AS c FROM time_off_requests WHERE allocation_id = $1 AND status = 'approved'`,
		[allocationId],
	);
	return rows[0]?.c ?? 0;
}

export async function createLeaveRequest(db, payload) {
	const {
		userId,
		allocationId,
		companyId,
		leaveType,
		startDate,
		endDate,
		daysRequested,
		reason,
	} = payload;
	const { rows } = await db.query(
		`INSERT INTO time_off_requests
		 (user_id, allocation_id, company_id, leave_type, start_date, end_date, days_requested, reason)
		 VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
		[userId, allocationId, companyId, leaveType, startDate, endDate, daysRequested, reason || null],
	);
	return rows[0] || null;
}

export async function countRequests(db, companyId, filters = {}, mineUserId = null) {
	const params = [companyId];
	let where = `WHERE r.company_id = $1`;
	if (mineUserId) {
		params.push(mineUserId);
		where += ` AND r.user_id = $${params.length}`;
	}
	for (const [k, v] of Object.entries(filters)) {
		if (v === undefined || v === null || v === "") continue;
		if (k === "status") {
			params.push(v);
			where += ` AND r.status::text = $${params.length}`;
		} else if (k === "leave_type") {
			params.push(v);
			where += ` AND r.leave_type::text = $${params.length}`;
		} else if (k === "user_id") {
			params.push(v);
			where += ` AND r.user_id = $${params.length}`;
		} else if (k === "from_date") {
			params.push(v);
			where += ` AND r.start_date >= $${params.length}::date`;
		} else if (k === "to_date") {
			params.push(v);
			where += ` AND r.end_date <= $${params.length}::date`;
		}
	}
	const { rows } = await db.query(
		`SELECT COUNT(*)::int AS c FROM time_off_requests r ${where}`,
		params,
	);
	return rows[0]?.c ?? 0;
}

export async function listRequests(db, companyId, page, limit, filters = {}, mineUserId = null) {
	const params = [companyId];
	let where = `WHERE r.company_id = $1`;
	if (mineUserId) {
		params.push(mineUserId);
		where += ` AND r.user_id = $${params.length}`;
	}
	for (const [k, v] of Object.entries(filters)) {
		if (v === undefined || v === null || v === "") continue;
		if (k === "status") {
			params.push(v);
			where += ` AND r.status::text = $${params.length}`;
		} else if (k === "leave_type") {
			params.push(v);
			where += ` AND r.leave_type::text = $${params.length}`;
		} else if (k === "user_id") {
			params.push(v);
			where += ` AND r.user_id = $${params.length}`;
		} else if (k === "from_date") {
			params.push(v);
			where += ` AND r.start_date >= $${params.length}::date`;
		} else if (k === "to_date") {
			params.push(v);
			where += ` AND r.end_date <= $${params.length}::date`;
		}
	}
	const offset = (page - 1) * limit;
	params.push(limit, offset);
	const iLim = params.length - 1;
	const iOff = params.length;

	const q = `
		SELECT r.*, u.name AS employee_name, u.login_id AS employee_login_id,
		       ep.designation,
		       rv.name AS reviewer_name
		FROM time_off_requests r
		JOIN users u ON u.id = r.user_id
		LEFT JOIN employee_profiles ep ON ep.user_id = u.id
		LEFT JOIN users rv ON rv.id = r.reviewed_by
		${where}
		ORDER BY r.created_at DESC
		LIMIT $${iLim} OFFSET $${iOff}
	`;
	const { rows } = await db.query(q, params);
	return rows;
}

export async function findRequestById(db, id, companyId) {
	const { rows } = await db.query(
		`SELECT r.*, u.name AS employee_name, u.login_id AS employee_login_id,
		        ep.designation, rv.name AS reviewer_name
		 FROM time_off_requests r
		 JOIN users u ON u.id = r.user_id
		 LEFT JOIN employee_profiles ep ON ep.user_id = u.id
		 LEFT JOIN users rv ON rv.id = r.reviewed_by
		 WHERE r.id = $1 AND r.company_id = $2`,
		[id, companyId],
	);
	return rows[0] || null;
}

export async function updateRequestStatus(db, id, companyId, status, reviewerId, reviewerNote) {
	const { rows } = await db.query(
		`UPDATE time_off_requests
		 SET status = $1::leave_status,
		     reviewed_by = COALESCE($2, reviewed_by),
		     reviewed_at = NOW(),
		     reviewer_note = COALESCE($3, reviewer_note),
		     updated_at = NOW()
		 WHERE id = $4 AND company_id = $5
		 RETURNING *`,
		[status, reviewerId, reviewerNote || null, id, companyId],
	);
	return rows[0] || null;
}

export async function incrementAllocationUsage(db, allocationId, days) {
	await db.query(
		`UPDATE time_off_allocations
		 SET used_days = used_days + $1, updated_at = NOW()
		 WHERE id = $2`,
		[days, allocationId],
	);
}

export async function decrementAllocationUsage(db, allocationId, days) {
	await db.query(
		`UPDATE time_off_allocations
		 SET used_days = GREATEST(0, used_days - $1), updated_at = NOW()
		 WHERE id = $2`,
		[days, allocationId],
	);
}

export async function markLeaveAttendanceDays(db, companyId, userId, startDate, endDate) {
	const q = `
		WITH days AS (
			SELECT generate_series($1::date, $2::date, interval '1 day')::date AS d
		)
		INSERT INTO attendance(user_id, company_id, date, status)
		SELECT $3, $4, d, 'on_leave'::attendance_status
		FROM days
		ON CONFLICT (user_id, date)
		DO UPDATE SET status = 'on_leave'::attendance_status, updated_at = NOW()
	`;
	await db.query(q, [startDate, endDate, userId, companyId]);
}
