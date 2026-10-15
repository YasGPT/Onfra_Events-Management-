const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const EventRegistry = sequelize.define(
        "EventRegistry",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            created_by_admin_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: {
                        tableName: "admins",
                        schema: "public",
                    },
                    key: "id",
                },
                onDelete: "SET NULL",
            },
            business_code: {
                type: DataTypes.STRING(80),
                allowNull: false,
                unique: true,
            },
            schema_name: {
                type: DataTypes.STRING(63),
                allowNull: false,
                unique: true,
            },
            provisioning_status: {
                type: DataTypes.STRING(20),
                defaultValue: "pending",
                validate: {
                    isIn: [["pending", "provisioning", "ready", "failed"]],
                },
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            schema_version: {
                type: DataTypes.STRING(100),
                defaultValue: "1.0.0",
            },
            provisioned_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            last_migrated_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            schema: "public",
            tableName: "event_registry",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );

    return EventRegistry;
};
