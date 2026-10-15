'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      email: { type: Sequelize.TEXT, allowNull: false, unique: true },
      // Nullable until the auth milestone; CHECK ensures any stored hash is non-empty.
      password_hash: { type: Sequelize.TEXT },
      full_name: { type: Sequelize.TEXT, allowNull: false },
      avatar_url: { type: Sequelize.TEXT },
      directory_opt_in: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
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
      `ALTER TABLE users ADD CONSTRAINT users_email_lowercase CHECK (email = lower(email));`
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE users ADD CONSTRAINT users_password_hash_nonempty CHECK (password_hash IS NULL OR length(password_hash) > 0);`
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
