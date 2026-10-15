const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class EventSetting extends Model {}

EventSetting.init(
  {
    // 1:1 with events: event_id is BOTH primary key and foreign key (matches live schema).
    event_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'events',
        key: 'id',
      },
    },
    allow_connections: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    allow_meetings: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    directory_visibility: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'opt_in',
      // Must match the PG enum: opt_in | public | hidden
      validate: {
        isIn: [['opt_in', 'public', 'hidden']],
      },
    },
    features: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'EventSetting',
    tableName: 'event_settings',
    underscored: true,
    timestamps: true,
  }
);

module.exports = EventSetting;
