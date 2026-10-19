const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const AuditLog = sequelize.define(
        "AuditLog",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            actor_admin_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: { tableName: "admins", schema: "public" },
                    key: "id",
                },
                onDelete: "SET NULL",
            },
            event_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: { tableName: "events", schema: "public" },
                    key: "id",
                },
                onDelete: "SET NULL",
            },
            actor_identifier: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            action: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            entity_type: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            entity_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            metadata: {
                type: DataTypes.JSONB,
                allowNull: true,
            },
            ip_address: {
                type: DataTypes.STRING(45),
                allowNull: true,
            },
            user_agent: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            schema: "public",
            tableName: "audit_logs",
            timestamps: false,
        }
    );

    return AuditLog;
};
