const crypto = require("crypto");
const { Attendee, AttendeePrivacySetting } = require("../models");
const AppError = require("../utils/AppError");
const { hashPassword } = require("../utils/passwordUtils");
const { Op } = require("sequelize");

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
        phone,
        password_hash,
        company_name,
        job_title,
        bio,
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

async function createPendingAttendee(eventId, data) {
    const {
        full_name,
        email,
        phone,
        company_name,
        job_title,
        bio,
        website_url,
        whatsapp_url,
    } = data;

    const normalizedEmail = email.trim().toLowerCase();

    // Check duplicate in this event
    const existing = await Attendee.findOne({
        where: { event_id: eventId, email: normalizedEmail },
    });

    if (existing) {
        throw new AppError(`Attendee with email '${normalizedEmail}' is already registered for this event.`, 409);
    }

    const qr_token_hash = crypto.randomBytes(32).toString("hex");

    const attendee = await Attendee.create({
        event_id: eventId,
        registered_by_admin_id: null,
        full_name: full_name.trim(),
        email: normalizedEmail,
        phone,
        password_hash: null, // No password yet - will be set after approval
        company_name,
        job_title,
        bio,
        website_url,
        whatsapp_url,
        qr_token_hash,
        registration_status: "pending",
        is_active: false, // Inactive until approved
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

async function approveAttendee(attendeeId) {
    const attendee = await Attendee.findByPk(attendeeId);
    if (!attendee) {
        throw new AppError("Attendee not found.", 404);
    }

    if (attendee.registration_status !== "pending") {
        throw new AppError("Attendee is not in pending status.", 400);
    }

    // Update status to approved
    await attendee.update({
        registration_status: "approved",
        is_active: true,
    });

    // Generate password setup token
    const passwordSetupToken = crypto.randomBytes(32).toString("hex");
    const passwordSetupExpiry = new Date();
    passwordSetupExpiry.setHours(passwordSetupExpiry.getHours() + 24); // 24 hours

    await attendee.update({
        password_setup_token: passwordSetupToken,
        password_setup_token_expires_at: passwordSetupExpiry,
    });

    return {
        attendee: getAttendeeById(attendeeId),
        passwordSetupToken,
        passwordSetupExpiry,
    };
}

async function setPassword(attendeeId, token, password) {
    const attendee = await Attendee.findByPk(attendeeId);
    if (!attendee) {
        throw new AppError("Attendee not found.", 404);
    }

    if (attendee.registration_status !== "approved") {
        throw new AppError("Attendee must be approved before setting password.", 400);
    }

    if (attendee.password_setup_token !== token) {
        throw new AppError("Invalid password setup token.", 400);
    }

    if (new Date() > new Date(attendee.password_setup_token_expires_at)) {
        throw new AppError("Password setup token has expired.", 400);
    }

    const password_hash = await hashPassword(password);

    await attendee.update({
        password_hash,
        password_setup_token: null,
        password_setup_token_expires_at: null,
        registration_status: "registered",
    });

    return getAttendeeById(attendeeId);
}

async function getAttendeesAdmin(eventId, filters = {}) {
    const where = { event_id: eventId };

    if (filters.search) {
        where[Op.or] = [
            { full_name: { [Op.iLike]: `%${filters.search}%` } },
            { email: { [Op.iLike]: `%${filters.search}%` } },
            { company_name: { [Op.iLike]: `%${filters.search}%` } },
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
    getAttendeesAdmin,
    getAttendeeDirectory,
    getAttendeeById,
    updateAttendeeProfile,
    updatePrivacySettings,
    toggleAttendeeStatus,
};
