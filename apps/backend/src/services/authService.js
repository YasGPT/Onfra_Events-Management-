const {
    Admin,
    AdminRole,
    AdminSession,
    Event,
    Attendee,
    AttendeeSession,
} = require("../models");
const AppError = require("../utils/AppError");
const { hashPassword, comparePassword } = require("../utils/passwordUtils");
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
 * Attendee Login: Email + Password (NO Business Code needed)
 */
async function attendeeLogin({ email, password } = {}) {
    if (!email || !password) {
        throw new AppError("Email and password are required.", 400);
    }

    // 1. Look up Attendee directly in attendees table by email
    const attendee = await Attendee.findOne({
        where: { email: email.trim().toLowerCase() },
    });

    if (!attendee) {
        throw new AppError("Invalid email or password.", 401);
    }

    if (!attendee.is_active) {
        throw new AppError("Your attendee account has been deactivated.", 403);
    }

    // 2. Verify Password
    const isPasswordValid = await comparePassword(password, attendee.password_hash);
    if (!isPasswordValid) {
        throw new AppError("Invalid email or password.", 401);
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
    ensureDefaultRolesAndAdmin,
};
