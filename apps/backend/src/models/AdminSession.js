const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const AdminSession = sequelize.define(
        "AdminSession",
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
                    model: {
                        tableName: "admins",
                        schema: "public",
                    },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            refresh_token_hash: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            expires_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            revoked_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            schema: "public",
            tableName: "admin_sessions",
            timestamps: false,
        }
    );

    return AdminSession;
};
