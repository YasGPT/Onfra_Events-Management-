const AppError = require("../utils/AppError");

const MAIL_DRIVER = process.env.MAIL_DRIVER || "log";

let transporter = null;

function getTransporter() {
    if (transporter) return transporter;

    // Lazy require so the app still boots when the package is not installed yet.
    let nodemailer;
    try {
        nodemailer = require("nodemailer");
    } catch {
        console.warn("[mail] nodemailer is not installed - emails will only be logged.");
        return null;
    }

    if (MAIL_DRIVER !== "smtp") {
        return null;
    }

    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || "false") === "true",
        auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
    });

    return transporter;
}

/** Public base URL used to build the links that go inside the emails. */
function getClientUrl() {
    return (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");
}

async function sendMail({ to, subject, html, text }) {
    if (!to) {
        throw new AppError("Recipient email address is required.", 400);
    }

    const body = text || String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    const mailTransport = getTransporter();

    if (!mailTransport) {
        // Development fallback: the message is recorded instead of being delivered.
        console.log("\n┌─[mail:log]──────────────────────────────────────────");
        console.log(`│ to      : ${to}`);
        console.log(`│ subject : ${subject}`);
        console.log(`│ body    : ${body}`);
        console.log("└────────────────────────────────────────────────────────\n");
        return { delivered: false, driver: "log", to, subject, reason: "MAIL_DRIVER is not set to smtp" };
    }

    try {
        await mailTransport.sendMail({
            from: process.env.MAIL_FROM || process.env.SMTP_USER,
            to,
            subject,
            html,
            text,
        });
    } catch (error) {
        // A mail outage must never break the approval workflow.
        console.error(`[mail] delivery failed for ${to}: ${error.message}`);
        return { delivered: false, driver: "smtp", to, subject, reason: error.message };
    }

    return { delivered: true, driver: "smtp", to, subject };
}

function wrapTemplate(title, highlight, paragraphs, cta) {
    const blocks = (Array.isArray(paragraphs) ? paragraphs : [paragraphs])
        .map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155">${p}</p>`)
        .join("");

    const button = cta
        ? `<a href="${cta.url}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:15px">${cta.label}</a>
           <p style="margin:14px 0 0;font-size:13px;color:#64748b;word-break:break-all">${cta.url}</p>`
        : "";

    return `
    <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;background:#f1f5f9;padding:28px 16px">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:#0f172a;padding:20px 26px">
          <p style="margin:0;color:#93c5fd;font-size:12px;letter-spacing:1.4px;text-transform:uppercase">CONFRA</p>
          <h2 style="margin:6px 0 0;color:#ffffff;font-size:20px">${highlight}</h2>
        </div>
        <div style="padding:26px">
          <h3 style="margin:0 0 16px;font-size:17px;color:#0f172a">${title}</h3>
          ${blocks}
          ${button}
        </div>
      </div>
    </div>`;
}

/** Email sent right after a public registration is submitted. */
async function sendRegistrationReceivedMail({ to, fullName, eventName }) {
    return sendMail({
        to,
        subject: `We received your registration – ${eventName}`,
        html: wrapTemplate(
            "Registration submitted",
            eventName,
            [
                `Hi ${fullName},`,
                "Your registration has been submitted and is now <strong>pending administrator approval</strong>. You will receive a second email with a link to create your password once it is approved.",
            ]
        ),
    });
}

/** Email carrying the password-setup link. */
async function sendPasswordSetupMail({ to, fullName, eventName, setupUrl, expiresAt, rescheduled = false }) {
    const expiry = expiresAt ? new Date(expiresAt).toUTCString() : "";
    return sendMail({
        to,
        subject: `${rescheduled ? "New link" : "Create your password"} – ${eventName}`,
        html: wrapTemplate(
            rescheduled ? "Here is a fresh password setup link" : "Your registration is approved",
            eventName,
            [
                `Hi ${fullName},`,
                rescheduled
                    ? "Your previous password setup link was re-issued by the event team. Use the new link below; the old one no longer works."
                    : "Your registration was <strong>approved</strong> by the event team. Click the link below to create your password.",
                "Once the password is set you can sign in to the attendee app with your email address or mobile number.",
                `<p style="margin:0 0 14px;font-size:13px;color:#64748b">This link expires on ${expiry}.</p>`,
            ],
            { url: setupUrl, label: "Create password" }
        ),
    });
}

/** Email sent when a registration is rejected. */
async function sendRejectionMail({ to, fullName, eventName, reason }) {
    return sendMail({
        to,
        subject: `Registration update – ${eventName}`,
        html: wrapTemplate(
            "Registration not approved",
            eventName,
            [
                `Hi ${fullName},`,
                "After reviewing your submission, the event team was not able to approve your registration.",
                reason ? `<p style="margin:0 0 14px;font-size:15px;color:#334155"><strong>Reason:</strong> ${reason}</p>` : "",
                "If you think this is a mistake, reply to the organiser contact listed on the event page.",
            ]
        ),
    });
}

/** Free-form message typed by the admin on the Attendees page. */
async function sendCustomMail({ to, subject, message }) {
    return sendMail({
        to,
        subject,
        html: wrapTemplate("Message from the event team", subject, [String(message || "").replace(/\n/g, "<br />")]),
    });
}

module.exports = {
    sendMail,
    getClientUrl,
    sendRegistrationReceivedMail,
    sendPasswordSetupMail,
    sendRejectionMail,
    sendCustomMail,
};
