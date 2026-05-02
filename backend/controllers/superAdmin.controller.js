import { successResponse, errorResponse } from "../utils/constant.js";
import {
	findCompanyRequestById,
	reviewCompanyRequest as reviewCompanyRequestModel,
	listCompanyRequestsPaged,
} from "../models/CompanyRequest.js";
import { activateUser } from "../models/User.js";
import { paginationMeta, parseListQuery } from "../utils/pagination.js";
import { serializePagination } from "../utils/serializer.js";

export async function reviewCompanyRequest(req, res) {
	try {
		const { id } = req.params;
		const { action, reviewer_notes } = req.body;

		if (!["approve", "reject"].includes(action)) {
			return res.status(400).json(errorResponse("Invalid action"));
		}

		const requestRow = await findCompanyRequestById(req.db, id);
		if (!requestRow) return res.status(404).json(errorResponse("Request not found"));

		const status = action === "approve" ? "approved" : "rejected";
		const updatedRequest = await reviewCompanyRequestModel(req.db, {
			requestId: id,
			reviewerId: req.user.id,
			status,
			reviewerNotes: reviewer_notes,
		});

		if (action === "approve") {
			await activateUser(req.db, requestRow.admin_user_id);
		}

		return res.json(
			successResponse(
				{
					id: updatedRequest.id,
					status: updatedRequest.status,
					reviewedAt: updatedRequest.reviewed_at,
				},
				`Company request ${status}`,
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Review failed"));
	}
}

export async function listCompanyRequests(req, res) {
	try {
		const { page, limit } = parseListQuery(req.query);
		const { status } = req.query;
		const { rows, total } = await listCompanyRequestsPaged(req.db, {
			page,
			limit,
			status,
		});

		const items = rows.map((r) => ({
			id: r.id,
			companyId: r.company_id,
			status: r.status,
			reviewedBy: r.reviewed_by,
			reviewedAt: r.reviewed_at,
			reviewerNotes: r.reviewer_notes,
			companyName: r.company_name,
			employee: r.admin_login_id ?
				{
					id: r.admin_user_id,
					name: r.admin_name,
					email: r.admin_email,
					loginId: r.admin_login_id,
				}
			:	{ id: r.admin_user_id, name: r.admin_name, email: r.admin_email },
			createdAt: r.created_at,
		}));

		return res.json(
			successResponse(
				serializePagination(items, paginationMeta({ page, limit, total })),
				"Company requests fetched",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to list company requests"));
	}
}
