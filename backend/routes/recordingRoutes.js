const express = require('express');
const router = express.Router();
const recordingController = require('../controllers/recordingController');
const { validateRecording, validateRecordingId } = require('../middleware/validation');

// GET /api/recordings - Get all recordings with optional filters
router.get('/', recordingController.getRecordings);

// GET /api/recordings/active - Get currently active recordings
router.get('/active', recordingController.getActiveRecordings);

// GET /api/recordings/:id - Get specific recording by ID
router.get('/:id', validateRecordingId, recordingController.getRecordingById);

// POST /api/recordings - Create new recording
router.post('/', validateRecording, recordingController.createRecording);

// POST /api/recordings/:id/start - Start recording
router.post('/:id/start', validateRecordingId, recordingController.startRecording);

// POST /api/recordings/:id/stop - Stop recording
router.post('/:id/stop', validateRecordingId, recordingController.stopRecording);

// DELETE /api/recordings/:id - Delete recording
router.delete('/:id', validateRecordingId, recordingController.deleteRecording);

// GET /api/recordings/:id/download - Generate download URL
router.get('/:id/download', validateRecordingId, recordingController.generateDownloadUrl);

// GET /api/recordings/:id/stream - Generate streaming URL
router.get('/:id/stream', validateRecordingId, recordingController.generateStreamUrl);

module.exports = router;