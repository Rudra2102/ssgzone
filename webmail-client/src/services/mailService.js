import axios from 'axios';

const API_BASE_URL = ''; // Use relative URLs to go through nginx proxy

class MailService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30050,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('webmail_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('webmail_token');
          window.location.reload();
        }
        return Promise.reject(error);
      }
    );
  }

  // Get messages from a folder
  async getMessages(folder = 'INBOX', limit = 50, offset = 0) {
    return this.client.get(`/api/v1/webmail/messages`, {
      params: { folder, limit, offset }
    });
  }

  // Get a specific message
  async getMessage(messageId) {
    return this.client.get(`/api/v1/webmail/messages/${messageId}`);
  }

  // Send a new message
  async sendMessage(messageData) {
    return this.client.post('/api/v1/webmail/messages/send', messageData);
  }

  // Save draft
  async saveDraft(messageData) {
    return this.client.post('/api/v1/webmail/messages/draft', messageData);
  }

  // Mark message as read
  async markAsRead(messageId) {
    return this.client.patch(`/api/v1/webmail/messages/${messageId}/flags`, {
      action: 'add',
      flags: ['\\\\Seen']
    });
  }

  // Mark message as unread
  async markAsUnread(messageId) {
    return this.client.patch(`/api/v1/webmail/messages/${messageId}/flags`, {
      action: 'remove',
      flags: ['\\\\Seen']
    });
  }

  // Delete message
  async deleteMessage(messageId) {
    return this.client.delete(`/api/v1/webmail/messages/${messageId}`);
  }

  // Move message to folder
  async moveMessage(messageId, folder) {
    return this.client.patch(`/api/v1/webmail/messages/${messageId}/move`, {
      folder
    });
  }

  // Search messages
  async searchMessages(query, folder = null) {
    return this.client.get('/api/v1/webmail/messages/search', {
      params: { query, folder }
    });
  }

  // Get folders
  async getFolders() {
    return this.client.get('/api/v1/webmail/folders');
  }

  // Create folder
  async createFolder(name) {
    return this.client.post('/api/v1/webmail/folders', { name });
  }

  // Upload attachment
  async uploadAttachment(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.client.post('/api/v1/webmail/attachments/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  // Download attachment
  async downloadAttachment(messageId, attachmentId) {
    return this.client.get(`/api/v1/webmail/messages/${messageId}/attachments/${attachmentId}`, {
      responseType: 'blob'
    });
  }

  // Get user settings
  async getUserSettings() {
    return this.client.get('/api/v1/webmail/settings');
  }

  // Update user settings
  async updateUserSettings(settings) {
    return this.client.put('/api/v1/webmail/settings', settings);
  }

  // Get tenant signature
  async getTenantSignature() {
    return this.client.get('/api/v1/signatures/tenant/signature');
  }

  // Get storage usage
  async getStorageUsage() {
    return this.client.get('/api/v1/webmail/storage');
  }
}

const mailServiceInstance = new MailService();
export const mailService = mailServiceInstance;
export default mailServiceInstance;