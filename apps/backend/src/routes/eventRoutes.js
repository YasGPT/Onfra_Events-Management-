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

// Get Specific Event Details (Tenant context resolved)
router.get("/:eventId", authenticate, resolveEventContext, eventController.getEventDetails);

// Update Specific Event
router.patch(
    "/:eventId",
    authenticate,
    requireUserType("admin"),
    eventController.updateEvent
);

// Upload & Link Media Asset (Logo/Banner)
router.post(
    "/:eventId/media",
    authenticate,
    requireUserType("admin"),
    eventController.uploadEventMedia
);

module.exports = router;
