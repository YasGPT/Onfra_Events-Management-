const {
    Admin,
    AdminRole,
    AdminSession,
    Event,
    AdminEventAccess,
    Attendee,
    AttendeeSession,
    AttendeePasswordResetToken,
} = require("../models");
const AppError = require("../utils/AppError");
const { hashPassword, comparePassword } = require("../utils/passwordUtils");
const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} = require("../utils/tokenUtils");
const { Op } = require("sequelize");
const { sendPasswordResetEmail } = require("../utils/emailService");

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
        where: { email: email.trim().toLowerCase() },
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
 * Attendee Login: Mobile Number (or Email) + Password
 * Validates registration_status: prevents login if "pending" or "rejected".
 */
async function attendeeLogin({ phone, email, identifier, password } = {}) {
    const loginIdentifier = (phone || email || identifier || "").trim();

    if (!loginIdentifier || !password) {
        throw new AppError("Mobile number or email, and password are required.", 400);
    }

    // 1. Look up Attendee by Mobile Number OR Email
    const attendee = await Attendee.findOne({
        where: {
            [Op.or]: [
                { phone: loginIdentifier },
                { email: loginIdentifier.toLowerCase() },
            ],
        },
    });

    if (!attendee) {
        throw new AppError("Invalid mobile number/email or password.", 401);
    }

    // 2. Check Approval / Registration Status
    if (attendee.registration_status === "pending") {
        throw new AppError("Your registration is pending approval by the event organizer.", 403);
    }

    if (attendee.registration_status === "rejected") {
        throw new AppError("Your registration request was not approved by the event organizer.", 403);
    }

    if (!attendee.is_active) {
        throw new AppError("Your attendee account has been deactivated.", 403);
    }

    // 3. Verify Password
    const isPasswordValid = await comparePassword(password, attendee.password_hash);
    if (!isPasswordValid) {
        throw new AppError("Invalid mobile number/email or password.", 401);
    }

    // 4. Look up Event by attendee.event_id
    const event = await Event.findByPk(attendee.event_id);
    if (!event || !event.is_active) {
        throw new AppError("The event associated with this account is inactive.", 403);
    }

    // 5. Generate Tokens
    const tokenPayload = {
        id: attendee.id,
        email: attendee.email,
        phone: attendee.phone,
        full_name: attendee.full_name,
        role: "attendee",
        userType: "attendee",
        eventId: event.id,
        businessCode: event.business_code,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ id: attendee.id, userType: "attendee" });

    // 6. Save Session in Attendee Sessions table
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
 * Attendee Forgot Password (generates OTP code and emails it to attendee)
 */
async function attendeeForgotPassword({ email, phone, identifier }) {
    const lookupId = (email || phone || identifier || "").trim();

    if (!lookupId) {
        throw new AppError("Please provide your registered email or mobile number.", 400);
    }

    const attendee = await Attendee.findOne({
        where: {
            [Op.or]: [
                { email: lookupId.toLowerCase() },
                { phone: lookupId },
            ],
        },
    });

    if (!attendee) {
        // Return friendly message even if user doesn't exist for security
        return {
            success: true,
            message: "If an account exists with this email/phone, a password reset code has been sent.",
        };
    }

    // Generate 6-digit numeric OTP code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const token_hash = await hashPassword(resetCode);

    // Code expires in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await AttendeePasswordResetToken.create({
        attendee_id: attendee.id,
        token_hash,
        expires_at: expiresAt,
    });

    // Lookup event name for professional email
    const event = await Event.findByPk(attendee.event_id);
    const eventName = event ? event.name : "Confra Event";

    // Send email
    await sendPasswordResetEmail({
        to: attendee.email,
        fullName: attendee.full_name,
        resetCode,
        eventName,
    });

    // Mask email for response display (e.g., j***e@domain.com)
    const emailParts = attendee.email.split("@");
    const maskedEmail = emailParts[0].length > 2
        ? `${emailParts[0][0]}***${emailParts[0].slice(-1)}@${emailParts[1]}`
        : attendee.email;

    return {
        success: true,
        message: `Password reset code sent to your registered email (${maskedEmail}).`,
    };
}

/**
 * Attendee Resets Password using the received OTP code
 */
