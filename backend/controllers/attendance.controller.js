import { successResponse, errorResponse } from "../utils/constant.js";
import { findUserById } from "../models/User.js";
import {
	findAttendanceByUserAndDate,
	insertAttendance,
	updateCheckOut,
	findAttendanceById,
	updateAttendanceManual,
	listUserAttendanceMonth,
	countUserAttendanceEntriesMonth,
	aggregateUserAttendanceMonth,
	countOrgAttendanceDay,
	listOrgAttendanceDay,
	weekdaysInMonthRange,
} from "../models/Attendance.js";
import { paginationMeta, parseListQuery } from "../utils/pagination.js";

async function pgToday(req) {
	const { rows } = await req.db.query(`SELECT CURRENT_DATE::text AS d`);
	return rows[0].d;
}

function serializeAttendance(row) {
	if (!row) return null;
	return {
		id: row.id,
		date: row.date,
		checkIn: row.check_in,
		checkOut: row.check_out,
		workHours: row.work_hours != null ? Number(row.work_hours) : null,
		extraHours: row.extra_hours != null ? Number(row.extra_hours) : null,
		status: row.status,
		notes: row.notes,
	};
}

function rosterRoles(role) {
	return ["admin", "hr_officer", "payroll_officer"].includes(role);
}

function resolveMonth(monthQuery) {
	if (monthQuery && /^\d{4}-\d{2}$/.test(monthQuery)) return monthQuery;
	const d = new Date();
	const y = d.getUTCFullYear();
	const m = String(d.getUTCMonth() + 1).padStart(2, "0");
	return `${y}-${m}`;
}

function monthUtcLabel(y, mNum) {
	return new Date(Date.UTC(Number(y), Number(mNum) - 1, 1)).toLocaleString(
		"en-US",
		{ month: "long", year: "numeric", timeZone: "UTC" },
	);
}

async function monthlyAttendanceEnvelope(db, userId, reqQuery) {
	const rawMonth = resolveMonth(reqQuery.month);
	const { page, limit } = parseListQuery(reqQuery);
	const total = await countUserAttendanceEntriesMonth(db, userId, rawMonth);
	const rows = await listUserAttendanceMonth(db, userId, rawMonth, page, limit);
	const agg = await aggregateUserAttendanceMonth(db, userId, rawMonth);

	const [sy, sm] = rawMonth.split("-");
	const lastDay = new Date(Date.UTC(Number(sy), Number(sm), 0)).getUTCDate();
	const startStr = `${sy}-${sm}-01`;
	const endStr = `${sy}-${sm}-${String(lastDay).padStart(2, "0")}`;
	const totalWorkingDays = weekdaysInMonthRange(startStr, endStr);

	return {
		items: rows.map(serializeAttendance),
		summary: {
			month: monthUtcLabel(sy, sm),
			daysPresent: Number(agg.days_present || 0),
			leavesTaken: Number(agg.leaves_taken || 0),
			totalWorkingDays,
			extraHoursTotal: Number(agg.extra_hours_total || 0),
		},
		pagination: paginationMeta({ page, limit, total }),
	};
}

export async function checkIn(req, res) {
	try {
		const userId = req.user.id;
		const user = await findUserById(req.db, userId);
		if (!user?.company_id) {
			return res.status(400).json(errorResponse("Company context required"));
		}
		if (!user.is_active) {
			return res.status(403).json(errorResponse("Account inactive"));
		}

		const today = await pgToday(req);
		const existing = await findAttendanceByUserAndDate(req.db, userId, today);
		if (existing?.check_in) {
			return res.status(409).json(errorResponse("You have already checked in today"));
		}

		let resultRow;
		if (existing && !existing.check_in) {
			const { rows } = await req.db.query(
				`UPDATE attendance SET check_in = NOW(), status = 'present'::attendance_status, updated_at = NOW()
				 WHERE id = $1 RETURNING *`,
				[existing.id],
			);
			resultRow = rows[0];
		} else if (!existing) {
			resultRow = await insertAttendance(req.db, {
				userId,
				companyId: user.company_id,
				date: today,
				checkIn: new Date(),
				status: "present",
			});
		} else {
			resultRow = existing;
		}

		return res.status(201).json(
			successResponse(serializeAttendance(resultRow), "Check-in marked"),
		);
	} catch (err) {
		if (err.code === "23505") {
			return res.status(409).json(errorResponse("You have already checked in today"));
		}
		console.error(err);
		return res.status(500).json(errorResponse("Check-in failed"));
	}
}

