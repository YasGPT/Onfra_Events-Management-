const eventService = require("../services/eventService");
const { sendResponse } = require("../utils/responseHandler");

async function createEvent(req, res, next) {
    try {
        const result = await eventService.createEvent(req.user.id, req.user.businessCode, req.body);
        return sendResponse(res, 201, "Event created successfully", result);
    } catch (error) {
        next(error);
    }
}

async function listMyEvents(req, res, next) {
    try {
        const events = await eventService.getAdminEvents(req.user.id, req.user.role, req.user.businessCode);
        return sendResponse(res, 200, "Events retrieved successfully", events);
    } catch (error) {
        next(error);
    }
}

async function getEventDetails(req, res, next) {
    try {
        return sendResponse(res, 200, "Event details retrieved successfully", req.event);
    } catch (error) {
        next(error);
    }
}

async function updateEvent(req, res, next) {
    try {
        const result = await eventService.updateEvent(req.params.eventId, req.user.businessCode, req.body);
        return sendResponse(res, 200, "Event updated successfully", result);
    } catch (error) {
        next(error);
    }
}

async function uploadEventMedia(req, res, next) {
    try {
        const result = await eventService.uploadEventMedia(req.params.eventId, req.user.id, req.body);
        return sendResponse(res, 201, "Media asset uploaded and linked successfully", result);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createEvent,
    updateEvent,
    uploadEventMedia,
    listMyEvents,
    getEventDetails,
};
