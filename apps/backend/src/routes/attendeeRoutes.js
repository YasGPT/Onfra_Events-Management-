const express = require("express");
const attendeeController = require("../controllers/attendeeController");
const { authenticate } = require("../middlewares/authMiddleware");
const { resolveEventContext } = require("../middlewares/eventMiddleware");
const { requireUserType } = require("../middlewares/roleMiddleware");

const router = express.Router({ mergeParams: true });

// Require authentication and resolved event context
router.use(authenticate, resolveEventContext);

// --- Stats & Directory (Must be before /:id) ---
router.get("/stats", requireUserType("admin"), attendeeController.getAttendeeStats);
router.get("/directory", attendeeController.listAttendeeDirectory);

// --- Bulk Operations (Must be before /:id) ---
router.get("/bulk-import/template", requireUserType("admin"), attendeeController.getBulkImportTemplate);
router.post("/bulk-import", requireUserType("admin"), attendeeController.bulkImportAttendees);
router.get("/import-jobs", requireUserType("admin"), attendeeController.listImportJobs);
router.get("/import-jobs/:jobId", requireUserType("admin"), attendeeController.getImportJobDetails);
router.post("/bulk-approve", requireUserType("admin"), attendeeController.bulkApproveAttendees);
router.post("/bulk-reject", requireUserType("admin"), attendeeController.bulkRejectAttendees);
router.post("/bulk-delete", requireUserType("admin"), attendeeController.bulkDeleteAttendees);
router.post("/bulk-email", requireUserType("admin"), attendeeController.bulkSendEmail);
router.post("/bulk-badge", requireUserType("admin"), attendeeController.bulkPrintBadges);
router.post("/qr-check-in", requireUserType("admin"), attendeeController.qrCheckIn);

// --- Attendee Self-service ---
router.get("/profile/me", attendeeController.getAttendeeProfile);
router.put("/profile/me", attendeeController.updateProfile);
router.put("/profile/privacy", attendeeController.updatePrivacySettings);

// --- Admin List & Create ---
router.get("/", requireUserType("admin"), attendeeController.listAttendeesAdmin);
router.post("/", requireUserType("admin"), attendeeController.registerAttendee);

// --- Single Attendee Actions ---
router.get("/:id", attendeeController.getAttendeeProfile);
router.put("/:id", requireUserType("admin"), attendeeController.updateAttendee);
router.delete("/:id", requireUserType("admin"), attendeeController.deleteAttendee);
router.patch("/:id/status", requireUserType("admin"), attendeeController.toggleStatus);

// Approve & Reject (Supports both PATCH and POST)
router.post("/:id/approve", requireUserType("admin"), attendeeController.approveAttendee);
router.patch("/:id/approve", requireUserType("admin"), attendeeController.approveAttendee);
router.post("/:id/reject", requireUserType("admin"), attendeeController.rejectAttendee);
router.patch("/:id/reject", requireUserType("admin"), attendeeController.rejectAttendee);
router.post("/:id/check-in", requireUserType("admin"), attendeeController.checkInAttendee);
router.post("/:id/check-out", requireUserType("admin"), attendeeController.checkOutAttendee);
router.post("/:id/badge-print", requireUserType("admin"), attendeeController.printBadge);
router.post("/:id/regenerate-qr", requireUserType("admin"), attendeeController.regenerateQr);
router.post("/:id/send-email", requireUserType("admin"), attendeeController.sendEmail);
router.post("/:id/reset-password", requireUserType("admin"), attendeeController.resetPassword);
router.post("/:id/resend-link", requireUserType("admin"), attendeeController.resendSetupLink);
router.put("/:id/privacy", requireUserType("admin"), attendeeController.updatePrivacySettings);

module.exports = router;
