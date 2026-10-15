'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const { rateLimit } = require('express-rate-limit');
const { User } = require('../models');
const { signAccessToken } = require('../services/tokenService');

const router = express.Router();

const BCRYPT_WORK_FACTOR = 12;
const MIN_PASSWORD_LENGTH = 8;
// Compared against when the email is unknown so response time does not
// reveal whether an account exists.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_WORK_FACTOR);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again later.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many registrations. Try again later.' },
});

function safeUser(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    directory_opt_in: user.directory_opt_in,
  };
}

function validateRegisterBody(body) {
  const errors = [];
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('A valid email is required.');
  if (password.length < MIN_PASSWORD_LENGTH) errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  if (!fullName) errors.push('full_name is required.');

  return { errors, email, password, fullName };
}

router.post('/register', registerLimiter, async (req, res) => {
  const { errors, email, password, fullName } = validateRegisterBody(req.body || {});
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Invalid request.', details: errors });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
  try {
    const user = await User.create({
      email,
      password_hash: passwordHash,
      full_name: fullName,
    });
    return res.status(201).json({ user: safeUser(user) });
  } catch (err) {
    // Email uniqueness is enforced by the database; a concurrent duplicate
    // registration surfaces here rather than as a check-then-create race.
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Unable to register with this email.' });
    }
    throw err;
  }
});

router.post('/login', authLimiter, async (req, res) => {
  const body = req.body || {};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = await User.findOne({ where: { email } });
  const passwordMatches = await bcrypt.compare(password, user && user.password_hash ? user.password_hash : DUMMY_HASH);

  if (!user || !passwordMatches) {
    // Same message and same code whether the account exists or not.
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const accessToken = signAccessToken(user);
  res.json({ user: safeUser(user), accessToken });
});

module.exports = router;
