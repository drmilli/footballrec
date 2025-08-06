const axios = require('axios');
const logger = require('../utils/logger');

class StreamSourceService {
  constructor() {
    this.sources = {
      supersport: {
        name: 'SuperSport',
        baseUrl: process.env.SUPERSPORT_API_URL || 'https://api.supersport.com',
        apiKey: process.env.SUPERSPORT_API_KEY,
        endpoints: {
          live: '/live-streams',
          schedule: '/schedule'
        }
      },
      youtube: {
        name: 'YouTube Live Sport',
        baseUrl: 'https://www.googleapis.com/youtube/v3',
        apiKey: process.env.YOUTUBE_API_KEY,
        endpoints: {
          search: '/search',
          videos: '/videos'
        }
      },
      fifa: {
        name: 'FIFA+',
        baseUrl: process.env.FIFA_PLUS_API_URL || 'https://api.fifa.com',
        apiKey: process.env.FIFA_PLUS_API_KEY,
        endpoints: {
          live: '/live-streams',
          matches: '/matches'
        }
      },
      caftv: {
        name: 'CAF TV',
        baseUrl: process.env.CAF_TV_API_URL || 'https://api.cafonline.com',
        apiKey: process.env.CAF_TV_API_KEY,
        endpoints: {
          live: '/live-matches',
          schedule: '/fixtures'
        }
      }
    };
  }

  // Get all available stream sources
  async getAllSources() {
    const sources = [];
    
    for (const [key, source] of Object.entries(this.sources)) {
      sources.push({
        id: key,
        name: source.name,
        status: source.apiKey ? 'configured' : 'not_configured',
        hasApiKey: !!source.apiKey
      });
    }
    
    return sources;
  }

  // Get live streams from SuperSport
  async getSuperSportStreams() {
    try {
      const source = this.sources.supersport;
      if (!source.apiKey) {
        throw new Error('SuperSport API key not configured');
      }

      // Mock implementation - replace with actual API calls
      const mockStreams = [
        {
          id: 'ss_001',
          title: 'Premier League Live',
          url: 'https://supersport.com/stream/premier-league',
          quality: ['1080p', '720p', '480p'],
          status: 'live',
          competition: 'Premier League',
          teams: ['Manchester United', 'Arsenal']
        },
        {
          id: 'ss_002',
          title: 'Champions League',
          url: 'https://supersport.com/stream/champions-league',
          quality: ['1080p', '720p'],
          status: 'live',
          competition: 'UEFA Champions League',
          teams: ['Barcelona', 'PSG']
        }
      ];

      logger.info('Retrieved SuperSport streams', { count: mockStreams.length });
      return mockStreams;
    } catch (error) {
      logger.error('Error fetching SuperSport streams:', error.message);
      return [];
    }
  }

  // Get live streams from YouTube
  async getYouTubeStreams() {
    try {
      const source = this.sources.youtube;
      if (!source.apiKey) {
        throw new Error('YouTube API key not configured');
      }

      const response = await axios.get(`${source.baseUrl}${source.endpoints.search}`, {
        params: {
          part: 'snippet',
          eventType: 'live',
          type: 'video',
          q: 'football live stream',
          maxResults: 10,
          key: source.apiKey
        }
      });

      const streams = response.data.items.map(item => ({
        id: `yt_${item.id.videoId}`,
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        quality: ['auto'],
        status: 'live',
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.medium.url
      }));

      logger.info('Retrieved YouTube streams', { count: streams.length });
      return streams;
    } catch (error) {
      logger.error('Error fetching YouTube streams:', error.message);
      return [];
    }
  }

  // Get live streams from FIFA+
  async getFifaPlusStreams() {
    try {
      const source = this.sources.fifa;
      
      // Mock implementation - replace with actual API calls
      const mockStreams = [
        {
          id: 'fifa_001',
          title: 'FIFA World Cup Qualifier',
          url: 'https://fifa.com/fifaplus/stream/qualifier',
          quality: ['1080p', '720p'],
          status: 'live',
          competition: 'World Cup Qualifier',
          teams: ['Brazil', 'Argentina']
        }
      ];

      logger.info('Retrieved FIFA+ streams', { count: mockStreams.length });
      return mockStreams;
    } catch (error) {
      logger.error('Error fetching FIFA+ streams:', error.message);
      return [];
    }
  }

