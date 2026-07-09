const AWS = require('aws-sdk');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class StorageService {
  constructor() {
    this.s3 = new AWS.S3({
      endpoint: `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || 9000}`,
      accessKeyId: process.env.MINIO_ROOT_USER || 'ssgzone_admin',
      secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'SSGzone@MinIO2024Secure',
      s3ForcePathStyle: true,
      signatureVersion: 'v4'
    });
    
    this.buckets = {
      emails: process.env.MINIO_BUCKET_EMAILS || 'ssgzone-emails',
      attachments: process.env.MINIO_BUCKET_ATTACHMENTS || 'ssgzone-attachments',
      backups: process.env.MINIO_BUCKET_BACKUPS || 'ssgzone-backups'
    };
    
    this.maxFileSize = parseInt(process.env.MAX_ATTACHMENT_SIZE) || 100 * 1024 * 1024; // 100MB
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      for (const [name, bucket] of Object.entries(this.buckets)) {
        try {
          await this.s3.headBucket({ Bucket: bucket }).promise();
          console.log(`✓ MinIO bucket exists: ${bucket}`);
        } catch (error) {
          if (error.code === 'NoSuchBucket') {
            await this.s3.createBucket({ Bucket: bucket }).promise();
            console.log(`✓ MinIO bucket created: ${bucket}`);
          } else {
            throw error;
          }
        }
      }
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing MinIO buckets:', error);
      throw error;
    }
  }

  async uploadAttachment(file, tenantId, messageId) {
    await this.initialize();
    
    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds limit of ${this.maxFileSize} bytes`);
    }

    const fileKey = `${tenantId}/${messageId}/${crypto.randomUUID()}-${file.originalname}`;
    
    const uploadParams = {
      Bucket: this.buckets.attachments,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        'tenant-id': tenantId.toString(),
        'message-id': messageId.toString(),
        'original-name': file.originalname,
        'upload-date': new Date().toISOString()
      },
      ServerSideEncryption: 'AES256'
    };

    const result = await this.s3.upload(uploadParams).promise();
    
    return {
      key: fileKey,
      url: result.Location,
      size: file.size,
      contentType: file.mimetype,
      originalName: file.originalname
    };
  }

  async uploadEmail(emailContent, tenantId, emailId) {
    await this.initialize();
    
    const fileKey = `${tenantId}/${emailId}.json`;
    
    const uploadParams = {
      Bucket: this.buckets.emails,
      Key: fileKey,
      Body: JSON.stringify(emailContent),
      ContentType: 'application/json',
      Metadata: {
        'tenant-id': tenantId.toString(),
        'email-id': emailId.toString(),
        'upload-date': new Date().toISOString()
      },
      ServerSideEncryption: 'AES256'
    };

    const result = await this.s3.upload(uploadParams).promise();
    
    return {
      key: fileKey,
      location: result.Location,
      size: JSON.stringify(emailContent).length
    };
  }

  async getAttachment(key, tenantId) {
    await this.initialize();
    
    if (!key.startsWith(`${tenantId}/`)) {
      throw new Error('Access denied');
    }

    const params = {
      Bucket: this.buckets.attachments,
      Key: key
    };

    return this.s3.getObject(params).createReadStream();
  }

  async getEmail(key, tenantId) {
    await this.initialize();
    
    if (!key.startsWith(`${tenantId}/`)) {
      throw new Error('Access denied');
    }

    const params = {
      Bucket: this.buckets.emails,
      Key: key
    };

    const data = await this.s3.getObject(params).promise();
    return JSON.parse(data.Body.toString());
  }

  async deleteAttachment(key, tenantId) {
    await this.initialize();
    
    if (!key.startsWith(`${tenantId}/`)) {
      throw new Error('Access denied');
    }

    const params = {
      Bucket: this.buckets.attachments,
      Key: key
    };

    await this.s3.deleteObject(params).promise();
  }

  async deleteEmail(key, tenantId) {
    await this.initialize();
    
    if (!key.startsWith(`${tenantId}/`)) {
      throw new Error('Access denied');
    }

    const params = {
      Bucket: this.buckets.emails,
      Key: key
    };

    await this.s3.deleteObject(params).promise();
  }

  async getAttachmentMetadata(key, tenantId) {
    await this.initialize();
    
    if (!key.startsWith(`${tenantId}/`)) {
      throw new Error('Access denied');
    }

    const params = {
      Bucket: this.buckets.attachments,
      Key: key
    };

    const result = await this.s3.headObject(params).promise();
    return {
      size: result.ContentLength,
      contentType: result.ContentType,
      lastModified: result.LastModified,
      metadata: result.Metadata
    };
  }

  async getEmailMetadata(key, tenantId) {
    await this.initialize();
    
    if (!key.startsWith(`${tenantId}/`)) {
      throw new Error('Access denied');
    }

    const params = {
      Bucket: this.buckets.emails,
      Key: key
    };

    const result = await this.s3.headObject(params).promise();
    return {
      size: result.ContentLength,
      contentType: result.ContentType,
      lastModified: result.LastModified,
      metadata: result.Metadata
    };
  }
}

module.exports = new StorageService();