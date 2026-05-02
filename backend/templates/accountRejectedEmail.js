export function generateAccountRejectedTemplate({ userName, companyName, reviewerNotes }) {
    const subject = `Registration Request Rejected - ${companyName}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>Registration Rejected</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
	<h2 style="color: #d9534f;">Registration Request Update</h2>
	<p>Hello ${userName},</p>
	<p>We are writing to inform you that your registration request for the company <strong>${companyName}</strong> has been reviewed and unfortunately, it could not be approved at this time.</p>
	${reviewerNotes ? `<p><strong>Reason:</strong> ${reviewerNotes}</p>` : ''}
	<p>If you believe this is a mistake or have further questions, please contact the administrator.</p>
	<br>
	<p>Best regards,<br>EmPay HRMS Team</p>
</body>
</html>
	`;

    const text = `
Hello ${userName},

Your registration request for the company ${companyName} has been rejected.
${reviewerNotes ? `Reason: ${reviewerNotes}` : ''}

If you believe this is a mistake or have further questions, please contact the administrator.

Best regards,
EmPay HRMS Team
	`;

    return { subject, html, text };
}
