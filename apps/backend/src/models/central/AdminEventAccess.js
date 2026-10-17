const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const AdminEventAccess = sequelize.define(
        "AdminEventAccess",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            admin_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "admins", schema: "public" },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            event_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "events", schema: "public" },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            granted_by_admin_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: { tableName: "admins", schema: "public" },
                    key: "id",
                },
                onDelete: "SET NULL",
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            schema: "public",
            tableName: "admin_event_access",
            timestamps: false,
            indexes: [
                {
                    unique: true,
                    fields: ["admin_id", "event_id"],
                },
            ],
        }
    );

    return AdminEventAccess;
};
