const express = require("express");
const authController = require("../controllers/authController");
const { validateAdminLogin, validateAttendeeLogin } = require("../validators/authValidator");
const { authenticate } = require("../middlewares/authMiddleware");

const router = express.Router();

// Admin Login: Business Code + Email + Password
router.post("/admin/login", validateAdminLogin, authController.adminLogin);

// Attendee Login: Email + Password (NO Business Code)
router.post("/attendee/login", validateAttendeeLogin, authController.attendeeLogin);

// Authenticated User Profile
router.get("/me", authenticate, authController.getProfile);

module.exports = router;
