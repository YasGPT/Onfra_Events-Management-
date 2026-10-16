const {
    Session,
    EventDay,
    Track,
    Venue,
    Speaker,
    SessionSpeaker,
    SavedSession,
    Meeting,
} = require("../models");
const AppError = require("../utils/AppError");
const { Op } = require("sequelize");

// --- Event Days ---
async function createEventDay(eventId, data) {
    const { day_number, title, event_date } = data;
    if (!day_number || !title || !event_date) {
        throw new AppError("Day number, title, and event date are required.", 400);
    }
    return EventDay.create({ event_id: eventId, day_number, title, event_date });
}

async function getEventDays(eventId) {
    return EventDay.findAll({
        where: { event_id: eventId },
        order: [["day_number", "ASC"]],
    });
}

// --- Tracks ---
async function createTrack(eventId, data) {
    const { name, description, display_order } = data;
    if (!name) {
        throw new AppError("Track name is required.", 400);
    }
    return Track.create({ event_id: eventId, name, description, display_order: display_order || 0 });
}

async function getTracks(eventId) {
    return Track.findAll({
        where: { event_id: eventId },
        order: [["display_order", "ASC"]],
    });
}

// --- Venues ---
async function createVenue(eventId, data) {
    const { name, location_details } = data;
    if (!name) {
        throw new AppError("Venue name is required.", 400);
    }
    return Venue.create({ event_id: eventId, name, location_details });
}

async function getVenues(eventId) {
    return Venue.findAll({
        where: { event_id: eventId },
        order: [["name", "ASC"]],
    });
}

// --- Speakers ---
async function createSpeaker(eventId, data) {
    const { full_name, job_title, organization, bio, photo_asset_id } = data;
    if (!full_name) {
        throw new AppError("Speaker full name is required.", 400);
    }
    return Speaker.create({
        event_id: eventId,
        full_name,
        job_title,
        organization,
        bio,
        photo_asset_id,
    });
}

async function getSpeakers(eventId) {
    return Speaker.findAll({
        where: { event_id: eventId },
        order: [["full_name", "ASC"]],
    });
}

// --- Sessions (Agenda) ---
async function createSession(adminId, eventId, data) {
    const {
        event_day_id,
        track_id,
        venue_id,
        title,
        description,
        starts_at,
        ends_at,
        speaker_ids = [],
    } = data;

    if (!title || !event_day_id || !starts_at || !ends_at) {
        throw new AppError("Title, event day, start time, and end time are required.", 400);
    }

    const startDate = new Date(starts_at);
    const endDate = new Date(ends_at);

    if (endDate <= startDate) {
        throw new AppError("End time must be after start time.", 400);
    }

    // Scheduling conflict validation: check if venue is already booked for overlapping time
    if (venue_id) {
        const conflict = await Session.findOne({
            where: {
                event_id: eventId,
                venue_id,
                status: { [Op.ne]: "cancelled" },
                [Op.or]: [
                    {
                        starts_at: { [Op.lt]: endDate },
                        ends_at: { [Op.gt]: startDate },
                    },
                ],
            },
        });

        if (conflict) {
            throw new AppError(
                `Scheduling conflict: Venue is already booked for session '${conflict.title}' during this time.`,
                409
            );
        }
    }

    const session = await Session.create({
        event_id: eventId,
        created_by_admin_id: adminId,
        event_day_id,
        track_id: track_id || null,
        venue_id: venue_id || null,
        title,
        description,
        starts_at: startDate,
        ends_at: endDate,
        status: "scheduled",
    });

    // Link Speakers
    if (Array.isArray(speaker_ids) && speaker_ids.length > 0) {
        const sessionSpeakers = speaker_ids.map((speaker_id, index) => ({
            session_id: session.id,
            speaker_id,
            display_order: index + 1,
        }));
        await SessionSpeaker.bulkCreate(sessionSpeakers);
    }

    return getSessionById(session.id);
}

