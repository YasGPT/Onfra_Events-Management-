const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const AttendeeLookup = sequelize.define(
        "AttendeeLookup",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            normalized_email: {
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true,
            },
            event_registry_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: {
                        tableName: "event_registry",
                        schema: "public",
                    },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            schema_name: {
                type: DataTypes.STRING(63),
                allowNull: false,
            },
            attendee_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            schema: "public",
            tableName: "attendee_lookups",
            timestamps: false,
            indexes: [
                {
                    unique: true,
                    fields: ["normalized_email"],
                },
                {
                    fields: ["event_registry_id"],
                },
            ],
        }
    );

    return AttendeeLookup;
};
