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
    requireRoles("Super Admin", "Event Manager"),
    attendeeController.listAttendeesAdmin
);

router.post(
    "/",
    requireUserType("admin"),
    requireRoles("Super Admin", "Event Manager"),
    attendeeController.registerAttendee
);

router.patch(
    "/:id/status",
    requireUserType("admin"),
    requireRoles("Super Admin", "Event Manager"),
    attendeeController.toggleStatus
);

// Specific attendee profile view
router.get("/:id", attendeeController.getAttendeeProfile);

module.exports = router;
