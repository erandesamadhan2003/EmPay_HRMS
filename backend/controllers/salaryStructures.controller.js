import { successResponse, errorResponse } from "../utils/constant.js";
import { paginationMeta, parseListQuery } from "../utils/pagination.js";
import {
	countSalaryStructures,
	listSalaryStructures,
	listSalaryComponentsForStructure,
	createSalaryStructureWithComponents,
	findSalaryStructureById,
	updateSalaryStructureWithComponents,
	deleteSalaryStructure,
	countEmployeesUsingSalaryStructure,
} from "../models/Salary.js";

function serializeStructure(row, components = []) {
	return {
		id: row.id,
		name: row.name,
		wageType: row.wage_type,
		pfRate: Number(row.pf_rate),
		professionalTax: Number(row.professional_tax),
		components: components.map((c) => ({
			id: c.id,
			name: c.name,
			componentType: c.component_type,
			computationType: c.computation_type,
			value: Number(c.value),
			sortOrder: c.sort_order,
		})),
	};
}

export async function getSalaryStructures(req, res) {
	try {
		const companyId = req.user.company_id;
		const { page, limit } = parseListQuery(req.query);
		const total = await countSalaryStructures(req.db, companyId);
		const rows = await listSalaryStructures(req.db, companyId, page, limit);
		const items = [];
		for (const r of rows) {
			const comps = await listSalaryComponentsForStructure(req.db, r.id);
			items.push(serializeStructure(r, comps));
		}
		return res.json(
			successResponse(
				{ items, pagination: paginationMeta({ page, limit, total }) },
				"Salary structures fetched",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch salary structures"));
	}
}

export async function createSalaryStructure(req, res) {
	const client = await req.db.connect();
	try {
		const companyId = req.user.company_id;
		if (!req.body?.name) return res.status(400).json(errorResponse("name required"));
		await client.query("BEGIN");
		const structure = await createSalaryStructureWithComponents(client, companyId, req.body);
		await client.query("COMMIT");
		return res
			.status(201)
			.json(successResponse({ id: structure.id, name: structure.name }, "Salary structure created"));
	} catch (err) {
		await client.query("ROLLBACK");
		console.error(err);
		return res.status(500).json(errorResponse("Unable to create salary structure"));
	} finally {
		client.release();
	}
}

export async function getSalaryStructureById(req, res) {
	try {
		const companyId = req.user.company_id;
		const row = await findSalaryStructureById(req.db, req.params.id, companyId);
		if (!row) return res.status(404).json(errorResponse("Salary structure not found"));
		const comps = await listSalaryComponentsForStructure(req.db, row.id);
		return res.json(successResponse(serializeStructure(row, comps), "Salary structure fetched"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to fetch salary structure"));
	}
}

export async function updateSalaryStructure(req, res) {
	const client = await req.db.connect();
	try {
		const companyId = req.user.company_id;
		await client.query("BEGIN");
		const row = await updateSalaryStructureWithComponents(
			client,
			req.params.id,
			companyId,
			req.body,
		);
		if (!row) {
			await client.query("ROLLBACK");
			return res.status(404).json(errorResponse("Salary structure not found"));
		}
		await client.query("COMMIT");
		return res.json(successResponse({ id: row.id }, "Salary structure updated"));
	} catch (err) {
		await client.query("ROLLBACK");
		console.error(err);
		return res.status(500).json(errorResponse("Unable to update salary structure"));
	} finally {
		client.release();
	}
}

export async function removeSalaryStructure(req, res) {
	try {
		const companyId = req.user.company_id;
		const row = await findSalaryStructureById(req.db, req.params.id, companyId);
		if (!row) return res.status(404).json(errorResponse("Salary structure not found"));

		const usage = await countEmployeesUsingSalaryStructure(req.db, row.id);
		if (usage > 0) {
			return res.status(422).json(errorResponse("Cannot delete structure assigned to employees"));
		}

		await deleteSalaryStructure(req.db, row.id, companyId);
		return res.json(successResponse(null, "Salary structure deleted"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to delete salary structure"));
	}
}
