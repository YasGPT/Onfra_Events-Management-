const express = require("express");
const authRoutes = require("./authRoutes");
const eventRoutes = require("./eventRoutes");
const agendaRoutes = require("./agendaRoutes");
const commercialRoutes = require("./commercialRoutes");
const attendeeRoutes = require("./attendeeRoutes");
const networkingRoutes = require("./networkingRoutes");
const reportRoutes = require("./reportRoutes");
const adminRoutes = require("./adminRoutes");

const router = express.Router();

// Base API Info & Documentation Endpoint
router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Confra Event Networking & Management API v1 is running smoothly",
        version: "1.0.0",
        endpoints: {
            health: "GET /api/health",
            auth: {
                admin_login: "POST /api/v1/auth/admin/login (requires business_code, email, password)",
                attendee_login: "POST /api/v1/auth/attendee/login (requires phone or email, and password)",
                forgot_password: "POST /api/v1/auth/attendee/forgot-password (sends 6-digit OTP code to email)",
                reset_password: "POST /api/v1/auth/attendee/reset-password (verifies OTP code and sets new password)",
                refresh_token: "POST /api/v1/auth/refresh-token",
                logout: "POST /api/v1/auth/logout",
            },
            events: {
                list_or_create: "GET, POST /api/v1/events",
                get_or_update: "GET, PATCH /api/v1/events/:id",
                settings: "GET, PUT, PATCH /api/v1/events/:eventId/settings (feature toggles, registration & privacy rules)",
                public_register_qr: "POST /api/v1/events/:eventId/register (public QR web form submission)",
            },
            event_scoped_modules: {
                agenda: "/api/v1/events/:eventId/agenda (days, tracks, venues, speakers, sessions, my-schedule)",
                commercial: "/api/v1/events/:eventId/commercial (exhibitors, stalls, floor-maps, sponsors)",
                attendees: "/api/v1/events/:eventId/attendees (directory, status, approve, reject, reset-password, registration, bulk-import, import-jobs)",
                networking: "/api/v1/events/:eventId/networking (qr-code, qr-scan, connections, meetings, chat)",
                reports: "/api/v1/events/:eventId/reports (overview, export)",
            },
        },
    });
});

// Central Authentication & Admins
router.use("/auth", authRoutes);
router.use("/admins", adminRoutes);

// Core Event Operations
router.use("/events", eventRoutes);

// Sub-modules nested under specific event context
router.use("/events/:eventId/agenda", agendaRoutes);
router.use("/events/:eventId/commercial", commercialRoutes);
router.use("/events/:eventId/attendees", attendeeRoutes);
router.use("/events/:eventId/networking", networkingRoutes);
router.use("/events/:eventId/reports", reportRoutes);

module.exports = router;
