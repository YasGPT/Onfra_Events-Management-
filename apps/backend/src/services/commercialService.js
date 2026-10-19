const {
    ExhibitorCategory,
    Exhibitor,
    ExhibitorOffering,
    EventFloorMap,
    Stall,
    SponsorshipTier,
    Sponsor,
} = require("../models");
const AppError = require("../utils/AppError");
const { Op } = require("sequelize");

// --- Exhibitor Categories ---
async function createCategory(eventId, data) {
    const { name, description } = data;
    if (!name) throw new AppError("Category name is required.", 400);
    return ExhibitorCategory.create({ event_id: eventId, name, description });
}

async function getCategories(eventId) {
    return ExhibitorCategory.findAll({
        where: { event_id: eventId },
        order: [["name", "ASC"]],
    });
}

// --- Exhibitors ---
async function createExhibitor(adminId, eventId, data) {
    const {
        company_name,
        category_id,
        description,
        website_url,
        contact_name,
        contact_email,
        contact_phone,
        booth_number,
        booth_type,
        stall_size,
        zone_location,
        special_requirements,
        internal_notes,
        display_order,
    } = data;

    if (!company_name) throw new AppError("Company name is required.", 400);

    const exhibitor = await Exhibitor.create({
        event_id: eventId,
        created_by_admin_id: adminId,
        company_name,
        category_id: category_id || null,
        description,
        website_url,
        contact_name,
        contact_email,
        contact_phone,
        booth_number,
        booth_type: booth_type || "standard",
        stall_size,
        zone_location,
        special_requirements,
        internal_notes,
        display_order: display_order || 0,
        status: "pending",
    });

    return getExhibitorById(exhibitor.id);
}

async function getExhibitors(eventId, filters = {}) {
    const where = { event_id: eventId, status: "active" };

    if (filters.category_id) where.category_id = filters.category_id;
    if (filters.search) {
        where[Op.or] = [
            { company_name: { [Op.iLike]: `%${filters.search}%` } },
            { description: { [Op.iLike]: `%${filters.search}%` } },
        ];
    }

    return Exhibitor.findAll({
        where,
        include: [
            { model: ExhibitorCategory, attributes: ["id", "name"] },
            { model: Stall },
            { model: ExhibitorOffering },
        ],
        order: [["display_order", "ASC"], ["company_name", "ASC"]],
    });
}

async function getExhibitorById(id) {
    const exhibitor = await Exhibitor.findByPk(id, {
        include: [ExhibitorCategory, Stall, ExhibitorOffering],
    });
    if (!exhibitor) throw new AppError("Exhibitor not found.", 404);
    return exhibitor;
}

async function updateExhibitor(id, data) {
    const exhibitor = await getExhibitorById(id);
    
    // Update only allowed fields
    const allowedFields = [
        'company_name',
        'category_id',
        'description',
        'website_url',
        'contact_name',
        'contact_email',
        'contact_phone',
        'booth_number',
        'booth_type',
        'stall_size',
        'zone_location',
        'special_requirements',
        'internal_notes',
        'status',
        'display_order',
    ];
    
    const updateData = {};
    allowedFields.forEach(field => {
        if (data[field] !== undefined) {
            updateData[field] = data[field];
        }
    });
    
    await exhibitor.update(updateData);
    return getExhibitorById(id);
}

async function deleteExhibitor(id) {
    const exhibitor = await getExhibitorById(id);
    await exhibitor.destroy();
    return { success: true, message: "Exhibitor removed successfully." };
}

async function updateExhibitorStatus(id, status) {
    const exhibitor = await getExhibitorById(id);
    
    const validStatuses = ['pending', 'approved', 'rejected', 'active', 'inactive'];
    if (!validStatuses.includes(status)) {
        throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }
    
    await exhibitor.update({ status });
    return getExhibitorById(id);
}

async function getExhibitorStats(eventId) {
    const total = await Exhibitor.count({ where: { event_id: eventId } });
    const pending = await Exhibitor.count({ where: { event_id: eventId, status: 'pending' } });
    const approved = await Exhibitor.count({ where: { event_id: eventId, status: 'approved' } });
    const rejected = await Exhibitor.count({ where: { event_id: eventId, status: 'rejected' } });
    const active = await Exhibitor.count({ where: { event_id: eventId, status: 'active' } });
    
    return {
        total,
        pending,
        approved,
        rejected,
        active,
    };
}

