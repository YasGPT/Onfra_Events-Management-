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

function validateAttendeeLogin(req, res, next) {
    const { phone, email, identifier, password } = req.body || {};
    const userIdentifier = phone || email || identifier;

    if (!userIdentifier || typeof userIdentifier !== "string" || !userIdentifier.trim()) {
        return next(new AppError("Mobile number or email is required for attendee login.", 400));
    }

    if (!password || typeof password !== "string" || !password.trim()) {
        return next(new AppError("Password is required.", 400));
    }

    req.body.identifier = userIdentifier.trim();
    next();
}

function validateForgotPassword(req, res, next) {
    const { email, phone, identifier } = req.body || {};
    const userIdentifier = email || phone || identifier;

    if (!userIdentifier || typeof userIdentifier !== "string" || !userIdentifier.trim()) {
        return next(new AppError("Please provide your registered mobile number or email address.", 400));
    }

    req.body.identifier = userIdentifier.trim();
    next();
}

function validateResetPassword(req, res, next) {
    const { email, phone, identifier, token, new_password } = req.body || {};
    const userIdentifier = email || phone || identifier;

    if (!userIdentifier || typeof userIdentifier !== "string" || !userIdentifier.trim()) {
        return next(new AppError("Mobile number or email is required.", 400));
    }

    if (!token || typeof token !== "string" || !token.trim()) {
        return next(new AppError("Reset code is required.", 400));
    }

    if (!new_password || typeof new_password !== "string" || new_password.length < 6) {
        return next(new AppError("New password must be at least 6 characters long.", 400));
    }

    req.body.identifier = userIdentifier.trim();
    req.body.token = token.trim();
    next();
}

function validateCreateAdmin(req, res, next) {
    const { full_name, email, password, role_id } = req.body || {};

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
    validateForgotPassword,
    validateResetPassword,
    validateCreateAdmin,
};
