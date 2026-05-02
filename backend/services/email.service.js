/**
 * Email service — Nodemailer backed by Gmail SMTP App Password.
 * Env vars: SMTP_USER, SMTP_PASS
 */
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const APP_NAME = "EmPay HRMS";

/**
 * Send a payslip notification email to an employee after payrun is marked paid.
 * @param {{ to: string, name: string, period: string, netSalary: number|string, payDate: string }} opts
 */
export async function sendPayslipNotification({ to, name, period, netSalary, payDate }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[email] SMTP not configured — skipping payslip email.");
    return;
  }

  const fmt = (v) =>
    "₹" + Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f8; margin: 0; padding: 0; }
        .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #0D9488, #14B8A6); padding: 32px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px; }
        .body { padding: 32px; }
        .greeting { font-size: 16px; color: #1a1a2e; margin-bottom: 20px; }
        .card { background: #f8f9fd; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; border: 1px solid #e8eaef; }
        .card .label { font-size: 11px; color: #8b8a9b; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
        .card .amount { font-size: 36px; font-weight: 700; color: #0D9488; margin: 8px 0; }
        .card .period { font-size: 13px; color: #6b6a7b; }
        .details { margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f5; font-size: 13px; }
        .detail-row .key { color: #8b8a9b; }
        .detail-row .val { color: #1a1a2e; font-weight: 500; }
        .footer { background: #f8f9fd; padding: 24px; text-align: center; font-size: 12px; color: #8b8a9b; border-top: 1px solid #e8eaef; }
        .badge { display: inline-block; background: #0D948822; color: #0D9488; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${APP_NAME}</h1>
          <p>Your salary has been processed</p>
        </div>
        <div class="body">
          <p class="greeting">Dear <strong>${name}</strong>,</p>
          <p style="color:#6b6a7b;font-size:14px;">We're pleased to inform you that your salary for <strong>${period}</strong> has been successfully processed and credited.</p>
          <div class="card">
            <div class="label">Net Salary Credited</div>
            <div class="amount">${fmt(netSalary)}</div>
            <div class="period">Pay Period: ${period}</div>
            <div class="period" style="margin-top:4px;">Pay Date: ${payDate}</div>
            <div style="margin-top:12px;"><span class="badge">✓ Credited</span></div>
          </div>
          <div class="details">
            <div class="detail-row"><span class="key">Employee Name</span><span class="val">${name}</span></div>
            <div class="detail-row"><span class="key">Pay Period</span><span class="val">${period}</span></div>
            <div class="detail-row"><span class="key">Payment Date</span><span class="val">${payDate}</span></div>
          </div>
          <p style="color:#8b8a9b;font-size:12px;margin-top:24px;">Please log in to your <strong>${APP_NAME}</strong> portal to view and download your detailed payslip.</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from ${APP_NAME}. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${process.env.SMTP_USER}>`,
      to,
      subject: `Your ${period} Salary Has Been Processed — ${APP_NAME}`,
      html,
    });
    console.log(`[email] Payslip notification sent to ${to}`);
  } catch (err) {
    // Non-fatal — log but don't throw
    console.error(`[email] Failed to send payslip notification to ${to}:`, err.message);
  }
}

export default { sendPayslipNotification };
