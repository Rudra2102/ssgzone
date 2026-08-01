const { createClient } = require('redis');

class RedisService {
  constructor() {
    this.client = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
      },
      ...(process.env.REDIS_PASSWORD ? { password: process.env.REDIS_PASSWORD } : {}),
    });

    this.client.on('error', (err) => console.error('Redis error:', err.message));
    this.client.on('connect', () => console.log('Redis connected'));
  }

  async connect() {
    if (!this.client.isOpen) await this.client.connect();
  }

  // Blacklist a JWT by its jti. TTL = remaining seconds until token expiry.
  async blacklistToken(jti, ttlSeconds) {
    await this.client.set(`bl:${jti}`, '1', { EX: ttlSeconds });
  }

  async isBlacklisted(jti) {
    const val = await this.client.get(`bl:${jti}`);
    return val !== null;
  }

  // Refresh token store: key = userId, value = hashed refresh token
  async setRefreshToken(userId, hashedToken, ttlSeconds) {
    await this.client.set(`rt:${userId}`, hashedToken, { EX: ttlSeconds });
  }

  async getRefreshToken(userId) {
    return this.client.get(`rt:${userId}`);
  }

  async deleteRefreshToken(userId) {
    await this.client.del(`rt:${userId}`);
  }
}

module.exports = new RedisService();
