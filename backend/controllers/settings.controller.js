import { successResponse, errorResponse } from "../utils/constant.js";
import { parseListQuery, paginationMeta } from "../utils/pagination.js";
import { findCompanyById } from "../models/Company.js";

export async function getSettingsUsers(req, res) {
	try {
		const companyId = req.user.company_id;
		const { page, limit } = parseListQuery(req.query);
		const search = req.query.search;
		const params = [companyId];
		let where = `WHERE company_id = $1`;
		if (search) {
			params.push(`%${search}%`);
			where += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length} OR login_id ILIKE $${params.length})`;
		}
		const { rows: cRows } = await req.db.query(
			`SELECT COUNT(*)::int AS c FROM users ${where}`,
			params,
		);
		const total = cRows[0]?.c ?? 0;
		const offset = (page - 1) * limit;
		params.push(limit, offset);
		const iLim = params.length - 1;
		const iOff = params.length;
		const { rows } = await req.db.query(
			`SELECT id, name, login_id, email, role, is_active
			 FROM users ${where}
			 ORDER BY created_at DESC
			 LIMIT $${iLim} OFFSET $${iOff}`,
			params,
		);
		return res.json(
			successResponse(
				{
					items: rows.map((r) => ({
						id: r.id,
						name: r.name,
						loginId: r.login_id,
						email: r.email,
						role: r.role,
						isActive: r.is_active,
					})),
					pagination: paginationMeta({ page, limit, total }),
				},
				"Users fetched",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch users"));
	}
}

export async function updateSettingsUserRole(req, res) {
	try {
		const role = req.body.role;
		if (!["admin", "hr_officer", "payroll_officer", "employee"].includes(role)) {
			return res.status(400).json(errorResponse("Invalid role"));
		}
		const { rows } = await req.db.query(
			`UPDATE users SET role = $1::user_role, updated_at = NOW()
			 WHERE id = $2 AND company_id = $3 RETURNING id, role`,
			[role, req.params.id, req.user.company_id],
		);
		if (!rows.length) return res.status(404).json(errorResponse("User not found"));
		return res.json(successResponse({ id: rows[0].id, role: rows[0].role }, `User role updated to ${rows[0].role}`));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to update role"));
	}
}

export async function getSettingsCompany(req, res) {
	try {
		const c = await findCompanyById(req.db, req.user.company_id);
		if (!c) return res.status(404).json(errorResponse("Company not found"));
		return res.json(
			successResponse(
				{
					id: c.id,
					name: c.name,
					logoUrl: c.logo_url,
					officeLatitude: c.office_latitude != null ? Number(c.office_latitude) : null,
					officeLongitude: c.office_longitude != null ? Number(c.office_longitude) : null,
				},
				"Company info fetched",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch company"));
	}
}

export async function updateSettingsCompany(req, res) {
	try {
		const name = req.body?.name ?? null;
		const logoUrl = req.body?.logo_url ?? req.body?.logoUrl ?? null;
		const hasLat = "officeLatitude" in (req.body || {}) || "office_latitude" in (req.body || {});
		const hasLng = "officeLongitude" in (req.body || {}) || "office_longitude" in (req.body || {});
		if (hasLat !== hasLng) {
			return res
				.status(400)
				.json(errorResponse("officeLatitude and officeLongitude must be sent together"));
		}

		let geoLat = null;
		let geoLng = null;
		let touchGeo = false;
		if (hasLat && hasLng) {
			touchGeo = true;
			geoLat = req.body?.officeLatitude ?? req.body?.office_latitude;
			geoLng = req.body?.officeLongitude ?? req.body?.office_longitude;
			if (geoLat != null && geoLng != null) {
				const la = typeof geoLat === "string" ? Number.parseFloat(geoLat) : geoLat;
				const ln = typeof geoLng === "string" ? Number.parseFloat(geoLng) : geoLng;
				if (!Number.isFinite(la) || !Number.isFinite(ln) || la < -90 || la > 90 || ln < -180 || ln > 180) {
					return res.status(400).json(errorResponse("Invalid office latitude or longitude"));
				}
				geoLat = la;
				geoLng = ln;
			}
		}

		const sets = [
			"name = COALESCE($1, name)",
			"logo_url = COALESCE($2, logo_url)",
		];
		const params = [name, logoUrl];
		if (touchGeo) {
			sets.push(`office_latitude = $${params.length + 1}`);
			sets.push(`office_longitude = $${params.length + 2}`);
			params.push(geoLat, geoLng);
		}
		params.push(req.user.company_id);
		const idParam = params.length;

		const { rows } = await req.db.query(
			`UPDATE companies
			 SET ${sets.join(", ")}, updated_at = NOW()
			 WHERE id = $${idParam}
			 RETURNING id, name, logo_url, office_latitude, office_longitude`,
			params,
		);
		if (!rows.length) return res.status(404).json(errorResponse("Company not found"));
		return res.json(
			successResponse(
				{
					id: rows[0].id,
					name: rows[0].name,
					logoUrl: rows[0].logo_url,
					officeLatitude: rows[0].office_latitude != null ? Number(rows[0].office_latitude) : null,
					officeLongitude:
						rows[0].office_longitude != null ? Number(rows[0].office_longitude) : null,
				},
				"Company info updated",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to update company"));
	}
}
