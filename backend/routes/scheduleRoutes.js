const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { validateSchedule, validateScheduleId, validatePagination } = require('../middleware/validation');

// GET /api/schedules - Get all schedules
router.get('/', validatePagination, scheduleController.getSchedules);

// GET /api/schedules/upcoming - Get upcoming schedules
router.get('/upcoming', scheduleController.getUpcomingSchedules);

// GET /api/schedules/active - Get active schedules
router.get('/active', scheduleController.getActiveSchedules);

// GET /api/schedules/stats - Get schedule statistics
router.get('/stats', scheduleController.getStats);

// GET /api/schedules/:id - Get specific schedule by ID
router.get('/:id', validateScheduleId, scheduleController.getScheduleById);

// POST /api/schedules - Create new schedule
router.post('/', validateSchedule, scheduleController.createSchedule);

// PUT /api/schedules/:id - Update schedule
router.put('/:id', validateScheduleId, validateSchedule, scheduleController.updateSchedule);

// DELETE /api/schedules/:id - Delete schedule
router.delete('/:id', validateScheduleId, scheduleController.deleteSchedule);

// POST /api/schedules/:id/execute - Manually execute schedule
router.post('/:id/execute', validateScheduleId, scheduleController.executeSchedule);

// POST /api/schedules/bulk-create - Create multiple schedules
router.post('/bulk-create', scheduleController.bulkCreateSchedules);

module.exports = router;