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
        const { phone, email, identifier, password } = req.body || {};
        const result = await authService.attendeeLogin({ phone, email, identifier, password });
        return sendResponse(res, 200, "Attendee login successful", result);
    } catch (error) {
        next(error);
    }
}

async function attendeeForgotPassword(req, res, next) {
    try {
        const { email, phone, identifier } = req.body || {};
        const result = await authService.attendeeForgotPassword({ email, phone, identifier });
        return sendResponse(res, 200, result.message, result);
    } catch (error) {
        next(error);
    }
}

async function attendeeResetPassword(req, res, next) {
    try {
        const { email, phone, identifier, token, new_password } = req.body || {};
        const result = await authService.attendeeResetPassword({
            email,
            phone,
            identifier,
            token,
            new_password,
        });
        return sendResponse(res, 200, result.message, result);
    } catch (error) {
        next(error);
    }
}

async function refreshToken(req, res, next) {
    try {
        const { refreshToken: token, userType } = req.body || {};
        const result = await authService.refreshToken({ refreshToken: token, userType });
        return sendResponse(res, 200, "Token refreshed successfully", result);
    } catch (error) {
        next(error);
    }
}

async function logout(req, res, next) {
    try {
        const { refreshToken: token, userType } = req.body || {};
        const userId = req.user ? req.user.id : null;
        const result = await authService.logout({ refreshToken: token, userType, userId });
        return sendResponse(res, 200, result.message);
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
    attendeeResetPassword,
    refreshToken,
    logout,
    getProfile,
};
