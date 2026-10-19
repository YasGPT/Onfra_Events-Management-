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
        const event = await eventService.getEventById(req.params.eventId, req.user.businessCode);
        return sendResponse(res, 200, "Event details retrieved successfully", event);
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

async function deleteEvent(req, res, next) {
    try {
        const result = await eventService.deleteEvent(req.params.eventId, req.user.businessCode);
        return sendResponse(res, 200, "Event deleted successfully", result);
    } catch (error) {
        next(error);
    }
}

async function bulkDeleteEvents(req, res, next) {
    try {
        const result = await eventService.bulkDeleteEvents(req.body.eventIds, req.user.businessCode);
        return sendResponse(res, 200, "Selected events deleted successfully", result);
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

async function getSettings(req, res, next) {
    try {
        const settings = await eventService.getEventSettings(req.params.eventId);
        return sendResponse(res, 200, "Event settings retrieved successfully", settings);
    } catch (error) {
        next(error);
    }
}

async function updateSettings(req, res, next) {
    try {
        const settings = await eventService.updateEventSettings(req.params.eventId, req.user.id, req.body);
        return sendResponse(res, 200, "Event settings updated successfully", settings);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createEvent,
    updateEvent,
    deleteEvent,
    bulkDeleteEvents,
    uploadEventMedia,
    listMyEvents,
    getEventDetails,
    getSettings,
    updateSettings,
};
