const axios = require('axios');
const logger = require('../utils/logger');

class FootballApiService {
  constructor() {
    this.apiKey = process.env.FOOTBALL_API_KEY;
    this.apiUrl = process.env.FOOTBALL_API_URL || 'https://api.football-data.org/v4';
    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: 10000,
      headers: {
        'X-Auth-Token': this.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  async getUpcomingMatches(days = 7) {
    try {
      if (!this.apiKey) {
        logger.warn('Football API key not configured, returning mock data');
        return this.getMockMatches();
      }

      const dateFrom = new Date().toISOString().split('T')[0];
      const dateTo = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      logger.info(`Fetching matches from ${dateFrom} to ${dateTo}`);

      const response = await this.client.get('/matches', {
        params: {
          dateFrom,
          dateTo,
          status: 'SCHEDULED'
        }
      });

      const matches = response.data.matches.map(match => ({
        id: match.id,
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        competition: match.competition.name,
        utcDate: match.utcDate,
        status: match.status.toLowerCase(),
        venue: match.venue?.name,
        matchday: match.matchday,
        season: match.season?.currentMatchday
      }));

      logger.info(`Fetched ${matches.length} upcoming matches`);
      return matches;

    } catch (error) {
      logger.error('Error fetching upcoming matches:', error.message);
      
      if (error.response?.status === 429) {
        logger.warn('API rate limit exceeded, returning cached/mock data');
        return this.getMockMatches();
      }
      
      throw error;
    }
  }

  async getMatchById(matchId) {
    try {
      if (!this.apiKey) {
        logger.warn('Football API key not configured, returning mock data');
        return this.getMockMatch(matchId);
      }

      const response = await this.client.get(`/matches/${matchId}`);
      const match = response.data;

      return {
        id: match.id,
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        competition: match.competition.name,
        utcDate: match.utcDate,
        status: match.status.toLowerCase(),
        venue: match.venue?.name,
        score: match.score,
        matchday: match.matchday
      };

    } catch (error) {
      logger.error(`Error fetching match ${matchId}:`, error.message);
      throw error;
    }
  }

  async getCompetitions() {
    try {
      if (!this.apiKey) {
        return this.getMockCompetitions();
      }

      const response = await this.client.get('/competitions');
      
      return response.data.competitions.map(comp => ({
        id: comp.id,
        name: comp.name,
        code: comp.code,
        type: comp.type,
        emblem: comp.emblem,
        currentSeason: comp.currentSeason
      }));

    } catch (error) {
      logger.error('Error fetching competitions:', error.message);
      return this.getMockCompetitions();
    }
  }

  async getTeamMatches(teamId, status = 'SCHEDULED', limit = 10) {
    try {
      if (!this.apiKey) {
        return this.getMockTeamMatches(teamId);
      }

      const response = await this.client.get(`/teams/${teamId}/matches`, {
        params: {
          status,
          limit
        }
      });

      return response.data.matches.map(match => ({
        id: match.id,
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        competition: match.competition.name,
        utcDate: match.utcDate,
        status: match.status.toLowerCase()
      }));

    } catch (error) {
      logger.error(`Error fetching matches for team ${teamId}:`, error.message);
      throw error;
    }
  }

  async searchTeams(query) {
    try {
      if (!this.apiKey) {
        return this.getMockTeams().filter(team => 
          team.name.toLowerCase().includes(query.toLowerCase())
        );
      }

      // Note: Football-data.org doesn't have a direct search endpoint
      // This would need to be implemented differently or use a different API
      const competitions = await this.getCompetitions();
      const teams = [];

      for (const comp of competitions.slice(0, 3)) { // Limit to avoid rate limits
        try {
          const response = await this.client.get(`/competitions/${comp.id}/teams`);
          const compTeams = response.data.teams
            .filter(team => team.name.toLowerCase().includes(query.toLowerCase()))
            .map(team => ({
              id: team.id,
              name: team.name,
              shortName: team.shortName,
              tla: team.tla,
              crest: team.crest,
              competition: comp.name
            }));
          
          teams.push(...compTeams);
        } catch (error) {
          logger.warn(`Error fetching teams for competition ${comp.id}:`, error.message);
        }
      }

      return teams.slice(0, 20); // Limit results

    } catch (error) {
      logger.error('Error searching teams:', error.message);
      return [];
    }
  }

  // Mock data methods for development/fallback
  getMockMatches() {
    const now = new Date();
    return [
      {
        id: 'mock-1',
        homeTeam: 'Manchester United',
        awayTeam: 'Liverpool',
        competition: 'Premier League',
        utcDate: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        status: 'scheduled',
        venue: 'Old Trafford'
      },
      {
        id: 'mock-2',
        homeTeam: 'Barcelona',
        awayTeam: 'Real Madrid',
        competition: 'La Liga',
        utcDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        status: 'scheduled',
        venue: 'Camp Nou'
      },
      {
        id: 'mock-3',
        homeTeam: 'Bayern Munich',
        awayTeam: 'Borussia Dortmund',
        competition: 'Bundesliga',
        utcDate: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
        status: 'scheduled',
        venue: 'Allianz Arena'
      }
    ];
  }

  getMockMatch(matchId) {
    return {
      id: matchId,
      homeTeam: 'Mock Home Team',
      awayTeam: 'Mock Away Team',
      competition: 'Mock League',
      utcDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      status: 'scheduled',
      venue: 'Mock Stadium'
    };
  }

  getMockCompetitions() {
    return [
      { id: 'PL', name: 'Premier League', code: 'PL', type: 'LEAGUE' },
      { id: 'CL', name: 'UEFA Champions League', code: 'CL', type: 'CUP' },
      { id: 'PD', name: 'Primera División', code: 'PD', type: 'LEAGUE' },
      { id: 'BL1', name: 'Bundesliga', code: 'BL1', type: 'LEAGUE' },
      { id: 'SA', name: 'Serie A', code: 'SA', type: 'LEAGUE' }
    ];
  }

  getMockTeamMatches(teamId) {
    return [
      {
        id: `mock-team-${teamId}-1`,
        homeTeam: 'Mock Team',
        awayTeam: 'Opponent Team',
        competition: 'Mock League',
        utcDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'scheduled'
      }
    ];
  }

  getMockTeams() {
    return [
      { id: 1, name: 'Manchester United', shortName: 'Man United', tla: 'MUN' },
      { id: 2, name: 'Liverpool', shortName: 'Liverpool', tla: 'LIV' },
      { id: 3, name: 'Chelsea', shortName: 'Chelsea', tla: 'CHE' },
      { id: 4, name: 'Arsenal', shortName: 'Arsenal', tla: 'ARS' },
      { id: 5, name: 'Manchester City', shortName: 'Man City', tla: 'MCI' }
    ];
  }

  async testConnection() {
    try {
      if (!this.apiKey) {
        logger.warn('Football API key not configured');
        return false;
      }

      await this.client.get('/competitions', { timeout: 5000 });
      logger.info('✅ Football API connection successful');
      return true;

    } catch (error) {
      logger.error('❌ Football API connection failed:', error.message);
      return false;
    }
  }

  // Helper method to format match for display
  formatMatch(match) {
    const date = new Date(match.utcDate);
    return {
      ...match,
      formattedDate: date.toLocaleDateString(),
      formattedTime: date.toLocaleTimeString(),
      matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
      isToday: date.toDateString() === new Date().toDateString(),
      isUpcoming: date > new Date()
    };
  }

  // Get matches for specific competitions
  async getCompetitionMatches(competitionCode, matchday = null) {
    try {
      if (!this.apiKey) {
        return this.getMockMatches();
      }

      const params = { status: 'SCHEDULED' };
      if (matchday) {
        params.matchday = matchday;
      }

      const response = await this.client.get(`/competitions/${competitionCode}/matches`, {
        params
      });

      return response.data.matches.map(match => ({
        id: match.id,
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        competition: match.competition.name,
        utcDate: match.utcDate,
        status: match.status.toLowerCase(),
        matchday: match.matchday
      }));

    } catch (error) {
      logger.error(`Error fetching matches for competition ${competitionCode}:`, error.message);
      throw error;
    }
  }
}

module.exports = new FootballApiService();