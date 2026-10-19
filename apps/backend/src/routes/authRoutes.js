const express = require("express");
const authController = require("../controllers/authController");
const { validateAdminLogin, validateAttendeeLogin, validateAttendeeForgotPassword } = require("../validators/authValidator");
const { authenticate } = require("../middlewares/authMiddleware");

const router = express.Router();

// Admin Login: Business Code + Email + Password
router.post("/admin/login", validateAdminLogin, authController.adminLogin);

// Attendee Login: email OR mobile number + password (optional event scope)
router.post("/attendee/login", validateAttendeeLogin, authController.attendeeLogin);

// Attendee forgot password: re-issues the setup link by email
router.post(
    "/attendee/forgot-password",
    validateAttendeeForgotPassword,
    authController.attendeeForgotPassword
);

// Authenticated User Profile
router.get("/me", authenticate, authController.getProfile);

module.exports = router;
