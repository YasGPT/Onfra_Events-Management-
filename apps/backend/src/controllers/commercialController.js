const commercialService = require("../services/commercialService");
const { sendResponse } = require("../utils/responseHandler");

// Categories
async function createCategory(req, res, next) {
    try {
        const category = await commercialService.createCategory(req.eventId, req.body);
        return sendResponse(res, 201, "Category created successfully", category);
    } catch (error) {
        next(error);
    }
}

async function listCategories(req, res, next) {
    try {
        const categories = await commercialService.getCategories(req.eventId);
        return sendResponse(res, 200, "Categories retrieved successfully", categories);
    } catch (error) {
        next(error);
    }
}

// Exhibitors
async function createExhibitor(req, res, next) {
    try {
        const exhibitor = await commercialService.createExhibitor(req.user.id, req.eventId, req.body);
        return sendResponse(res, 201, "Exhibitor created successfully", exhibitor);
    } catch (error) {
        next(error);
    }
}

async function listExhibitors(req, res, next) {
    try {
        const exhibitors = await commercialService.getExhibitors(req.eventId, req.query);
        return sendResponse(res, 200, "Exhibitors retrieved successfully", exhibitors);
    } catch (error) {
        next(error);
    }
}

async function getExhibitor(req, res, next) {
    try {
        const exhibitor = await commercialService.getExhibitorById(req.params.id);
        return sendResponse(res, 200, "Exhibitor retrieved successfully", exhibitor);
    } catch (error) {
        next(error);
    }
}

async function updateExhibitor(req, res, next) {
    try {
        const exhibitor = await commercialService.updateExhibitor(req.params.id, req.body);
        return sendResponse(res, 200, "Exhibitor updated successfully", exhibitor);
    } catch (error) {
        next(error);
    }
}

async function deleteExhibitor(req, res, next) {
    try {
        const result = await commercialService.deleteExhibitor(req.params.id);
        return sendResponse(res, 200, result.message);
    } catch (error) {
        next(error);
    }
}

async function updateExhibitorStatus(req, res, next) {
    try {
        const { status } = req.body;
        const exhibitor = await commercialService.updateExhibitorStatus(req.params.id, status);
        return sendResponse(res, 200, "Exhibitor status updated successfully", exhibitor);
    } catch (error) {
        next(error);
    }
}

async function getExhibitorStats(req, res, next) {
    try {
        const stats = await commercialService.getExhibitorStats(req.eventId);
        return sendResponse(res, 200, "Exhibitor statistics retrieved successfully", stats);
    } catch (error) {
        next(error);
    }
}

// Offerings
async function addOffering(req, res, next) {
    try {
        const offering = await commercialService.addOffering(req.params.id, req.body);
        return sendResponse(res, 201, "Offering added successfully", offering);
    } catch (error) {
        next(error);
    }
}

// Stalls
async function assignStall(req, res, next) {
    try {
        const stall = await commercialService.assignStall(req.body);
        return sendResponse(res, 201, "Stall assigned successfully", stall);
    } catch (error) {
        next(error);
    }
}

async function listStalls(req, res, next) {
    try {
        const stalls = await commercialService.getStalls(req.eventId);
        return sendResponse(res, 200, "Stalls retrieved successfully", stalls);
    } catch (error) {
        next(error);
    }
}

// Tiers
async function listTiers(req, res, next) {
    try {
        const tiers = await commercialService.getTiers(req.eventId);
        return sendResponse(res, 200, "Sponsorship tiers retrieved successfully", tiers);
    } catch (error) {
        next(error);
    }
}

async function createTier(req, res, next) {
    try {
        const tier = await commercialService.createTier(req.eventId, req.body);
        return sendResponse(res, 201, "Sponsorship tier created successfully", tier);
    } catch (error) {
        next(error);
    }
}

// Sponsors
async function createSponsor(req, res, next) {
    try {
        const sponsor = await commercialService.createSponsor(req.user.id, req.eventId, req.body);
        return sendResponse(res, 201, "Sponsor created successfully", sponsor);
    } catch (error) {
        next(error);
    }
}

async function listSponsors(req, res, next) {
    try {
        const sponsors = await commercialService.getSponsors(req.eventId);
        return sendResponse(res, 200, "Sponsors retrieved successfully", sponsors);
    } catch (error) {
        next(error);
    }
}

async function getSponsor(req, res, next) {
    try {
        const sponsor = await commercialService.getSponsorById(req.params.id);
        return sendResponse(res, 200, "Sponsor retrieved successfully", sponsor);
    } catch (error) {
        next(error);
    }
}

async function updateSponsor(req, res, next) {
    try {
        const sponsor = await commercialService.updateSponsor(req.params.id, req.body);
        return sendResponse(res, 200, "Sponsor updated successfully", sponsor);
    } catch (error) {
        next(error);
    }
}

async function deleteSponsor(req, res, next) {
    try {
        const result = await commercialService.deleteSponsor(req.params.id);
        return sendResponse(res, 200, result.message);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createCategory,
    listCategories,
    createExhibitor,
    listExhibitors,
    getExhibitor,
    updateExhibitor,
    deleteExhibitor,
    updateExhibitorStatus,
    getExhibitorStats,
    addOffering,
    assignStall,
    listStalls,
    listTiers,
    createTier,
    createSponsor,
    listSponsors,
    getSponsor,
    updateSponsor,
    deleteSponsor,
};
