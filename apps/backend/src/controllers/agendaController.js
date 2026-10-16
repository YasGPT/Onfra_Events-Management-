const agendaService = require("../services/agendaService");
const { sendResponse } = require("../utils/responseHandler");

// Days
async function createDay(req, res, next) {
    try {
        const day = await agendaService.createEventDay(req.eventId, req.body);
        return sendResponse(res, 201, "Event day created successfully", day);
    } catch (error) {
        next(error);
    }
}

async function listDays(req, res, next) {
    try {
        const days = await agendaService.getEventDays(req.eventId);
        return sendResponse(res, 200, "Event days retrieved successfully", days);
    } catch (error) {
        next(error);
    }
}

// Tracks
async function createTrack(req, res, next) {
    try {
        const track = await agendaService.createTrack(req.eventId, req.body);
        return sendResponse(res, 201, "Track created successfully", track);
    } catch (error) {
        next(error);
    }
}

async function listTracks(req, res, next) {
    try {
        const tracks = await agendaService.getTracks(req.eventId);
        return sendResponse(res, 200, "Tracks retrieved successfully", tracks);
    } catch (error) {
        next(error);
    }
}

// Venues
async function createVenue(req, res, next) {
    try {
        const venue = await agendaService.createVenue(req.eventId, req.body);
        return sendResponse(res, 201, "Venue created successfully", venue);
    } catch (error) {
        next(error);
    }
}

async function listVenues(req, res, next) {
    try {
        const venues = await agendaService.getVenues(req.eventId);
        return sendResponse(res, 200, "Venues retrieved successfully", venues);
    } catch (error) {
        next(error);
    }
}

// Speakers
async function createSpeaker(req, res, next) {
    try {
        const speaker = await agendaService.createSpeaker(req.eventId, req.body);
        return sendResponse(res, 201, "Speaker created successfully", speaker);
    } catch (error) {
        next(error);
    }
}

async function listSpeakers(req, res, next) {
    try {
        const speakers = await agendaService.getSpeakers(req.eventId);
        return sendResponse(res, 200, "Speakers retrieved successfully", speakers);
    } catch (error) {
        next(error);
    }
}

// Sessions (Agenda)
async function createSession(req, res, next) {
    try {
        const session = await agendaService.createSession(req.user.id, req.eventId, req.body);
        return sendResponse(res, 201, "Session scheduled successfully", session);
    } catch (error) {
        next(error);
    }
}

async function listSessions(req, res, next) {
    try {
        const sessions = await agendaService.getSessions(req.eventId, req.query);
        return sendResponse(res, 200, "Sessions retrieved successfully", sessions);
    } catch (error) {
        next(error);
    }
}

async function getSession(req, res, next) {
    try {
        const session = await agendaService.getSessionById(req.params.id);
        return sendResponse(res, 200, "Session retrieved successfully", session);
    } catch (error) {
        next(error);
    }
}

async function updateSession(req, res, next) {
    try {
        const session = await agendaService.updateSession(req.params.id, req.body);
        return sendResponse(res, 200, "Session updated successfully", session);
    } catch (error) {
        next(error);
    }
}

async function deleteSession(req, res, next) {
    try {
        const result = await agendaService.deleteSession(req.params.id);
        return sendResponse(res, 200, result.message);
    } catch (error) {
        next(error);
    }
}

// My Schedule (Attendee)
async function saveToSchedule(req, res, next) {
    try {
        const result = await agendaService.saveSessionToSchedule(req.user.id, req.params.sessionId);
        return sendResponse(res, 200, "Session saved to My Schedule", result);
    } catch (error) {
        next(error);
    }
}

async function removeFromSchedule(req, res, next) {
    try {
        const result = await agendaService.removeSessionFromSchedule(req.user.id, req.params.sessionId);
        return sendResponse(res, 200, result.message);
    } catch (error) {
        next(error);
    }
}

async function getMySchedule(req, res, next) {
    try {
        const schedule = await agendaService.getMySchedule(req.user.id, req.eventId);
        return sendResponse(res, 200, "Personal schedule retrieved successfully", schedule);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createDay,
    listDays,
    createTrack,
    listTracks,
    createVenue,
    listVenues,
    createSpeaker,
    listSpeakers,
    createSession,
    listSessions,
    getSession,
    updateSession,
    deleteSession,
    saveToSchedule,
    removeFromSchedule,
    getMySchedule,
};
