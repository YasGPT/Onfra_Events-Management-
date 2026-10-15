const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
      set(val) {
        if (typeof val === 'string') {
          this.setDataValue('email', val.trim().toLowerCase());
        }
      },
    },
    // Nullable until the auth milestone; DB CHECK ensures any stored hash is non-empty.
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    full_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      trim: true,
    },
    avatar_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    directory_opt_in: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    timestamps: true,
  }
);

module.exports = User;
