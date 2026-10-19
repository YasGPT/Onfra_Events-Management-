const express = require("express");
const attendeeController = require("../controllers/attendeeController");
const { authenticate } = require("../middlewares/authMiddleware");
const { resolveEventContext } = require("../middlewares/eventMiddleware");
const { requireUserType, requireRoles } = require("../middlewares/roleMiddleware");

const router = express.Router({ mergeParams: true });

// Require authentication and resolved event context
router.use(authenticate, resolveEventContext);

// --- Attendee Directory (Available to attendees and admins) ---
router.get("/directory", attendeeController.listAttendeeDirectory);

// --- My Profile & Privacy (Attendee self-service) ---
router.get("/profile/me", attendeeController.getAttendeeProfile);
router.put("/profile/me", attendeeController.updateProfile);
router.put("/profile/privacy", attendeeController.updatePrivacySettings);

// --- Admin Management ---
router.get(
    "/",
    requireUserType("admin"),
    attendeeController.listAttendeesAdmin
);

router.post(
    "/",
    requireUserType("admin"),
    attendeeController.registerAttendee
);

router.patch(
    "/:id/status",
    requireUserType("admin"),
    attendeeController.toggleStatus
);

router.post(
    "/:id/approve",
    requireUserType("admin"),
    attendeeController.approveAttendee
);

// Specific attendee profile view
router.get("/:id", attendeeController.getAttendeeProfile);

// Public password setup (no auth required)
router.post("/:id/set-password", attendeeController.setPassword);

module.exports = router;
