export async function countSalaryStructures(db, companyId) {
	const { rows } = await db.query(
		`SELECT COUNT(*)::int AS c FROM salary_structures WHERE company_id = $1`,
		[companyId],
	);
	return rows[0]?.c ?? 0;
}

export async function listSalaryStructures(db, companyId, page, limit) {
	const offset = (page - 1) * limit;
	const { rows } = await db.query(
		`SELECT * FROM salary_structures
		 WHERE company_id = $1
		 ORDER BY created_at DESC
		 LIMIT $2 OFFSET $3`,
		[companyId, limit, offset],
	);
	return rows;
}

function normalizeSalaryComponentInput(c) {
	if (!c || typeof c !== "object") return null;
	const name = c.name;
	if (!name) return null;
	return {
		name,
		componentType: c.componentType ?? c.component_type ?? "allowance",
		computationType: c.computationType ?? c.computation_type ?? "percentage",
		value: c.value != null ? Number(c.value) : 0,
		sortOrder: c.sortOrder ?? c.sort_order ?? 0,
	};
}

export async function listSalaryComponentsForStructure(db, structureId) {
	const { rows } = await db.query(
		`SELECT * FROM salary_components
		 WHERE salary_structure_id = $1
		 ORDER BY sort_order ASC, created_at ASC`,
		[structureId],
	);
	return rows;
}

export async function createSalaryStructureWithComponents(db, companyId, payload) {
	const name = payload.name;
	const wageType = payload.wageType ?? payload.wage_type ?? "fixed_wage";
	const pfRate = payload.pfRate ?? payload.pf_rate ?? 12;
	const professionalTax = payload.professionalTax ?? payload.professional_tax ?? 200;
	const components = payload.components ?? [];
	const { rows } = await db.query(
		`INSERT INTO salary_structures(company_id, name, wage_type, pf_rate, professional_tax)
		 VALUES($1,$2,$3,$4,$5) RETURNING *`,
		[companyId, name, wageType, pfRate, professionalTax],
	);
	const structure = rows[0];

	for (const raw of components) {
		const c = normalizeSalaryComponentInput(raw);
		if (!c) continue;
		await db.query(
			`INSERT INTO salary_components
			 (salary_structure_id, name, component_type, computation_type, value, sort_order)
			 VALUES($1,$2,$3,$4,$5,$6)`,
			[
				structure.id,
				c.name,
				c.componentType,
				c.computationType,
				c.value,
				c.sortOrder,
			],
		);
	}
	return structure;
}

export async function findSalaryStructureById(db, id, companyId) {
	const { rows } = await db.query(
		`SELECT * FROM salary_structures WHERE id = $1 AND company_id = $2`,
		[id, companyId],
	);
	return rows[0] || null;
}

export async function updateSalaryStructureWithComponents(db, id, companyId, payload) {
	const name = payload.name;
	const wageType = payload.wageType ?? payload.wage_type;
	const pfRate = payload.pfRate ?? payload.pf_rate;
	const professionalTax = payload.professionalTax ?? payload.professional_tax;
	const { components } = payload;
	const { rows } = await db.query(
		`UPDATE salary_structures
		 SET name = COALESCE($1, name),
		     wage_type = COALESCE($2::wage_type, wage_type),
		     pf_rate = COALESCE($3, pf_rate),
		     professional_tax = COALESCE($4, professional_tax),
		     updated_at = NOW()
		 WHERE id = $5 AND company_id = $6 RETURNING *`,
		[name ?? null, wageType ?? null, pfRate ?? null, professionalTax ?? null, id, companyId],
	);
	const structure = rows[0] || null;
	if (!structure) return null;

	if (Array.isArray(components)) {
		await db.query(`DELETE FROM salary_components WHERE salary_structure_id = $1`, [id]);
		for (const raw of components) {
			const c = normalizeSalaryComponentInput(raw);
			if (!c) continue;
			await db.query(
				`INSERT INTO salary_components
				 (salary_structure_id, name, component_type, computation_type, value, sort_order)
				 VALUES($1,$2,$3,$4,$5,$6)`,
				[
					id,
					c.name,
					c.componentType,
					c.computationType,
					c.value,
					c.sortOrder,
				],
			);
		}
	}
	return structure;
}

export async function deleteSalaryStructure(db, id, companyId) {
	const { rows } = await db.query(
		`DELETE FROM salary_structures WHERE id = $1 AND company_id = $2 RETURNING id`,
		[id, companyId],
	);
	return rows[0] || null;
}

export async function findEmployeeSalaryInfo(db, userId, companyId) {
	const { rows } = await db.query(
		`SELECT esi.*, ss.name AS structure_name, ss.wage_type, ss.pf_rate, ss.professional_tax
		 FROM employee_salary_info esi
		 JOIN salary_structures ss ON ss.id = esi.salary_structure_id
		 JOIN users u ON u.id = esi.user_id
		 WHERE esi.user_id = $1 AND u.company_id = $2`,
		[userId, companyId],
	);
	return rows[0] || null;
}

export async function upsertEmployeeSalaryInfo(db, userId, companyId, payload) {
	const salaryStructureId = payload.salaryStructureId ?? payload.salary_structure_id;
	const monthlyWage = payload.monthlyWage ?? payload.monthly_wage;
	const workingHoursPerDay = payload.workingHoursPerDay ?? payload.working_hours_per_day ?? 8;
	const workingDaysPerWeek = payload.workingDaysPerWeek ?? payload.working_days_per_week ?? 5;
	const effectiveFrom = payload.effectiveFrom ?? payload.effective_from;

	await db.query(
		`INSERT INTO employee_salary_info
		 (user_id, salary_structure_id, monthly_wage, working_hours_per_day, working_days_per_week, effective_from)
		 VALUES($1,$2,$3,$4,$5,$6)
		 ON CONFLICT (user_id)
		 DO UPDATE SET salary_structure_id = EXCLUDED.salary_structure_id,
		               monthly_wage = EXCLUDED.monthly_wage,
		               working_hours_per_day = EXCLUDED.working_hours_per_day,
		               working_days_per_week = EXCLUDED.working_days_per_week,
		               effective_from = EXCLUDED.effective_from,
		               updated_at = NOW()`,
		[userId, salaryStructureId, monthlyWage, workingHoursPerDay, workingDaysPerWeek, effectiveFrom],
	);

	return findEmployeeSalaryInfo(db, userId, companyId);
}

export async function countEmployeesUsingSalaryStructure(db, structureId) {
	const { rows } = await db.query(
		`SELECT COUNT(*)::int AS c FROM employee_salary_info WHERE salary_structure_id = $1`,
		[structureId],
	);
	return rows[0]?.c ?? 0;
}
