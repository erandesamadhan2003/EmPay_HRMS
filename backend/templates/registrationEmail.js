export function generateSuperAdminRegistrationTemplate({
    companyName,
    userName,
    userEmail,
    userPhone,
    loginId,
    companyId,
    registrationDate,
}) {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
            .credentials-box { background: #f0f4ff; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 4px; }
            .credential-item { margin: 15px 0; font-size: 15px; }
            .label { font-weight: bold; color: #555; display: inline-block; width: 140px; }
            .value { color: #333; font-family: 'Courier New', monospace; background: white; padding: 8px 12px; border-radius: 4px; display: inline-block; }
            .important-note { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>New Registration Pending Approval</h1>
            </div>
            <div class="content">
                <p>Hello Super Admin,</p>
                <p>A new user has registered in <strong>${companyName}</strong> and is waiting for your verification.</p>
                <div class="credentials-box">
                    <h3>Registration Details</h3>
                    <div class="credential-item"><span class="label">Company:</span><span class="value">${companyName}</span></div>
                    <div class="credential-item"><span class="label">Employee Name:</span><span class="value">${userName}</span></div>
                    <div class="credential-item"><span class="label">Employee Email:</span><span class="value">${userEmail}</span></div>
                    <div class="credential-item"><span class="label">Employee Phone:</span><span class="value">${userPhone || "N/A"}</span></div>
                    <div class="credential-item"><span class="label">Login ID:</span><span class="value">${loginId}</span></div>
                </div>
                <div class="important-note">
                    <strong>Action Required:</strong>
                    <p style="margin: 10px 0 0 0;">Please review this registration and verify the account.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    const textContent = `
New user registration pending approval
Hello Super Admin,
A new user has registered in ${companyName} and is waiting for verification.

Company: ${companyName}
Employee Name: ${userName}
Employee Email: ${userEmail}
Login ID: ${loginId}

Please review the registration and verify the account.
	`;

    return { subject: `New User Registration Pending Approval - ${userName}`, html: htmlContent, text: textContent };
}
