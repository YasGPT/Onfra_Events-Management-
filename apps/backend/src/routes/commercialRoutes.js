const express = require("express");
const commercialController = require("../controllers/commercialController");
const { authenticate } = require("../middlewares/authMiddleware");
const { resolveEventContext } = require("../middlewares/eventMiddleware");
const { requireUserType } = require("../middlewares/roleMiddleware");

const router = express.Router({ mergeParams: true });

// Require authentication and resolved event context
router.use(authenticate, resolveEventContext);

// --- Exhibitor Categories ---
router.get("/exhibitor-categories", commercialController.listCategories);
router.post(
    "/exhibitor-categories",
    requireUserType("admin"),
    commercialController.createCategory
);

// --- Exhibitors ---
router.get("/exhibitors", commercialController.listExhibitors);
router.get("/exhibitors/:id", commercialController.getExhibitor);
router.get("/exhibitors/stats", commercialController.getExhibitorStats);
router.post(
    "/exhibitors",
    requireUserType("admin"),
    commercialController.createExhibitor
);
router.put(
    "/exhibitors/:id",
    requireUserType("admin"),
    commercialController.updateExhibitor
);
router.patch(
    "/exhibitors/:id/status",
    requireUserType("admin"),
    commercialController.updateExhibitorStatus
);
router.delete(
    "/exhibitors/:id",
    requireUserType("admin"),
    commercialController.deleteExhibitor
);

// --- Offerings ---
router.post(
    "/exhibitors/:id/offerings",
    requireUserType("admin"),
    commercialController.addOffering
);

// --- Stalls ---
router.get("/stalls", commercialController.listStalls);
router.post(
    "/stalls",
    requireUserType("admin"),
    commercialController.assignStall
);

// --- Sponsorship Tiers ---
router.get("/sponsorship-tiers", commercialController.listTiers);
router.post(
    "/sponsorship-tiers",
    requireUserType("admin"),
    commercialController.createTier
);

// --- Sponsors ---
router.get("/sponsors", commercialController.listSponsors);
router.get("/sponsors/:id", commercialController.getSponsor);
router.post(
    "/sponsors",
    requireUserType("admin"),
    commercialController.createSponsor
);
router.put(
    "/sponsors/:id",
    requireUserType("admin"),
    commercialController.updateSponsor
);
router.delete(
    "/sponsors/:id",
    requireUserType("admin"),
    commercialController.deleteSponsor
);

module.exports = router;
