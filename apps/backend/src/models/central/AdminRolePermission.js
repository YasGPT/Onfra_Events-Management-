const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const AdminRolePermission = sequelize.define(
        "AdminRolePermission",
        {
            role_id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                references: {
                    model: {
                        tableName: "admin_roles",
                        schema: "public",
                    },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            permission_id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                references: {
                    model: {
                        tableName: "permissions",
                        schema: "public",
                    },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
        },
        {
            schema: "public",
            tableName: "admin_role_permissions",
            timestamps: false,
        }
    );

    return AdminRolePermission;
};
