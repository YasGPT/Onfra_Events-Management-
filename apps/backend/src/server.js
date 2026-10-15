const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { sequelize, testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await sequelize.authenticate();
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  res.json({
    status: 'ok',
    service: 'confra-backend',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, async () => {
  console.log(`CONFRA backend running on http://localhost:${PORT}`);
  try {
    await testConnection();
  } catch (err) {
    console.warn('[Database] Notice: Initial DB connection check failed. Verify PostgreSQL is running.');
  }
});
