const eventService = require("../services/eventService");
const attendeeService = require("../services/attendeeService");
const { sendResponse } = require("../utils/responseHandler");
const { Event } = require("../models");
const AppError = require("../utils/AppError");

async function getEventByPublicId(req, res, next) {
    try {
        const { eventId } = req.params;
        const event = await Event.findByPk(eventId, {
            attributes: [
                'id',
                'name',
                'description',
                'starts_at',
                'ends_at',
                'venue_name',
                'organizer_name',
                'allow_personal_photo_uploads',
                'is_active',
                'status'
            ]
        });

        if (!event) {
            throw new AppError("Event not found", 404);
        }

        if (!event.is_active) {
            throw new AppError("Event is not active", 403);
        }

        return sendResponse(res, 200, "Event retrieved successfully", event);
    } catch (error) {
        next(error);
    }
}

async function publicRegisterAttendee(req, res, next) {
    try {
        const { eventId } = req.params;
        const {
            full_name,
            email,
            phone,
            company_name,
            job_title,
            bio,
            website_url,
            whatsapp_url,
        } = req.body;

        if (!full_name || !email) {
            throw new AppError("Full name and email are required", 400);
        }

        // Verify event exists and is active
        const event = await Event.findByPk(eventId);
        if (!event) {
            throw new AppError("Event not found", 404);
        }

        if (!event.is_active) {
            throw new AppError("Event is not active", 403);
        }

        // Create attendee with pending status
        const attendee = await attendeeService.createPendingAttendee(eventId, {
            full_name,
            email,
            phone,
            company_name,
            job_title,
            bio,
            website_url,
            whatsapp_url,
        });

        return sendResponse(res, 201, "Registration submitted successfully. Your registration is pending approval.", attendee);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getEventByPublicId,
    publicRegisterAttendee,
};
