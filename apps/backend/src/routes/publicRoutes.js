const express = require("express");
const publicController = require("../controllers/publicController");

const router = express.Router();

// Public event access (no authentication required)
router.get("/events/:eventId", publicController.getEventByPublicId);

// Mobile apps are configured with the business code instead of the event UUID
router.get("/events/by-code/:businessCode", publicController.getEventByBusinessCode);

// Attendee registration submission (by event UUID or by business code)
router.post("/events/:eventId/register", publicController.publicRegisterAttendee);
router.post("/events/by-code/:businessCode/register", publicController.publicRegisterAttendee);

// Password setup link lifecycle (opened from the approval email)
router.get("/attendee/setup-link", publicController.verifyPasswordSetupToken);
router.post("/attendee/set-password", publicController.createPassword);

module.exports = router;
