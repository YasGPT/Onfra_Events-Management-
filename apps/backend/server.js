
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { syncDatabase } = require("./src/models");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Confra Admin API is running",
    });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log("PostgreSQL connected successfully");

        // Sync Central and Template tables
        await syncDatabase();

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
}

startServer();
