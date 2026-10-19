const {
    Admin,
    AdminRole,
    AdminSession,
    Event,
    Attendee,
    AttendeeSession,
    AttendeePasswordResetToken,
} = require("../models");
const AppError = require("../utils/AppError");
const { Op } = require("sequelize");
const { hashPassword, comparePassword } = require("../utils/passwordUtils");
const mailService = require("./mailService");
const crypto = require("crypto");
const {
    generateAccessToken,
    generateRefreshToken,
} = require("../utils/tokenUtils");

/**
 * Admin Login: Requires business_code, email, password
 */
async function adminLogin({ business_code, email, password } = {}) {
    if (!business_code || !email || !password) {
        throw new AppError("Business code, email, and password are required.", 400);
    }

    const normalizedBusinessCode = business_code.trim().toUpperCase();

    // 1. Find Admin by Email AND Business Code
    const admin = await Admin.findOne({
        where: {
            email,
            business_code: normalizedBusinessCode,
        },
        include: [{ model: AdminRole, attributes: ["id", "name", "is_system_role"] }],
    });

    if (!admin) {
        throw new AppError("Invalid email, business code, or password.", 401);
    }

    if (!admin.is_active) {
        throw new AppError("Your administrator account is deactivated.", 403);
    }

    // 2. Verify Password
    const isPasswordValid = await comparePassword(password, admin.password_hash);
    if (!isPasswordValid) {
        throw new AppError("Invalid email, business code, or password.", 401);
    }

    // 3. Find Event by Admin's Business Code
    const event = await Event.findOne({
        where: { business_code: normalizedBusinessCode },
    });

    const roleName = admin.AdminRole ? admin.AdminRole.name : "Admin";

    // 4. Generate Tokens
    const tokenPayload = {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: roleName,
        userType: "admin",
        businessCode: admin.business_code,
        eventId: event ? event.id : null,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ id: admin.id, userType: "admin" });

    // 5. Save Session
    const refreshTokenHash = await hashPassword(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await AdminSession.create({
        admin_id: admin.id,
        refresh_token_hash: refreshTokenHash,
        expires_at: expiresAt,
    });

    // 6. Update Last Login
    await admin.update({ last_login_at: new Date() });

    return {
        accessToken,
        refreshToken,
        admin: {
            id: admin.id,
            full_name: admin.full_name,
            email: admin.email,
            phone: admin.phone,
            role: roleName,
            business_code: admin.business_code,
        },
        event: event ? {
            id: event.id,
            name: event.name,
            business_code: event.business_code,
        } : null,
    };
}

/**
 * Significant digits of a mobile number: drops the country code so that
 * "9876543210", "+91 98765 43210" and "+919876543210" all point at one account.
 */
function phoneDigits(value) {
    const digits = String(value).replace(/\D/g, "");
    // Anything shorter than a real subscriber number is not a lookup key.
    if (digits.length < 8) return null;
    const withoutCountry = digits.replace(/^00/, "").replace(/^91(?=\d{10}$)/, "");
    return withoutCountry.length >= 10 ? withoutCountry : digits;
}

/**
 * Attendee Login: email OR mobile number + password.
 * The same person can be registered for several events, so the mobile app sends
 * the event it is configured for (event_id or business_code) to disambiguate.
 */
