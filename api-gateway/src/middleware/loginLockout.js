const redis = require('../services/RedisService');

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60; // 15 minutes
const LOCKOUT_SECONDS = 15 * 60;

function lockoutKey(identifier) {
  return `lockout:${identifier}`;
}

function attemptsKey(identifier) {
  return `login_attempts:${identifier}`;
}

// Call after a failed login attempt — increments counter, locks if threshold reached
async function recordFailedAttempt(identifier) {
  const key = attemptsKey(identifier);
  const client = redis.client;
  const attempts = await client.incr(key);
  if (attempts === 1) await client.expire(key, WINDOW_SECONDS);
  if (attempts >= MAX_ATTEMPTS) {
    await client.set(lockoutKey(identifier), '1', { EX: LOCKOUT_SECONDS });
    await client.del(key);
  }
  return attempts;
}

// Call after a successful login — clears the counter
async function clearFailedAttempts(identifier) {
  await redis.client.del(attemptsKey(identifier));
}

// Express middleware — rejects request if identifier is locked out
function checkLockout(getIdentifier) {
  return async (req, res, next) => {
    const identifier = getIdentifier(req);
    if (!identifier) return next();
    try {
      const locked = await redis.client.get(lockoutKey(identifier));
      if (locked) {
        return res.status(429).json({
          success: false,
          error: 'Account temporarily locked due to too many failed login attempts. Try again in 15 minutes.'
        });
      }
      next();
    } catch {
      next(); // Redis failure must not block login
    }
  };
}

module.exports = { checkLockout, recordFailedAttempt, clearFailedAttempts };