async function getSessions(eventId, filters = {}) {
    const where = { event_id: eventId };

    if (filters.event_day_id) where.event_day_id = filters.event_day_id;
    if (filters.track_id) where.track_id = filters.track_id;
    if (filters.venue_id) where.venue_id = filters.venue_id;

    return Session.findAll({
        where,
        include: [
            { model: EventDay, attributes: ["id", "day_number", "title", "event_date"] },
            { model: Track, attributes: ["id", "name"] },
            { model: Venue, attributes: ["id", "name", "location_details"] },
            { model: Speaker, through: { attributes: ["display_order"] } },
        ],
        order: [["starts_at", "ASC"]],
    });
}

async function getSessionById(id) {
    const session = await Session.findByPk(id, {
        include: [
            { model: EventDay },
            { model: Track },
            { model: Venue },
            { model: Speaker, through: { attributes: ["display_order"] } },
        ],
    });
    if (!session) {
        throw new AppError("Session not found.", 404);
    }
    return session;
}

async function updateSession(id, data) {
    const session = await getSessionById(id);
    await session.update(data);
    return getSessionById(id);
}

async function deleteSession(id) {
    const session = await getSessionById(id);
    await session.destroy();
    return { success: true, message: "Session deleted successfully." };
}

// --- My Schedule (Attendee saved sessions & meetings) ---
async function saveSessionToSchedule(attendeeId, sessionId) {
    const session = await Session.findByPk(sessionId);
    if (!session) {
        throw new AppError("Session not found.", 404);
    }

    // Check overlap with attendee's other saved sessions
    const otherSaved = await SavedSession.findAll({
        where: { attendee_id: attendeeId },
        include: [{ model: Session }],
    });

    for (const item of otherSaved) {
        if (
            item.Session &&
            item.Session.id !== sessionId &&
            new Date(session.starts_at) < new Date(item.Session.ends_at) &&
            new Date(session.ends_at) > new Date(item.Session.starts_at)
        ) {
            console.warn(`Warning: Session overlaps with saved session '${item.Session.title}'`);
        }
    }

    const [saved, created] = await SavedSession.findOrCreate({
        where: { attendee_id: attendeeId, session_id: sessionId },
        defaults: { attendee_id: attendeeId, session_id: sessionId },
    });

    return { saved, created };
}

async function removeSessionFromSchedule(attendeeId, sessionId) {
    await SavedSession.destroy({
        where: { attendee_id: attendeeId, session_id: sessionId },
    });
    return { success: true, message: "Session removed from schedule." };
}

async function getMySchedule(attendeeId, eventId) {
    // 1. Saved Sessions
    const saved = await SavedSession.findAll({
        where: { attendee_id: attendeeId },
        include: [
            {
                model: Session,
                where: { event_id: eventId },
                include: [EventDay, Track, Venue, Speaker],
            },
        ],
    });

    const sessions = saved.map((s) => ({
        type: "session",
        item: s.Session,
        starts_at: s.Session?.starts_at,
        ends_at: s.Session?.ends_at,
    }));

    // 2. Confirmed Meetings
    const confirmedMeetings = await Meeting.findAll({
        where: {
            event_id: eventId,
            status: "accepted",
            [Op.or]: [
                { requester_attendee_id: attendeeId },
                { recipient_attendee_id: attendeeId },
            ],
        },
        include: [{ model: Venue, attributes: ["name", "location_details"] }],
    });

    const meetings = confirmedMeetings.map((m) => ({
        type: "meeting",
        item: m,
        starts_at: m.starts_at,
        ends_at: m.ends_at,
    }));

    // Combine and sort chronologically
    const allActivities = [...sessions, ...meetings].sort(
        (a, b) => new Date(a.starts_at) - new Date(b.starts_at)
    );

    return allActivities;
}

module.exports = {
    createEventDay,
    getEventDays,
    createTrack,
    getTracks,
    createVenue,
    getVenues,
    createSpeaker,
    getSpeakers,
    createSession,
    getSessions,
    getSessionById,
    updateSession,
    deleteSession,
    saveSessionToSchedule,
    removeSessionFromSchedule,
    getMySchedule,
};
