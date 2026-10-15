'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('event_settings', {
      event_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        references: { model: 'events', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      allow_connections: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      allow_meetings: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      directory_visibility: {
        type: Sequelize.ENUM('opt_in', 'public', 'hidden'),
        allowNull: false,
        defaultValue: 'opt_in',
      },
      features: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('event_settings');
  },
};
