const {
    Event,
    SponsorshipTier,
    EventDay,
    Venue,
    MediaAsset,
} = require("../models");
const AppError = require("../utils/AppError");

async function createEvent(adminId, businessCode, data) {
    const {
        name,
        description,
        starts_at,
        ends_at,
        timezone = "Asia/Kolkata",
        venue_name,
        venue_address,
        organizer_name,
        organizer_email,
        organizer_phone,
        meeting_request_expiry_hours = 24,
        allow_personal_photo_uploads = false,
        logo_data,
        banner_data,
        logo_asset_id,
        banner_asset_id,
    } = data;

    if (!name || !name.trim()) {
        throw new AppError("Event name is required.", 400);
    }

    if (!starts_at) {
        throw new AppError("Start date and time is required.", 400);
    }

    if (!ends_at) {
        throw new AppError("End date and time is required.", 400);
    }

    if (new Date(ends_at) <= new Date(starts_at)) {
        throw new AppError("End date/time must be after start date/time.", 400);
    }

    // 1. Create Event row first (business_code from admin session, not from form)
    const event = await Event.create({
        created_by_admin_id: adminId,
        name: name.trim(),
        business_code: businessCode,
        description: description ? description.trim() : null,
        starts_at,
        ends_at,
        timezone: timezone || "Asia/Kolkata",
        venue_name: venue_name ? venue_name.trim() : null,
        venue_address: venue_address ? venue_address.trim() : null,
        organizer_name: organizer_name ? organizer_name.trim() : null,
        organizer_email: organizer_email ? organizer_email.trim() : null,
        organizer_phone: organizer_phone ? organizer_phone.trim() : null,
        meeting_request_expiry_hours: parseInt(meeting_request_expiry_hours, 10) || 24,
        allow_personal_photo_uploads: Boolean(allow_personal_photo_uploads),
        status: "draft",
        is_active: true,
    });

    // 2. Attach Logo & Banner media assets if provided
    let eventNeedsUpdate = false;

    if (logo_data && (logo_data.storage_key || logo_data.dataUrl)) {
        const logoAsset = await MediaAsset.create({
            event_id: event.id,
            storage_key: logo_data.storage_key || logo_data.dataUrl,
            original_filename: logo_data.original_filename || "event_logo.png",
            mime_type: logo_data.mime_type || "image/png",
            file_size_bytes: logo_data.file_size_bytes || null,
            access_scope: "public",
            uploaded_by_admin_id: adminId,
        });
        event.logo_asset_id = logoAsset.id;
        eventNeedsUpdate = true;
    } else if (logo_asset_id) {
        event.logo_asset_id = logo_asset_id;
        eventNeedsUpdate = true;
    }

    if (banner_data && (banner_data.storage_key || banner_data.dataUrl)) {
        const bannerAsset = await MediaAsset.create({
            event_id: event.id,
            storage_key: banner_data.storage_key || banner_data.dataUrl,
            original_filename: banner_data.original_filename || "event_banner.png",
            mime_type: banner_data.mime_type || "image/png",
            file_size_bytes: banner_data.file_size_bytes || null,
            access_scope: "public",
            uploaded_by_admin_id: adminId,
        });
        event.banner_asset_id = bannerAsset.id;
        eventNeedsUpdate = true;
    } else if (banner_asset_id) {
        event.banner_asset_id = banner_asset_id;
        eventNeedsUpdate = true;
    }

    if (eventNeedsUpdate) {
        await event.save();
    }

    // 3. Create Event Days for multi-day events
    const startDate = new Date(starts_at);
    const endDate = new Date(ends_at);
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const diffTime = endDateOnly.getTime() - startDateOnly.getTime();
    const dayCount = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);

    for (let i = 0; i < dayCount; i++) {
        const dayDate = new Date(startDateOnly);
        dayDate.setDate(dayDate.getDate() + i);
        const yyyy = dayDate.getFullYear();
        const mm = String(dayDate.getMonth() + 1).padStart(2, "0");
        const dd = String(dayDate.getDate()).padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;

        await EventDay.create({
            event_id: event.id,
            day_number: i + 1,
            title: `Day ${i + 1}`,
            event_date: dateStr,
        });
    }

    // 4. Create Initial Venue in venues table if venue_name provided
    if (venue_name && venue_name.trim()) {
        await Venue.create({
            event_id: event.id,
            name: venue_name.trim(),
            location_details: venue_address ? venue_address.trim() : "Main venue",
        });
    }

    // 5. Seed Default Sponsorship Tiers (Gold, Silver, Bronze)
    await SponsorshipTier.bulkCreate([
        { event_id: event.id, name: "Gold", display_order: 1 },
        { event_id: event.id, name: "Silver", display_order: 2 },
        { event_id: event.id, name: "Bronze", display_order: 3 },
    ]);

    return event;
}

