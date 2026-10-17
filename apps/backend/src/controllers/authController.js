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
        const { email, password } = req.body || {};
        const result = await authService.attendeeLogin({ email, password });
        return sendResponse(res, 200, "Attendee login successful", result);
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
    getProfile,
};
