const crypto = require("crypto");
const { Attendee, AttendeePrivacySetting, Event, EventSetting } = require("../models");
const AppError = require("../utils/AppError");
const { hashPassword } = require("../utils/passwordUtils");
const { Op } = require("sequelize");
const { sendRegistrationApprovedEmail } = require("../utils/emailService");

/**
 * Admin directly creates and pre-approves an Attendee
 */
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
        whatsapp_url,
    } = data;

    if (!full_name || !email || !password) {
        throw new AppError("Full name, email, and password are required.", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone ? phone.trim() : null;

    // Check duplicate in this event
    const existing = await Attendee.findOne({
        where: { event_id: eventId, email: normalizedEmail },
    });

    if (existing) {
        throw new AppError(`Attendee with email '${normalizedEmail}' is already registered for this event.`, 409);
    }

    const password_hash = await hashPassword(password);
    const qr_token_hash = crypto.randomBytes(32).toString("hex");

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
        website_url,
        whatsapp_url,
        qr_token_hash,
        registration_status: "registered",
        is_active: true,
        registered_at: new Date(),
    });

    // Seed default privacy settings
    await AttendeePrivacySetting.bulkCreate([
        { attendee_id: attendee.id, field_name: "email", directory_visible: true, allow_qr_share: true },
        { attendee_id: attendee.id, field_name: "phone", directory_visible: false, allow_qr_share: true },
        { attendee_id: attendee.id, field_name: "company_name", directory_visible: true, allow_qr_share: true },
        { attendee_id: attendee.id, field_name: "job_title", directory_visible: true, allow_qr_share: true },
    ]);

    return getAttendeeById(attendee.id);
}

/**
 * Public Attendee Registration via Event QR Code / Web Form.
 * Sets status to "pending" and is_active to false until organizer approves.
 */
