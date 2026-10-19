const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Event = sequelize.define(
        "Event",
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
                    model: { tableName: "admins", schema: "public" },
                    key: "id",
                },
                onDelete: "SET NULL",
            },
            business_code: {
                type: DataTypes.STRING(80),
                allowNull: false,
                unique: true,
            },
            name: {
                type: DataTypes.STRING(200),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            logo_asset_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            banner_asset_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            starts_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            ends_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            timezone: {
                type: DataTypes.STRING(100),
                defaultValue: "UTC",
            },
            venue_name: {
                type: DataTypes.STRING(200),
                allowNull: true,
            },
            venue_address: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            organizer_name: {
                type: DataTypes.STRING(150),
                allowNull: true,
            },
            organizer_email: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            organizer_phone: {
                type: DataTypes.STRING(30),
                allowNull: true,
            },
            meeting_request_expiry_hours: {
                type: DataTypes.INTEGER,
                defaultValue: 24,
            },
            allow_personal_photo_uploads: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            status: {
                type: DataTypes.STRING(20),
                defaultValue: "draft",
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            published_at: {
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
            tableName: "events",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            indexes: [
                {
                    unique: true,
                    fields: ["business_code"],
                },
            ],
        }
    );

    return Event;
};
