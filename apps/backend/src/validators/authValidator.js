const AppError = require("../utils/AppError");

function validateAdminLogin(req, res, next) {
    const { business_code, email, password } = req.body || {};

    if (!business_code || typeof business_code !== "string" || !business_code.trim()) {
        return next(new AppError("Business code is required for admin login.", 400));
    }

    if (!email || typeof email !== "string" || !email.trim()) {
        return next(new AppError("Email or username is required.", 400));
    }

    if (!password || typeof password !== "string" || !password.trim()) {
        return next(new AppError("Password is required.", 400));
    }

    req.body.business_code = business_code.trim().toUpperCase();
    req.body.email = email.trim().toLowerCase();
    next();
}

/** Attendee login accepts either an email address or a mobile number. */
function validateAttendeeLogin(req, res, next) {
    const body = req.body || {};
    const identifier = body.identifier || body.email || body.phone;

    if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
        return next(new AppError("Email address or mobile number is required.", 400));
    }

    if (!body.password || typeof body.password !== "string" || !body.password.trim()) {
        return next(new AppError("Password is required.", 400));
    }

    req.body.identifier = identifier.trim();
    next();
}

/** Attendee "forgot password" accepts the same identifier field. */
function validateAttendeeForgotPassword(req, res, next) {
    const body = req.body || {};
    const identifier = body.identifier || body.email || body.phone;

    if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
        return next(new AppError("Email address or mobile number is required.", 400));
    }

    req.body.identifier = identifier.trim();
    next();
}

function validateCreateAdmin(req, res, next) {
    const { full_name, email, password, role_id } = req.body;

    if (!full_name || !full_name.trim()) {
        return next(new AppError("Full name is required.", 400));
    }

    if (!email || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return next(new AppError("A valid email address is required.", 400));
    }

    if (!password || password.length < 6) {
        return next(new AppError("Password must be at least 6 characters long.", 400));
    }

    req.body.email = email.trim().toLowerCase();
    req.body.full_name = full_name.trim();
    next();
}

module.exports = {
    validateAdminLogin,
    validateAttendeeLogin,
    validateAttendeeForgotPassword,
    validateCreateAdmin,
};
