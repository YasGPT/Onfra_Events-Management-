'use strict';

require('dotenv').config();

const MIN_SECRET_LENGTH = 32;

function assertSecureEnv() {
  const problems = [];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    problems.push('JWT_SECRET is not set. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  } else if (secret.length < MIN_SECRET_LENGTH) {
    problems.push(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters.`);
  } else if (/^(changeme|secret|test|dev)/i.test(secret)) {
    problems.push('JWT_SECRET looks like a placeholder. Use a random value.');
  }

  if (problems.length > 0) {
    throw new Error(`Insecure environment:\n- ${problems.join('\n- ')}`);
  }
}

assertSecureEnv();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  jwtSecret: process.env.JWT_SECRET,
  jwtIssuer: 'confra-api',
  jwtAudience: 'confra-clients',
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
};
