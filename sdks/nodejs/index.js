const axios = require('axios');

class SSGHubClient {
  constructor(options = {}) {
    this.apiKey = options.apiKey;
    this.baseURL = options.baseURL || 'http://localhost:4000/api/v1';
    this.timeout = options.timeout || 30050;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  // SaaS Management
  async registerSaaS(data) {
    const response = await this.client.post('/saas/register', data);
    return response.data;
  }

  // Tenant Management
  async provisionTenant(data) {
    const response = await this.client.post('/tenant/provision', data);
    return response.data;
  }

  async createDistributionGroup(data) {
    const response = await this.client.post('/tenant/group/create', data);
    return response.data;
  }

  // User Management
  async createUser(data) {
    const response = await this.client.post('/user/create', data);
    return response.data;
  }

  async updateUser(data) {
    const response = await this.client.put('/user/update', data);
    return response.data;
  }

  async suspendUser(email) {
    const response = await this.client.post('/user/suspend', { email });
    return response.data;
  }

  async deleteUser(email) {
    const response = await this.client.delete('/user/delete', { data: { email } });
    return response.data;
  }

  // Webhook Management
  async registerWebhook(data) {
    const response = await this.client.post('/webhooks/register', data);
    return response.data;
  }

  // Search
  async searchEmails(query, options = {}) {
    const params = { q: query, ...options };
    const response = await this.client.get('/search/emails', { params });
    return response.data;
  }
}

module.exports = SSGHubClient;