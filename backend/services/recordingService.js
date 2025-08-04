const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const logger = require('../utils/logger');
const database = require('../config/database');
const s3Service = require('./s3Service');

class RecordingService {
  constructor() {
    this.activeRecordings = new Map();
    this.recordingsPath = process.env.RECORDINGS_PATH || '/tmp/recordings';
    this.maxDuration = parseInt(process.env.MAX_RECORDING_DURATION) || 7200000; // 2 hours
    
    // Ensure recordings directory exists
    this.ensureRecordingsDirectory();
    
    // Set FFmpeg path if specified
    if (process.env.FFMPEG_PATH) {
      ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
    }
  }

  async ensureRecordingsDirectory() {
    try {
      await fs.mkdir(this.recordingsPath, { recursive: true });
      logger.info(`Recordings directory ensured: ${this.recordingsPath}`);
    } catch (error) {
      logger.error('Failed to create recordings directory:', error.message);
    }
  }

  async startRecording(recordingData) {
    const { id, title, stream_url, quality = 'best', format = 'mp4' } = recordingData;
    
    try {
      // Check if recording is already active
      if (this.activeRecordings.has(id)) {
        throw new Error('Recording is already active');
      }

      // Update recording status to recording
      await database.query(
        'UPDATE recordings SET status = $1, started_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['recording', id]
      );

      const filename = `${id}_${moment().format('YYYYMMDD_HHmmss')}.${format}`;
      const filePath = path.join(this.recordingsPath, filename);

      logger.info(`Starting recording: ${title} (${id})`);
      logger.info(`Stream URL: ${stream_url}`);
      logger.info(`Output: ${filePath}`);

      // Configure FFmpeg command
      const command = ffmpeg(stream_url)
        .inputOptions([
          '-user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          '-headers', 'Referer: https://example.com',
          '-timeout', '30000000', // 30 second timeout
          '-reconnect', '1',
          '-reconnect_at_eof', '1',
          '-reconnect_streamed', '1',
          '-reconnect_delay_max', '2'
        ])
        .outputOptions([
          '-c', 'copy', // Copy streams without re-encoding
          '-bsf:a', 'aac_adtstoasc', // Fix AAC stream
          '-f', format,
          '-y' // Overwrite output file
        ])
        .output(filePath);

      // Set quality-specific options
      if (quality === 'best') {
        command.outputOptions(['-q:v', '1']);
      } else if (quality === 'good') {
        command.outputOptions(['-q:v', '3']);
      } else if (quality === 'medium') {
        command.outputOptions(['-q:v', '5']);
      }

      // Set up event handlers
      let startTime = Date.now();
      
      command
        .on('start', (commandLine) => {
          logger.info(`FFmpeg command: ${commandLine}`);
          this.activeRecordings.set(id, {
            command,
            filePath,
            startTime,
            title
          });
        })
        .on('progress', (progress) => {
          const duration = Date.now() - startTime;
          logger.debug(`Recording progress for ${id}: ${JSON.stringify(progress)}`);
          
          // Check max duration
          if (duration > this.maxDuration) {
            logger.warn(`Recording ${id} exceeded max duration, stopping`);
            this.stopRecording(id);
          }
        })
        .on('error', async (err) => {
          logger.error(`Recording error for ${id}:`, err.message);
          await this.handleRecordingError(id, err.message);
        })
        .on('end', async () => {
          logger.info(`Recording completed for ${id}`);
          await this.handleRecordingComplete(id, filePath);
        });

      // Start the recording
      command.run();

      return { success: true, message: 'Recording started', recordingId: id };

    } catch (error) {
      logger.error(`Failed to start recording ${id}:`, error.message);
      await this.handleRecordingError(id, error.message);
      throw error;
    }
  }

  async stopRecording(recordingId) {
    try {
      const recording = this.activeRecordings.get(recordingId);
      if (!recording) {
        throw new Error('Recording not found or not active');
      }

      logger.info(`Stopping recording: ${recordingId}`);
      
      // Kill the FFmpeg process
      recording.command.kill('SIGTERM');
      
      // Remove from active recordings
      this.activeRecordings.delete(recordingId);

      // Update database status
      await database.query(
        'UPDATE recordings SET status = $1 WHERE id = $2',
        ['stopped', recordingId]
      );

      return { success: true, message: 'Recording stopped' };

    } catch (error) {
      logger.error(`Failed to stop recording ${recordingId}:`, error.message);
      throw error;
    }
  }

