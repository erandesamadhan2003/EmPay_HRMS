import { successResponse, errorResponse } from "../utils/constant.js";
import { paginationMeta, parseListQuery } from "../utils/pagination.js";
import { findUserById } from "../models/User.js";
import {
	countAllocations,
	listAllocations,
	listMyAllocations,
	createAllocation,
	findAllocationById,
	updateAllocation,
	deleteAllocation,
	countApprovedRequestsForAllocation,
	createLeaveRequest,
	countRequests,
	listRequests,
	findRequestById,
	updateRequestStatus,
	incrementAllocationUsage,
	decrementAllocationUsage,
	markLeaveAttendanceDays,
} from "../models/TimeOff.js";

function allocationDTO(row) {
	return {
		id: row.id,
		employee: row.user_id ? { id: row.user_id, name: row.employee_name, loginId: row.employee_login_id } : undefined,
		userId: row.user_id,
		leaveType: row.leave_type,
		validityStart: row.validity_start,
		validityEnd: row.validity_end,
		allocatedDays: Number(row.allocated_days),
		usedDays: Number(row.used_days),
		availableDays: Number(row.allocated_days) - Number(row.used_days),
		notes: row.notes,
		createdBy: row.created_by ? { id: row.created_by, name: row.creator_name } : undefined,
	};
}

function requestDTO(r) {
	return {
		id: r.id,
		employee: {
			id: r.user_id,
			name: r.employee_name,
			loginId: r.employee_login_id,
			designation: r.designation || null,
		},
		leaveType: r.leave_type,
		startDate: r.start_date,
		endDate: r.end_date,
		daysRequested: Number(r.days_requested),
		reason: r.reason,
		status: r.status,
		reviewedBy: r.reviewed_by ? { id: r.reviewed_by, name: r.reviewer_name } : null,
		reviewedAt: r.reviewed_at,
		reviewerNote: r.reviewer_note,
		createdAt: r.created_at,
	};
}

