const express = require("express");
const publicController = require("../controllers/publicController");

const router = express.Router();

// Public event access (no authentication required)
router.get("/events/:eventId", publicController.getEventByPublicId);
router.post("/events/:eventId/register", publicController.publicRegisterAttendee);

module.exports = router;
