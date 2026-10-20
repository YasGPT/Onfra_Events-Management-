const express = require("express");
const attendeeController = require("../controllers/attendeeController");
const { authenticate } = require("../middlewares/authMiddleware");
const { resolveEventContext } = require("../middlewares/eventMiddleware");
const { requireUserType, requireRoles } = require("../middlewares/roleMiddleware");
const { uploadCsvHandler } = require("../middlewares/uploadMiddleware");

const router = express.Router({ mergeParams: true });

// Require authentication and resolved event context for all routes here
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

// Admin Approves Pending Registration
router.patch(
    "/:id/approve",
    requireUserType("admin"),
    requireRoles("Super Admin", "Event Manager"),
    attendeeController.approveAttendee
);

// Admin Rejects Pending Registration
router.patch(
    "/:id/reject",
    requireUserType("admin"),
    requireRoles("Super Admin", "Event Manager"),
    attendeeController.rejectAttendee
);

// Admin / Helpdesk Reception Password Reset
router.post(
    "/:id/reset-password",
    requireUserType("admin"),
    requireRoles("Super Admin", "Event Manager"),
    attendeeController.adminResetPassword
);

// Admin toggle active status
router.patch(
    "/:id/status",
    requireUserType("admin"),
    requireRoles("Super Admin", "Event Manager"),
    attendeeController.toggleStatus
);

// --- Admin Bulk Import ---
router.get(
    "/bulk-import/template",
    requireUserType("admin"),
    requireRoles("Super Admin", "Event Manager"),
    attendeeController.getImportTemplate
);

router.post(
    "/bulk-import",
    requireUserType("admin"),
    requireRoles("Super Admin", "Event Manager"),
    uploadCsvHandler,
    attendeeController.bulkImportAttendees
);

router.get(
    "/import-jobs",
    requireUserType("admin"),
    requireRoles("Super Admin", "Event Manager"),
    attendeeController.listImportJobs
);

router.get(
    "/import-jobs/:jobId",
    requireUserType("admin"),
    requireRoles("Super Admin", "Event Manager"),
    attendeeController.getImportJobDetails
);

// Specific attendee profile view
router.get("/:id", attendeeController.getAttendeeProfile);

module.exports = router;
