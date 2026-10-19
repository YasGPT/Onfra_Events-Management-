const crypto = require("crypto");
const { Attendee, Event, AttendeePrivacySetting, AttendeeCheckIn, AttendeeActivityLog, AttendeePasswordResetToken } = require("../models");
const AppError = require("../utils/AppError");
const { hashPassword, comparePassword } = require("../utils/passwordUtils");
const mailService = require("./mailService");
const { Op } = require("sequelize");

const SETUP_TOKEN_TTL_MS = Number(process.env.PASSWORD_SETUP_TOKEN_HOURS || 72) * 60 * 60 * 1000;

/** Mobile digits only, prefixed with + so stored and looked-up values match. */
function normalizePhone(phone) {
    if (!phone) return null;
    const raw = String(phone).replace(/[^\d+]/g, "");
    const digits = raw.replace(/\+/g, "");
    if (!digits) return null;
    return `+${digits}`;
}

/** Stores a single-use hashed password setup token for the attendee. */
async function createSetupToken(attendee) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SETUP_TOKEN_TTL_MS);

    await AttendeePasswordResetToken.destroy({ where: { attendee_id: attendee.id, used_at: null } });
    await AttendeePasswordResetToken.create({
        attendee_id: attendee.id,
        token_hash: await hashPassword(rawToken),
        expires_at: expiresAt,
    });

    // The legacy plain-text columns are no longer used for links.
    await attendee.update({
        password_setup_token: null,
        password_setup_token_expires_at: null,
        email_verified_at: new Date(),
    });

    return { rawToken, expiresAt };
}

/** Creates the setup token and emails the link. Mail failure never blocks approval. */
async function issuePasswordSetupLink(attendee, event, { rescheduled = false } = {}) {
    const { rawToken, expiresAt } = await createSetupToken(attendee);
    const setupUrl = `${mailService.getClientUrl()}/set-password?token=${rawToken}`;

    const mail = await mailService.sendPasswordSetupMail({
        to: attendee.email,
        fullName: attendee.full_name,
        eventName: event ? event.name : "the event",
        setupUrl,
        expiresAt,
        rescheduled,
    });

    await logActivity(
        attendee.event_id,
        attendee.id,
        "password_setup_sent",
        rescheduled ? "Setup Link Re-sent" : "Setup Link Emailed",
        `Password setup link sent to ${attendee.email} (valid ${Math.round(SETUP_TOKEN_TTL_MS / 3600000)}h).`,
        { delivered: mail.delivered, driver: mail.driver, reason: mail.reason || null }
    );

    return { setupUrl, expiresAt, delivered: mail.delivered };
}

async function findEvent(eventId) {
    return Event.findByPk(eventId);
}

/** Admins work inside one event context; never touch another event's attendee. */
function assertEventScope(attendee, expectedEventId) {
    if (expectedEventId && attendee.event_id !== expectedEventId) {
        throw new AppError("This attendee does not belong to the selected event.", 403);
    }
}

async function logActivity(eventId, attendeeId, actionType, title, description = "", details = null) {
    try {
        await AttendeeActivityLog.create({
            event_id: eventId,
            attendee_id: attendeeId,
            action_type: actionType,
            title,
            description,
            details,
            created_at: new Date(),
        });
    } catch (err) {
        console.error("Failed to log attendee activity:", err.message);
    }
}

