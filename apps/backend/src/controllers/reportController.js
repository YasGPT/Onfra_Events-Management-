const reportService = require("../services/reportService");
const { sendResponse } = require("../utils/responseHandler");

async function getEventOverview(req, res, next) {
    try {
        const overview = await reportService.getEventOverview(req.eventId);
        return sendResponse(res, 200, "Event analytics overview retrieved successfully", overview);
    } catch (error) {
        next(error);
    }
}

async function exportAttendees(req, res, next) {
    try {
        const csv = await reportService.exportAttendeesCsv(req.eventId);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=attendees_${req.eventId}.csv`);
        return res.status(200).send(csv);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getEventOverview,
    exportAttendees,
};
