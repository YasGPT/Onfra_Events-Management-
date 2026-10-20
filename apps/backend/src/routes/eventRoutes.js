const express = require("express");
const eventController = require("../controllers/eventController");
const attendeeController = require("../controllers/attendeeController");
const { authenticate } = require("../middlewares/authMiddleware");
const { requireUserType, requireRoles } = require("../middlewares/roleMiddleware");
const { resolveEventContext } = require("../middlewares/eventMiddleware");

const router = express.Router();

// List Admin's Events
router.get("/", authenticate, requireUserType("admin"), eventController.listMyEvents);

// Create New Event (Super Admin or Event Manager)
router.post(
    "/",
    authenticate,
    requireUserType("admin"),
    requireRoles("Super Admin", "Event Manager"),
    eventController.createEvent
);

// Public Attendee Event Registration via QR Code / Web Form (No auth token required)
router.post("/:eventId/register", attendeeController.publicRegister);

// Get Specific Event Details (Tenant context resolved)
router.get("/:eventId", authenticate, resolveEventContext, eventController.getEventDetails);

// Update Event Profile (Super Admin or Event Manager)
router.patch(
    "/:eventId",
    authenticate,
    requireUserType("admin"),
    requireRoles("Super Admin", "Event Manager"),
    resolveEventContext,
    eventController.updateEvent
);

// Get Event Settings & Feature Toggles (Available to Admins and Attendees)
router.get("/:eventId/settings", authenticate, resolveEventContext, eventController.getSettings);

// Update Event Settings (Super Admin or Event Manager)
router.put(
    "/:eventId/settings",
    authenticate,
    requireUserType("admin"),
    requireRoles("Super Admin", "Event Manager"),
    resolveEventContext,
    eventController.updateSettings
);

router.patch(
    "/:eventId/settings",
    authenticate,
    requireUserType("admin"),
    requireRoles("Super Admin", "Event Manager"),
    resolveEventContext,
    eventController.updateSettings
);

module.exports = router;
