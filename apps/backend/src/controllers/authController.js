const authService = require("../services/authService");
const { sendResponse } = require("../utils/responseHandler");

async function adminLogin(req, res, next) {
    try {
        const { business_code, email, password } = req.body || {};
        const result = await authService.adminLogin({ business_code, email, password });
        return sendResponse(res, 200, "Admin login successful", result);
    } catch (error) {
        next(error);
    }
}

async function attendeeLogin(req, res, next) {
    try {
        const { identifier, email, phone, password, event_id, business_code } = req.body || {};
        const result = await authService.attendeeLogin({
            identifier: identifier || email || phone,
            password,
            event_id,
            business_code,
        });
        return sendResponse(res, 200, "Attendee login successful", result);
    } catch (error) {
        next(error);
    }
}

async function attendeeForgotPassword(req, res, next) {
    try {
        const { identifier, email, phone, event_id } = req.body || {};
        const result = await authService.attendeeForgotPassword({
            identifier: identifier || email || phone,
            event_id,
        });
        return sendResponse(res, 200, result.message, result);
    } catch (error) {
        next(error);
    }
}

async function getProfile(req, res, next) {
    try {
        return sendResponse(res, 200, "Profile retrieved successfully", {
            user: req.user,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    adminLogin,
    attendeeLogin,
    attendeeForgotPassword,
    getProfile,
};
