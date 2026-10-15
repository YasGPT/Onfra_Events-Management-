'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('event_users', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      event_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'events', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.ENUM('attendee', 'exhibitor', 'organizer', 'admin'),
        allowNull: false,
        defaultValue: 'attendee',
      },
      status: {
        type: Sequelize.ENUM('invited', 'active', 'removed'),
        allowNull: false,
        defaultValue: 'active',
      },
      created_at: {
        type: Sequelize.DATE({ timezone: true }),
        allowNull: false,
        defaultValue: Sequelize.literal('now()'),
      },
      updated_at: {
        type: Sequelize.DATE({ timezone: true }),
        allowNull: false,
        defaultValue: Sequelize.literal('now()'),
      },
    });

    await queryInterface.addConstraint('event_users', {
      fields: ['event_id', 'user_id'],
      type: 'unique',
      name: 'event_users_event_user_unique',
    });
    await queryInterface.addIndex('event_users', ['user_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('event_users');
  },
};
