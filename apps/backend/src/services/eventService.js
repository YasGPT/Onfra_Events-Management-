const {
    Event,
    AdminEventAccess,
    SponsorshipTier,
    EventSetting,
} = require("../models");
const AppError = require("../utils/AppError");

const DEFAULT_EVENT_SETTINGS = {
    features: {
        networking: true,
        meetings: true,
        chat: true,
        agenda: true,
        exhibitors: true,
        sponsors: true,
        gallery: true,
    },
    registration: {
        allow_public_registration: true,
        require_admin_approval: true,
        registration_closed: false,
    },
    privacy: {
        directory_visibility: "opt_in", // 'opt_in' | 'attendees_only' | 'hidden'
        allow_qr_share: true,
    },
    meeting_rules: {
        auto_expire_hours: 24,
        allow_reschedule: true,
    },
};

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

    // 5. Seed Default Event Settings
    for (const [key, value] of Object.entries(DEFAULT_EVENT_SETTINGS)) {
        await EventSetting.create({
            event_id: event.id,
            setting_key: key,
            setting_value: value,
            updated_by_admin_id: adminId,
            updated_at: new Date(),
        });
    }

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

async function updateEvent(adminId, eventId, data = {}) {
    const event = await Event.findByPk(eventId);
    if (!event) {
        throw new AppError("Event not found.", 404);
    }

    const allowedFields = [
        "name",
        "description",
        "starts_at",
        "ends_at",
        "timezone",
        "venue_name",
        "venue_address",
        "organizer_name",
        "organizer_email",
        "organizer_phone",
        "meeting_request_expiry_hours",
        "allow_personal_photo_uploads",
        "status",
        "is_active",
    ];

    allowedFields.forEach((field) => {
        if (data[field] !== undefined) {
            event[field] = data[field];
        }
    });

    await event.save();
    return event;
}

async function getEventSettings(eventId) {
    const event = await Event.findByPk(eventId);
    if (!event) {
        throw new AppError("Event not found.", 404);
    }

    const storedSettings = await EventSetting.findAll({
        where: { event_id: eventId },
    });

    const settingsMap = JSON.parse(JSON.stringify(DEFAULT_EVENT_SETTINGS));

    for (const record of storedSettings) {
        if (record.setting_key && record.setting_value) {
            if (
                typeof record.setting_value === "object" &&
                !Array.isArray(record.setting_value) &&
                settingsMap[record.setting_key]
            ) {
                settingsMap[record.setting_key] = {
                    ...settingsMap[record.setting_key],
                    ...record.setting_value,
                };
            } else {
                settingsMap[record.setting_key] = record.setting_value;
            }
        }
    }

    return {
        event_id: eventId,
        settings: settingsMap,
        event_controls: {
            meeting_request_expiry_hours: event.meeting_request_expiry_hours,
            allow_personal_photo_uploads: event.allow_personal_photo_uploads,
            status: event.status,
            is_active: event.is_active,
            timezone: event.timezone,
        },
    };
}

async function updateEventSettings(adminId, eventId, payload = {}) {
    const event = await Event.findByPk(eventId);
    if (!event) {
        throw new AppError("Event not found.", 404);
    }

    const updates = {};
    if (payload.setting_key && payload.setting_value !== undefined) {
        updates[payload.setting_key] = payload.setting_value;
    } else {
        const knownKeys = ["features", "registration", "privacy", "meeting_rules"];
        for (const key of Object.keys(payload)) {
            if (knownKeys.includes(key) || typeof payload[key] === "object") {
                updates[key] = payload[key];
            }
        }
    }

    for (const [key, value] of Object.entries(updates)) {
        let existingRecord = await EventSetting.findOne({
            where: { event_id: eventId, setting_key: key },
        });

        if (existingRecord) {
            const mergedValue =
                typeof existingRecord.setting_value === "object" &&
                typeof value === "object" &&
                !Array.isArray(existingRecord.setting_value) &&
                !Array.isArray(value)
                    ? { ...existingRecord.setting_value, ...value }
                    : value;

            existingRecord.setting_value = mergedValue;
            existingRecord.updated_by_admin_id = adminId;
            existingRecord.updated_at = new Date();
            await existingRecord.save();
        } else {
            const baseDefault = DEFAULT_EVENT_SETTINGS[key] || {};
            const initialValue =
                typeof value === "object" && !Array.isArray(value)
                    ? { ...baseDefault, ...value }
                    : value;

            await EventSetting.create({
                event_id: eventId,
                setting_key: key,
                setting_value: initialValue,
                updated_by_admin_id: adminId,
                updated_at: new Date(),
            });
        }
    }

    // Sync direct event-level columns if passed
    const directFields = [
        "meeting_request_expiry_hours",
        "allow_personal_photo_uploads",
        "status",
        "is_active",
        "timezone",
    ];
    let directChanged = false;
    for (const field of directFields) {
        if (payload[field] !== undefined) {
            event[field] = payload[field];
            directChanged = true;
        }
    }
    if (directChanged) {
        await event.save();
    }

    return getEventSettings(eventId);
}

module.exports = {
    createEvent,
    getAdminEvents,
    getEventById,
    updateEvent,
    getEventSettings,
    updateEventSettings,
};

