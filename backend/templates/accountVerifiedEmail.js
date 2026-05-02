export function generateAccountVerifiedTemplate({
    userName,
    userEmail,
    loginId,
    temporaryPassword,
    companyName,
}) {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
            .credentials-box { background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 4px; }
            .credential-item { margin: 15px 0; font-size: 15px; }
            .label { font-weight: bold; color: #555; display: inline-block; width: 140px; }
            .value { color: #333; font-family: 'Courier New', monospace; background: white; padding: 8px 12px; border-radius: 4px; display: inline-block; }
            .important-note { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Account Verified</h1>
            </div>
            <div class="content">
                <p>Hello <strong>${userName}</strong>,</p>
                <p>Your account in <strong>${companyName}</strong> has been verified by the super admin. You can now sign in to EmPay HRMS.</p>
                <div class="credentials-box">
                    <h3>Your Login Details</h3>
                    <div class="credential-item"><span class="label">Email:</span><span class="value">${userEmail}</span></div>
                    <div class="credential-item"><span class="label">Login ID:</span><span class="value">${loginId}</span></div>
                    <div class="credential-item"><span class="label">Temporary Password:</span><span class="value">${temporaryPassword}</span></div>
                </div>
                <div class="important-note">
                    <strong>Security Notice:</strong>
                    <p style="margin: 10px 0 0 0;">Please change your temporary password immediately after your first login.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    const textContent = `
Account verified for ${userName}

Hello ${userName},
Your account in ${companyName} has been verified by the super admin.

Email: ${userEmail}
Login ID: ${loginId}
Temporary Password: ${temporaryPassword}

Please change your temporary password immediately after your first login.
	`;

    return { subject: `Your EmPay HRMS Account Has Been Verified`, html: htmlContent, text: textContent };
}
