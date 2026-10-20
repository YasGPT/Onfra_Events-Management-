const nodemailer = require("nodemailer");

/**
 * Creates nodemailer transport if SMTP config is present,
 * otherwise falls back to a development console logger.
 */
function getTransporter() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return null;
}

/**
 * Sends a generic email with fallback to development console log.
 */
async function sendMail({ to, subject, html, text }) {
    const transporter = getTransporter();
    const fromAddress = process.env.EMAIL_FROM || '"Confra Events" <no-reply@confra.io>';

    if (transporter) {
        try {
            const info = await transporter.sendMail({
                from: fromAddress,
                to,
                subject,
                text,
                html,
            });
            console.log(`[EMAIL SENT] To: ${to} | MessageId: ${info.messageId}`);
            return info;
        } catch (error) {
            console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, error.message);
            // Don't crash request if email provider fails
            return null;
        }
    } else {
        console.log(`\n================== [EMAIL SERVICE (DEV MODE)] ==================`);
        console.log(`TO: ${to}`);
        console.log(`SUBJECT: ${subject}`);
        console.log(`MESSAGE:\n${text || html}`);
        console.log(`=================================================================\n`);
        return { messageId: "dev-mock-id" };
    }
}

/**
 * Send Password Reset Code / OTP
 */
async function sendPasswordResetEmail({ to, fullName, resetCode, eventName }) {
    const subject = `Password Reset Code for ${eventName || "Confra"}`;
    const text = `Hi ${fullName || "Attendee"},\n\nYour password reset code is: ${resetCode}\n\nThis code is valid for 15 minutes. If you did not request this, you can ignore this email.\n\nBest regards,\n${eventName || "Confra Event Team"}`;
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #4F46E5;">Password Reset Request</h2>
            <p>Hi <strong>${fullName || "Attendee"}</strong>,</p>
            <p>We received a request to reset your password for <strong>${eventName || "Confra"}</strong>.</p>
            <div style="background-color: #F3F4F6; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
                <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #1F2937;">${resetCode}</span>
            </div>
            <p style="color: #6B7280; font-size: 14px;">This code will expire in <strong>15 minutes</strong>. If you did not make this request, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
            <p style="font-size: 12px; color: #9CA3AF;">Confra Event Management & Networking</p>
        </div>
    `;

    return sendMail({ to, subject, html, text });
}

/**
 * Send Approval Welcome Email to Attendee
 */
async function sendRegistrationApprovedEmail({ to, fullName, eventName, phone }) {
    const subject = `Registration Approved - Welcome to ${eventName || "Confra"}!`;
    const text = `Hi ${fullName || "Attendee"},\n\nCongratulations! Your registration for ${eventName || "Confra"} has been approved by the organizer.\n\nYou can now log in to the Attendee mobile app using your Mobile Number (${phone}) and the password you set during registration.\n\nBest regards,\n${eventName || "Confra Event Team"}`;
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #059669;">Your Registration is Approved! 🎉</h2>
            <p>Hi <strong>${fullName || "Attendee"}</strong>,</p>
            <p>We are delighted to let you know that your registration for <strong>${eventName || "Confra"}</strong> has been approved by the organizer.</p>
            <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 12px 16px; margin: 20px 0;">
                <p style="margin: 0; color: #065F46;"><strong>Login Instructions:</strong></p>
                <p style="margin: 4px 0 0 0; color: #047857; font-size: 14px;">Open the Confra Attendee Mobile App and log in with your registered mobile number (<strong>${phone}</strong>) and the password you created during registration.</p>
            </div>
            <p>See you at the event!</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
            <p style="font-size: 12px; color: #9CA3AF;">Confra Event Management & Networking</p>
        </div>
    `;

    return sendMail({ to, subject, html, text });
}

module.exports = {
    sendMail,
    sendPasswordResetEmail,
    sendRegistrationApprovedEmail,
};
