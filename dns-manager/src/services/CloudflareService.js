const axios = require('axios');

class CloudflareService {
  constructor() {
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN;
    this.baseURL = 'https://api.cloudflare.com/client/v4';
  }

  async createRecords(domain, records) {
    const zoneId = await this.getZoneId(domain);
    const results = [];

    for (const record of records) {
      const result = await this.createRecord(zoneId, record);
      results.push(result);
    }

    return results;
  }

  async getZoneId(domain) {
    const response = await axios.get(`${this.baseURL}/zones`, {
      headers: { 'Authorization': `Bearer ${this.apiToken}` },
      params: { name: domain }
    });

    if (response.data.result.length === 0) {
      throw new Error(`Zone not found for domain: ${domain}`);
    }

    return response.data.result[0].id;
  }

  async createRecord(zoneId, record) {
    const response = await axios.post(`${this.baseURL}/zones/${zoneId}/dns_records`, {
      type: record.type,
      name: record.name,
      content: record.value,
      ttl: record.ttl || 3600
    }, {
      headers: { 'Authorization': `Bearer ${this.apiToken}` }
    });

    return response.data.result;
  }
}

module.exports = CloudflareService;