  async handleRecordingComplete(recordingId, filePath) {
    try {
      // Remove from active recordings
      this.activeRecordings.delete(recordingId);

      // Get file stats
      const stats = await fs.stat(filePath);
      const fileSize = stats.size;

      // Get video duration using FFprobe
      const duration = await this.getVideoDuration(filePath);

      // Upload to S3
      const s3Result = await s3Service.uploadFile(filePath, `recordings/${path.basename(filePath)}`);

      // Update database with completion info
      await database.query(
        `UPDATE recordings SET 
         status = $1, 
         completed_at = CURRENT_TIMESTAMP,
         file_path = $2,
         s3_key = $3,
         s3_url = $4,
         file_size = $5,
         duration = $6
         WHERE id = $7`,
        ['completed', filePath, s3Result.key, s3Result.url, fileSize, duration, recordingId]
      );

      // Clean up local file after successful upload
      if (s3Result.success) {
        await fs.unlink(filePath);
        logger.info(`Local file cleaned up: ${filePath}`);
      }

      logger.info(`Recording completed successfully: ${recordingId}`);

    } catch (error) {
      logger.error(`Failed to handle recording completion for ${recordingId}:`, error.message);
      await this.handleRecordingError(recordingId, error.message);
    }
  }

  async handleRecordingError(recordingId, errorMessage) {
    try {
      // Remove from active recordings
      this.activeRecordings.delete(recordingId);

      // Update database with error
      await database.query(
        'UPDATE recordings SET status = $1, error_message = $2 WHERE id = $3',
        ['failed', errorMessage, recordingId]
      );

      logger.error(`Recording failed: ${recordingId} - ${errorMessage}`);

    } catch (error) {
      logger.error(`Failed to handle recording error for ${recordingId}:`, error.message);
    }
  }

  async getVideoDuration(filePath) {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          logger.warn(`Could not get video duration: ${err.message}`);
          resolve(0);
        } else {
          const duration = metadata.format.duration || 0;
          resolve(Math.round(duration));
        }
      });
    });
  }

  async getActiveRecordings() {
    const active = [];
    for (const [id, recording] of this.activeRecordings) {
      active.push({
        id,
        title: recording.title,
        startTime: recording.startTime,
        duration: Date.now() - recording.startTime
      });
    }
    return active;
  }

  async createRecording(data) {
    try {
      const id = uuidv4();
      const { title, description, stream_url, quality = 'best', format = 'mp4' } = data;

      const result = await database.query(
        `INSERT INTO recordings (id, title, description, stream_url, quality, format)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, title, description, stream_url, quality, format]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create recording:', error.message);
      throw error;
    }
  }

  async getRecordings(filters = {}) {
    try {
      let query = 'SELECT * FROM recordings';
      const params = [];
      const conditions = [];

      if (filters.status) {
        conditions.push(`status = $${params.length + 1}`);
        params.push(filters.status);
      }

      if (filters.limit) {
        query += conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';
        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
        params.push(filters.limit);
      } else {
        query += conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';
        query += ' ORDER BY created_at DESC';
      }

      const result = await database.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get recordings:', error.message);
      throw error;
    }
  }

  async getRecordingById(id) {
    try {
      const result = await database.query('SELECT * FROM recordings WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get recording by ID:', error.message);
      throw error;
    }
  }

  async deleteRecording(id) {
    try {
      const recording = await this.getRecordingById(id);
      if (!recording) {
        throw new Error('Recording not found');
      }

      // Stop if active
      if (this.activeRecordings.has(id)) {
        await this.stopRecording(id);
      }

      // Delete from S3 if exists
      if (recording.s3_key) {
        await s3Service.deleteFile(recording.s3_key);
      }

      // Delete local file if exists
      if (recording.file_path) {
        try {
          await fs.unlink(recording.file_path);
        } catch (error) {
          logger.warn(`Could not delete local file: ${error.message}`);
        }
      }

      // Delete from database
      await database.query('DELETE FROM recordings WHERE id = $1', [id]);

      return { success: true, message: 'Recording deleted' };
    } catch (error) {
      logger.error('Failed to delete recording:', error.message);
      throw error;
    }
  }
}

module.exports = new RecordingService();