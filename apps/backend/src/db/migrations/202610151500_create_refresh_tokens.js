'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('refresh_tokens', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // SHA-256 hex of the raw token. The raw token is never stored.
      token_hash: { type: Sequelize.TEXT, allowNull: false, unique: true },
      // Rotation lineage: all tokens minted from the same initial login share a family.
      family_id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      parent_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'refresh_tokens', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      expires_at: { type: Sequelize.DATE({ timezone: true }), allowNull: false },
      // Set on rotation (single-use), logout, or family revocation.
      revoked_at: { type: Sequelize.DATE({ timezone: true }), allowNull: true },
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

    await queryInterface.sequelize.query(
      `ALTER TABLE refresh_tokens ADD CONSTRAINT refresh_tokens_valid_lifetime CHECK (expires_at > created_at);`
    );
    await queryInterface.addIndex('refresh_tokens', ['user_id']);
    await queryInterface.addIndex('refresh_tokens', ['family_id']);
    await queryInterface.addIndex('refresh_tokens', ['expires_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('refresh_tokens');
  },
};
