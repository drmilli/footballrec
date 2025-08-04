const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class S3Service {
  constructor() {
    // Configure AWS SDK for IDrive S3
    this.s3 = new AWS.S3({
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'us-east-1',
      s3ForcePathStyle: true, // Required for IDrive S3
      signatureVersion: 'v4'
    });

    this.bucket = process.env.S3_BUCKET;
    
    if (!this.bucket) {
      logger.error('S3_BUCKET environment variable is required');
    }
  }

  async uploadFile(filePath, s3Key, options = {}) {
    try {
      logger.info(`Uploading file to S3: ${filePath} -> ${s3Key}`);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Get file stats
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;

      // Create read stream
      const fileStream = fs.createReadStream(filePath);

      // Prepare upload parameters
      const uploadParams = {
        Bucket: this.bucket,
        Key: s3Key,
        Body: fileStream,
        ContentType: this.getContentType(filePath),
        Metadata: {
          'original-name': path.basename(filePath),
          'upload-timestamp': new Date().toISOString(),
          'file-size': fileSize.toString(),
          ...options.metadata
        }
      };

      // Add ACL if specified
      if (options.acl) {
        uploadParams.ACL = options.acl;
      }

      // Upload with progress tracking
      const upload = this.s3.upload(uploadParams);
      
      // Track upload progress
      upload.on('httpUploadProgress', (progress) => {
        const percentage = Math.round((progress.loaded / progress.total) * 100);
        logger.debug(`Upload progress for ${s3Key}: ${percentage}%`);
      });

      const result = await upload.promise();

      logger.info(`File uploaded successfully: ${s3Key}`);
      logger.info(`S3 Location: ${result.Location}`);

      return {
        success: true,
        key: s3Key,
        url: result.Location,
        etag: result.ETag,
        size: fileSize
      };

    } catch (error) {
      logger.error(`Failed to upload file ${filePath}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async downloadFile(s3Key, localPath) {
    try {
      logger.info(`Downloading file from S3: ${s3Key} -> ${localPath}`);

      // Ensure local directory exists
      const localDir = path.dirname(localPath);
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }

      const downloadParams = {
        Bucket: this.bucket,
        Key: s3Key
      };

      // Create write stream
      const writeStream = fs.createWriteStream(localPath);

      // Download file
      const downloadStream = this.s3.getObject(downloadParams).createReadStream();
      
      return new Promise((resolve, reject) => {
        downloadStream.pipe(writeStream);
        
        writeStream.on('finish', () => {
          logger.info(`File downloaded successfully: ${localPath}`);
          resolve({
            success: true,
            localPath,
            size: fs.statSync(localPath).size
          });
        });

        writeStream.on('error', (error) => {
          logger.error(`Download write error:`, error.message);
          reject(error);
        });

        downloadStream.on('error', (error) => {
          logger.error(`Download stream error:`, error.message);
          reject(error);
        });
      });

    } catch (error) {
      logger.error(`Failed to download file ${s3Key}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteFile(s3Key) {
    try {
      logger.info(`Deleting file from S3: ${s3Key}`);

      const deleteParams = {
        Bucket: this.bucket,
        Key: s3Key
      };

      await this.s3.deleteObject(deleteParams).promise();

      logger.info(`File deleted successfully: ${s3Key}`);
      return {
        success: true,
        key: s3Key
      };

    } catch (error) {
      logger.error(`Failed to delete file ${s3Key}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getFileInfo(s3Key) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: s3Key
      };

      const result = await this.s3.headObject(params).promise();

      return {
        success: true,
        key: s3Key,
        size: result.ContentLength,
        lastModified: result.LastModified,
        contentType: result.ContentType,
        metadata: result.Metadata,
        etag: result.ETag
      };

    } catch (error) {
      logger.error(`Failed to get file info ${s3Key}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async listFiles(prefix = '', maxKeys = 1000) {
    try {
      const params = {
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys
      };

      const result = await this.s3.listObjectsV2(params).promise();

      const files = result.Contents.map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        etag: obj.ETag
      }));

      return {
        success: true,
        files,
        count: files.length,
        isTruncated: result.IsTruncated,
        nextContinuationToken: result.NextContinuationToken
      };

    } catch (error) {
      logger.error(`Failed to list files with prefix ${prefix}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generatePresignedUrl(s3Key, expiresIn = 3600, operation = 'getObject') {
    try {
      const params = {
        Bucket: this.bucket,
        Key: s3Key,
        Expires: expiresIn
      };

      const url = await this.s3.getSignedUrlPromise(operation, params);

      logger.info(`Generated presigned URL for ${s3Key} (expires in ${expiresIn}s)`);

      return {
        success: true,
        url,
        expiresIn,
        expiresAt: new Date(Date.now() + expiresIn * 1000)
      };

    } catch (error) {
      logger.error(`Failed to generate presigned URL for ${s3Key}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testConnection() {
    try {
      logger.info('Testing S3 connection...');

      // Try to list bucket contents
      await this.s3.headBucket({ Bucket: this.bucket }).promise();

      logger.info('✅ S3 connection successful');
      return true;

    } catch (error) {
      logger.error('❌ S3 connection failed:', error.message);
      return false;
    }
  }

  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.mp4': 'video/mp4',
      '.mkv': 'video/x-matroska',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.wmv': 'video/x-ms-wmv',
      '.flv': 'video/x-flv',
      '.webm': 'video/webm',
      '.m4v': 'video/x-m4v',
      '.ts': 'video/mp2t',
      '.m3u8': 'application/x-mpegURL'
    };

    return contentTypes[ext] || 'application/octet-stream';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = new S3Service();