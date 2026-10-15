const express = require('express');
const cors = require('cors');
// Requiring env.js fails fast if JWT_SECRET is missing or insecure.
const env = require('./config/env');
const { sequelize, testConnection } = require('./config/database');
const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = env.port;

app.disable('x-powered-by');
app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', authRoutes);

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

// Central JSON error handler: never leak stacks or DB details to clients.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    console.error('[Error]', err.message);
  }
  res.status(status).json({ error: status >= 500 ? 'Internal server error.' : err.message });
});

app.listen(PORT, async () => {
  console.log(`CONFRA backend running on http://localhost:${PORT}`);
  try {
    await testConnection();
  } catch (err) {
    console.warn('[Database] Notice: Initial DB connection check failed. Verify PostgreSQL is running.');
  }
});
