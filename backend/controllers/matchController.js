const database = require('../config/database');
const footballApiService = require('../services/footballApiService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class MatchController {
  async getMatches(req, res) {
    try {
      const { page, limit, sort, order } = req.pagination;
      const { status, competition, date_from, date_to } = req.query;

      let query = 'SELECT * FROM matches';
      const params = [];
      const conditions = [];

      if (status) {
        conditions.push(`status = $${params.length + 1}`);
        params.push(status);
      }

      if (competition) {
        conditions.push(`competition ILIKE $${params.length + 1}`);
        params.push(`%${competition}%`);
      }

      if (date_from) {
        conditions.push(`match_date >= $${params.length + 1}`);
        params.push(date_from);
      }

      if (date_to) {
        conditions.push(`match_date <= $${params.length + 1}`);
        params.push(date_to);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` ORDER BY ${sort} ${order.toUpperCase()}`;
      query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, (page - 1) * limit);

      const result = await database.query(query, params);

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) FROM matches';
      if (conditions.length > 0) {
        countQuery += ' WHERE ' + conditions.join(' AND ');
      }
      const countResult = await database.query(countQuery, params.slice(0, -2));
      const totalCount = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      });
    } catch (error) {
      logger.error('Get matches error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch matches'
      });
    }
  }

  async getUpcomingMatches(req, res) {
    try {
      const { limit = 20, days = 7 } = req.query;
      const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      const result = await database.query(`
        SELECT * FROM matches 
        WHERE match_date > CURRENT_TIMESTAMP 
        AND match_date <= $1
        ORDER BY match_date ASC 
        LIMIT $2
      `, [endDate, limit]);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      logger.error('Get upcoming matches error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch upcoming matches'
      });
    }
  }

  async getTodayMatches(req, res) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const result = await database.query(`
        SELECT * FROM matches 
        WHERE match_date >= $1 AND match_date < $2
        ORDER BY match_date ASC
      `, [startOfDay, endOfDay]);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      logger.error('Get today matches error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch today\'s matches'
      });
    }
  }

  async getMatchById(req, res) {
    try {
      const { id } = req.params;
      
      const result = await database.query(`
        SELECT m.*, r.title as recording_title, r.status as recording_status
        FROM matches m
        LEFT JOIN recordings r ON m.recording_id = r.id
        WHERE m.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Match not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Get match by ID error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch match'
      });
    }
  }

  async createMatch(req, res) {
    try {
      const matchData = req.body;
      const id = uuidv4();

      const result = await database.query(`
        INSERT INTO matches (id, home_team, away_team, competition, match_date, stream_url, auto_record)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        id,
        matchData.home_team,
        matchData.away_team,
        matchData.competition,
        matchData.match_date,
        matchData.stream_url,
        matchData.auto_record || false
      ]);

      logger.info(`Match created: ${id} - ${matchData.home_team} vs ${matchData.away_team}`);

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Match created successfully'
      });
    } catch (error) {
      logger.error('Create match error:', error.message);
      res.status(400).json({
        success: false,
        error: 'Failed to create match',
        details: error.message
      });
    }
  }

  async updateMatch(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');

      const values = [id, ...Object.values(updates)];

      const result = await database.query(`
        UPDATE matches SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, values);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Match not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Match updated successfully'
      });
    } catch (error) {
      logger.error('Update match error:', error.message);
      res.status(400).json({
        success: false,
        error: 'Failed to update match',
        details: error.message
      });
    }
  }

  async deleteMatch(req, res) {
    try {
      const { id } = req.params;

      const result = await database.query('DELETE FROM matches WHERE id = $1 RETURNING *', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Match not found'
        });
      }

      res.json({
        success: true,
        message: 'Match deleted successfully'
      });
    } catch (error) {
      logger.error('Delete match error:', error.message);
      res.status(400).json({
        success: false,
        error: 'Failed to delete match',
        details: error.message
      });
    }
  }

  async toggleAutoRecord(req, res) {
    try {
      const { id } = req.params;
      const { auto_record } = req.body;

      const result = await database.query(`
        UPDATE matches SET auto_record = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [id, auto_record]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Match not found'
        });
      }

      const action = auto_record ? 'enabled' : 'disabled';
      logger.info(`Auto-record ${action} for match: ${id}`);

      res.json({
        success: true,
        data: result.rows[0],
        message: `Auto-record ${action} successfully`
      });
    } catch (error) {
      logger.error('Toggle auto-record error:', error.message);
      res.status(400).json({
        success: false,
        error: 'Failed to toggle auto-record',
        details: error.message
      });
    }
  }

  async searchMatches(req, res) {
    try {
      const { query } = req.params;
      const { limit = 20 } = req.query;

      const result = await database.query(`
        SELECT * FROM matches 
        WHERE home_team ILIKE $1 
        OR away_team ILIKE $1 
        OR competition ILIKE $1
        ORDER BY match_date DESC
        LIMIT $2
      `, [`%${query}%`, limit]);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
        query
      });
    } catch (error) {
      logger.error('Search matches error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to search matches'
      });
    }
  }

  async getMatchesByCompetition(req, res) {
    try {
      const { code } = req.params;
      const { limit = 50 } = req.query;

      const result = await database.query(`
        SELECT * FROM matches 
        WHERE competition ILIKE $1
        ORDER BY match_date DESC
        LIMIT $2
      `, [`%${code}%`, limit]);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
        competition: code
      });
    } catch (error) {
      logger.error('Get matches by competition error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch matches by competition'
      });
    }
  }

  async syncMatches(req, res) {
    try {
      const { days = 7, force = false } = req.body;

      logger.info(`Starting match sync for ${days} days (force: ${force})`);

      // Fetch matches from external API
      const apiMatches = await footballApiService.getUpcomingMatches(days);

      let created = 0;
      let updated = 0;
      let errors = 0;

      for (const apiMatch of apiMatches) {
        try {
          // Check if match exists
          const existingMatch = await database.query(
            'SELECT id FROM matches WHERE external_id = $1',
            [apiMatch.id]
          );

          if (existingMatch.rows.length > 0) {
            // Update existing match if force is true
            if (force) {
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
                apiMatch.homeTeam,
                apiMatch.awayTeam,
                apiMatch.competition,
                apiMatch.utcDate,
                apiMatch.status,
                apiMatch.id
              ]);
              updated++;
            }
          } else {
            // Create new match
            await database.query(`
              INSERT INTO matches (id, external_id, home_team, away_team, competition, match_date, status)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
              uuidv4(),
              apiMatch.id,
              apiMatch.homeTeam,
              apiMatch.awayTeam,
              apiMatch.competition,
              apiMatch.utcDate,
              apiMatch.status
            ]);
            created++;
          }
        } catch (matchError) {
          logger.error(`Error syncing match ${apiMatch.id}:`, matchError.message);
          errors++;
        }
      }

      logger.info(`Match sync completed: ${created} created, ${updated} updated, ${errors} errors`);

      res.json({
        success: true,
        data: {
          created,
          updated,
          errors,
          total: apiMatches.length
        },
        message: 'Match sync completed successfully'
      });

    } catch (error) {
      logger.error('Sync matches error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to sync matches',
        details: error.message
      });
    }
  }
}

module.exports = new MatchController();