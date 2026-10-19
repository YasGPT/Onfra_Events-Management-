const { Event } = require("../models");
const AppError = require("../utils/AppError");

/**
 * Resolves event context by unique eventId
 */
async function resolveEventContext(req, res, next) {
    try {
        if (!req.user) {
            return next(new AppError("User is not authenticated.", 401));
        }

        let eventId;

        // If Attendee, event context is strictly locked to their token
        if (req.user.userType === "attendee") {
            eventId = req.user.eventId;
            if (!eventId) {
                return next(new AppError("Attendee is not linked to any event.", 403));
            }
        } else {
            // If Admin, get from route params or custom header
            eventId = req.params.eventId || req.headers["x-event-id"];
            if (!eventId) {
                return next(
                    new AppError("Event identifier is required (:eventId in params or X-Event-ID header).", 400)
                );
            }

            // Verify admin's business_code matches the event's business_code
            const event = await Event.findByPk(eventId);
            if (!event) {
                return next(new AppError("Event not found.", 404));
            }

            if (event.business_code !== req.user.businessCode) {
                return next(
                    new AppError("Access denied. You do not have permission to manage this event.", 403)
                );
            }
        }

        // Fetch Event from Database
        const event = await Event.findByPk(eventId);

        if (!event) {
            return next(new AppError("Event not found.", 404));
        }

        if (!event.is_active) {
            return next(new AppError("This event is currently inactive.", 403));
        }

        // Attach event instance and eventId to request
        req.event = event;
        req.eventId = event.id;

        next();
    } catch (error) {
        next(error);
    }
}

module.exports = { resolveEventContext };
