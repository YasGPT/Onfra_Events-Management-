const {
    Event,
    AdminEventAccess,
    SponsorshipTier,
} = require("../models");
const AppError = require("../utils/AppError");

async function createEvent(adminId, data) {
    const {
        name,
        business_code,
        description,
        starts_at,
        ends_at,
        timezone = "UTC",
        venue_name,
        venue_address,
        organizer_name,
        organizer_email,
        organizer_phone,
    } = data;

    if (!business_code || !business_code.trim()) {
        throw new AppError("Business code is required.", 400);
    }

    if (!name || !name.trim()) {
        throw new AppError("Event name is required.", 400);
    }

    const normalizedBusinessCode = business_code.trim().toUpperCase();

    // 1. Check duplicate business code
    const existing = await Event.findOne({
        where: { business_code: normalizedBusinessCode },
    });

    if (existing) {
        throw new AppError(`Event with business code '${normalizedBusinessCode}' already exists.`, 409);
    }

    // 2. Create Event row with unique ID
    const event = await Event.create({
        created_by_admin_id: adminId,
        name: name.trim(),
        business_code: normalizedBusinessCode,
        description,
        starts_at,
        ends_at,
        timezone,
        venue_name,
        venue_address,
        organizer_name,
        organizer_email,
        organizer_phone,
        status: "draft",
        is_active: true,
    });

    // 3. Seed Default Sponsorship Tiers (Gold, Silver, Bronze) for this event_id
    await SponsorshipTier.bulkCreate([
        { event_id: event.id, name: "Gold", display_order: 1 },
        { event_id: event.id, name: "Silver", display_order: 2 },
        { event_id: event.id, name: "Bronze", display_order: 3 },
    ]);

    // 4. Grant creator admin event access
    await AdminEventAccess.create({
        admin_id: adminId,
        event_id: event.id,
        granted_by_admin_id: adminId,
        is_active: true,
    });

    return event;
}

async function getAdminEvents(adminId, role) {
    if (role === "Super Admin") {
        return Event.findAll({
            order: [["created_at", "DESC"]],
        });
    }

    const accessList = await AdminEventAccess.findAll({
        where: { admin_id: adminId, is_active: true },
        include: [{ model: Event }],
    });

    return accessList.map((a) => a.Event).filter(Boolean);
}

async function getEventById(eventId) {
    const event = await Event.findByPk(eventId);
    if (!event) {
        throw new AppError("Event not found.", 404);
    }
    return event;
}

module.exports = {
    createEvent,
    getAdminEvents,
    getEventById,
};
