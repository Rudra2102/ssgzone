const redis = require('redis');

class SecurityManager {
  constructor() {
    this.redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    });
    
    this.redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
  }

  async validateConnection(remoteAddress) {
    try {
      // Rate limiting
      const isRateLimited = await this.checkRateLimit(remoteAddress);
      if (isRateLimited) {
        console.log(`Rate limited connection from ${remoteAddress}`);
        return false;
      }

      // Blacklist check
      const isBlacklisted = await this.checkBlacklist(remoteAddress);
      if (isBlacklisted) {
        console.log(`Blacklisted connection from ${remoteAddress}`);
        return false;
      }

      // Geographic restrictions (if configured)
      const isGeoBlocked = await this.checkGeographicRestrictions(remoteAddress);
      if (isGeoBlocked) {
        console.log(`Geo-blocked connection from ${remoteAddress}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Security validation error:', error);
      return false; // Fail secure
    }
  }

  async checkRateLimit(remoteAddress) {
    const key = `rate_limit:${remoteAddress}`;
    const maxConnections = 10; // Max connections per minute
    const windowSize = 60; // 1 minute window

    try {
      const current = await this.redisClient.get(key);
      
      if (current === null) {
        await this.redisClient.setex(key, windowSize, 1);
        return false;
      }

      const count = parseInt(current);
      if (count >= maxConnections) {
        return true; // Rate limited
      }

      await this.redisClient.incr(key);
      return false;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return false;
    }
  }

  async checkBlacklist(remoteAddress) {
    try {
      // Check Redis blacklist
      const isBlacklisted = await this.redisClient.sismember('blacklist:ips', remoteAddress);
      if (isBlacklisted) {
        return true;
      }

      // Check known spam sources
      const spamSources = [
        '192.168.1.100', // Example spam IP
        // Add more known spam sources
      ];

      return spamSources.includes(remoteAddress);
    } catch (error) {
      console.error('Blacklist check error:', error);
      return false;
    }
  }

  async checkGeographicRestrictions(remoteAddress) {
    // In production, integrate with GeoIP service
    // For now, allow all connections
    return false;
  }

  async addToBlacklist(ipAddress, reason = 'Manual addition') {
    try {
      await this.redisClient.sadd('blacklist:ips', ipAddress);
      await this.redisClient.hset('blacklist:reasons', ipAddress, reason);
      console.log(`Added ${ipAddress} to blacklist: ${reason}`);
    } catch (error) {
      console.error('Error adding to blacklist:', error);
    }
  }

  async removeFromBlacklist(ipAddress) {
    try {
      await this.redisClient.srem('blacklist:ips', ipAddress);
      await this.redisClient.hdel('blacklist:reasons', ipAddress);
      console.log(`Removed ${ipAddress} from blacklist`);
    } catch (error) {
      console.error('Error removing from blacklist:', error);
    }
  }

  async scanForVirus(content) {
    // In production, integrate with ClamAV or similar
    try {
      // Placeholder virus scanning logic
      const suspiciousPatterns = [
        /eval\s*\(/gi,
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(content)) {
          return true; // Suspicious content detected
        }
      }

      return false;
    } catch (error) {
      console.error('Virus scan error:', error);
      return false; // Fail open for availability
    }
  }

  async validateSPF(senderDomain, senderIP) {
    // SPF validation logic
    try {
      // In production, implement proper SPF checking
      // For now, return true (valid)
      return true;
    } catch (error) {
      console.error('SPF validation error:', error);
      return false;
    }
  }

  async validateDKIM(message) {
    // DKIM validation logic
    try {
      // In production, implement proper DKIM verification
      // For now, return true (valid)
      return true;
    } catch (error) {
      console.error('DKIM validation error:', error);
      return false;
    }
  }

  async logSecurityEvent(event) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        ...event
      };

      await this.redisClient.lpush('security:events', JSON.stringify(logEntry));
      
      // Keep only last 1000 events
      await this.redisClient.ltrim('security:events', 0, 999);
      
      console.log('Security event logged:', logEntry);
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  async getSecurityStats() {
    try {
      const events = await this.redisClient.lrange('security:events', 0, -1);
      const parsedEvents = events.map(event => JSON.parse(event));
      
      const stats = {
        totalEvents: parsedEvents.length,
        recentEvents: parsedEvents.slice(0, 10),
        eventTypes: {}
      };

      parsedEvents.forEach(event => {
        stats.eventTypes[event.type] = (stats.eventTypes[event.type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting security stats:', error);
      return { totalEvents: 0, recentEvents: [], eventTypes: {} };
    }
  }
}

module.exports = { SecurityManager };