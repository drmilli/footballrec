const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const { validateRecordingId } = require('../middleware/validation');

// GET /api/videos - Get all available videos
router.get('/', videoController.getVideos);

// GET /api/videos/:id/stream - Stream video
router.get('/:id/stream', validateRecordingId, videoController.streamVideo);

// GET /api/videos/:id/download - Download video
router.get('/:id/download', validateRecordingId, videoController.downloadVideo);

// GET /api/videos/:id/info - Get video metadata
router.get('/:id/info', validateRecordingId, videoController.getVideoInfo);

// POST /api/videos/:id/generate-url - Generate temporary access URL
router.post('/:id/generate-url', validateRecordingId, videoController.generateTempUrl);

// GET /api/videos/:id/thumbnail - Get video thumbnail
router.get('/:id/thumbnail', validateRecordingId, videoController.getThumbnail);

// DELETE /api/videos/:id - Delete video
router.delete('/:id', validateRecordingId, videoController.deleteVideo);

module.exports = router;