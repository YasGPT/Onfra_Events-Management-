const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const databaseUrl = process.env.DATABASE_URL;

let sequelize;

if (databaseUrl) {
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    timezone: '+00:00',
    logging: process.env.NODE_ENV === 'test' ? false : (msg) => console.log(`[Sequelize] ${msg}`),
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  });
} else {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || 5432;
  const database = process.env.DB_NAME || 'confra';
  const username = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || undefined;

  sequelize = new Sequelize(database, username, password, {
    host,
    port,
    dialect: 'postgres',
    timezone: '+00:00',
    logging: process.env.NODE_ENV === 'test' ? false : (msg) => console.log(`[Sequelize] ${msg}`),
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  });
}

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('[Database] PostgreSQL connection established successfully.');
    return true;
  } catch (error) {
    console.error('[Database] Unable to connect to PostgreSQL database:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
};
