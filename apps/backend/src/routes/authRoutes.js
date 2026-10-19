const express = require("express");
const authController = require("../controllers/authController");
const {
    validateAdminLogin,
    validateAttendeeLogin,
    validateForgotPassword,
    validateResetPassword,
} = require("../validators/authValidator");
const { authenticate } = require("../middlewares/authMiddleware");

const router = express.Router();

// Admin Login: Business Code + Email + Password
router.post("/admin/login", validateAdminLogin, authController.adminLogin);

// Attendee Login: Mobile Number (or Email) + Password
router.post("/attendee/login", validateAttendeeLogin, authController.attendeeLogin);

// Attendee Password Reset via Email OTP
router.post("/attendee/forgot-password", validateForgotPassword, authController.attendeeForgotPassword);
router.post("/attendee/reset-password", validateResetPassword, authController.attendeeResetPassword);

// Session Management (Token Refresh & Logout)
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);

// Authenticated User Profile
router.get("/me", authenticate, authController.getProfile);

module.exports = router;