async function updateEvent(eventId, businessCode, data) {
    const event = await Event.findOne({
        where: { id: eventId, business_code: businessCode },
    });
    if (!event) {
        throw new AppError("Event not found or access denied.", 404);
    }

    const {
        name,
        description,
        starts_at,
        ends_at,
        timezone,
        venue_name,
        venue_address,
        organizer_name,
        organizer_email,
        organizer_phone,
        meeting_request_expiry_hours,
        allow_personal_photo_uploads,
        logo_asset_id,
        banner_asset_id,
        status,
        is_active,
    } = data;

    if (name !== undefined) event.name = name.trim();
    if (description !== undefined) event.description = description;
    if (starts_at !== undefined) event.starts_at = starts_at;
    if (ends_at !== undefined) event.ends_at = ends_at;
    if (timezone !== undefined) event.timezone = timezone;
    if (venue_name !== undefined) {
        const oldVenueName = event.venue_name;
        event.venue_name = venue_name;
        // Sync primary venue if venue_name changed
        if (oldVenueName && oldVenueName !== venue_name) {
            const primaryVenue = await Venue.findOne({
                where: { event_id: event.id, name: oldVenueName },
            });
            if (primaryVenue) {
                primaryVenue.name = venue_name;
                if (venue_address !== undefined) primaryVenue.location_details = venue_address;
                await primaryVenue.save();
            }
        }
    }
    if (venue_address !== undefined) event.venue_address = venue_address;
    if (organizer_name !== undefined) event.organizer_name = organizer_name;
    if (organizer_email !== undefined) event.organizer_email = organizer_email;
    if (organizer_phone !== undefined) event.organizer_phone = organizer_phone;
    if (meeting_request_expiry_hours !== undefined) {
        event.meeting_request_expiry_hours = parseInt(meeting_request_expiry_hours, 10);
    }
    if (allow_personal_photo_uploads !== undefined) {
        event.allow_personal_photo_uploads = Boolean(allow_personal_photo_uploads);
    }
    if (logo_asset_id !== undefined) event.logo_asset_id = logo_asset_id;
    if (banner_asset_id !== undefined) event.banner_asset_id = banner_asset_id;
    if (status !== undefined) event.status = status;
    if (is_active !== undefined) event.is_active = is_active;

    await event.save();
    return event;
}

async function uploadEventMedia(eventId, adminId, mediaData) {
    const { storage_key, original_filename, mime_type, file_size_bytes, scope = "logo" } = mediaData;
    if (!storage_key) {
        throw new AppError("Storage key or data is required.", 400);
    }
    const asset = await MediaAsset.create({
        event_id: eventId,
        storage_key,
        original_filename: original_filename || "upload",
        mime_type: mime_type || "image/png",
        file_size_bytes: file_size_bytes || null,
        access_scope: "public",
        uploaded_by_admin_id: adminId,
    });

    if (scope === "logo") {
        await Event.update({ logo_asset_id: asset.id }, { where: { id: eventId } });
    } else if (scope === "banner") {
        await Event.update({ banner_asset_id: asset.id }, { where: { id: eventId } });
    }

    return asset;
}

async function getAdminEvents(adminId, role, businessCode) {
    // Admins can only see events that match their business_code
    return Event.findAll({
        where: { business_code: businessCode },
        order: [["created_at", "DESC"]],
    });
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
    updateEvent,
    uploadEventMedia,
    getAdminEvents,
    getEventById,
};