export async function getAllocations(req, res) {
	try {
		const companyId = req.user.company_id;
		const { page, limit } = parseListQuery(req.query);
		const filters = { user_id: req.query.user_id, leave_type: req.query.leave_type };
		const total = await countAllocations(req.db, companyId, filters);
		const rows = await listAllocations(req.db, companyId, page, limit, filters);
		return res.json(
			successResponse(
				{ items: rows.map(allocationDTO), pagination: paginationMeta({ page, limit, total }) },
				"Allocations fetched",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch allocations"));
	}
}

export async function createAllocationController(req, res) {
	try {
		const companyId = req.user.company_id;
		const { userId, leaveType, validityStart, validityEnd, allocatedDays, notes } = req.body;
		if (!userId || !leaveType || !validityStart || !validityEnd || allocatedDays === undefined) {
			return res.status(400).json(errorResponse("Missing required fields"));
		}
		const user = await findUserById(req.db, userId);
		if (!user || String(user.company_id) !== String(companyId)) {
			return res.status(404).json(errorResponse("Employee not found"));
		}
		const row = await createAllocation(req.db, {
			userId,
			companyId,
			leaveType,
			validityStart,
			validityEnd,
			allocatedDays,
			notes,
			createdBy: req.user.id,
		});
		return res.status(201).json(successResponse(allocationDTO(row), "Leave allocation created"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to create allocation"));
	}
}

export async function getMyAllocationsController(req, res) {
	try {
		const rows = await listMyAllocations(req.db, req.user.id, req.user.company_id);
		return res.json(successResponse(rows.map(allocationDTO), "Your allocations fetched"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch allocations"));
	}
}

export async function updateAllocationController(req, res) {
	try {
		const companyId = req.user.company_id;
		const existing = await findAllocationById(req.db, req.params.id, companyId);
		if (!existing) return res.status(404).json(errorResponse("Allocation not found"));
		const row = await updateAllocation(req.db, req.params.id, companyId, {
			allocatedDays: req.body.allocatedDays,
			notes: req.body.notes,
		});
		return res.json(successResponse({ id: row.id, allocatedDays: Number(row.allocated_days) }, "Allocation updated"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to update allocation"));
	}
}

export async function deleteAllocationController(req, res) {
	try {
		const companyId = req.user.company_id;
		const existing = await findAllocationById(req.db, req.params.id, companyId);
		if (!existing) return res.status(404).json(errorResponse("Allocation not found"));
		const approved = await countApprovedRequestsForAllocation(req.db, existing.id);
		if (approved > 0) {
			return res.status(422).json(errorResponse("Cannot delete allocation with approved leave requests"));
		}
		await deleteAllocation(req.db, existing.id, companyId);
		return res.json(successResponse(null, "Allocation deleted"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to delete allocation"));
	}
}

export async function listRequestsController(req, res) {
	try {
		const companyId = req.user.company_id;
		const { page, limit } = parseListQuery(req.query);
		const filters = {
			status: req.query.status,
			leave_type: req.query.leave_type,
			user_id: req.query.user_id,
			from_date: req.query.from_date,
			to_date: req.query.to_date,
		};
		const total = await countRequests(req.db, companyId, filters);
		const rows = await listRequests(req.db, companyId, page, limit, filters);
		return res.json(
			successResponse(
				{ items: rows.map(requestDTO), pagination: paginationMeta({ page, limit, total }) },
				"Requests fetched",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch requests"));
	}
}

export async function createRequestController(req, res) {
	const client = await req.db.connect();
	try {
		const companyId = req.user.company_id;
		const { allocationId, startDate, endDate, daysRequested, reason } = req.body;
		if (!allocationId || !startDate || !endDate || !daysRequested) {
			return res.status(400).json(errorResponse("Missing required fields"));
		}
		const alloc = await findAllocationById(client, allocationId, companyId);
		if (!alloc || String(alloc.user_id) !== String(req.user.id)) {
			return res.status(404).json(errorResponse("Allocation not found"));
		}
		const available = Number(alloc.allocated_days) - Number(alloc.used_days);
		if (Number(daysRequested) > available) {
			return res
				.status(422)
				.json(errorResponse(`Insufficient leave balance. Available: ${available} days, requested: ${daysRequested} days`));
		}
		await client.query("BEGIN");
		const row = await createLeaveRequest(client, {
			userId: req.user.id,
			allocationId,
			companyId,
			leaveType: alloc.leave_type,
			startDate,
			endDate,
			daysRequested,
			reason,
		});
		await client.query("COMMIT");
		return res.status(201).json(
			successResponse(
				{
					id: row.id,
					leaveType: row.leave_type,
					startDate: row.start_date,
					endDate: row.end_date,
					daysRequested: Number(row.days_requested),
					status: row.status,
				},
				"Leave request submitted",
			),
		);
	} catch (err) {
		await client.query("ROLLBACK");
		console.error(err);
		return res.status(500).json(errorResponse("Unable to submit leave request"));
	} finally {
		client.release();
	}
}

export async function myRequestsController(req, res) {
	try {
		const companyId = req.user.company_id;
		const { page, limit } = parseListQuery(req.query);
		const filters = { status: req.query.status, leave_type: req.query.leave_type };
		const total = await countRequests(req.db, companyId, filters, req.user.id);
		const rows = await listRequests(req.db, companyId, page, limit, filters, req.user.id);
		return res.json(
			successResponse(
				{ items: rows.map(requestDTO), pagination: paginationMeta({ page, limit, total }) },
				"Your leave requests fetched",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch leave requests"));
	}
}

export async function getRequestByIdController(req, res) {
	try {
		const row = await findRequestById(req.db, req.params.id, req.user.company_id);
		if (!row) return res.status(404).json(errorResponse("Request not found"));
		const self = String(row.user_id) === String(req.user.id);
		if (!self && !["admin", "payroll_officer"].includes(req.user.role) && req.user.role !== "superadmin") {
			return res.status(403).json(errorResponse("Forbidden"));
		}
		return res.json(successResponse(requestDTO(row), "Request fetched"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch request"));
	}
}

async function reviewRequest(req, res, targetStatus) {
	const client = await req.db.connect();
	try {
		const row = await findRequestById(client, req.params.id, req.user.company_id);
		if (!row) return res.status(404).json(errorResponse("Request not found"));
		if (row.status !== "pending") {
			return res.status(422).json(errorResponse(`Only pending requests can be ${targetStatus === "approved" ? "approved" : "rejected"}`));
		}

		await client.query("BEGIN");
		const updated = await updateRequestStatus(
			client,
			row.id,
			req.user.company_id,
			targetStatus,
			req.user.id,
			req.body?.reviewerNote ?? req.body?.reviewer_note ?? null,
		);

		if (targetStatus === "approved") {
			await incrementAllocationUsage(client, row.allocation_id, Number(row.days_requested));
			await markLeaveAttendanceDays(client, req.user.company_id, row.user_id, row.start_date, row.end_date);
		}

		await client.query("COMMIT");
		return res.json(
			successResponse(
				{ id: updated.id, status: updated.status, reviewedAt: updated.reviewed_at },
				`Leave request ${targetStatus === "approved" ? "approved" : "rejected"}`,
			),
		);
	} catch (err) {
		await client.query("ROLLBACK");
		console.error(err);
		return res.status(500).json(errorResponse("Unable to update request"));
	} finally {
		client.release();
	}
}

export async function approveRequestController(req, res) {
	return reviewRequest(req, res, "approved");
}

export async function rejectRequestController(req, res) {
	return reviewRequest(req, res, "rejected");
}

export async function cancelRequestController(req, res) {
	try {
		const row = await findRequestById(req.db, req.params.id, req.user.company_id);
		if (!row) return res.status(404).json(errorResponse("Request not found"));

		const isSelf = String(row.user_id) === String(req.user.id);
		const isPrivileged = ["admin", "hr_officer"].includes(req.user.role);

		if (!isSelf && !isPrivileged) {
			return res.status(403).json(errorResponse("You can only cancel your own requests"));
		}
		if (row.status !== "pending") {
			return res.status(422).json(errorResponse("Only pending requests can be cancelled"));
		}
		const updated = await updateRequestStatus(req.db, row.id, req.user.company_id, "cancelled", req.user.id, null);
		return res.json(successResponse({ id: updated.id, status: updated.status }, "Leave request cancelled"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to cancel request"));
	}
}
