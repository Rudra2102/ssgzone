const crypto = require('crypto');
const db = require('./DatabaseService');

class KeyManagementService {
  constructor() {
    this.masterKey = process.env.MASTER_ENCRYPTION_KEY || this.generateMasterKey();
    this.algorithm = 'aes-256-gcm';
  }

  generateMasterKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  async generateTenantKey(tenantId) {
    const tenantKey = crypto.randomBytes(32);
    const encryptedKey = this.encryptKey(tenantKey);
    
    const query = `
      INSERT INTO tenant_encryption_keys (tenant_id, encrypted_key, key_version, created_at)
      VALUES ($1, $2, 1, NOW())
      ON CONFLICT (tenant_id) 
      DO UPDATE SET encrypted_key = $2, key_version = tenant_encryption_keys.key_version + 1, updated_at = NOW()
      RETURNING *
    `;

    await db.query(query, [tenantId, encryptedKey]);
    return tenantKey;
  }

  encryptKey(key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.masterKey);
    cipher.setAAD(Buffer.from('tenant-key'));
    
    let encrypted = cipher.update(key);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const authTag = cipher.getAuthTag();
    
    return {
      iv: iv.toString('hex'),
      encrypted: encrypted.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  async decryptTenantKey(tenantId) {
    const query = 'SELECT encrypted_key FROM tenant_encryption_keys WHERE tenant_id = $1';
    const result = await db.query(query, [tenantId]);
    
    if (result.rows.length === 0) {
      throw new Error('Tenant encryption key not found');
    }

    const encryptedData = result.rows[0].encrypted_key;
    return this.decryptKey(encryptedData);
  }

  decryptKey(encryptedData) {
    const decipher = crypto.createDecipher(this.algorithm, this.masterKey);
    decipher.setAAD(Buffer.from('tenant-key'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(Buffer.from(encryptedData.encrypted, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
  }

  async encryptAttachmentKey(tenantId, attachmentKey) {
    const tenantKey = await this.decryptTenantKey(tenantId);
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', tenantKey);
    
    let encrypted = cipher.update(attachmentKey);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return {
      iv: iv.toString('hex'),
      encrypted: encrypted.toString('hex')
    };
  }

  async decryptAttachmentKey(tenantId, encryptedAttachmentKey) {
    const tenantKey = await this.decryptTenantKey(tenantId);
    
    const decipher = crypto.createDecipher('aes-256-cbc', tenantKey);
    
    let decrypted = decipher.update(Buffer.from(encryptedAttachmentKey.encrypted, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
  }

  async rotateKeys(tenantId) {
    // Generate new tenant key
    const newTenantKey = await this.generateTenantKey(tenantId);
    
    // Re-encrypt all attachment keys with new tenant key
    const query = `
      SELECT id, encrypted_attachment_key 
      FROM attachments 
      WHERE tenant_id = $1
    `;
    
    const result = await db.query(query, [tenantId]);
    
    for (const attachment of result.rows) {
      // Decrypt with old key and re-encrypt with new key
      const oldKey = await this.decryptAttachmentKey(tenantId, attachment.encrypted_attachment_key);
      const newEncryptedKey = await this.encryptAttachmentKey(tenantId, oldKey);
      
      await db.query(
        'UPDATE attachments SET encrypted_attachment_key = $1 WHERE id = $2',
        [newEncryptedKey, attachment.id]
      );
    }
    
    return { success: true, rotatedAttachments: result.rows.length };
  }

  async validateKeyAccess(tenantId, attachmentId) {
    const query = `
      SELECT a.encrypted_attachment_key, a.tenant_id
      FROM attachments a
      WHERE a.id = $1
    `;
    
    const result = await db.query(query, [attachmentId]);
    
    if (result.rows.length === 0) {
      throw new Error('Attachment not found');
    }
    
    const attachment = result.rows[0];
    
    if (attachment.tenant_id !== tenantId) {
      throw new Error('Access denied: Tenant mismatch');
    }
    
    // Verify we can decrypt the key (validates API Gateway access)
    try {
      await this.decryptAttachmentKey(tenantId, attachment.encrypted_attachment_key);
      return true;
    } catch (error) {
      throw new Error('Key decryption failed: Invalid credentials');
    }
  }
}

module.exports = new KeyManagementService();