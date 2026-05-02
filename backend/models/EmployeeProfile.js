export async function createEmployeeProfile(db, { userId, companyId, dateOfJoining }) {
    const { rows } = await db.query(
        'INSERT INTO employee_profiles(user_id, company_id, date_of_joining) VALUES($1,$2,$3) RETURNING *',
        [userId, companyId, dateOfJoining]
    );
    return rows[0];
}
