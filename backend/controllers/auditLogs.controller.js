import { successResponse, errorResponse } from "../utils/constant.js";
import { parseListQuery, paginationMeta } from "../utils/pagination.js";
import { countAuditLogs, listAuditLogs } from "../models/AuditLog.js";

function auditDTO(r) {
	return {
		id: r.id,
		companyId: r.company_id,
		actorId: r.actor_id,
		action: r.action,
		entityType: r.entity_type,
		entityId: r.entity_id,
		payload: r.payload,
		ipAddress: r.ip_address,
		createdAt: r.created_at,
	};
}

export async function getAuditLogs(req, res) {
	try {
		const { page, limit } = parseListQuery(req.query);
		const filters = {
			companyId: req.query.companyId,
			actorId: req.query.actorId,
			entityType: req.query.entityType,
			from: req.query.from,
			to: req.query.to,
		};
		const actorScope =
			req.user.role === "superadmin" ? {} : { companyId: req.user.company_id };
		if (req.user.role !== "superadmin" && req.user.role !== "admin") {
			return res.status(403).json(errorResponse("Forbidden"));
		}
		const total = await countAuditLogs(req.db, filters, actorScope);
		const rows = await listAuditLogs(req.db, page, limit, filters, actorScope);
		return res.json(
			successResponse(
				{
					items: rows.map(auditDTO),
					pagination: paginationMeta({ page, limit, total }),
				},
				"Audit logs fetched",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch audit logs"));
	}
}
