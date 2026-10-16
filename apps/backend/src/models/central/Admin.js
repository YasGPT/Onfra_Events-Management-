const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Admin = sequelize.define(
        "Admin",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            role_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: {
                        tableName: "admin_roles",
                        schema: "public",
                    },
                    key: "id",
                },
                onDelete: "SET NULL",
            },
            full_name: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true,
                validate: {
                    isEmail: true,
                },
            },
            phone: {
                type: DataTypes.STRING(30),
                allowNull: true,
            },
            password_hash: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            email_verified_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            last_login_at: {
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
            tableName: "admins",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );

    return Admin;
};
