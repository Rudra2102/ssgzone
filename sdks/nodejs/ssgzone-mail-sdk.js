// SSGzone Mail SDK for Node.js
// Copy this file to your project and use it

class SSGzoneMailSDK {
  constructor(apiKey, baseUrl = 'http://YOUR_SERVER_IP:4000', saasSlug = 'lms') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.saasSlug = saasSlug;
  }

  async request(method, endpoint, data = null) {
    const fetch = require('node-fetch');
    
    const options = {
      method,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    return await response.json();
  }

  // Create a new tenant (company/organization)
  async createTenant(companyName, tenantSlug) {
    return await this.request('POST', '/api/v1/tenant/provision', {
      saas_slug: this.saasSlug,
      company_name: companyName,
      tenant_slug: tenantSlug
    });
  }

  // Create a new user email account
  async createUser(tenantSlug, firstName, lastName, password) {
    return await this.request('POST', '/api/v1/user/create', {
      tenant_slug: tenantSlug,
      saas_slug: this.saasSlug,
      first_name: firstName,
      last_name: lastName,
      password: password
    });
  }

  // Get user information
  async getUser(email) {
    return await this.request('GET', `/api/v1/user/info?email=${email}`);
  }

  // Suspend user account
  async suspendUser(email) {
    return await this.request('POST', '/api/v1/user/suspend', { email });
  }

  // Activate user account
  async activateUser(email) {
    return await this.request('POST', '/api/v1/user/activate', { email });
  }

  // Delete user account
  async deleteUser(email) {
    return await this.request('DELETE', '/api/v1/user/delete', { email });
  }

  // Update user password
  async updatePassword(email, newPassword) {
    return await this.request('POST', '/api/v1/user/update-password', {
      email,
      new_password: newPassword
    });
  }

  // Get tenant information
  async getTenant(tenantSlug) {
    return await this.request('GET', `/api/v1/tenant/info?tenant_slug=${tenantSlug}&saas_slug=${this.saasSlug}`);
  }

  // List all users in a tenant
  async listUsers(tenantSlug) {
    return await this.request('GET', `/api/v1/tenant/users?tenant_slug=${tenantSlug}&saas_slug=${this.saasSlug}`);
  }
}

module.exports = SSGzoneMailSDK;

// USAGE EXAMPLE:
/*
const SSGzoneMailSDK = require('./ssgzone-mail-sdk');

const mailClient = new SSGzoneMailSDK(
  'YOUR_API_KEY',
  'http://YOUR_SERVER_IP:4000',
  'lms'
);

// Create tenant
const tenant = await mailClient.createTenant('NABC School', 'nabc');
console.log('Domain:', tenant.data.domain);

// Create user
const user = await mailClient.createUser('nabc', 'John', 'Doe', 'password123');
console.log('Email:', user.data.email);

// Get user info
const userInfo = await mailClient.getUser('john.doe@nabc.lms.ssgzone.in');
console.log('User:', userInfo.data);

// Suspend user
await mailClient.suspendUser('john.doe@nabc.lms.ssgzone.in');

// Delete user
await mailClient.deleteUser('john.doe@nabc.lms.ssgzone.in');
*/