  // Get live streams from CAF TV
  async getCafTvStreams() {
    try {
      const source = this.sources.caftv;
      
      // Mock implementation - replace with actual API calls
      const mockStreams = [
        {
          id: 'caf_001',
          title: 'AFCON Qualifier',
          url: 'https://cafonline.com/tv/stream/qualifier',
          quality: ['720p', '480p'],
          status: 'live',
          competition: 'AFCON Qualifier',
          teams: ['Nigeria', 'Ghana']
        }
      ];

      logger.info('Retrieved CAF TV streams', { count: mockStreams.length });
      return mockStreams;
    } catch (error) {
      logger.error('Error fetching CAF TV streams:', error.message);
      return [];
    }
  }

  // Get all live streams from all sources
  async getAllLiveStreams() {
    try {
      const [superSportStreams, youtubeStreams, fifaStreams, cafStreams] = await Promise.allSettled([
        this.getSuperSportStreams(),
        this.getYouTubeStreams(),
        this.getFifaPlusStreams(),
        this.getCafTvStreams()
      ]);

      const allStreams = [];
      
      if (superSportStreams.status === 'fulfilled') {
        allStreams.push(...superSportStreams.value.map(stream => ({ ...stream, source: 'supersport' })));
      }
      
      if (youtubeStreams.status === 'fulfilled') {
        allStreams.push(...youtubeStreams.value.map(stream => ({ ...stream, source: 'youtube' })));
      }
      
      if (fifaStreams.status === 'fulfilled') {
        allStreams.push(...fifaStreams.value.map(stream => ({ ...stream, source: 'fifa' })));
      }
      
      if (cafStreams.status === 'fulfilled') {
        allStreams.push(...cafStreams.value.map(stream => ({ ...stream, source: 'caftv' })));
      }

      logger.info('Retrieved all live streams', { totalCount: allStreams.length });
      return allStreams;
    } catch (error) {
      logger.error('Error fetching all live streams:', error.message);
      throw error;
    }
  }

  // Get stream by ID from specific source
  async getStreamById(sourceId, streamId) {
    try {
      let streams = [];
      
      switch (sourceId) {
        case 'supersport':
          streams = await this.getSuperSportStreams();
          break;
        case 'youtube':
          streams = await this.getYouTubeStreams();
          break;
        case 'fifa':
          streams = await this.getFifaPlusStreams();
          break;
        case 'caftv':
          streams = await this.getCafTvStreams();
          break;
        default:
          throw new Error(`Unknown source: ${sourceId}`);
      }

      const stream = streams.find(s => s.id === streamId);
      if (!stream) {
        throw new Error(`Stream not found: ${streamId}`);
      }

      return { ...stream, source: sourceId };
    } catch (error) {
      logger.error(`Error fetching stream ${streamId} from ${sourceId}:`, error.message);
      throw error;
    }
  }

  // Test connection to a specific source
  async testSourceConnection(sourceId) {
    try {
      const source = this.sources[sourceId];
      if (!source) {
        throw new Error(`Unknown source: ${sourceId}`);
      }

      if (!source.apiKey && sourceId !== 'fifa' && sourceId !== 'caftv') {
        return { status: 'not_configured', message: 'API key not configured' };
      }

      // For YouTube, test the actual API
      if (sourceId === 'youtube' && source.apiKey) {
        await axios.get(`${source.baseUrl}/search`, {
          params: {
            part: 'snippet',
            type: 'video',
            q: 'test',
            maxResults: 1,
            key: source.apiKey
          }
        });
      }

      return { status: 'connected', message: 'Connection successful' };
    } catch (error) {
      logger.error(`Error testing ${sourceId} connection:`, error.message);
      return { status: 'error', message: error.message };
    }
  }
}

module.exports = new StreamSourceService();