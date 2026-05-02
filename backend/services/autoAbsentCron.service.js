import cron from 'node-cron';
import { sendEmail } from '../utils/emailService.js';
import { absentWarningEmailTemplate } from '../templates/absentWarningEmail.js';

/**
 * Auto-mark absent for employees with no attendance record for today
 * Scheduled: 10:00 AM IST, Monday-Friday
 * Timezone: Asia/Kolkata (India Standard Time)
 */
export function scheduleAutoAbsentCron(pool, redisClient) {
    // Schedule: 0 10 * * 1-5 = 10:00 AM, Mon-Fri
    // Using IST (UTC+5:30), which is the default for Asia/Kolkata timezone in cron
    const cronExpression = '0 10 * * 1-5';

    cron.schedule(cronExpression, async () => {
        console.log('[cron] Running: auto-absent marking at 10:00 AM IST');
        try {
            await markAbsentAndSendEmails(pool, redisClient);
        } catch (error) {
            console.error('[cron] Error in auto-absent marking:', error.message);
        }
    }, {
        timezone: 'Asia/Kolkata'
    });

    console.log('[cron] Scheduled: auto-absent marking at 10:00 AM IST (Mon-Fri)');
}

/**
 * Mark all active employees with no attendance as absent
 * Send styled warning email to their registered emails
 */
async function markAbsentAndSendEmails(pool, redisClient) {
    const client = await pool.connect();
    try {
        // Get today's date
        const todayResult = await client.query("SELECT CURRENT_DATE::text AS today");
        const today = todayResult.rows[0].today;

        // Find all active employees from all companies with no attendance record for today
        const query = `
      SELECT DISTINCT
        u.id,
        u.company_id,
        u.name,
        u.email,
        c.name AS company_name,
        ep.designation
      FROM users u
      JOIN companies c ON u.company_id = c.id
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      LEFT JOIN attendance a ON u.id = a.user_id AND a.date = $1
      WHERE u.is_active = TRUE
        AND u.role::text NOT IN ('superadmin', 'admin', 'superadmin_portal')
        AND a.id IS NULL
      ORDER BY u.company_id, u.name
    `;

        const result = await client.query(query, [today]);
        const absentEmployees = result.rows;

        console.log(`[cron] Found ${absentEmployees.length} employees without attendance for ${today}`);

        if (absentEmployees.length === 0) {
            console.log('[cron] No absent employees to mark');
            return;
        }

        // Group by company for batch processing
        const byCompany = {};
        absentEmployees.forEach(emp => {
            if (!byCompany[emp.company_id]) {
                byCompany[emp.company_id] = [];
            }
            byCompany[emp.company_id].push(emp);
        });

        // Process each company
        for (const [companyId, employees] of Object.entries(byCompany)) {
            for (const emp of employees) {
                try {
                    // Insert absent attendance record
                    await client.query(
                        `INSERT INTO attendance(id, user_id, company_id, date, status, notes, created_at, updated_at)
             VALUES(uuid_generate_v4(), $1, $2, $3, 'absent', $4, NOW(), NOW())
             ON CONFLICT (user_id, date) DO UPDATE
             SET status = 'absent', notes = $4, updated_at = NOW()`,
                        [
                            emp.id,
                            emp.company_id,
                            today,
                            'System: Auto-marked absent at 10:00 AM (no check-in recorded)'
                        ]
                    );

                    console.log(`[cron] Marked absent: ${emp.name} (${emp.email})`);

                    // Send warning email to employee
                    if (emp.email) {
                        const { html } = absentWarningEmailTemplate({
                            employeeName: emp.name,
                            date: new Date(today).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
                            designation: emp.designation || 'Employee',
                            companyName: emp.company_name,
                        });

                        await sendEmail({
                            to: emp.email,
                            subject: `⚠️ Attendance Warning — Auto-Marked Absent (${new Date(today).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })})`,
                            html,
                            text: `You have been marked as absent for ${today}. Please contact your HR team if this is incorrect.`
                        });

                        console.log(`[cron] Warning email sent: ${emp.email}`);
                    }

                    // Invalidate relevant caches for this employee
                    if (redisClient && redisClient.isOpen) {
                        const cachePatterns = [
                            `attendance:user:${emp.id}:*`,
                            `dashboard:company:${emp.company_id}:*`,
                            `attendance:*`
                        ];
                        for (const pattern of cachePatterns) {
                            await redisClient.del(`attendance:user:${emp.id}:${today}`).catch(() => { });
                        }
                    }
                } catch (empError) {
                    console.error(`[cron] Error processing employee ${emp.id}:`, empError.message);
                }
            }

            // Log summary for company
            console.log(`[cron] Processed ${employees.length} employees in company ${companyId}`);
        }

        console.log('[cron] Auto-absent marking completed successfully');
    } catch (error) {
        console.error('[cron] Database error:', error.message);
        throw error;
    } finally {
        client.release();
    }
}
