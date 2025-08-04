const recordingService = require('../services/recordingService');
const s3Service = require('../services/s3Service');
const logger = require('../utils/logger');

class RecordingController {
  async getRecordings(req, res) {
    try {
      const { status, limit, page = 1 } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (limit) filters.limit = parseInt(limit);

      const recordings = await recordingService.getRecordings(filters);
      
      res.json({
        success: true,
        data: recordings,
        count: recordings.length
      });
    } catch (error) {
      logger.error('Get recordings error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recordings'
      });
    }
  }

  async getActiveRecordings(req, res) {
    try {
      const activeRecordings = await recordingService.getActiveRecordings();
      
      res.json({
        success: true,
        data: activeRecordings,
        count: activeRecordings.length
      });
    } catch (error) {
      logger.error('Get active recordings error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch active recordings'
      });
    }
  }

  async getRecordingById(req, res) {
    try {
      const { id } = req.params;
      const recording = await recordingService.getRecordingById(id);
      
      if (!recording) {
        return res.status(404).json({
          success: false,
          error: 'Recording not found'
        });
      }

      res.json({
        success: true,
        data: recording
      });
    } catch (error) {
      logger.error('Get recording by ID error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recording'
      });
    }
  }

  async createRecording(req, res) {
    try {
      const recordingData = req.body;
      const recording = await recordingService.createRecording(recordingData);
      
      logger.info(`Recording created: ${recording.id} - ${recording.title}`);
      
      res.status(201).json({
        success: true,
        data: recording,
        message: 'Recording created successfully'
      });
    } catch (error) {
      logger.error('Create recording error:', error.message);
      res.status(400).json({
        success: false,
        error: 'Failed to create recording',
        details: error.message
      });
    }
  }

  async startRecording(req, res) {
    try {
      const { id } = req.params;
      
      // Get recording details
      const recording = await recordingService.getRecordingById(id);
      if (!recording) {
        return res.status(404).json({
          success: false,
          error: 'Recording not found'
        });
      }

      // Check if recording is already active or completed
      if (recording.status === 'recording') {
        return res.status(400).json({
          success: false,
          error: 'Recording is already active'
        });
      }

      if (recording.status === 'completed') {
        return res.status(400).json({
          success: false,
          error: 'Recording is already completed'
        });
      }

      // Start the recording
      const result = await recordingService.startRecording(recording);
      
      res.json({
        success: true,
        data: result,
        message: 'Recording started successfully'
      });
    } catch (error) {
      logger.error('Start recording error:', error.message);
      res.status(400).json({
        success: false,
        error: 'Failed to start recording',
        details: error.message
      });
    }
  }

  async stopRecording(req, res) {
    try {
      const { id } = req.params;
      
      const result = await recordingService.stopRecording(id);
      
      res.json({
        success: true,
        data: result,
        message: 'Recording stopped successfully'
      });
    } catch (error) {
      logger.error('Stop recording error:', error.message);
      res.status(400).json({
        success: false,
        error: 'Failed to stop recording',
        details: error.message
      });
    }
  }

  async deleteRecording(req, res) {
    try {
      const { id } = req.params;
      
      const result = await recordingService.deleteRecording(id);
      
      res.json({
        success: true,
        data: result,
        message: 'Recording deleted successfully'
      });
    } catch (error) {
      logger.error('Delete recording error:', error.message);
      res.status(400).json({
        success: false,
        error: 'Failed to delete recording',
        details: error.message
      });
    }
  }

  async generateDownloadUrl(req, res) {
    try {
      const { id } = req.params;
      const { expires = 3600 } = req.query; // Default 1 hour
      
      const recording = await recordingService.getRecordingById(id);
      if (!recording) {
        return res.status(404).json({
          success: false,
          error: 'Recording not found'
        });
      }

      if (!recording.s3_key) {
        return res.status(400).json({
          success: false,
          error: 'Recording file not available'
        });
      }

      // Generate presigned URL for download
      const urlResult = await s3Service.generatePresignedUrl(
        recording.s3_key,
        parseInt(expires),
        'getObject'
      );

      if (!urlResult.success) {
        throw new Error(urlResult.error);
      }

      res.json({
        success: true,
        data: {
          downloadUrl: urlResult.url,
          expiresIn: urlResult.expiresIn,
          expiresAt: urlResult.expiresAt,
          filename: `${recording.title}.${recording.format}`,
          fileSize: recording.file_size
        }
      });
    } catch (error) {
      logger.error('Generate download URL error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to generate download URL'
      });
    }
  }

  async generateStreamUrl(req, res) {
    try {
      const { id } = req.params;
      const { expires = 7200 } = req.query; // Default 2 hours for streaming
      
      const recording = await recordingService.getRecordingById(id);
      if (!recording) {
        return res.status(404).json({
          success: false,
          error: 'Recording not found'
        });
      }

      if (!recording.s3_key) {
        return res.status(400).json({
          success: false,
          error: 'Recording file not available'
        });
      }

      // Generate presigned URL for streaming
      const urlResult = await s3Service.generatePresignedUrl(
        recording.s3_key,
        parseInt(expires),
        'getObject'
      );

      if (!urlResult.success) {
        throw new Error(urlResult.error);
      }

      res.json({
        success: true,
        data: {
          streamUrl: urlResult.url,
          expiresIn: urlResult.expiresIn,
          expiresAt: urlResult.expiresAt,
          title: recording.title,
          duration: recording.duration,
          format: recording.format
        }
      });
    } catch (error) {
      logger.error('Generate stream URL error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to generate stream URL'
      });
    }
  }
}

module.exports = new RecordingController();