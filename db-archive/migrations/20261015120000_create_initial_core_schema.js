'use strict';

/**
 * Migration: Initial Core Schema
 * Creates the initial 4 core tables for Confra:
 *  1. users
 *  2. events
 *  3. event_users
 *  4. event_settings
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      full_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      avatar_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      directory_opt_in: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Case-insensitive unique email index
    await queryInterface.addIndex('users', [Sequelize.fn('lower', Sequelize.col('email'))], {
      name: 'users_email_lower_idx',
      unique: true,
    });

    // 2. events table
    await queryInterface.createTable('events', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      organizer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      timezone: {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: 'UTC',
      },
      status: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'draft',
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('events', ['organizer_id'], {
      name: 'events_organizer_id_idx',
    });
    await queryInterface.addIndex('events', ['slug'], {
      name: 'events_slug_idx',
      unique: true,
    });

    // 3. event_users table (Event membership and event-specific role)
    await queryInterface.createTable('event_users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      event_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'events',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'attendee',
      },
      status: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'active',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Unique constraint: A user can belong to an event only once
    await queryInterface.addConstraint('event_users', {
      fields: ['event_id', 'user_id'],
      type: 'unique',
      name: 'event_users_event_user_unique',
    });

    await queryInterface.addIndex('event_users', ['event_id'], {
      name: 'event_users_event_id_idx',
    });
    await queryInterface.addIndex('event_users', ['user_id'], {
      name: 'event_users_user_id_idx',
    });

    // 4. event_settings table (1-to-1 event configuration and feature toggles)
    await queryInterface.createTable('event_settings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      event_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'events',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      allow_connections: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      allow_meetings: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      directory_visibility: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'opt_in',
      },
      features: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('event_settings', ['event_id'], {
      name: 'event_settings_event_id_unique_idx',
      unique: true,
    });
  },

  down: async (queryInterface) => {
    // Drop in reverse dependency order
    await queryInterface.dropTable('event_settings');
    await queryInterface.dropTable('event_users');
    await queryInterface.dropTable('events');
    await queryInterface.dropTable('users');
  },
};
