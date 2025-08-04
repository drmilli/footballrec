const schedulerService = require('../services/schedulerService');
const logger = require('../utils/logger');

class ScheduleController {
  async getSchedules(req, res) {
    try {
      const { page, limit, sort, order } = req.pagination;
      const { status, upcoming } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (upcoming === 'true') filters.upcoming = true;
      if (limit) filters.limit = parseInt(limit);

      const schedules = await schedulerService.getSchedules(filters);

      res.json({
        success: true,
        data: schedules,
        count: schedules.length
      });
    } catch (error) {
      logger.error('Get schedules error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch schedules'
      });
    }
  }

  async getUpcomingSchedules(req, res) {
    try {
      const { limit = 10 } = req.query;

      const schedules = await schedulerService.getSchedules({
        status: 'pending',
        upcoming: true,
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: schedules,
        count: schedules.length
      });
    } catch (error) {
      logger.error('Get upcoming schedules error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch upcoming schedules'
      });
    }
  }

  async getActiveSchedules(req, res) {
    try {
      const schedules = await schedulerService.getSchedules({
        status: 'active'
      });

      res.json({
        success: true,
        data: schedules,
        count: schedules.length
      });
    } catch (error) {
      logger.error('Get active schedules error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch active schedules'
      });
    }
  }

  async getStats(req, res) {
    try {
      const stats = await schedulerService.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Get schedule stats error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch schedule statistics'
      });
    }
  }

  async getScheduleById(req, res) {
    try {
      const { id } = req.params;

      const schedules = await schedulerService.getSchedules();
      const schedule = schedules.find(s => s.id === id);

      if (!schedule) {
        return res.status(404).json({
          success: false,
          error: 'Schedule not found'
        });
      }

      res.json({
        success: true,
        data: schedule
      });
    } catch (error) {
      logger.error('Get schedule by ID error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch schedule'
      });
    }
  }

  async createSchedule(req, res) {
    try {
      const scheduleData = req.body;

      const schedule = await schedulerService.createSchedule(scheduleData);

      logger.info(`Schedule created: ${schedule.id}`);

      res.status(201).json({
        success: true,
        data: schedule,
        message: 'Schedule created successfully'
      });
    } catch (error) {
      logger.error('Create schedule error:', error.message);
      res.status(400).json({
        success: false,
        error: 'Failed to create schedule',
        details: error.message
      });
    }
  }

  async updateSchedule(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const schedule = await schedulerService.updateSchedule(id, updates);

      if (!schedule) {
        return res.status(404).json({
          success: false,
          error: 'Schedule not found'
        });
      }

      res.json({
        success: true,
        data: schedule,
        message: 'Schedule updated successfully'
      });
    } catch (error) {
      logger.error('Update schedule error:', error.message);
      res.status(400).json({
        success: false,
        error: 'Failed to update schedule',
        details: error.message
      });
    }
  }

  async deleteSchedule(req, res) {
    try {
      const { id } = req.params;

      await schedulerService.deleteSchedule(id);

      res.json({
        success: true,
        message: 'Schedule deleted successfully'
      });
    } catch (error) {
      logger.error('Delete schedule error:', error.message);
      res.status(400).json({
        success: false,
        error: 'Failed to delete schedule',
        details: error.message
      });
    }
  }

  async executeSchedule(req, res) {
    try {
      const { id } = req.params;

      // Get schedule details
      const schedules = await schedulerService.getSchedules();
      const schedule = schedules.find(s => s.id === id);

      if (!schedule) {
        return res.status(404).json({
          success: false,
          error: 'Schedule not found'
        });
      }

      if (schedule.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Schedule is not in pending status'
        });
      }

      // Execute the schedule manually
      await schedulerService.executeScheduledRecording(schedule);

      res.json({
        success: true,
        message: 'Schedule executed successfully'
      });
    } catch (error) {
      logger.error('Execute schedule error:', error.message);
      res.status(400).json({
        success: false,
        error: 'Failed to execute schedule',
        details: error.message
      });
    }
  }

  async bulkCreateSchedules(req, res) {
    try {
      const { schedules } = req.body;

      if (!Array.isArray(schedules) || schedules.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Schedules array is required and must not be empty'
        });
      }

      const results = [];
      let created = 0;
      let errors = 0;

      for (const scheduleData of schedules) {
        try {
          const schedule = await schedulerService.createSchedule(scheduleData);
          results.push({
            success: true,
            data: schedule
          });
          created++;
        } catch (error) {
          results.push({
            success: false,
            error: error.message,
            data: scheduleData
          });
          errors++;
        }
      }

      logger.info(`Bulk schedule creation: ${created} created, ${errors} errors`);

      res.json({
        success: true,
        data: {
          results,
          summary: {
            total: schedules.length,
            created,
            errors
          }
        },
        message: `Bulk schedule creation completed: ${created} created, ${errors} errors`
      });
    } catch (error) {
      logger.error('Bulk create schedules error:', error.message);
      res.status(400).json({
        success: false,
        error: 'Failed to create schedules in bulk',
        details: error.message
      });
    }
  }

  // Helper method to format schedule times
  formatScheduleTime(dateString) {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      iso: date.toISOString(),
      relative: this.getRelativeTime(date)
    };
  }

  // Helper method to get relative time
  getRelativeTime(date) {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMs < 0) {
      return 'Past';
    } else if (diffMins < 60) {
      return `${diffMins} minutes`;
    } else if (diffHours < 24) {
      return `${diffHours} hours`;
    } else {
      return `${diffDays} days`;
    }
  }
}

module.exports = new ScheduleController();