const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const AdminPasswordResetToken = sequelize.define(
        "AdminPasswordResetToken",
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
            token_hash: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            expires_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            used_at: {
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
            tableName: "admin_password_reset_tokens",
            timestamps: false,
        }
    );

    return AdminPasswordResetToken;
};