async function publicRegisterAttendee(eventId, data) {
    const {
        full_name,
        email,
        phone,
        password,
        company_name,
        job_title,
        bio,
        website_url,
        whatsapp_url,
    } = data;

    if (!full_name || !email || !phone || !password) {
        throw new AppError("Full name, email, mobile number, and password are required.", 400);
    }

    // Sanitize eventId (strip accidental angle brackets < > or whitespace)
    const cleanEventId = typeof eventId === "string" ? eventId.replace(/[<>]/g, "").trim() : eventId;

    // 1. Verify Event exists and is active
    const event = await Event.findByPk(cleanEventId);
    if (!event) {
        throw new AppError("Event not found.", 404);
    }
    if (!event.is_active) {
        throw new AppError("This event is currently inactive and not accepting registrations.", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    // 2. Check duplicate email or phone in this event
    const existing = await Attendee.findOne({
        where: {
            event_id: cleanEventId,
            [Op.or]: [
                { email: normalizedEmail },
                { phone: normalizedPhone },
            ],
        },
    });

    if (existing) {
        if (existing.email === normalizedEmail) {
            throw new AppError(`An attendee with email '${normalizedEmail}' is already registered for this event.`, 409);
        }
        if (existing.phone === normalizedPhone) {
            throw new AppError(`An attendee with mobile number '${normalizedPhone}' is already registered for this event.`, 409);
        }
    }

    // 3. Check Event Settings for registration rules
    const regSetting = await EventSetting.findOne({
        where: { event_id: cleanEventId, setting_key: "registration" },
    });
    const regConfig = regSetting && regSetting.setting_value ? regSetting.setting_value : {};
    if (regConfig.allow_public_registration === false || regConfig.registration_closed === true) {
        throw new AppError("Public registration is currently closed for this event.", 403);
    }
    const requireApproval = regConfig.require_admin_approval !== false; // default true

    const password_hash = await hashPassword(password);
    const qr_token_hash = crypto.randomBytes(32).toString("hex");

    const attendee = await Attendee.create({
        event_id: cleanEventId,
        registered_by_admin_id: null,
        full_name: full_name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        password_hash,
        company_name: company_name ? company_name.trim() : null,
        job_title: job_title ? job_title.trim() : null,
        bio: bio ? bio.trim() : null,
        website_url,
        whatsapp_url,
        qr_token_hash,
        registration_status: requireApproval ? "pending" : "registered",
        is_active: !requireApproval,
        registered_at: new Date(),
    });

    // Seed default privacy settings
    await AttendeePrivacySetting.bulkCreate([
        { attendee_id: attendee.id, field_name: "email", directory_visible: true, allow_qr_share: true },
        { attendee_id: attendee.id, field_name: "phone", directory_visible: false, allow_qr_share: true },
        { attendee_id: attendee.id, field_name: "company_name", directory_visible: true, allow_qr_share: true },
        { attendee_id: attendee.id, field_name: "job_title", directory_visible: true, allow_qr_share: true },
    ]);

    return {
        id: attendee.id,
        event_id: attendee.event_id,
        full_name: attendee.full_name,
        email: attendee.email,
        phone: attendee.phone,
        registration_status: attendee.registration_status,
        is_active: attendee.is_active,
        registered_at: attendee.registered_at,
        message: requireApproval
            ? "Registration submitted successfully. Your request is pending approval by the event organizer."
            : "Registration successful! Your account is active and you can now log in.",
    };
}

/**
 * Admin approves a pending attendee registration
 */
async function approveAttendee(eventId, attendeeId) {
    const cleanEventId = typeof eventId === "string" ? eventId.replace(/[<>]/g, "").trim() : eventId;
    const cleanAttendeeId = typeof attendeeId === "string" ? attendeeId.replace(/[<>]/g, "").trim() : attendeeId;

    const attendee = await Attendee.findOne({
        where: { id: cleanAttendeeId, event_id: cleanEventId },
    });

    if (!attendee) {
        throw new AppError("Attendee not found in this event.", 404);
    }

    await attendee.update({
        registration_status: "registered",
        is_active: true,
    });

    // Fetch Event name for email notification
    const event = await Event.findByPk(cleanEventId);
    const eventName = event ? event.name : "Confra Event";

    // Send email notification (non-blocking)
    sendRegistrationApprovedEmail({
        to: attendee.email,
        fullName: attendee.full_name,
        eventName,
        phone: attendee.phone,
    }).catch((err) => console.error("Approval email notification error:", err.message));

    return {
        id: attendee.id,
        full_name: attendee.full_name,
        email: attendee.email,
        phone: attendee.phone,
        registration_status: "registered",
        is_active: true,
        message: "Attendee approved successfully. An approval notification has been sent.",
    };
}

/**
 * Admin rejects a pending attendee registration
 */
async function rejectAttendee(eventId, attendeeId, reason) {
    const cleanEventId = typeof eventId === "string" ? eventId.replace(/[<>]/g, "").trim() : eventId;
    const cleanAttendeeId = typeof attendeeId === "string" ? attendeeId.replace(/[<>]/g, "").trim() : attendeeId;

    const attendee = await Attendee.findOne({
        where: { id: cleanAttendeeId, event_id: cleanEventId },
    });

    if (!attendee) {
        throw new AppError("Attendee not found in this event.", 404);
    }

    await attendee.update({
        registration_status: "rejected",
        is_active: false,
    });

    return {
        id: attendee.id,
        full_name: attendee.full_name,
        email: attendee.email,
        registration_status: "rejected",
        is_active: false,
        reason: reason || "Registration request rejected by event organizer.",
        message: "Attendee registration has been rejected.",
    };
}

/**
 * Admin Reception / Helpdesk resets an attendee's password directly
 */
async function adminResetPassword(eventId, attendeeId, newPassword) {
    const cleanEventId = typeof eventId === "string" ? eventId.replace(/[<>]/g, "").trim() : eventId;
    const cleanAttendeeId = typeof attendeeId === "string" ? attendeeId.replace(/[<>]/g, "").trim() : attendeeId;

    const attendee = await Attendee.findOne({
        where: { id: cleanAttendeeId, event_id: cleanEventId },
    });

    if (!attendee) {
        throw new AppError("Attendee not found in this event.", 404);
    }

    const tempPassword = newPassword || `Confra@${Math.floor(1000 + Math.random() * 9000)}`;
    const password_hash = await hashPassword(tempPassword);

    await attendee.update({ password_hash });

    return {
        id: attendee.id,
        full_name: attendee.full_name,
        email: attendee.email,
        phone: attendee.phone,
        temporary_password: tempPassword,
        message: "Attendee password reset successfully by administrator.",
    };
}

async function getAttendeesAdmin(eventId, filters = {}) {
    const where = { event_id: eventId };

    // Support filtering by registration status: pending, registered, rejected
    if (filters.status) {
        const s = String(filters.status).trim().toLowerCase();
        if (s.startsWith("pend")) {
            where.registration_status = "pending";
        } else if (s.startsWith("reg") || s.startsWith("appr")) {
            where.registration_status = "registered";
        } else if (s.startsWith("rej")) {
            where.registration_status = "rejected";
        } else {
            where.registration_status = s;
        }
    }

    if (filters.is_active !== undefined) {
        where.is_active = filters.is_active === "true" || filters.is_active === true;
    }

    if (filters.search) {
        where[Op.or] = [
            { full_name: { [Op.iLike]: `%${filters.search}%` } },
            { email: { [Op.iLike]: `%${filters.search}%` } },
            { company_name: { [Op.iLike]: `%${filters.search}%` } },
            { phone: { [Op.iLike]: `%${filters.search}%` } },
        ];
    }

    return Attendee.findAll({
        where,
        attributes: { exclude: ["password_hash"] },
        order: [["created_at", "DESC"]],
    });
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
            "whatsapp_url",
            "photo_asset_id",
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

async function getAttendeeById(id) {
    const attendee = await Attendee.findByPk(id, {
        attributes: { exclude: ["password_hash"] },
        include: [AttendeePrivacySetting],
    });
    if (!attendee) throw new AppError("Attendee not found.", 404);
    return attendee;
}

async function updateAttendeeProfile(attendeeId, data) {
    const attendee = await Attendee.findByPk(attendeeId);
    if (!attendee) throw new AppError("Attendee not found.", 404);

    const allowedUpdates = [
        "full_name",
        "company_name",
        "job_title",
        "bio",
        "website_url",
        "whatsapp_url",
    ];

    allowedUpdates.forEach((field) => {
        if (data[field] !== undefined) {
            attendee[field] = data[field];
        }
    });

    await attendee.save();
    return getAttendeeById(attendeeId);
}

async function updatePrivacySettings(attendeeId, settings = []) {
    for (const setting of settings) {
        if (setting.field_name) {
            await AttendeePrivacySetting.upsert({
                attendee_id: attendeeId,
                field_name: setting.field_name,
                directory_visible: setting.directory_visible ?? true,
                allow_qr_share: setting.allow_qr_share ?? true,
            });
        }
    }
    return AttendeePrivacySetting.findAll({ where: { attendee_id: attendeeId } });
}

async function toggleAttendeeStatus(attendeeId, is_active) {
    const attendee = await Attendee.findByPk(attendeeId);
    if (!attendee) throw new AppError("Attendee not found.", 404);

    await attendee.update({ is_active });
    return {
        id: attendee.id,
        is_active: attendee.is_active,
        message: `Attendee account ${is_active ? "activated" : "deactivated"} successfully.`,
    };
}

module.exports = {
    createAttendee,
    publicRegisterAttendee,
    approveAttendee,
    rejectAttendee,
    adminResetPassword,
    getAttendeesAdmin,
    getAttendeeDirectory,
    getAttendeeById,
    updateAttendeeProfile,
    updatePrivacySettings,
    toggleAttendeeStatus,
};
