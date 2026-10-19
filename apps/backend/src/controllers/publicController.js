const eventService = require("../services/eventService");
const attendeeService = require("../services/attendeeService");
const { sendResponse } = require("../utils/responseHandler");
const { Event } = require("../models");
const AppError = require("../utils/AppError");

/** An organiser (business_code) can run many events, so a code alone may be ambiguous. */
async function findPublicEventsByCode(code) {
    return Event.findAll({
        where: { business_code: code, is_active: true },
        order: [["starts_at", "ASC"]],
    });
}

/** Registrations target one event: either its id, or a business code that maps to exactly one event. */
async function resolvePublicEvent(req) {
    if (req.params.eventId) {
        return Event.findByPk(req.params.eventId);
    }

    const code = String(req.params.businessCode || "").trim().toUpperCase();
    if (!code) {
        throw new AppError("Event reference is required.", 400);
    }

    const events = await findPublicEventsByCode(code);
    if (events.length === 0) {
        throw new AppError("No active event found for this business code.", 404);
    }
    if (events.length > 1) {
        throw new AppError(
            "This organiser has more than one active event. Register through the specific event link.",
            409
        );
    }

    return events[0];
}

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

        // Verify event exists and is open for registrations
        const event = await resolvePublicEvent(req);
        if (!event) {
            throw new AppError("Event not found", 404);
        }

        if (!event.is_active) {
            throw new AppError("Event is not active", 403);
        }

        if (event.status === "draft") {
            throw new AppError("This event is not open for registrations yet", 403);
        }

        // Create attendee with pending status
        const attendee = await attendeeService.createPendingAttendee(event.id, {
            full_name,
            email,
            phone,
            company_name,
            job_title,
            bio,
            website_url,
            whatsapp_url,
        });

        await attendeeService.notifyRegistrationReceived(attendee.id);

        return sendResponse(
            res,
            201,
            "Registration submitted successfully. Your registration is pending approval.",
            {
                id: attendee.id,
                full_name: attendee.full_name,
                email: attendee.email,
                registration_status: attendee.registration_status,
                event: { id: event.id, name: event.name, business_code: event.business_code },
            }
        );
    } catch (error) {
        next(error);
    }
}

/**
 * Mobile apps are configured with a business code. Returns every event that code
 * owns so the app can show a picker; registration always posts to a concrete event.
 */
async function getEventByBusinessCode(req, res, next) {
    try {
        const code = String(req.params.businessCode || "").trim().toUpperCase();
        if (!code) {
            throw new AppError("Business code is required", 400);
        }

        const events = await findPublicEventsByCode(code);
        if (events.length === 0) {
            throw new AppError("No event found for this business code", 404);
        }

        const list = events.map((event) => ({
            id: event.id,
            name: event.name,
            business_code: event.business_code,
            description: event.description,
            starts_at: event.starts_at,
            ends_at: event.ends_at,
            venue_name: event.venue_name,
            status: event.status,
        }));

        return sendResponse(res, 200, "Events retrieved successfully", {
            business_code: code,
            events: list,
            // Shortcut for the common single-event organiser.
            event: list.length === 1 ? list[0] : null,
        });
    } catch (error) {
        next(error);
    }
}

/** Public: preview a password setup link before the attendee types a password. */
async function verifyPasswordSetupToken(req, res, next) {
    try {
        const details = await attendeeService.getSetupLinkDetails(req.query.token);
        return sendResponse(res, 200, "Setup link is valid", {
            full_name: details.full_name,
            email: details.email,
            event: details.event,
            already_setup: details.already_setup,
            expires_at: details.expires_at,
        });
    } catch (error) {
        next(error);
    }
}

/** Public: create the attendee password and activate the account. */
async function createPassword(req, res, next) {
    try {
        const { token, password } = req.body || {};
        const result = await attendeeService.setAttendeePassword(token, password);
        return sendResponse(res, 200, "Password created successfully. You can now sign in.", result);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getEventByPublicId,
    publicRegisterAttendee,
    getEventByBusinessCode,
    verifyPasswordSetupToken,
    createPassword,
};
