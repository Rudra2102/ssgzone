const redis = require('redis');

class ReputationService {
  constructor() {
    this.redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    });
  }

  async trackDelivery(recipientDomain, status) {
    const key = `reputation:${recipientDomain}`;
    const today = new Date().toISOString().split('T')[0];
    
    try {
      await this.redisClient.hincrby(`${key}:${today}`, status, 1);
      await this.redisClient.expire(`${key}:${today}`, 86400 * 30);
    } catch (error) {
      console.error('Failed to track delivery:', error);
    }
  }

  async getReputationScore(recipientDomain) {
    const key = `reputation:${recipientDomain}`;
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const stats = await this.redisClient.hgetall(`${key}:${today}`);
      
      const delivered = parseInt(stats.delivered || 0);
      const bounced = parseInt(stats.bounced || 0);
      const rejected = parseInt(stats.rejected || 0);
      
      const total = delivered + bounced + rejected;
      if (total === 0) return 100;
      
      const successRate = (delivered / total) * 100;
      return Math.max(0, Math.min(100, successRate));
    } catch (error) {
      console.error('Failed to get reputation score:', error);
      return 50;
    }
  }

  async shouldThrottle(recipientDomain) {
    const score = await this.getReputationScore(recipientDomain);
    
    if (score < 70) {
      return {
        throttle: true,
        delay: Math.max(1000, (100 - score) * 100),
        reason: `Low reputation score: ${score}%`
      };
    }
    
    return { throttle: false };
  }

  async getDedicatedIpStats() {
    try {
      const serverIp = process.env.SERVER_IP || '127.0.0.1';
      
      return {
        ip: serverIp,
        reputation_score: await this.getOverallReputation(),
        daily_volume: await this.getDailyVolume(),
        bounce_rate: await this.getBounceRate()
      };
    } catch (error) {
      console.error('Failed to get IP stats:', error);
      return null;
    }
  }

  async getOverallReputation() {
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com'];
    let totalScore = 0;
    let count = 0;
    
    for (const domain of domains) {
      const score = await this.getReputationScore(domain);
      totalScore += score;
      count++;
    }
    
    return count > 0 ? totalScore / count : 100;
  }

  async getDailyVolume() {
    const today = new Date().toISOString().split('T')[0];
    const key = `volume:${today}`;
    
    try {
      const volume = await this.redisClient.get(key);
      return parseInt(volume || 0);
    } catch (error) {
      return 0;
    }
  }

  async getBounceRate() {
    return 2.5; // Mock bounce rate
  }
}

module.exports = { ReputationService };