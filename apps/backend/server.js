const path = require("path");
require("dotenv").config({ path: [path.resolve(__dirname, ".env"), path.resolve(__dirname, "src/.env")] });

const express = require("express");
const cors = require("cors");
const { sequelize, syncDatabase } = require("./src/models");
const { ensureDefaultRolesAndAdmin } = require("./src/services/authService");
const apiRoutes = require("./src/routes");
const errorHandler = require("./src/middlewares/errorHandler");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Root Welcome & Health Check
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to Confra Event Management & Networking Shared Backend Server",
        api_v1_url: "/api/v1",
        health_check: "/api/health",
        timestamp: new Date().toISOString(),
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Confra Event Networking API is running",
        timestamp: new Date().toISOString(),
    });
});

// Mount Shared API v1 Routes for both Admin Web and Attendee Mobile
app.use("/api/v1", apiRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});

process.on("exit", (code) => {
    console.log(`Server process exiting with code: ${code}`);
});

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log("PostgreSQL connected successfully");

        // Sync Central and Template tables if requested
        if (process.env.SYNC_DB === "true") {
            console.log("Synchronizing all database models...");
            await syncDatabase();
        }

        // Seed initial default roles and admin
        await ensureDefaultRolesAndAdmin();

        const server = app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
            console.log(`API base route: http://localhost:${PORT}/api/v1`);
        });

        // Keepalive timer
        setInterval(() => {}, 1000 * 60 * 60);
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
}

startServer();
