const express = require("express");
const agendaController = require("../controllers/agendaController");
const { authenticate } = require("../middlewares/authMiddleware");
const { resolveEventContext } = require("../middlewares/eventMiddleware");
const { requireUserType } = require("../middlewares/roleMiddleware");

const router = express.Router({ mergeParams: true });

// All routes here require authentication and resolved event context
router.use(authenticate, resolveEventContext);

// --- Days ---
router.get("/days", agendaController.listDays);
router.post(
    "/days",
    requireUserType("admin"),
    agendaController.createDay
);

// --- Tracks ---
router.get("/tracks", agendaController.listTracks);
router.post(
    "/tracks",
    requireUserType("admin"),
    agendaController.createTrack
);

// --- Venues ---
router.get("/venues", agendaController.listVenues);
router.post(
    "/venues",
    requireUserType("admin"),
    agendaController.createVenue
);

// --- Speakers ---
router.get("/speakers", agendaController.listSpeakers);
router.post(
    "/speakers",
    requireUserType("admin"),
    agendaController.createSpeaker
);

// --- Sessions (Agenda) ---
router.get("/sessions", agendaController.listSessions);
router.get("/sessions/:id", agendaController.getSession);
router.post(
    "/sessions",
    requireUserType("admin"),
    agendaController.createSession
);
router.put(
    "/sessions/:id",
    requireUserType("admin"),
    agendaController.updateSession
);
router.delete(
    "/sessions/:id",
    requireUserType("admin"),
    agendaController.deleteSession
);

// --- My Schedule (Personal schedule) ---
router.get("/my-schedule", agendaController.getMySchedule);
router.post("/my-schedule/:sessionId", agendaController.saveToSchedule);
router.delete("/my-schedule/:sessionId", agendaController.removeFromSchedule);

module.exports = router;
