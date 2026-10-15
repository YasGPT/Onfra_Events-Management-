'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('events', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      organizer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      slug: { type: Sequelize.TEXT, allowNull: false, unique: true },
      title: { type: Sequelize.TEXT, allowNull: false },
      description: { type: Sequelize.TEXT },
      starts_at: { type: Sequelize.DATE({ timezone: true }), allowNull: false },
      ends_at: { type: Sequelize.DATE({ timezone: true }), allowNull: false },
      timezone: { type: Sequelize.TEXT, allowNull: false, defaultValue: 'UTC' },
      status: {
        type: Sequelize.ENUM('draft', 'published', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
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

    await queryInterface.addIndex('events', ['organizer_id']);
    await queryInterface.sequelize.query(
      `ALTER TABLE events ADD CONSTRAINT events_valid_period CHECK (ends_at >= starts_at);`
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('events');
  },
};
