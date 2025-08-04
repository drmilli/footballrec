const recordingService = require('../services/recordingService');
const s3Service = require('../services/s3Service');
const logger = require('../utils/logger');

class VideoController {
  async getVideos(req, res) {
    try {
      const { status = 'completed', limit, page = 1 } = req.query;

      const filters = { status };
      if (limit) filters.limit = parseInt(limit);

      const videos = await recordingService.getRecordings(filters);

      // Filter out videos without S3 URLs (not uploaded yet)
      const availableVideos = videos.filter(video => video.s3_url);

      res.json({
        success: true,
        data: availableVideos,
        count: availableVideos.length
      });
    } catch (error) {
      logger.error('Get videos error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch videos'
      });
    }
  }

  async streamVideo(req, res) {
    try {
      const { id } = req.params;
      const { quality } = req.query;

      const recording = await recordingService.getRecordingById(id);
      if (!recording) {
        return res.status(404).json({
          success: false,
          error: 'Video not found'
        });
      }

      if (!recording.s3_key) {
        return res.status(400).json({
          success: false,
          error: 'Video file not available for streaming'
        });
      }

      // Generate streaming URL with longer expiration for video playback
      const urlResult = await s3Service.generatePresignedUrl(
        recording.s3_key,
        7200, // 2 hours
        'getObject'
      );

      if (!urlResult.success) {
        throw new Error(urlResult.error);
      }

      res.json({
        success: true,
        data: {
          streamUrl: urlResult.url,
          title: recording.title,
          duration: recording.duration,
          format: recording.format,
          quality: recording.quality,
          fileSize: recording.file_size,
          expiresAt: urlResult.expiresAt
        }
      });
    } catch (error) {
      logger.error('Stream video error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to generate streaming URL'
      });
    }
  }

  async downloadVideo(req, res) {
    try {
      const { id } = req.params;

      const recording = await recordingService.getRecordingById(id);
      if (!recording) {
        return res.status(404).json({
          success: false,
          error: 'Video not found'
        });
      }

      if (!recording.s3_key) {
        return res.status(400).json({
          success: false,
          error: 'Video file not available for download'
        });
      }

      // Generate download URL
      const urlResult = await s3Service.generatePresignedUrl(
        recording.s3_key,
        3600, // 1 hour
        'getObject'
      );

      if (!urlResult.success) {
        throw new Error(urlResult.error);
      }

      // Set appropriate headers for download
      const filename = `${recording.title.replace(/[^a-z0-9]/gi, '_')}.${recording.format}`;

      res.json({
        success: true,
        data: {
          downloadUrl: urlResult.url,
          filename,
          fileSize: recording.file_size,
          format: recording.format,
          expiresAt: urlResult.expiresAt
        }
      });
    } catch (error) {
      logger.error('Download video error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to generate download URL'
      });
    }
  }

  async getVideoInfo(req, res) {
    try {
      const { id } = req.params;

      const recording = await recordingService.getRecordingById(id);
      if (!recording) {
        return res.status(404).json({
          success: false,
          error: 'Video not found'
        });
      }

      // Get additional S3 file info if available
      let s3Info = null;
      if (recording.s3_key) {
        const s3Result = await s3Service.getFileInfo(recording.s3_key);
        if (s3Result.success) {
          s3Info = {
            size: s3Result.size,
            lastModified: s3Result.lastModified,
            contentType: s3Result.contentType
          };
        }
      }

      res.json({
        success: true,
        data: {
          id: recording.id,
          title: recording.title,
          description: recording.description,
          duration: recording.duration,
          fileSize: recording.file_size,
          format: recording.format,
          quality: recording.quality,
          status: recording.status,
          createdAt: recording.created_at,
          startedAt: recording.started_at,
          completedAt: recording.completed_at,
          s3Info,
          isAvailable: !!recording.s3_url
        }
      });
    } catch (error) {
      logger.error('Get video info error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch video information'
      });
    }
  }

  async generateTempUrl(req, res) {
    try {
      const { id } = req.params;
      const { expires = 3600, operation = 'getObject' } = req.body;

      const recording = await recordingService.getRecordingById(id);
      if (!recording) {
        return res.status(404).json({
          success: false,
          error: 'Video not found'
        });
      }

      if (!recording.s3_key) {
        return res.status(400).json({
          success: false,
          error: 'Video file not available'
        });
      }

      const urlResult = await s3Service.generatePresignedUrl(
        recording.s3_key,
        parseInt(expires),
        operation
      );

      if (!urlResult.success) {
        throw new Error(urlResult.error);
      }

      res.json({
        success: true,
        data: {
          url: urlResult.url,
          expiresIn: urlResult.expiresIn,
          expiresAt: urlResult.expiresAt,
          operation
        }
      });
    } catch (error) {
      logger.error('Generate temp URL error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to generate temporary URL'
      });
    }
  }

  async getThumbnail(req, res) {
    try {
      const { id } = req.params;
      const { timestamp = 10 } = req.query; // Default to 10 seconds

      const recording = await recordingService.getRecordingById(id);
      if (!recording) {
        return res.status(404).json({
          success: false,
          error: 'Video not found'
        });
      }

      // For now, return a placeholder response
      // In a full implementation, you would generate thumbnails using FFmpeg
      res.json({
        success: true,
        message: 'Thumbnail generation not implemented yet',
        data: {
          placeholder: true,
          videoId: id,
          timestamp: parseInt(timestamp)
        }
      });
    } catch (error) {
      logger.error('Get thumbnail error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get video thumbnail'
      });
    }
  }

  async deleteVideo(req, res) {
    try {
      const { id } = req.params;

      const result = await recordingService.deleteRecording(id);

      res.json({
        success: true,
        data: result,
        message: 'Video deleted successfully'
      });
    } catch (error) {
      logger.error('Delete video error:', error.message);
      res.status(400).json({
        success: false,
        error: 'Failed to delete video',
        details: error.message
      });
    }
  }

  // Helper method to format video duration
  formatDuration(seconds) {
    if (!seconds) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }

  // Helper method to format file size
  formatFileSize(bytes) {
    if (!bytes) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = new VideoController();