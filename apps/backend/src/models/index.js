const sequelize = require("../config/database");
const defineAdminRole = require("./central/AdminRole");
const definePermission = require("./central/Permission");
const defineAdminRolePermission = require("./central/AdminRolePermission");
const defineAdmin = require("./central/Admin");
const defineAdminSession = require("./central/AdminSession");
const defineAdminPasswordResetToken = require("./central/AdminPasswordResetToken");
const defineEventRegistry = require("./central/EventRegistry");
const defineAdminEventAccess = require("./central/AdminEventAccess");
const defineAuditLog = require("./central/AuditLog");
const defineAttendeeLookup = require("./central/AttendeeLookup");
const defineEventModels = require("./event/defineEventModels");

// Initialize Central Models (schema: "public")
const AdminRole = defineAdminRole(sequelize);
const Permission = definePermission(sequelize);
const AdminRolePermission = defineAdminRolePermission(sequelize);
const Admin = defineAdmin(sequelize);
const AdminSession = defineAdminSession(sequelize);
const AdminPasswordResetToken = defineAdminPasswordResetToken(sequelize);
const EventRegistry = defineEventRegistry(sequelize);
const AdminEventAccess = defineAdminEventAccess(sequelize);
const AuditLog = defineAuditLog(sequelize);
const AttendeeLookup = defineAttendeeLookup(sequelize);

// Central Associations
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

Admin.hasMany(EventRegistry, { foreignKey: "created_by_admin_id" });
EventRegistry.belongsTo(Admin, { foreignKey: "created_by_admin_id" });

Admin.hasMany(AdminEventAccess, { foreignKey: "admin_id" });
AdminEventAccess.belongsTo(Admin, { foreignKey: "admin_id" });

EventRegistry.hasMany(AdminEventAccess, { foreignKey: "event_registry_id" });
AdminEventAccess.belongsTo(EventRegistry, { foreignKey: "event_registry_id" });

Admin.hasMany(AuditLog, { foreignKey: "actor_admin_id" });
AuditLog.belongsTo(Admin, { foreignKey: "actor_admin_id" });

EventRegistry.hasMany(AuditLog, { foreignKey: "event_registry_id" });
AuditLog.belongsTo(EventRegistry, { foreignKey: "event_registry_id" });

EventRegistry.hasMany(AttendeeLookup, { foreignKey: "event_registry_id" });
AttendeeLookup.belongsTo(EventRegistry, { foreignKey: "event_registry_id" });

// Event model cache by schema name
const eventModelCache = new Map();

function getEventModels(schemaName = "event_template") {
    if (!eventModelCache.has(schemaName)) {
        const models = defineEventModels(sequelize, schemaName);
        eventModelCache.set(schemaName, models);
    }
    return eventModelCache.get(schemaName);
}

// Default event template models
const eventTemplateModels = getEventModels("event_template");

// Synchronize all central and template tables
async function syncDatabase(options = {}) {
    // 1. Ensure public and event_template schemas exist
    await sequelize.query('CREATE SCHEMA IF NOT EXISTS "public";');
    await sequelize.query('CREATE SCHEMA IF NOT EXISTS "event_template";');

    // 2. Sync central tables in public schema
    await AdminRole.sync(options);
    await Permission.sync(options);
    await AdminRolePermission.sync(options);
    await Admin.sync(options);
    await AdminSession.sync(options);
    await AdminPasswordResetToken.sync(options);
    await EventRegistry.sync(options);
    await AdminEventAccess.sync(options);
    await AuditLog.sync(options);
    await AttendeeLookup.sync(options);

    // 3. Sync all event tables in event_template schema
    const models = Object.values(eventTemplateModels);
    for (const model of models) {
        await model.sync(options);
    }

    console.log("All central and event_template tables synchronized successfully.");
}

module.exports = {
    sequelize,
    syncDatabase,
    getEventModels,
    // Central Models
    AdminRole,
    Permission,
    AdminRolePermission,
    Admin,
    AdminSession,
    AdminPasswordResetToken,
    EventRegistry,
    AdminEventAccess,
    AuditLog,
    AttendeeLookup,
    // Default Template Models
    ...eventTemplateModels,
};
