import nodemailer from "nodemailer";
import { emailConfig } from "../config/email.js";

let transporter;

function initializeTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport(emailConfig);
    }
    return transporter;
}

export async function sendEmail({ to, subject, html, text, from } = {}) {
    try {
        const emailTransporter = initializeTransporter();
        const mailOptions = {
            from: from || emailConfig.from,
            to,
            subject,
            html,
            text,
        };
        const info = await emailTransporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.response);
        return { success: true, message: "Email sent successfully", messageId: info.messageId };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, message: "Failed to send email", error: error.message };
    }
}

export async function verifyEmailConfig() {
    try {
        const emailTransporter = initializeTransporter();
        await emailTransporter.verify();
        console.log("Email configuration verified successfully");
        return { success: true, message: "Email transporter is ready to send emails" };
    } catch (error) {
        console.error("Email configuration error:", error);
        return { success: false, message: "Email configuration failed", error: error.message };
    }
}
