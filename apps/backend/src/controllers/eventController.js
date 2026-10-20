const eventService = require("../services/eventService");
const { sendResponse } = require("../utils/responseHandler");

async function createEvent(req, res, next) {
    try {
        const result = await eventService.createEvent(req.user.id, req.body);
        return sendResponse(res, 201, "Event created successfully", result);
    } catch (error) {
        next(error);
    }
}

async function listMyEvents(req, res, next) {
    try {
        const events = await eventService.getAdminEvents(req.user.id, req.user.role);
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
        const eventId = req.eventId || req.params.eventId;
        const result = await eventService.updateEvent(req.user.id, eventId, req.body);
        return sendResponse(res, 200, "Event updated successfully", result);
    } catch (error) {
        next(error);
    }
}

async function getSettings(req, res, next) {
    try {
        const eventId = req.eventId || req.params.eventId;
        const result = await eventService.getEventSettings(eventId);
        return sendResponse(res, 200, "Event settings retrieved successfully", result);
    } catch (error) {
        next(error);
    }
}

async function updateSettings(req, res, next) {
    try {
        const eventId = req.eventId || req.params.eventId;
        const result = await eventService.updateEventSettings(req.user.id, eventId, req.body);
        return sendResponse(res, 200, "Event settings updated successfully", result);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createEvent,
    listMyEvents,
    getEventDetails,
    updateEvent,
    getSettings,
    updateSettings,
};
