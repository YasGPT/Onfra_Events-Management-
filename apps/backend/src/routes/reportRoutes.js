const express = require("express");
const reportController = require("../controllers/reportController");
const { authenticate } = require("../middlewares/authMiddleware");
const { resolveEventContext } = require("../middlewares/eventMiddleware");
const { requireUserType } = require("../middlewares/roleMiddleware");

const router = express.Router({ mergeParams: true });

// Require admin authentication and resolved event context
router.use(
    authenticate,
    resolveEventContext,
    requireUserType("admin")
);

router.get("/overview", reportController.getEventOverview);
router.get("/export/attendees", reportController.exportAttendees);

module.exports = router;
