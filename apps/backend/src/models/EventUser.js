const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class EventUser extends Model {}

EventUser.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    event_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'events',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    role: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'attendee',
      // Must match the PG enum: attendee | exhibitor | organizer | admin
      validate: {
        isIn: [['attendee', 'exhibitor', 'organizer', 'admin']],
      },
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'active',
      // Must match the PG enum: invited | active | removed
      validate: {
        isIn: [['invited', 'active', 'removed']],
      },
    },
  },
  {
    sequelize,
    modelName: 'EventUser',
    tableName: 'event_users',
    underscored: true,
    timestamps: true,
  }
);

module.exports = EventUser;
