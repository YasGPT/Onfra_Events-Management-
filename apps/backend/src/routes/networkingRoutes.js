const express = require("express");
const networkingController = require("../controllers/networkingController");
const { authenticate } = require("../middlewares/authMiddleware");
const { resolveEventContext } = require("../middlewares/eventMiddleware");

const router = express.Router({ mergeParams: true });

// Require authentication and resolved event context
router.use(authenticate, resolveEventContext);

// --- QR & Connections ---
router.get("/qr-code", networkingController.getMyQr);
router.post("/qr-scan", networkingController.previewScan);
router.post("/connections", networkingController.connectQr);
router.get("/connections", networkingController.listConnections);

// --- 1-on-1 Meetings ---
router.post("/meetings", networkingController.requestMeeting);
router.get("/meetings", networkingController.listMeetings);
router.patch("/meetings/:id/respond", networkingController.respondMeeting);
router.delete("/meetings/:id", networkingController.cancelMeeting);

// --- 1-on-1 Chat / Messaging ---
router.get("/conversations", networkingController.listConversations);
router.get("/conversations/:id/messages", networkingController.listMessages);
router.post("/conversations/:id/messages", networkingController.sendMessage);

module.exports = router;
