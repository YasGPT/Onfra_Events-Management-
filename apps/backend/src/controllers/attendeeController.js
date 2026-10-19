const attendeeService = require("../services/attendeeService");
const { sendResponse } = require("../utils/responseHandler");

async function registerAttendee(req, res, next) {
    try {
        const attendee = await attendeeService.createAttendee(req.user.id, req.eventId, req.body);
        return sendResponse(res, 201, "Attendee registered successfully", attendee);
    } catch (error) {
        next(error);
    }
}

async function listAttendeesAdmin(req, res, next) {
    try {
        const attendees = await attendeeService.getAttendeesAdmin(req.eventId, req.query);
        return sendResponse(res, 200, "Attendees retrieved successfully", attendees);
    } catch (error) {
        next(error);
    }
}

async function listAttendeeDirectory(req, res, next) {
    try {
        const directory = await attendeeService.getAttendeeDirectory(
            req.eventId,
            req.user.id,
            req.query
        );
        return sendResponse(res, 200, "Attendee directory retrieved successfully", directory);
    } catch (error) {
        next(error);
    }
}

async function getAttendeeProfile(req, res, next) {
    try {
        const targetId = req.params.id || req.user.id;
        const profile = await attendeeService.getAttendeeById(targetId);
        return sendResponse(res, 200, "Attendee profile retrieved successfully", profile);
    } catch (error) {
        next(error);
    }
}

async function updateProfile(req, res, next) {
    try {
        const updated = await attendeeService.updateAttendeeProfile(req.user.id, req.body);
        return sendResponse(res, 200, "Profile updated successfully", updated);
    } catch (error) {
        next(error);
    }
}

async function updatePrivacySettings(req, res, next) {
    try {
        const { settings } = req.body;
        const updatedSettings = await attendeeService.updatePrivacySettings(req.user.id, settings);
        return sendResponse(res, 200, "Privacy settings updated successfully", updatedSettings);
    } catch (error) {
        next(error);
    }
}

async function toggleStatus(req, res, next) {
    try {
        const { is_active } = req.body;
        const result = await attendeeService.toggleAttendeeStatus(req.params.id, is_active);
        return sendResponse(res, 200, result.message, result);
    } catch (error) {
        next(error);
    }
}

async function approveAttendee(req, res, next) {
    try {
        const result = await attendeeService.approveAttendee(req.params.id);
        return sendResponse(res, 200, "Attendee approved successfully", result);
    } catch (error) {
        next(error);
    }
}

async function setPassword(req, res, next) {
    try {
        const { token, password } = req.body;
        const result = await attendeeService.setPassword(req.params.id, token, password);
        return sendResponse(res, 200, "Password set successfully", result);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    registerAttendee,
    listAttendeesAdmin,
    listAttendeeDirectory,
    getAttendeeProfile,
    updateProfile,
    updatePrivacySettings,
    toggleStatus,
    approveAttendee,
    setPassword,
};
