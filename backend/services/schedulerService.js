const cron = require('node-cron');
const moment = require('moment');
const database = require('../config/database');
const recordingService = require('./recordingService');
const footballApiService = require('./footballApiService');
const logger = require('../utils/logger');

class SchedulerService {
  constructor() {
    this.scheduledJobs = new Map();
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) {
      logger.warn('Scheduler service already initialized');
      return;
    }

    try {
      logger.info('Initializing scheduler service...');

      // Start the main scheduler that runs every minute
      this.startMainScheduler();

      // Load existing schedules from database
      await this.loadExistingSchedules();

      // Start automatic match fetching (runs every hour)
      this.startMatchFetcher();

      this.isInitialized = true;
      logger.info('✅ Scheduler service initialized successfully');

    } catch (error) {
      logger.error('❌ Failed to initialize scheduler service:', error.message);
      throw error;
    }
  }

  startMainScheduler() {
    // Run every minute to check for scheduled recordings
    cron.schedule('* * * * *', async () => {
      try {
        await this.checkScheduledRecordings();
      } catch (error) {
        logger.error('Main scheduler error:', error.message);
      }
    });

    logger.info('Main scheduler started (runs every minute)');
  }

  startMatchFetcher() {
    // Run every hour to fetch upcoming matches
    cron.schedule('0 * * * *', async () => {
      try {
        await this.fetchUpcomingMatches();
      } catch (error) {
        logger.error('Match fetcher error:', error.message);
      }
    });

    logger.info('Match fetcher started (runs every hour)');
  }

  async checkScheduledRecordings() {
    try {
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      // Get schedules that should start within the next 5 minutes
      const result = await database.query(`
        SELECT s.*, r.title, r.stream_url, r.quality, r.format, m.home_team, m.away_team
        FROM schedules s
        LEFT JOIN recordings r ON s.recording_id = r.id
        LEFT JOIN matches m ON s.match_id = m.id
        WHERE s.status = 'pending'
        AND s.scheduled_start <= $1
        AND s.scheduled_start > $2
      `, [fiveMinutesFromNow, now]);

      const schedules = result.rows;

      for (const schedule of schedules) {
        await this.executeScheduledRecording(schedule);
      }

      if (schedules.length > 0) {
        logger.info(`Processed ${schedules.length} scheduled recordings`);
      }

    } catch (error) {
      logger.error('Error checking scheduled recordings:', error.message);
    }
  }

  async executeScheduledRecording(schedule) {
    try {
      logger.info(`Executing scheduled recording: ${schedule.id}`);

      // Update schedule status to executing
      await database.query(
        'UPDATE schedules SET status = $1, executed_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['executing', schedule.id]
      );

      let recording;

      if (schedule.recording_id) {
        // Use existing recording
        recording = await recordingService.getRecordingById(schedule.recording_id);
      } else if (schedule.match_id) {
        // Create recording for match
        const title = `${schedule.home_team} vs ${schedule.away_team}`;
        const recordingData = {
          title,
          description: `Automatic recording for scheduled match`,
          stream_url: schedule.stream_url || 'https://example.com/stream.m3u8', // This should be provided
          quality: 'best',
          format: 'mp4'
        };

        recording = await recordingService.createRecording(recordingData);

        // Update schedule with recording ID
        await database.query(
          'UPDATE schedules SET recording_id = $1 WHERE id = $2',
          [recording.id, schedule.id]
        );
      }

      if (!recording) {
        throw new Error('No recording found or created');
      }

      // Start the recording
      await recordingService.startRecording(recording);

      // Schedule stop time if specified
      if (schedule.scheduled_end) {
        await this.scheduleRecordingStop(recording.id, schedule.scheduled_end);
      }

      // Update schedule status to active
      await database.query(
        'UPDATE schedules SET status = $1 WHERE id = $2',
        ['active', schedule.id]
      );

      logger.info(`Scheduled recording started successfully: ${recording.title}`);

    } catch (error) {
      logger.error(`Failed to execute scheduled recording ${schedule.id}:`, error.message);

      // Update schedule status to failed
      await database.query(
        'UPDATE schedules SET status = $1 WHERE id = $2',
        ['failed', schedule.id]
      );
    }
  }

  async scheduleRecordingStop(recordingId, stopTime) {
    const delay = new Date(stopTime).getTime() - Date.now();
    
    if (delay > 0) {
      setTimeout(async () => {
        try {
          await recordingService.stopRecording(recordingId);
          logger.info(`Scheduled recording stopped: ${recordingId}`);
        } catch (error) {
          logger.error(`Failed to stop scheduled recording ${recordingId}:`, error.message);
        }
      }, delay);
    }
  }

  async fetchUpcomingMatches() {
    try {
      logger.info('Fetching upcoming matches...');

      const matches = await footballApiService.getUpcomingMatches();
      
      for (const matchData of matches) {
        await this.processMatch(matchData);
      }

      logger.info(`Processed ${matches.length} upcoming matches`);

    } catch (error) {
      logger.error('Error fetching upcoming matches:', error.message);
    }
  }

  async processMatch(matchData) {
    try {
      // Check if match already exists
      const existingMatch = await database.query(
        'SELECT id FROM matches WHERE external_id = $1',
        [matchData.id]
      );

      let matchId;

      if (existingMatch.rows.length > 0) {
        matchId = existingMatch.rows[0].id;
        
        // Update existing match
        await database.query(`
          UPDATE matches SET 
            home_team = $1, 
            away_team = $2, 
            competition = $3, 
            match_date = $4,
            status = $5,
            updated_at = CURRENT_TIMESTAMP
          WHERE external_id = $6
        `, [
          matchData.homeTeam,
          matchData.awayTeam,
          matchData.competition,
          matchData.utcDate,
          matchData.status,
          matchData.id
        ]);
      } else {
        // Create new match
        const result = await database.query(`
          INSERT INTO matches (external_id, home_team, away_team, competition, match_date, status, auto_record)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [
          matchData.id,
          matchData.homeTeam,
          matchData.awayTeam,
          matchData.competition,
          matchData.utcDate,
          matchData.status,
          false // Auto-record disabled by default
        ]);

        matchId = result.rows[0].id;
      }

      // Check if auto-recording is enabled for this match
      const matchResult = await database.query(
        'SELECT auto_record FROM matches WHERE id = $1',
        [matchId]
      );

      if (matchResult.rows[0]?.auto_record) {
        await this.createAutoSchedule(matchId, matchData);
      }

    } catch (error) {
      logger.error(`Error processing match ${matchData.id}:`, error.message);
    }
  }

  async createAutoSchedule(matchId, matchData) {
    try {
      // Check if schedule already exists
      const existingSchedule = await database.query(
        'SELECT id FROM schedules WHERE match_id = $1 AND status IN ($2, $3)',
        [matchId, 'pending', 'active']
      );

      if (existingSchedule.rows.length > 0) {
        logger.debug(`Schedule already exists for match ${matchId}`);
        return;
      }

      // Schedule recording to start 5 minutes before match
      const scheduledStart = moment(matchData.utcDate).subtract(5, 'minutes').toDate();
      const scheduledEnd = moment(matchData.utcDate).add(2, 'hours').toDate(); // 2 hours after start

      await database.query(`
        INSERT INTO schedules (match_id, scheduled_start, scheduled_end, status, auto_generated)
        VALUES ($1, $2, $3, $4, $5)
      `, [matchId, scheduledStart, scheduledEnd, 'pending', true]);

      logger.info(`Auto-schedule created for match: ${matchData.homeTeam} vs ${matchData.awayTeam}`);

    } catch (error) {
      logger.error(`Error creating auto-schedule for match ${matchId}:`, error.message);
    }
  }

  async loadExistingSchedules() {
    try {
      const result = await database.query(`
        SELECT * FROM schedules 
        WHERE status = 'pending' 
        AND scheduled_start > CURRENT_TIMESTAMP
      `);

      logger.info(`Loaded ${result.rows.length} existing schedules`);

    } catch (error) {
      logger.error('Error loading existing schedules:', error.message);
    }
  }

  async createSchedule(scheduleData) {
    try {
      const {
        match_id,
        recording_id,
        scheduled_start,
        scheduled_end,
        cron_expression
      } = scheduleData;

      const result = await database.query(`
        INSERT INTO schedules (match_id, recording_id, scheduled_start, scheduled_end, cron_expression, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [match_id, recording_id, scheduled_start, scheduled_end, cron_expression, 'pending']);

      const schedule = result.rows[0];
      logger.info(`Schedule created: ${schedule.id}`);

      return schedule;

    } catch (error) {
      logger.error('Error creating schedule:', error.message);
      throw error;
    }
  }

  async updateSchedule(scheduleId, updates) {
    try {
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');

      const values = [scheduleId, ...Object.values(updates)];

      const result = await database.query(`
        UPDATE schedules SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, values);

      return result.rows[0];

    } catch (error) {
      logger.error('Error updating schedule:', error.message);
      throw error;
    }
  }

  async deleteSchedule(scheduleId) {
    try {
      await database.query('DELETE FROM schedules WHERE id = $1', [scheduleId]);
      logger.info(`Schedule deleted: ${scheduleId}`);

    } catch (error) {
      logger.error('Error deleting schedule:', error.message);
      throw error;
    }
  }

  async getSchedules(filters = {}) {
    try {
      let query = `
        SELECT s.*, m.home_team, m.away_team, m.competition, r.title as recording_title
        FROM schedules s
        LEFT JOIN matches m ON s.match_id = m.id
        LEFT JOIN recordings r ON s.recording_id = r.id
      `;

      const params = [];
      const conditions = [];

      if (filters.status) {
        conditions.push(`s.status = $${params.length + 1}`);
        params.push(filters.status);
      }

      if (filters.upcoming) {
        conditions.push(`s.scheduled_start > CURRENT_TIMESTAMP`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY s.scheduled_start ASC';

      if (filters.limit) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(filters.limit);
      }

      const result = await database.query(query, params);
      return result.rows;

    } catch (error) {
      logger.error('Error getting schedules:', error.message);
      throw error;
    }
  }

  async getStats() {
    try {
      const result = await database.query(`
        SELECT 
          COUNT(*) as total_schedules,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_schedules,
          COUNT(*) FILTER (WHERE status = 'active') as active_schedules,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_schedules,
          COUNT(*) FILTER (WHERE status = 'failed') as failed_schedules
        FROM schedules
      `);

      return result.rows[0];

    } catch (error) {
      logger.error('Error getting scheduler stats:', error.message);
      throw error;
    }
  }
}

module.exports = new SchedulerService();