const express = require("express");
const eventController = require("../controllers/eventController");
const { authenticate } = require("../middlewares/authMiddleware");
const { requireUserType } = require("../middlewares/roleMiddleware");
const { resolveEventContext } = require("../middlewares/eventMiddleware");

const router = express.Router();

// List Admin's Events
router.get("/", authenticate, requireUserType("admin"), eventController.listMyEvents);

// Create New Event & Provision Tenant Schema
router.post(
    "/",
    authenticate,
    requireUserType("admin"),
    eventController.createEvent
);

// Bulk Delete Events
router.post(
    "/bulk-delete",
    authenticate,
    requireUserType("admin"),
    eventController.bulkDeleteEvents
);

// Get Specific Event Details
router.get("/:eventId", authenticate, requireUserType("admin"), eventController.getEventDetails);

// Event Settings (Feature toggles, registration rules, privacy, meeting rules)
router.get(
    "/:eventId/settings",
    authenticate,
    requireUserType("admin"),
    eventController.getSettings
);

router.put(
    "/:eventId/settings",
    authenticate,
    requireUserType("admin"),
    eventController.updateSettings
);

// Update Specific Event
router.patch(
    "/:eventId",
    authenticate,
    requireUserType("admin"),
    eventController.updateEvent
);

// Delete Specific Event
router.delete(
    "/:eventId",
    authenticate,
    requireUserType("admin"),
    eventController.deleteEvent
);

// Upload & Link Media Asset (Logo/Banner)
router.post(
    "/:eventId/media",
    authenticate,
    requireUserType("admin"),
    eventController.uploadEventMedia
);

module.exports = router;
