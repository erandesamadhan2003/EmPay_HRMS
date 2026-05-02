function pad4(n) {
	return String(n).padStart(4, "0");
}

function makeCompanyCode(name) {
	if (!name) return "CO";
	const parts = name.replace(/[^a-zA-Z]/g, "").toUpperCase();
	return (parts.slice(0, 2) || "CO").toUpperCase();
}

function namePart(firstName = "", lastName = "") {
	const a = (firstName || "").toUpperCase().replace(/[^A-Z]/g, "");
	const b = (lastName || "").toUpperCase().replace(/[^A-Z]/g, "");
	const p1 = (a + "XX").slice(0, 2);
	const p2 = (b + "XX").slice(0, 2);
	return p1 + p2;
}

export async function generateLoginId(db, companyId, companyName, firstName, lastName, joiningDate) {
	const companyCode = makeCompanyCode(companyName);
	const np = namePart(firstName, lastName);
	const year = joiningDate ? new Date(joiningDate).getFullYear() : new Date().getFullYear();

	const q = `SELECT count(*) FROM users u
		JOIN employee_profiles e ON u.id = e.user_id
		WHERE e.company_id = $1 AND EXTRACT(YEAR FROM e.date_of_joining) = $2`;
	const r = await db.query(q, [companyId, year]);
	const count = parseInt(r.rows[0].count || "0", 10) + 1;
	const serial = pad4(count);
	const idPart = String(companyId).replace(/-/g, "").slice(0, 6).toUpperCase();
	return `${companyCode}${np}${year}${serial}${idPart}`;
}
