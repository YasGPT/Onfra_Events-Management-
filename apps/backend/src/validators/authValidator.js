const AppError = require("../utils/AppError");

function validateAdminLogin(req, res, next) {
    const { business_code, email, password } = req.body;

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
    const { email, password } = req.body;

    if (!email || typeof email !== "string" || !email.trim()) {
        return next(new AppError("Email is required for attendee login.", 400));
    }

    if (!password || typeof password !== "string" || !password.trim()) {
        return next(new AppError("Password is required.", 400));
    }

    req.body.email = email.trim().toLowerCase();
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
    validateCreateAdmin,
};
