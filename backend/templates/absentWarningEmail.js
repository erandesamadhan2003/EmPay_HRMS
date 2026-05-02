export function absentWarningEmailTemplate({ employeeName, date, designation, companyName }) {
    return {
        subject: `⚠️ Attendance Warning — Auto-Marked Absent`,
        html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; }
            .email-wrapper { background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 32px 24px; text-align: center; }
            .header-icon { font-size: 48px; margin-bottom: 16px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
            .content { padding: 32px 24px; }
            .alert-box { background-color: #fee2e2; border-left: 4px solid #dc2626; border-radius: 4px; padding: 16px; margin-bottom: 24px; }
            .alert-text { color: #991b1b; font-size: 14px; margin: 0; font-weight: 500; }
            .details { background-color: #f9fafb; border-radius: 6px; padding: 20px; margin-bottom: 24px; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { color: #6b7280; font-size: 13px; font-weight: 500; }
            .detail-value { color: #111827; font-size: 14px; font-weight: 600; }
            .action-text { color: #374151; font-size: 14px; line-height: 1.6; margin: 16px 0; }
            .contact-info { background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px; padding: 16px; margin-bottom: 24px; }
            .contact-info-title { color: #1e40af; font-weight: 600; font-size: 13px; margin-bottom: 8px; }
            .contact-info-text { color: #1e3a8a; font-size: 13px; margin: 4px 0; }
            .footer { background-color: #f3f4f6; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb; }
            .footer-text { color: #6b7280; font-size: 12px; margin: 0; }
            .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-wrapper">
              <div class="header">
                <div class="header-icon">⚠️</div>
                <h1>Attendance Warning</h1>
              </div>
              <div class="content">
                <p style="color: #111827; font-size: 16px; margin: 0 0 16px 0;">Hi <strong>${employeeName}</strong>,</p>
                
                <div class="alert-box">
                  <p class="alert-text">You have been automatically marked as <strong>ABSENT</strong> because no check-in was recorded for today.</p>
                </div>

                <div class="details">
                  <div class="detail-row">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">${date}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Designation</span>
                    <span class="detail-value">${designation}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Company</span>
                    <span class="detail-value">${companyName}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Status</span>
                    <span class="detail-value" style="color: #dc2626;">ABSENT</span>
                  </div>
                </div>

                <div class="action-text">
                  <strong>What you need to do:</strong><br>
                  ✓ If this is incorrect, please contact your HR team immediately<br>
                  ✓ Provide proof of work if applicable (e.g., emails, work logs, leave approval)<br>
                  ✓ Your company may have a grace period for corrections
                </div>

                <div class="contact-info">
                  <div class="contact-info-title">Need Help?</div>
                  <div class="contact-info-text">Please reach out to your HR department or manager to resolve this absence record.</div>
                  <div class="contact-info-text">This is an automated notice sent at 10:00 AM IST (Mon-Fri).</div>
                </div>

                <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
                  <strong>Attendance System</strong><br>
                  ${companyName}<br>
                  EmPay HRMS
                </p>
              </div>
              <div class="footer">
                <p class="footer-text">This is an automated email from EmPay HRMS. Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
        text: `Attendance Warning\n\nHi ${employeeName},\n\nYou have been automatically marked as ABSENT because no check-in was recorded for ${date}.\n\nDetails:\nDate: ${date}\nDesignation: ${designation}\nCompany: ${companyName}\nStatus: ABSENT\n\nIf this is incorrect, please contact your HR team immediately with any supporting documentation.\n\nThis is an automated notice from EmPay HRMS.`
    };
}