export async function checkOut(req, res) {
	try {
		const userId = req.user.id;
		const user = await findUserById(req.db, userId);
		if (!user?.company_id) {
			return res.status(400).json(errorResponse("Company context required"));
		}

		const today = await pgToday(req);
		const exists = await findAttendanceByUserAndDate(req.db, userId, today);
		if (!exists || !exists.check_in) {
			return res.status(422).json(errorResponse("No check-in found for today"));
		}
		if (exists.check_out) {
			return res.json(successResponse(serializeAttendance(exists), "Check-out marked"));
		}

		const updated = await updateCheckOut(req.db, exists.id, new Date(), null);
		return res.json(successResponse(serializeAttendance(updated), "Check-out marked"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Check-out failed"));
	}
}

export async function getMyAttendance(req, res) {
	try {
		const data = await monthlyAttendanceEnvelope(req.db, req.user.id, req.query);
		return res.json(successResponse(data, "Attendance fetched"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch attendance"));
	}
}

export async function listOrgAttendance(req, res) {
	try {
		const companyId = req.user?.company_id;
		if (!companyId) {
			return res.status(400).json(errorResponse("Company context required"));
		}

		const dateStr = req.query.date || (await pgToday(req));
		const { page, limit } = parseListQuery(req.query);
		const { search, status } = req.query;

		const total = await countOrgAttendanceDay(req.db, companyId, dateStr, search, status);
		const rows = await listOrgAttendanceDay(
			req.db,
			companyId,
			dateStr,
			page,
			limit,
			search,
			status,
		);

		const items = rows.map((r) => {
			const aj = r.attendance_row || {};
			return {
				userId: r.user_id,
				name: r.name,
				loginId: r.login_id,
				designation: r.designation,
				department: r.department_name,
				avatarUrl: r.avatar_url,
				attendance:
					aj?.id ?
						{
							id: aj.id,
							checkIn: aj.check_in,
							checkOut: aj.check_out,
							workHours: aj.work_hours != null ? Number(aj.work_hours) : null,
							extraHours: aj.extra_hours != null ? Number(aj.extra_hours) : null,
							status: aj.status,
						}
					:	null,
			};
		});

		return res.json(
			successResponse(
				{
					date: dateStr,
					items,
					pagination: paginationMeta({ page, limit, total }),
				},
				"Attendance fetched",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch attendance"));
	}
}

export async function getUserAttendance(req, res) {
	try {
		const { userId } = req.params;

		const self = req.user.id === userId;
		if (
			!self &&
			!rosterRoles(req.user.role) &&
			req.user.role !== "superadmin"
		) {
			return res.status(403).json(errorResponse("Forbidden"));
		}

		const target = await findUserById(req.db, userId);
		if (!target) return res.status(404).json(errorResponse("Employee not found"));

		if (
			req.user.role !== "superadmin" &&
			String(target.company_id) !== String(req.user.company_id)
		) {
			return res.status(403).json(errorResponse("Forbidden"));
		}

		const data = await monthlyAttendanceEnvelope(req.db, userId, req.query);
		return res.json(successResponse(data, "Attendance fetched"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch attendance"));
	}
}

export async function attendanceSummary(req, res) {
	try {
		const { userId } = req.params;
		const target = await findUserById(req.db, userId);
		if (!target) return res.status(404).json(errorResponse("Employee not found"));

		if (
			req.user.role !== "superadmin" &&
			String(target.company_id) !== String(req.user.company_id)
		) {
			return res.status(403).json(errorResponse("Forbidden"));
		}

		const self = req.user.id === userId;
		if (
			!self &&
			!rosterRoles(req.user.role) &&
			req.user.role !== "superadmin"
		) {
			return res.status(403).json(errorResponse("Forbidden"));
		}

		const rawMonth = resolveMonth(req.query.month);
		const agg = await aggregateUserAttendanceMonth(req.db, userId, rawMonth);
		const [sy, sm] = rawMonth.split("-");
		const lastDay = new Date(Date.UTC(Number(sy), Number(sm), 0)).getUTCDate();
		const totalWorkingDays = weekdaysInMonthRange(
			`${sy}-${sm}-01`,
			`${sy}-${sm}-${String(lastDay).padStart(2, "0")}`,
		);

		return res.json(
			successResponse(
				{
					month: monthUtcLabel(sy, sm),
					daysPresent: Number(agg.days_present || 0),
					leavesTaken: Number(agg.leaves_taken || 0),
					totalWorkingDays,
					extraHoursTotal: Number(agg.extra_hours_total || 0),
				},
				"Attendance summary fetched",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch summary"));
	}
}

export async function updateAttendanceRecord(req, res) {
	try {
		if (req.user.role !== "admin") {
			return res.status(403).json(errorResponse("Forbidden"));
		}

		const companyId = req.user.company_id;
		if (!companyId) return res.status(400).json(errorResponse("Company context required"));

		const row = await findAttendanceById(req.db, req.params.id);
		if (!row || String(row.company_id) !== String(companyId)) {
			return res.status(404).json(errorResponse("Attendance record not found"));
		}

		const { checkIn, checkOut, status, notes } = req.body;
		const updated = await updateAttendanceManual(req.db, row.id, {
			check_in: checkIn ?? null,
			check_out: checkOut ?? null,
			status: status ?? null,
			notes: notes ?? null,
		});

		return res.json(
			successResponse(serializeAttendance(updated), "Attendance record updated"),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to update attendance"));
	}
}
