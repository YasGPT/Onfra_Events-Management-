const { sequelize } = require('../config/database');
const User = require('./User');
const Event = require('./Event');
const EventUser = require('./EventUser');
const EventSetting = require('./EventSetting');

// 1. Organizer association (1 User organizes Many Events)
User.hasMany(Event, {
  foreignKey: 'organizer_id',
  as: 'organizedEvents',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});
Event.belongsTo(User, {
  foreignKey: 'organizer_id',
  as: 'organizer',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

// 2. Event Membership (Many-to-Many via EventUser)
User.belongsToMany(Event, {
  through: EventUser,
  foreignKey: 'user_id',
  otherKey: 'event_id',
  as: 'events',
});
Event.belongsToMany(User, {
  through: EventUser,
  foreignKey: 'event_id',
  otherKey: 'user_id',
  as: 'members',
});

// Direct associations for EventUser (useful for querying memberships with roles)
User.hasMany(EventUser, {
  foreignKey: 'user_id',
  as: 'eventMemberships',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
EventUser.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

Event.hasMany(EventUser, {
  foreignKey: 'event_id',
  as: 'eventMemberships',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
EventUser.belongsTo(Event, {
  foreignKey: 'event_id',
  as: 'event',
});

// 3. Event Settings (1-to-1 relationship)
Event.hasOne(EventSetting, {
  foreignKey: 'event_id',
  as: 'settings',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
EventSetting.belongsTo(Event, {
  foreignKey: 'event_id',
  as: 'event',
});

module.exports = {
  sequelize,
  User,
  Event,
  EventUser,
  EventSetting,
};
