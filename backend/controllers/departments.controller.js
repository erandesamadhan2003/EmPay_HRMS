import { successResponse, errorResponse } from "../utils/constant.js";
import {
	createDepartment,
	listDepartments,
	findDepartmentByIdForCompany,
	updateDepartment,
	deleteDepartment,
	countDepartments,
} from "../models/Department.js";
import { countEmployeesInDepartment } from "../models/EmployeeProfile.js";
import { paginationMeta, parseListQuery } from "../utils/pagination.js";
import { serializeDepartment, serializePagination } from "../utils/serializer.js";

export async function getDepartments(req, res) {
	try {
		const companyId = req.user?.company_id;
		if (!companyId) {
			return res.status(400).json(errorResponse("Company context required"));
		}

		const { page, limit } = parseListQuery(req.query);
		const { search } = req.query;

		const total = await countDepartments(req.db, companyId, search);
		const rows = await listDepartments(req.db, {
			companyId,
			page,
			limit,
			search,
		});

		return res.json(
			successResponse(
				serializePagination(
					rows.map(serializeDepartment),
					paginationMeta({ page, limit, total }),
				),
				"Departments fetched",
			),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to list departments"));
	}
}

export async function createDept(req, res) {
	try {
		const companyId = req.user?.company_id;
		const { name } = req.body;
		if (!companyId) {
			return res.status(400).json(errorResponse("Company context required"));
		}
		if (!name) return res.status(400).json(errorResponse("Department name required"));
		const row = await createDepartment(req.db, { companyId, name });
		return res
			.status(201)
			.json(successResponse(serializeDepartment(row), "Department created"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to create department"));
	}
}

export async function updateDept(req, res) {
	try {
		const companyId = req.user?.company_id;
		const { id } = req.params;
		const { name } = req.body;
		if (!companyId) {
			return res.status(400).json(errorResponse("Company context required"));
		}
		if (!name) return res.status(400).json(errorResponse("Name required"));

		const existing = await findDepartmentByIdForCompany(req.db, id, companyId);
		if (!existing) return res.status(404).json(errorResponse("Department not found"));

		const updated = await updateDepartment(req.db, id, name);
		return res.json(
			successResponse(serializeDepartment(updated), "Department updated"),
		);
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to update department"));
	}
}

export async function deleteDept(req, res) {
	try {
		const companyId = req.user?.company_id;
		const { id } = req.params;
		if (!companyId) {
			return res.status(400).json(errorResponse("Company context required"));
		}

		const existing = await findDepartmentByIdForCompany(req.db, id, companyId);
		if (!existing) return res.status(404).json(errorResponse("Department not found"));

		const inUse = await countEmployeesInDepartment(req.db, id);
		if (inUse > 0) {
			return res.status(422).json(
				errorResponse("Department still assigned to employees"),
			);
		}

		const d = await deleteDepartment(req.db, id);
		if (!d) return res.status(404).json(errorResponse("Department not found"));

		return res.json(successResponse(null, "Department deleted"));
	} catch (err) {
		console.error(err);
		return res.status(500).json(errorResponse("Unable to delete department"));
	}
}
