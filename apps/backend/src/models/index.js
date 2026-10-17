const sequelize = require("../config/database");
const defineAdminRole = require("./central/AdminRole");
const definePermission = require("./central/Permission");
const defineAdminRolePermission = require("./central/AdminRolePermission");
const defineAdmin = require("./central/Admin");
const defineAdminSession = require("./central/AdminSession");
const defineAdminPasswordResetToken = require("./central/AdminPasswordResetToken");
const defineEvent = require("./central/Event");
const defineAdminEventAccess = require("./central/AdminEventAccess");
const defineAuditLog = require("./central/AuditLog");
const defineEventModels = require("./event/defineEventModels");

// 1. Initialize Central Models (all in "public" schema)
const AdminRole = defineAdminRole(sequelize);
const Permission = definePermission(sequelize);
const AdminRolePermission = defineAdminRolePermission(sequelize);
const Admin = defineAdmin(sequelize);
const AdminSession = defineAdminSession(sequelize);
const AdminPasswordResetToken = defineAdminPasswordResetToken(sequelize);
const Event = defineEvent(sequelize);
const AdminEventAccess = defineAdminEventAccess(sequelize);
const AuditLog = defineAuditLog(sequelize);

// 2. Initialize Event Models (also in "public" schema, linked by event_id)
const eventModels = defineEventModels(sequelize, "public");

// 3. Central Associations
AdminRole.belongsToMany(Permission, {
    through: AdminRolePermission,
    foreignKey: "role_id",
    otherKey: "permission_id",
});
Permission.belongsToMany(AdminRole, {
    through: AdminRolePermission,
    foreignKey: "permission_id",
    otherKey: "role_id",
});

AdminRole.hasMany(Admin, { foreignKey: "role_id" });
Admin.belongsTo(AdminRole, { foreignKey: "role_id" });

Admin.hasMany(AdminSession, { foreignKey: "admin_id" });
AdminSession.belongsTo(Admin, { foreignKey: "admin_id" });

Admin.hasMany(AdminPasswordResetToken, { foreignKey: "admin_id" });
AdminPasswordResetToken.belongsTo(Admin, { foreignKey: "admin_id" });

Admin.hasMany(Event, { foreignKey: "created_by_admin_id" });
Event.belongsTo(Admin, { foreignKey: "created_by_admin_id" });

Admin.hasMany(AdminEventAccess, { foreignKey: "admin_id" });
AdminEventAccess.belongsTo(Admin, { foreignKey: "admin_id" });

Event.hasMany(AdminEventAccess, { foreignKey: "event_id" });
AdminEventAccess.belongsTo(Event, { foreignKey: "event_id" });

Admin.hasMany(AuditLog, { foreignKey: "actor_admin_id" });
AuditLog.belongsTo(Admin, { foreignKey: "actor_admin_id" });

Event.hasMany(AuditLog, { foreignKey: "event_id" });
AuditLog.belongsTo(Event, { foreignKey: "event_id" });

// 4. Event to Tenant Data Associations
Event.hasMany(eventModels.Attendee, { foreignKey: "event_id" });
eventModels.Attendee.belongsTo(Event, { foreignKey: "event_id" });

Event.hasMany(eventModels.EventDay, { foreignKey: "event_id" });
eventModels.EventDay.belongsTo(Event, { foreignKey: "event_id" });

Event.hasMany(eventModels.Track, { foreignKey: "event_id" });
eventModels.Track.belongsTo(Event, { foreignKey: "event_id" });

Event.hasMany(eventModels.Venue, { foreignKey: "event_id" });
eventModels.Venue.belongsTo(Event, { foreignKey: "event_id" });

Event.hasMany(eventModels.Session, { foreignKey: "event_id" });
eventModels.Session.belongsTo(Event, { foreignKey: "event_id" });

Event.hasMany(eventModels.Speaker, { foreignKey: "event_id" });
eventModels.Speaker.belongsTo(Event, { foreignKey: "event_id" });

Event.hasMany(eventModels.Exhibitor, { foreignKey: "event_id" });
eventModels.Exhibitor.belongsTo(Event, { foreignKey: "event_id" });

Event.hasMany(eventModels.SponsorshipTier, { foreignKey: "event_id" });
eventModels.SponsorshipTier.belongsTo(Event, { foreignKey: "event_id" });

Event.hasMany(eventModels.Sponsor, { foreignKey: "event_id" });
eventModels.Sponsor.belongsTo(Event, { foreignKey: "event_id" });

Event.hasMany(eventModels.Meeting, { foreignKey: "event_id" });
eventModels.Meeting.belongsTo(Event, { foreignKey: "event_id" });

// Synchronize all tables in single public schema
async function syncDatabase(options = {}) {
    // 1. Ensure public schema exists
    await sequelize.query('CREATE SCHEMA IF NOT EXISTS "public";');

    // Clean up old legacy schemas if present
    await sequelize.query('DROP SCHEMA IF EXISTS "event_template" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "public"."event_registry" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "public"."attendee_lookups" CASCADE;');

    // 2. Sync central tables
    await AdminRole.sync(options);
    await Permission.sync(options);
    await AdminRolePermission.sync(options);
    await Admin.sync(options);
    await AdminSession.sync(options);
    await AdminPasswordResetToken.sync(options);
    await Event.sync(options);
    await AdminEventAccess.sync(options);
    await AuditLog.sync(options);

    // 3. Sync all event tables in public schema
    const models = Object.values(eventModels);
    for (const model of models) {
        await model.sync(options);
    }

    console.log("All tables unified and synchronized successfully in 'public' schema.");
}

module.exports = {
    sequelize,
    syncDatabase,
    // Central Models
    AdminRole,
    Permission,
    AdminRolePermission,
    Admin,
    AdminSession,
    AdminPasswordResetToken,
    Event,
    AdminEventAccess,
    AuditLog,
    // Event Models
    ...eventModels,
};
