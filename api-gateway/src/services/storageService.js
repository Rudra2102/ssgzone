const AWS = require('aws-sdk');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class StorageService {
  constructor() {
    this.s3 = new AWS.S3({
      endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
      accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
      secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
      s3ForcePathStyle: true,
      signatureVersion: 'v4'
    });
    
    this.bucket = process.env.S3_BUCKET || 'ssghub-attachments';
    this.maxFileSize = parseInt(process.env.MAX_ATTACHMENT_SIZE) || 100 * 1024 * 1024; // 100MB
  }

  async uploadAttachment(file, tenantId, messageId) {
    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds limit of ${this.maxFileSize} bytes`);
    }

    const fileKey = `${tenantId}/${messageId}/${crypto.randomUUID()}-${file.originalname}`;
    
    const uploadParams = {
      Bucket: this.bucket,
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

  async getAttachment(key, tenantId) {
    // Verify tenant access
    if (!key.startsWith(`${tenantId}/`)) {
      throw new Error('Access denied');
    }

    const params = {
      Bucket: this.bucket,
      Key: key
    };

    return this.s3.getObject(params).createReadStream();
  }

  async deleteAttachment(key, tenantId) {
    if (!key.startsWith(`${tenantId}/`)) {
      throw new Error('Access denied');
    }

    const params = {
      Bucket: this.bucket,
      Key: key
    };

    await this.s3.deleteObject(params).promise();
  }

  async getAttachmentMetadata(key, tenantId) {
    if (!key.startsWith(`${tenantId}/`)) {
      throw new Error('Access denied');
    }

    const params = {
      Bucket: this.bucket,
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