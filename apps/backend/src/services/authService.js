const {
    Admin,
    AdminRole,
    AdminSession,
    Event,
    AdminEventAccess,
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

    // 1. Validate Business Code in Events Table
    const event = await Event.findOne({
        where: { business_code: business_code.trim().toUpperCase(), is_active: true },
    });

    if (!event) {
        throw new AppError("Invalid Business Code or event is not active.", 404);
    }

    // 2. Find Admin by Email
    const admin = await Admin.findOne({
        where: { email },
        include: [{ model: AdminRole, attributes: ["id", "name", "is_system_role"] }],
    });

    if (!admin) {
        throw new AppError("Invalid email or password.", 401);
    }

    if (!admin.is_active) {
        throw new AppError("Your administrator account is deactivated.", 403);
    }

    // 3. Verify Password
    const isPasswordValid = await comparePassword(password, admin.password_hash);
    if (!isPasswordValid) {
        throw new AppError("Invalid email or password.", 401);
    }

    // 4. Verify Event Access Permission (unless Super Admin)
    const roleName = admin.AdminRole ? admin.AdminRole.name : "Admin";
    if (roleName !== "Super Admin") {
        const hasAccess = await AdminEventAccess.findOne({
            where: {
                admin_id: admin.id,
                event_id: event.id,
                is_active: true,
            },
        });

        if (!hasAccess) {
            throw new AppError("You do not have administrative access to this event.", 403);
        }
    }

    // 5. Generate Tokens
    const tokenPayload = {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: roleName,
        userType: "admin",
        eventId: event.id,
        businessCode: event.business_code,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ id: admin.id, userType: "admin" });

    // 6. Save Session
    const refreshTokenHash = await hashPassword(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await AdminSession.create({
        admin_id: admin.id,
        refresh_token_hash: refreshTokenHash,
        expires_at: expiresAt,
    });

    // 7. Update Last Login
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
        },
        event: {
            id: event.id,
            name: event.name,
            business_code: event.business_code,
        },
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
 * Seed Default System Roles, Initial Super Admin, and Default Event
 */
async function ensureDefaultRolesAndAdmin() {
    // 1. Seed Roles
    const roles = [
        { name: "Super Admin", description: "Full access to platform configuration and administration", is_system_role: true },
        { name: "Event Manager", description: "Manage event content, agenda, and participants", is_system_role: true },
        { name: "Content Manager", description: "Manage exhibitors, sponsors, and gallery", is_system_role: true },
    ];

    let superAdminRole = null;

    for (const r of roles) {
        const [role] = await AdminRole.findOrCreate({
            where: { name: r.name },
            defaults: r,
        });
        if (r.name === "Super Admin") {
            superAdminRole = role;
        }
    }

    // 2. Seed Default Super Admin Account
    let defaultAdmin = await Admin.findOne({ where: { email: "admin@confra.io" } });
    if (!defaultAdmin && superAdminRole) {
        const defaultPasswordHash = await hashPassword("Admin@123");
        defaultAdmin = await Admin.create({
            full_name: "Super Administrator",
            email: "admin@confra.io",
            phone: "+1234567890",
            password_hash: defaultPasswordHash,
            role_id: superAdminRole.id,
            is_active: true,
            email_verified_at: new Date(),
        });
    }

    // 3. Seed Default Initial Event
    if (defaultAdmin) {
        const [defaultEvent] = await Event.findOrCreate({
            where: { business_code: "CONFRA2026" },
            defaults: {
                created_by_admin_id: defaultAdmin.id,
                business_code: "CONFRA2026",
                name: "Confra Annual Expo 2026",
                description: "Premier event networking and management conference",
                timezone: "UTC",
                status: "published",
                is_active: true,
            },
        });

        // Grant access
        await AdminEventAccess.findOrCreate({
            where: {
                admin_id: defaultAdmin.id,
                event_id: defaultEvent.id,
            },
            defaults: {
                admin_id: defaultAdmin.id,
                event_id: defaultEvent.id,
                granted_by_admin_id: defaultAdmin.id,
                is_active: true,
            },
        });
    }
}

module.exports = {
    adminLogin,
    attendeeLogin,
    ensureDefaultRolesAndAdmin,
};
