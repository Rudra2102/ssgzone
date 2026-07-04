const { simpleParser } = require('mailparser');
const { Pool } = require('pg');
const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');

class MessageProcessor {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'ssghub_mail',
      user: process.env.DB_USER || 'ssghub',
      password: process.env.DB_PASSWORD
    });
  }

  async processIncoming(stream, session) {
    try {
      // Parse the email
      const parsed = await simpleParser(stream);
      
      // Security checks
      await this.performSecurityChecks(parsed, session);
      
      // Store the message
      await this.storeMessage(parsed, session);
      
      console.log(`Message processed: ${parsed.subject}`);
    } catch (error) {
      console.error('Message processing error:', error);
      throw error;
    }
  }

  async performSecurityChecks(parsed, session) {
    // Spam filtering
    const spamScore = await this.calculateSpamScore(parsed, session);
    if (spamScore > 5) {
      throw new Error('Message rejected: High spam score');
    }

    // Virus scanning
    const hasVirus = await this.scanForVirus(parsed);
    if (hasVirus) {
      throw new Error('Message rejected: Virus detected');
    }

    // Size limits
    if (parsed.attachments) {
      const totalSize = parsed.attachments.reduce((sum, att) => sum + att.size, 0);
      if (totalSize > 25 * 1024 * 1024) { // 25MB limit
        throw new Error('Message rejected: Attachment size too large');
      }
    }
  }

  async calculateSpamScore(parsed, session) {
    let score = 0;

    // Basic spam indicators
    if (parsed.subject && parsed.subject.includes('URGENT')) score += 1;
    if (parsed.subject && /\$\d+/.test(parsed.subject)) score += 1;
    if (parsed.text && parsed.text.includes('Click here now')) score += 2;
    
    // Check sender reputation
    const senderDomain = parsed.from?.value[0]?.address?.split('@')[1];
    if (senderDomain && await this.isBlacklistedDomain(senderDomain)) {
      score += 5;
    }

    return score;
  }

  async scanForVirus(parsed) {
    // In production, integrate with ClamAV or similar
    // For now, return false (no virus)
    return false;
  }

  async isBlacklistedDomain(domain) {
    // Check against blacklist database
    // For now, return false
    return false;
  }

  async storeMessage(parsed, session) {
    const messageId = this.generateMessageId();
    
    // Determine recipients
    const recipients = [];
    if (parsed.to) recipients.push(...parsed.to.value.map(addr => addr.address));
    if (parsed.cc) recipients.push(...parsed.cc.value.map(addr => addr.address));
    if (parsed.bcc) recipients.push(...parsed.bcc.value.map(addr => addr.address));

    // Process attachments
    const attachments = await this.processAttachments(parsed.attachments, messageId);

    // Store message for each recipient
    for (const recipientEmail of recipients) {
      const user = await this.findUserByEmail(recipientEmail);
      if (user) {
        await this.insertMessage({
          user_id: user.id,
          message_id: messageId,
          folder: 'INBOX',
          subject: parsed.subject || '(No Subject)',
          sender: parsed.from?.value[0]?.address || '',
          recipients: recipients,
          body_text: parsed.text || '',
          body_html: parsed.html || '',
          attachments: attachments,
          size: this.calculateMessageSize(parsed),
          flags: ['\\Recent'],
          received_at: new Date()
        });

        // Update storage usage
        await this.updateStorageUsage(user.id);
      }
    }
  }

  async processAttachments(attachments, messageId) {
    if (!attachments || attachments.length === 0) {
      return null;
    }

    const processedAttachments = [];
    const attachmentDir = path.join('/var/mail/attachments', messageId);
    
    await fs.ensureDir(attachmentDir);

    for (const attachment of attachments) {
      const filename = attachment.filename || `attachment_${Date.now()}`;
      const filepath = path.join(attachmentDir, filename);
      
      await fs.writeFile(filepath, attachment.content);
      
      processedAttachments.push({
        filename: filename,
        contentType: attachment.contentType,
        size: attachment.size,
        path: filepath
      });
    }

    return processedAttachments;
  }

  generateMessageId() {
    return crypto.randomBytes(16).toString('hex');
  }

  calculateMessageSize(parsed) {
    let size = 0;
    if (parsed.text) size += Buffer.byteLength(parsed.text, 'utf8');
    if (parsed.html) size += Buffer.byteLength(parsed.html, 'utf8');
    if (parsed.attachments) {
      size += parsed.attachments.reduce((sum, att) => sum + att.size, 0);
    }
    return size;
  }

  async findUserByEmail(email) {
    const query = 'SELECT id, storage_quota, storage_used FROM users WHERE email = $1 AND status = $2';
    const result = await this.pool.query(query, [email, 'active']);
    return result.rows[0] || null;
  }

  async insertMessage(messageData) {
    const query = `
      INSERT INTO messages (
        user_id, message_id, folder, subject, sender, recipients,
        body_text, body_html, attachments, size, flags, received_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `;

    const values = [
      messageData.user_id,
      messageData.message_id,
      messageData.folder,
      messageData.subject,
      messageData.sender,
      messageData.recipients,
      messageData.body_text,
      messageData.body_html,
      JSON.stringify(messageData.attachments),
      messageData.size,
      messageData.flags,
      messageData.received_at
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0].id;
  }

  async updateStorageUsage(userId) {
    const query = `
      UPDATE users 
      SET storage_used = (
        SELECT COALESCE(SUM(size), 0) 
        FROM messages 
        WHERE user_id = $1
      )
      WHERE id = $1
    `;
    
    await this.pool.query(query, [userId]);
  }
}

module.exports = { MessageProcessor };