// --- Offerings ---
async function addOffering(exhibitorId, data) {
    const { name, offering_type, description, display_order } = data;
    if (!name) throw new AppError("Offering name is required.", 400);
    return ExhibitorOffering.create({
        exhibitor_id: exhibitorId,
        name,
        offering_type: offering_type || "product",
        description,
        display_order: display_order || 0,
    });
}

// --- Floor Map & Stalls ---
async function assignStall(data) {
    const { floor_map_id, exhibitor_id, stall_number, x_percent, y_percent } = data;

    if (!floor_map_id || !stall_number || x_percent === undefined || y_percent === undefined) {
        throw new AppError("Floor map ID, stall number, and x/y coordinates are required.", 400);
    }

    // Check duplicate stall number on floor map
    const existing = await Stall.findOne({
        where: { floor_map_id, stall_number },
    });

    if (existing) {
        throw new AppError(`Stall number '${stall_number}' already exists on this floor map.`, 409);
    }

    return Stall.create({
        floor_map_id,
        exhibitor_id: exhibitor_id || null,
        stall_number,
        x_percent,
        y_percent,
    });
}

async function getStalls(eventId) {
    return Stall.findAll({
        include: [
            {
                model: EventFloorMap,
                where: { event_id: eventId },
                attributes: ["id", "media_asset_id"],
            },
            {
                model: Exhibitor,
                attributes: ["id", "company_name", "contact_name", "website_url"],
            },
        ],
    });
}

async function getTiers(eventId) {
    let tiers = await SponsorshipTier.findAll({
        where: { event_id: eventId },
        order: [["display_order", "ASC"]],
    });

    if (tiers.length === 0) {
        tiers = await SponsorshipTier.bulkCreate([
            { event_id: eventId, name: "Gold", display_order: 1 },
            { event_id: eventId, name: "Silver", display_order: 2 },
            { event_id: eventId, name: "Bronze", display_order: 3 },
        ]);
    }

    return tiers;
}

async function createTier(eventId, data) {
    const { name, display_order } = data;
    if (!name) throw new AppError("Tier name is required.", 400);
    return SponsorshipTier.create({ event_id: eventId, name, display_order: display_order || 0 });
}

// --- Sponsors ---
async function createSponsor(adminId, eventId, data) {
    const {
        tier_id,
        organization_name,
        organization_type,
        description,
        representative_name,
        contact_email,
        contact_phone,
        website_url,
        display_order,
    } = data;

    if (!organization_name || !tier_id) {
        throw new AppError("Organization name and sponsorship tier are required.", 400);
    }

    const sponsor = await Sponsor.create({
        event_id: eventId,
        created_by_admin_id: adminId,
        tier_id,
        organization_name,
        organization_type,
        description,
        representative_name,
        contact_email,
        contact_phone,
        website_url,
        display_order: display_order || 0,
        status: "active",
    });

    return getSponsorById(sponsor.id);
}

async function getSponsors(eventId) {
    return Sponsor.findAll({
        where: { event_id: eventId, status: "active" },
        include: [{ model: SponsorshipTier, attributes: ["id", "name", "display_order"] }],
        order: [
            [{ model: SponsorshipTier }, "display_order", "ASC"],
            ["display_order", "ASC"],
            ["organization_name", "ASC"],
        ],
    });
}

async function getSponsorById(id) {
    const sponsor = await Sponsor.findByPk(id, { include: [SponsorshipTier] });
    if (!sponsor) throw new AppError("Sponsor not found.", 404);
    return sponsor;
}

async function updateSponsor(id, data) {
    const sponsor = await getSponsorById(id);
    await sponsor.update(data);
    return getSponsorById(id);
}

async function deleteSponsor(id) {
    const sponsor = await getSponsorById(id);
    await sponsor.destroy();
    return { success: true, message: "Sponsor removed successfully." };
}

module.exports = {
    createCategory,
    getCategories,
    createExhibitor,
    getExhibitors,
    getExhibitorById,
    updateExhibitor,
    deleteExhibitor,
    updateExhibitorStatus,
    getExhibitorStats,
    addOffering,
    assignStall,
    getStalls,
    getTiers,
    createTier,
    createSponsor,
    getSponsors,
    getSponsorById,
    updateSponsor,
    deleteSponsor,
};
