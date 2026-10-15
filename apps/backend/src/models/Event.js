const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Event extends Model {}

Event.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    organizer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      trim: true,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      trim: true,
      set(val) {
        if (typeof val === 'string') {
          this.setDataValue('slug', val.trim().toLowerCase());
        }
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    timezone: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'UTC',
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'draft',
      validate: {
        isIn: [['draft', 'published', 'archived']],
      },
    },
    // Column names match the live schema (TIMESTAMPTZ, NOT NULL, DB CHECK ends_at >= starts_at).
    starts_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    ends_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Event',
    tableName: 'events',
    underscored: true,
    timestamps: true,
  }
);

module.exports = Event;