async function attendeeResetPassword({ email, phone, identifier, token, new_password }) {
    const lookupId = (email || phone || identifier || "").trim();

    if (!lookupId || !token || !new_password) {
        throw new AppError("Mobile number/email, reset code, and new password are required.", 400);
    }

    if (new_password.length < 6) {
        throw new AppError("Password must be at least 6 characters long.", 400);
    }

    const attendee = await Attendee.findOne({
        where: {
            [Op.or]: [
                { email: lookupId.toLowerCase() },
                { phone: lookupId },
            ],
        },
    });

    if (!attendee) {
        throw new AppError("Invalid request or attendee not found.", 404);
    }

    // Find active unexpired tokens for this attendee
    const activeTokens = await AttendeePasswordResetToken.findAll({
        where: {
            attendee_id: attendee.id,
            used_at: null,
            expires_at: { [Op.gt]: new Date() },
        },
        order: [["created_at", "DESC"]],
    });

    let matchedTokenRecord = null;
    for (const record of activeTokens) {
        const isMatch = await comparePassword(token.trim(), record.token_hash);
        if (isMatch) {
            matchedTokenRecord = record;
            break;
        }
    }

    if (!matchedTokenRecord) {
        throw new AppError("Invalid or expired reset code.", 400);
    }

    // Update attendee password
    const newPasswordHash = await hashPassword(new_password);
    await attendee.update({ password_hash: newPasswordHash });

    // Mark token as used
    await matchedTokenRecord.update({ used_at: new Date() });

    return {
        success: true,
        message: "Password reset successfully. You can now log in with your mobile number and new password.",
    };
}

/**
 * Refresh Access Token using Refresh Token
 */
async function refreshToken({ refreshToken: token, userType = "attendee" } = {}) {
    if (!token) {
        throw new AppError("Refresh token is required.", 400);
    }

    let decoded;
    try {
        decoded = verifyRefreshToken(token);
    } catch (err) {
        throw new AppError("Invalid or expired refresh token.", 401);
    }

    const SessionModel = userType === "admin" ? AdminSession : AttendeeSession;
    const foreignKey = userType === "admin" ? "admin_id" : "attendee_id";

    const session = await SessionModel.findOne({
        where: {
            [foreignKey]: decoded.id,
            revoked_at: null,
            expires_at: { [Op.gt]: new Date() },
        },
        order: [["created_at", "DESC"]],
    });

    if (!session) {
        throw new AppError("Session expired or revoked. Please log in again.", 401);
    }

    // Fetch user info for token payload
    let tokenPayload;
    if (userType === "admin") {
        const admin = await Admin.findByPk(decoded.id, {
            include: [{ model: AdminRole, attributes: ["name"] }],
        });
        if (!admin || !admin.is_active) throw new AppError("Admin account not found or inactive.", 403);

        tokenPayload = {
            id: admin.id,
            email: admin.email,
            full_name: admin.full_name,
            role: admin.AdminRole ? admin.AdminRole.name : "Admin",
            userType: "admin",
        };
    } else {
        const attendee = await Attendee.findByPk(decoded.id);
        if (!attendee || !attendee.is_active) throw new AppError("Attendee account not found or inactive.", 403);

        tokenPayload = {
            id: attendee.id,
            email: attendee.email,
            phone: attendee.phone,
            full_name: attendee.full_name,
            role: "attendee",
            userType: "attendee",
            eventId: attendee.event_id,
        };
    }

    const newAccessToken = generateAccessToken(tokenPayload);

    return {
        accessToken: newAccessToken,
    };
}

/**
 * Logout: Revokes active session
 */
async function logout({ refreshToken: token, userType = "attendee", userId } = {}) {
    if (userId) {
        const SessionModel = userType === "admin" ? AdminSession : AttendeeSession;
        const foreignKey = userType === "admin" ? "admin_id" : "attendee_id";

        await SessionModel.update(
            { revoked_at: new Date() },
            { where: { [foreignKey]: userId, revoked_at: null } }
        );
    }

    return {
        success: true,
        message: "Logged out successfully.",
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
    attendeeForgotPassword,
    attendeeResetPassword,
    refreshToken,
    logout,
    ensureDefaultRolesAndAdmin,
};