async function attendeeLogin({ identifier, email, phone, password, event_id: event_id_in, business_code } = {}) {
    const loginId = identifier || email || phone;

    if (!loginId || !password) {
        throw new AppError("Email or mobile number and password are required.", 400);
    }

    const trimmed = String(loginId).trim();
    const isEmail = trimmed.includes("@");

    // Attendees type the number in many shapes, so match on the last digits.
    const phoneLookup = isEmail ? null : phoneDigits(trimmed);
    if (!isEmail && !phoneLookup) {
        throw new AppError("Enter a valid email address or mobile number.", 400);
    }

    const where = isEmail
        ? { email: trimmed.toLowerCase() }
        : { phone: { [Op.endsWith]: phoneLookup } };

    const scopedByEvent = Boolean(event_id_in || business_code);
    let attendees = await Attendee.findAll({
        where,
        ...(scopedByEvent ? { include: [{ model: Event, attributes: ["id", "business_code"] }] } : {}),
    });

    if (event_id_in) {
        attendees = attendees.filter((a) => a.event_id === event_id_in);
    } else if (business_code) {
        const code = String(business_code).trim().toUpperCase();
        attendees = attendees.filter((a) => a.Event && a.Event.business_code === code);
    }

    // Keep only rows whose password actually matches.
    const matches = [];
    for (const attendee of attendees) {
        if (attendee.password_hash && (await comparePassword(password, attendee.password_hash))) {
            matches.push(attendee);
        }
    }

    if (matches.length === 0) {
        if (attendees.length === 1 && !attendees[0].password_hash) {
            throw new AppError(
                "You have not created your password yet. Use the link from the approval email, or request a new one.",
                409
            );
        }
        if (attendees.length > 1) {
            throw new AppError("Multiple registrations found for this account. Send the event code with the login.", 409);
        }
        throw new AppError("Invalid credentials, or your registration is still waiting for approval.", 401);
    }

    const attendee = matches[0];

    if (!attendee.is_active) {
        throw new AppError("Your attendee account has been deactivated.", 403);
    }

    if (attendee.registration_status === "rejected") {
        throw new AppError("Your registration was not approved for this event.", 403);
    }

    // 3. Look up Event by attendee.event_id
    const event = await Event.findByPk(attendee.event_id);
    if (!event || !event.is_active) {
        throw new AppError("The event associated with this account is inactive.", 403);
    }

    // 4. Generate Tokens
    const tokenPayload = {
        id: attendee.id,
        email: attendee.email,
        full_name: attendee.full_name,
        role: "attendee",
        userType: "attendee",
        eventId: event.id,
        businessCode: event.business_code,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ id: attendee.id, userType: "attendee" });

    // 5. Save Session in Attendee Sessions table
    const refreshTokenHash = await hashPassword(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await AttendeeSession.create({
        attendee_id: attendee.id,
        refresh_token_hash: refreshTokenHash,
        expires_at: expiresAt,
    });

    return {
        accessToken,
        refreshToken,
        attendee: {
            id: attendee.id,
            full_name: attendee.full_name,
            email: attendee.email,
            phone: attendee.phone,
            company_name: attendee.company_name,
            job_title: attendee.job_title,
            bio: attendee.bio,
            website_url: attendee.website_url,
            whatsapp_url: attendee.whatsapp_url,
            registration_status: attendee.registration_status,
        },
        event: {
            id: event.id,
            name: event.name,
            business_code: event.business_code,
        },
    };
}

/**
 * Attendee self-service "forgot password": a fresh setup link is mailed when the
 * account exists. The response is identical either way so nothing is leaked.
 */
async function attendeeForgotPassword({ identifier, event_id: event_id_in } = {}) {
    const genericResult = { message: "If that account exists, a password reset link is on its way." };

    if (!identifier) return genericResult;

    const trimmed = String(identifier).trim();
    const isEmail = trimmed.includes("@");
    const phoneLookup = isEmail ? null : phoneDigits(trimmed);

    const where = isEmail
        ? { email: trimmed.toLowerCase() }
        : { phone: { [Op.endsWith]: phoneLookup } };

    const attendee = await Attendee.findOne({ where });
    if (!attendee || !attendee.is_active) return genericResult;

    if (event_id_in && attendee.event_id !== event_id_in) return genericResult;

    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await AttendeePasswordResetToken.destroy({ where: { attendee_id: attendee.id, used_at: null } });
    await AttendeePasswordResetToken.create({
        attendee_id: attendee.id,
        token_hash: await hashPassword(rawToken),
        expires_at: expiresAt,
    });

    const event = await Event.findByPk(attendee.event_id);
    await mailService.sendPasswordSetupMail({
        to: attendee.email,
        fullName: attendee.full_name,
        eventName: event ? event.name : "the event",
        setupUrl: `${mailService.getClientUrl()}/set-password?token=${rawToken}`,
        expiresAt,
        rescheduled: true,
    });

    return genericResult;
}

/**
 * Seed Default System Role Only (No hardcoded admin or event data)
 * Admin accounts and events must be created manually via API or database
 */
async function ensureDefaultRolesAndAdmin() {
    // 1. Seed Single Admin Role (metadata only)
    const [adminRole] = await AdminRole.findOrCreate({
        where: { name: "Admin" },
        defaults: {
            name: "Admin",
            description: "Full access to manage events and platform",
            is_system_role: true,
        },
    });

    // NOTE: No default admin or event is created.
    // Admin accounts must be created via API POST /api/v1/admins
    // Events must be created via API POST /api/v1/events
    // All data is stored in database tables - no hardcoded credentials.
}

module.exports = {
    adminLogin,
    attendeeLogin,
    attendeeForgotPassword,
    ensureDefaultRolesAndAdmin,
};