async function createAttendee(adminId, eventId, data) {
    const {
        full_name,
        email,
        phone,
        password,
        company_name,
        job_title,
        bio,
        website_url,
        linkedin_url,
        whatsapp_url,
        photo_url,
        registration_status = "registered",
        badge_template = "standard",
    } = data;

    if (!full_name || !email) {
        throw new AppError("Full name and email are required.", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const normalizedPhone = normalizePhone(phone);

    // Check duplicate in this event
    const existing = await Attendee.findOne({
        where: { event_id: eventId, email: normalizedEmail },
    });

    if (existing) {
        throw new AppError(`Attendee with email '${normalizedEmail}' is already registered for this event.`, 409);
    }

    if (normalizedPhone) {
        const phoneOwner = await Attendee.findOne({
            where: { event_id: eventId, phone: normalizedPhone },
        });
        if (phoneOwner) {
            throw new AppError(`Mobile number '${normalizedPhone}' is already registered for this event.`, 409);
        }
    }

    const password_hash = password ? await hashPassword(password) : null;
    const qr_token_hash = crypto.randomBytes(32).toString("hex");

    const isPending = registration_status === "pending";

    const attendee = await Attendee.create({
        event_id: eventId,
        registered_by_admin_id: adminId || null,
        full_name: full_name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        password_hash,
        company_name: company_name ? company_name.trim() : null,
        job_title: job_title ? job_title.trim() : null,
        bio: bio ? bio.trim() : null,
        website_url: website_url ? website_url.trim() : null,
        linkedin_url: linkedin_url ? linkedin_url.trim() : null,
        whatsapp_url: whatsapp_url ? whatsapp_url.trim() : null,
        photo_url: photo_url || null,
        qr_token_hash,
        registration_status: isPending ? "pending" : password ? "registered" : "approved",
        badge_template,
        is_active: !isPending,
        registered_at: new Date(),
        approved_at: isPending ? null : new Date(),
        password_setup_at: password ? new Date() : null,
    });

    // Seed default privacy settings
    await AttendeePrivacySetting.bulkCreate([
        { attendee_id: attendee.id, field_name: "email", directory_visible: true, allow_qr_share: true },
        { attendee_id: attendee.id, field_name: "phone", directory_visible: false, allow_qr_share: true },
        { attendee_id: attendee.id, field_name: "company_name", directory_visible: true, allow_qr_share: true },
        { attendee_id: attendee.id, field_name: "job_title", directory_visible: true, allow_qr_share: true },
        { attendee_id: attendee.id, field_name: "qr_sharing", directory_visible: true, allow_qr_share: true },
    ]);

    await logActivity(
        eventId,
        attendee.id,
        "registered",
        "Registration Created",
        isPending ? "Attendee registered with Pending status" : "Attendee successfully registered and activated"
    );

    return getAttendeeById(attendee.id);
}

/**
 * Public registration (mobile app / web form). No password, no admin id:
 * the row is stored as "pending" and only becomes usable after admin approval.
 */
async function createPendingAttendee(eventId, data) {
    return createAttendee(null, eventId, { ...data, registration_status: "pending" });
}

/** Confirmation mail that the submission was received (approval mail comes later). */
async function notifyRegistrationReceived(attendeeId) {
    const attendee = await Attendee.findByPk(attendeeId);
    if (!attendee) throw new AppError("Attendee not found.", 404);

    const event = await findEvent(attendee.event_id);

    return mailService.sendRegistrationReceivedMail({
        to: attendee.email,
        fullName: attendee.full_name,
        eventName: event ? event.name : "the event",
    });
}

async function getAttendeesAdmin(eventId, filters = {}) {
    const where = { event_id: eventId };

    if (filters.search) {
        where[Op.or] = [
            { full_name: { [Op.iLike]: `%${filters.search}%` } },
            { email: { [Op.iLike]: `%${filters.search}%` } },
            { company_name: { [Op.iLike]: `%${filters.search}%` } },
            { phone: { [Op.iLike]: `%${filters.search}%` } },
        ];
    }

    if (filters.status && filters.status !== "all") {
        where.registration_status = filters.status;
    }

    if (filters.company && filters.company.trim()) {
        where.company_name = { [Op.iLike]: `%${filters.company.trim()}%` };
    }

    if (filters.job_title && filters.job_title.trim()) {
        where.job_title = { [Op.iLike]: `%${filters.job_title.trim()}%` };
    }

    if (filters.checkInStatus === "checked_in") {
        where.is_checked_in = true;
    } else if (filters.checkInStatus === "not_checked_in") {
        where.is_checked_in = false;
    }

    if (filters.startDate && filters.endDate) {
        where.registered_at = {
            [Op.between]: [new Date(filters.startDate), new Date(filters.endDate)],
        };
    } else if (filters.startDate) {
        where.registered_at = { [Op.gte]: new Date(filters.startDate) };
    } else if (filters.endDate) {
        where.registered_at = { [Op.lte]: new Date(filters.endDate) };
    }

    return Attendee.findAll({
        where,
        attributes: {
            exclude: ["password_hash", "password_setup_token", "password_setup_token_expires_at"],
        },
        include: [{ model: AttendeePrivacySetting }],
        order: [["created_at", "DESC"]],
    });
}

async function getAttendeeStats(eventId) {
    const total = await Attendee.count({ where: { event_id: eventId } });
    const pending = await Attendee.count({ where: { event_id: eventId, registration_status: "pending" } });
    const approved = await Attendee.count({ where: { event_id: eventId, registration_status: "approved" } });
    const registered = await Attendee.count({ where: { event_id: eventId, registration_status: "registered" } });
    const rejected = await Attendee.count({ where: { event_id: eventId, registration_status: "rejected" } });
    const checkedIn = await Attendee.count({ where: { event_id: eventId, is_checked_in: true } });

    return {
        total,
        pending,
        approved,
        registered,
        rejected,
        checkedIn,
    };
}

async function getAttendeeById(id) {
    const attendee = await Attendee.findByPk(id, {
        attributes: { exclude: ["password_hash"] },
        include: [
            { model: AttendeePrivacySetting },
            { model: AttendeeCheckIn, separate: true, order: [["checked_in_at", "DESC"]] },
            { model: AttendeeActivityLog, separate: true, order: [["created_at", "DESC"]] },
        ],
    });
    if (!attendee) throw new AppError("Attendee not found.", 404);
    return attendee;
}

async function updateAttendeeProfile(attendeeId, data) {
    const attendee = await Attendee.findByPk(attendeeId);
    if (!attendee) throw new AppError("Attendee not found.", 404);

    const allowedUpdates = [
        "full_name",
        "email",
        "phone",
        "company_name",
        "job_title",
        "bio",
        "website_url",
        "linkedin_url",
        "whatsapp_url",
        "photo_url",
        "badge_template",
        "is_active",
        "registration_status",
    ];

    if (data.phone !== undefined) {
        data.phone = normalizePhone(data.phone);
    }

    allowedUpdates.forEach((field) => {
        if (data[field] !== undefined) {
            attendee[field] = data[field];
        }
    });

    await attendee.save();

    await logActivity(
        attendee.event_id,
        attendee.id,
        "profile_updated",
        "Profile Updated",
        `Admin updated attendee information.`
    );

    return getAttendeeById(attendeeId);
}

async function approveAttendee(attendeeId, expectedEventId) {
    const attendee = await Attendee.findByPk(attendeeId);
    if (!attendee) throw new AppError("Attendee not found.", 404);
    assertEventScope(attendee, expectedEventId);
    if (attendee.registration_status === "registered") {
        throw new AppError("This attendee has already completed password setup.", 409);
    }

    await attendee.update({
        registration_status: "approved",
        approved_at: new Date(),
        is_active: true,
        rejection_reason: null,
    });

    const event = await findEvent(attendee.event_id);
    const link = await issuePasswordSetupLink(attendee, event);

    await logActivity(
        attendee.event_id,
        attendee.id,
        "approved",
        "Registration Approved",
        "Attendee was approved by admin and the password setup link was emailed."
    );

    const profile = await getAttendeeById(attendeeId);
    return Object.assign(profile.toJSON ? profile.toJSON() : profile, {
        setup_link: { expires_at: link.expiresAt, delivered: link.delivered },
    });
}

async function resendSetupLink(attendeeId, expectedEventId) {
    const attendee = await Attendee.findByPk(attendeeId);
    if (!attendee) throw new AppError("Attendee not found.", 404);
    assertEventScope(attendee, expectedEventId);

    if (attendee.registration_status === "pending") {
        throw new AppError("Approve this registration before sending a password setup link.", 409);
    }
    if (attendee.registration_status === "registered") {
        throw new AppError("This attendee already created a password. Use reset password instead.", 409);
    }

    const event = await findEvent(attendee.event_id);
    const link = await issuePasswordSetupLink(attendee, event, { rescheduled: true });

    return {
        message: `Password setup link sent to ${attendee.email}.`,
        expires_at: link.expiresAt,
        delivered: link.delivered,
    };
}

async function bulkApproveAttendees(attendeeIds, eventId) {
    if (!Array.isArray(attendeeIds) || attendeeIds.length === 0) {
        throw new AppError("Please provide an array of attendee IDs to approve.", 400);
    }

    const attendees = await Attendee.findAll({
        where: { id: { [Op.in]: attendeeIds }, event_id: eventId },
    });

    const event = await findEvent(eventId);
    let emailed = 0;

    for (const attendee of attendees) {
        await attendee.update({
            registration_status: "approved",
            approved_at: new Date(),
            is_active: true,
            rejection_reason: null,
        });

        const link = await issuePasswordSetupLink(attendee, event);
        if (link.delivered) emailed += 1;

        await logActivity(
            eventId,
            attendee.id,
            "approved",
            "Bulk Approved",
            "Attendee was bulk approved by admin."
        );
    }

    return {
        success: true,
        count: attendees.length,
        emails_delivered: emailed,
        message: `${attendees.length} attendee(s) approved successfully.` +
            (emailed < attendees.length
                ? ` ${attendees.length - emailed} link(s) were generated but not delivered (check mail settings).`
                : ""),
    };
}

async function rejectAttendee(attendeeId, reason = "", expectedEventId) {
    const attendee = await Attendee.findByPk(attendeeId);
    if (!attendee) throw new AppError("Attendee not found.", 404);
    assertEventScope(attendee, expectedEventId);

    const rejectionReason = reason || "Registration declined by administrator";

    await attendee.update({
        registration_status: "rejected",
        rejection_reason: rejectionReason,
        is_active: false,
    });

    await AttendeePasswordResetToken.destroy({ where: { attendee_id: attendee.id, used_at: null } });

    const event = await findEvent(attendee.event_id);
    await mailService.sendRejectionMail({
        to: attendee.email,
        fullName: attendee.full_name,
        eventName: event ? event.name : "the event",
        reason: rejectionReason,
    });

    await logActivity(
        attendee.event_id,
        attendee.id,
        "rejected",
        "Registration Rejected",
        `Reason: ${rejectionReason}`
    );

    return getAttendeeById(attendeeId);
}

async function bulkRejectAttendees(attendeeIds, reason = "", eventId) {
    if (!Array.isArray(attendeeIds) || attendeeIds.length === 0) {
        throw new AppError("Please provide an array of attendee IDs to reject.", 400);
    }

    const attendees = await Attendee.findAll({
        where: { id: { [Op.in]: attendeeIds }, event_id: eventId },
    });

    const event = await findEvent(eventId);

    for (const attendee of attendees) {
        const rejectionReason = reason || "Bulk rejection by administrator";

        await attendee.update({
            registration_status: "rejected",
            rejection_reason: rejectionReason,
            is_active: false,
        });

        await AttendeePasswordResetToken.destroy({ where: { attendee_id: attendee.id, used_at: null } });

        await mailService.sendRejectionMail({
            to: attendee.email,
            fullName: attendee.full_name,
            eventName: event ? event.name : "the event",
            reason: rejectionReason,
        });

        await logActivity(
            eventId,
            attendee.id,
            "rejected",
            "Bulk Rejected",
            `Reason: ${rejectionReason}`
        );
    }

    return { success: true, count: attendees.length, message: `${attendees.length} attendee(s) rejected successfully.` };
}

async function deleteAttendee(attendeeId) {
    const attendee = await Attendee.findByPk(attendeeId);
    if (!attendee) throw new AppError("Attendee not found.", 404);

    await attendee.destroy();
    return { success: true, message: "Attendee deleted successfully." };
}

async function bulkDeleteAttendees(attendeeIds, eventId) {
    if (!Array.isArray(attendeeIds) || attendeeIds.length === 0) {
        throw new AppError("Please provide an array of attendee IDs to delete.", 400);
    }

    const count = await Attendee.destroy({
        where: { id: { [Op.in]: attendeeIds }, event_id: eventId },
    });

    return { success: true, count, message: `${count} attendee(s) deleted successfully.` };
}

async function checkInAttendee(attendeeId, gateLocation = "Main Gate", method = "manual", adminId = null) {
    const attendee = await Attendee.findByPk(attendeeId);
    if (!attendee) throw new AppError("Attendee not found.", 404);

    const nextCount = (attendee.check_in_count || 0) + 1;
    const now = new Date();

    await attendee.update({
        is_checked_in: true,
        checked_in_at: now,
        check_in_location: gateLocation,
        check_in_count: nextCount,
    });

    await AttendeeCheckIn.create({
        event_id: attendee.event_id,
        attendee_id: attendee.id,
        checked_in_at: now,
        gate_location: gateLocation,
        method,
        performed_by_admin_id: adminId,
    });

    await logActivity(
        attendee.event_id,
        attendee.id,
        "check_in",
        `Checked In (#${nextCount})`,
        `Checked in at ${gateLocation} via ${method.toUpperCase()}`
    );

    return getAttendeeById(attendeeId);
}

async function checkOutAttendee(attendeeId) {
    const attendee = await Attendee.findByPk(attendeeId);
    if (!attendee) throw new AppError("Attendee not found.", 404);

    await attendee.update({
        is_checked_in: false,
    });

    await logActivity(
        attendee.event_id,
        attendee.id,
        "check_out",
        "Checked Out",
        "Attendee marked as checked out / departed."
    );

    return getAttendeeById(attendeeId);
}

async function qrCheckIn(eventId, qrTokenHash, gateLocation = "QR Scanner Gate", adminId = null) {
    if (!qrTokenHash) {
        throw new AppError("QR token is required for check-in.", 400);
    }

    const attendee = await Attendee.findOne({
        where: { event_id: eventId, qr_token_hash: qrTokenHash.trim() },
    });

    if (!attendee) {
        throw new AppError("No attendee found matching this QR code for this event.", 404);
    }

    return checkInAttendee(attendee.id, gateLocation, "qr", adminId);
}

async function printBadge(attendeeId, badgeTemplate = "standard") {
    const attendee = await Attendee.findByPk(attendeeId);
    if (!attendee) throw new AppError("Attendee not found.", 404);

    const now = new Date();
    await attendee.update({
        is_badge_printed: true,
        badge_printed_at: now,
        badge_template: badgeTemplate,
    });

    await logActivity(
        attendee.event_id,
        attendee.id,
        "badge_printed",
        "Badge Printed",
        `Badge generated using template '${badgeTemplate}'`
    );

    return getAttendeeById(attendeeId);
}

async function bulkPrintBadges(attendeeIds, badgeTemplate = "standard", eventId) {
    if (!Array.isArray(attendeeIds) || attendeeIds.length === 0) {
        throw new AppError("Please provide an array of attendee IDs.", 400);
    }

    const attendees = await Attendee.findAll({
        where: { id: { [Op.in]: attendeeIds }, event_id: eventId },
    });

    const now = new Date();
    for (const attendee of attendees) {
        await attendee.update({
            is_badge_printed: true,
            badge_printed_at: now,
            badge_template: badgeTemplate,
        });

        await logActivity(
            eventId,
            attendee.id,
            "badge_printed",
            "Badge Generated",
            `Badge generated in bulk using template '${badgeTemplate}'`
        );
    }

    return { success: true, count: attendees.length, message: `Badges generated for ${attendees.length} attendee(s).` };
}

async function regenerateQr(attendeeId) {
    const attendee = await Attendee.findByPk(attendeeId);
    if (!attendee) throw new AppError("Attendee not found.", 404);

    const newQr = crypto.randomBytes(32).toString("hex");
    await attendee.update({
        qr_token_hash: newQr,
    });

    await logActivity(
        attendee.event_id,
        attendee.id,
        "qr_regenerated",
        "QR Code Regenerated",
        "Previous QR invalidated, new QR code issued."
    );

    return getAttendeeById(attendeeId);
}

async function sendEmailToAttendee(attendeeId, subject, message, type = "custom") {
    const attendee = await Attendee.findByPk(attendeeId);
    if (!attendee) throw new AppError("Attendee not found.", 404);

    if (!subject || !subject.trim()) {
        throw new AppError("Email subject is required.", 400);
    }

    if (type === "password_setup") {
        const event = await findEvent(attendee.event_id);
        await attendee.update({ registration_status: "approved", is_active: true });
        const link = await issuePasswordSetupLink(attendee, event, { rescheduled: true });
        return {
            success: link.delivered,
            message: link.delivered
                ? `Password setup link sent to ${attendee.email}.`
                : "Setup link was generated but the email could not be delivered (check mail settings).",
        };
    }

    const mail = await mailService.sendCustomMail({ to: attendee.email, subject, message });

    await logActivity(
        attendee.event_id,
        attendee.id,
        "email_sent",
        `Email Sent: ${subject}`,
        message,
        { subject, type, sent_to: attendee.email, delivered: mail.delivered }
    );

    return {
        success: mail.delivered,
        message: mail.delivered
            ? `Email '${subject}' dispatched to ${attendee.email}.`
            : `Email '${subject}' was logged but not delivered (check mail settings).`,
    };
}

async function bulkSendEmail(attendeeIds, subject, message, eventId) {
    if (!Array.isArray(attendeeIds) || attendeeIds.length === 0) {
        throw new AppError("Please provide an array of attendee IDs.", 400);
    }
    if (!subject || !subject.trim()) {
        throw new AppError("Email subject is required.", 400);
    }

    const attendees = await Attendee.findAll({
        where: { id: { [Op.in]: attendeeIds }, event_id: eventId },
    });

    let delivered = 0;

    for (const attendee of attendees) {
        const mail = await mailService.sendCustomMail({ to: attendee.email, subject, message });
        if (mail.delivered) delivered += 1;

        await logActivity(
            eventId,
            attendee.id,
            "email_sent",
            `Bulk Email: ${subject}`,
            message,
            { subject, sent_to: attendee.email, delivered: mail.delivered }
        );
    }

    return {
        success: true,
        count: attendees.length,
        emails_delivered: delivered,
        message: `Email dispatched to ${attendees.length} attendee(s).`,
    };
}

/** Admin action: issue a fresh link for an approved (or already registered) attendee. */
async function resetPasswordToken(attendeeId) {
    const attendee = await Attendee.findByPk(attendeeId);
    if (!attendee) throw new AppError("Attendee not found.", 404);

    const event = await findEvent(attendee.event_id);
    const link = await issuePasswordSetupLink(attendee, event, { rescheduled: true });

    return {
        success: true,
        expires_at: link.expiresAt,
        delivered: link.delivered,
        message: `New password setup link sent to ${attendee.email}.`,
        attendee: await getAttendeeById(attendeeId),
    };
}

/**
 * Public: validate a password setup link. Only non-sensitive details are returned.
 */
async function getSetupLinkDetails(rawToken) {
    if (!rawToken) throw new AppError("Setup token is required.", 400);

    const tokens = await AttendeePasswordResetToken.findAll({
        where: { used_at: null },
        attributes: ["id", "token_hash", "expires_at", "attendee_id"],
    });

    for (const token of tokens) {
        if (await comparePassword(rawToken, token.token_hash)) {
            if (new Date(token.expires_at) < new Date()) {
                throw new AppError("This link has expired. Ask the event team to send a new one.", 410);
            }
            const attendee = await Attendee.findByPk(token.attendee_id, {
                attributes: ["id", "event_id", "full_name", "email", "registration_status", "password_hash"],
            });
            if (!attendee) throw new AppError("Invalid setup link.", 400);

            const event = await findEvent(attendee.event_id);
            return {
                attendee_id: attendee.id,
                full_name: attendee.full_name,
                email: attendee.email,
                already_setup: Boolean(attendee.password_hash),
                event: event ? { id: event.id, name: event.name, business_code: event.business_code } : null,
                expires_at: token.expires_at,
            };
        }
    }

    throw new AppError("This link is not valid. Check the address or request a new link.", 400);
}

/**
 * Public: consume the token and store the attendee password.
 * Status moves pending/approved -> registered so the mobile app can log in.
 */
async function setAttendeePassword(rawToken, password) {
    if (!rawToken) throw new AppError("Setup token is required.", 400);
    if (!password || password.trim().length < 8) {
        throw new AppError("Password must be at least 8 characters long.", 400);
    }

    const tokens = await AttendeePasswordResetToken.findAll({
        where: { used_at: null },
        attributes: ["id", "token_hash", "expires_at", "attendee_id"],
    });

    for (const token of tokens) {
        if (!(await comparePassword(rawToken, token.token_hash))) continue;

        if (new Date(token.expires_at) < new Date()) {
            throw new AppError("This link has expired. Ask the event team to send a new one.", 410);
        }

        const attendee = await Attendee.findByPk(token.attendee_id);
        if (!attendee) throw new AppError("Invalid setup link.", 400);

        await attendee.update({
            password_hash: await hashPassword(password),
            password_setup_at: new Date(),
            registration_status: "registered",
            is_active: true,
        });

        await token.update({ used_at: new Date() });

        await logActivity(
            attendee.event_id,
            attendee.id,
            "password_set",
            "Password Created",
            "Attendee created a password through the setup link."
        );

        return {
            id: attendee.id,
            full_name: attendee.full_name,
            email: attendee.email,
            registration_status: attendee.registration_status,
        };
    }

    throw new AppError("This link is not valid. Check the address or request a new link.", 400);
}

async function updatePrivacySettings(attendeeId, settings = []) {
    let settingsArray = [];
    if (Array.isArray(settings)) {
        settingsArray = settings;
    } else if (settings && typeof settings === "object") {
        settingsArray = Object.entries(settings).map(([key, val]) => ({
            field_name: key,
            directory_visible: key === "qr_sharing" ? true : Boolean(val),
            allow_qr_share: key === "qr_sharing" ? Boolean(val) : true,
        }));
    }

    for (const setting of settingsArray) {
        if (setting.field_name) {
            await AttendeePrivacySetting.upsert({
                attendee_id: attendeeId,
                field_name: setting.field_name,
                directory_visible: setting.directory_visible ?? true,
                allow_qr_share: setting.allow_qr_share ?? true,
            });
        }
    }

    const attendee = await Attendee.findByPk(attendeeId);
    if (attendee) {
        await logActivity(
            attendee.event_id,
            attendee.id,
            "privacy_updated",
            "Privacy Settings Updated",
            "Attendee directory and QR visibility rules modified."
        );
    }

    return AttendeePrivacySetting.findAll({ where: { attendee_id: attendeeId } });
}

async function toggleAttendeeStatus(attendeeId, is_active) {
    const attendee = await Attendee.findByPk(attendeeId);
    if (!attendee) throw new AppError("Attendee not found.", 404);

    await attendee.update({ is_active });

    await logActivity(
        attendee.event_id,
        attendee.id,
        "status_changed",
        is_active ? "Account Activated" : "Account Deactivated",
        `Attendee status changed to ${is_active ? "active" : "inactive"}.`
    );

    return {
        id: attendee.id,
        is_active: attendee.is_active,
        message: `Attendee account ${is_active ? "activated" : "deactivated"} successfully.`,
    };
}

async function getAttendeeDirectory(eventId, currentAttendeeId, filters = {}) {
    const where = { event_id: eventId, is_active: true };

    if (filters.search) {
        where[Op.or] = [
            { full_name: { [Op.iLike]: `%${filters.search}%` } },
            { company_name: { [Op.iLike]: `%${filters.search}%` } },
            { job_title: { [Op.iLike]: `%${filters.search}%` } },
        ];
    }

    const attendees = await Attendee.findAll({
        where,
        attributes: [
            "id",
            "full_name",
            "email",
            "phone",
            "company_name",
            "job_title",
            "bio",
            "website_url",
            "linkedin_url",
            "whatsapp_url",
            "photo_url",
            "photo_asset_id",
            "qr_token_hash",
        ],
        include: [{ model: AttendeePrivacySetting }],
        order: [["full_name", "ASC"]],
    });

    // Apply privacy masking for directory
    return attendees.map((a) => {
        const plain = a.toJSON();
        const settings = plain.AttendeePrivacySettings || [];

        const isEmailVisible = settings.find((s) => s.field_name === "email")?.directory_visible ?? true;
        const isPhoneVisible = settings.find((s) => s.field_name === "phone")?.directory_visible ?? false;

        if (!isEmailVisible && plain.id !== currentAttendeeId) {
            delete plain.email;
        }
        if (!isPhoneVisible && plain.id !== currentAttendeeId) {
            delete plain.phone;
        }

        delete plain.AttendeePrivacySettings;
        return plain;
    });
}

module.exports = {
    createAttendee,
    createPendingAttendee,
    notifyRegistrationReceived,
    getAttendeesAdmin,
    getAttendeeStats,
    getAttendeeById,
    updateAttendeeProfile,
    deleteAttendee,
    bulkDeleteAttendees,
    approveAttendee,
    bulkApproveAttendees,
    rejectAttendee,
    bulkRejectAttendees,
    checkInAttendee,
    checkOutAttendee,
    qrCheckIn,
    printBadge,
    bulkPrintBadges,
    regenerateQr,
    sendEmailToAttendee,
    bulkSendEmail,
    resetPasswordToken,
    resendSetupLink,
    getSetupLinkDetails,
    setAttendeePassword,
    updatePrivacySettings,
    toggleAttendeeStatus,
    getAttendeeDirectory,
};
