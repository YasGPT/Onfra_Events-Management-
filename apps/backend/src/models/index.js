const sequelize = require("../config/database");
const defineAdminRole = require("./AdminRole");
const definePermission = require("./Permission");
const defineAdminRolePermission = require("./AdminRolePermission");
const defineAdmin = require("./Admin");
const defineAdminSession = require("./AdminSession");
const defineAdminPasswordResetToken = require("./AdminPasswordResetToken");
const defineEvent = require("./Event");
const defineAuditLog = require("./AuditLog");
const defineEventModels = require("./defineEventModels");

// 1. Initialize Central Models (all in "public" schema)
const AdminRole = defineAdminRole(sequelize);
const Permission = definePermission(sequelize);
const AdminRolePermission = defineAdminRolePermission(sequelize);
const Admin = defineAdmin(sequelize);
const AdminSession = defineAdminSession(sequelize);
const AdminPasswordResetToken = defineAdminPasswordResetToken(sequelize);
const Event = defineEvent(sequelize);
const AuditLog = defineAuditLog(sequelize);

// 2. Initialize Event Models (also in "public" schema, linked by event_id)
const eventModels = defineEventModels(sequelize);

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

    // 2. Sync central tables
    await AdminRole.sync(options);
    await Permission.sync(options);
    await AdminRolePermission.sync(options);
    await Admin.sync(options);
    await AdminSession.sync(options);
    await AdminPasswordResetToken.sync(options);
    await Event.sync(options);
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
    AuditLog,
    // Event Models
    ...eventModels,
};
