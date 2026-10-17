const express = require("express");
const eventController = require("../controllers/eventController");
const { authenticate } = require("../middlewares/authMiddleware");
const { requireUserType, requireRoles } = require("../middlewares/roleMiddleware");
const { resolveEventContext } = require("../middlewares/eventMiddleware");

const router = express.Router();

// List Admin's Events
router.get("/", authenticate, requireUserType("admin"), eventController.listMyEvents);

// Create New Event & Provision Tenant Schema (Super Admin or Event Manager)
router.post(
    "/",
    authenticate,
    requireUserType("admin"),
    requireRoles("Super Admin", "Event Manager"),
    eventController.createEvent
);

// Get Specific Event Details (Tenant context resolved)
router.get("/:eventId", authenticate, resolveEventContext, eventController.getEventDetails);

module.exports = router;
