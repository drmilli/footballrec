import axios, { AxiosInstance } from 'axios';
import {
  Recording,
  Match,
  Schedule,
  VideoInfo,
  StreamUrl,
  DownloadUrl,
  ActiveRecording,
  RecordingFormData,
  MatchFormData,
  ScheduleFormData,
  ApiResponse,
  PaginatedResponse,
  Stats,
  FilterOptions
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/health');
    return response.data;
  }

  // Recording endpoints
  async getRecordings(filters?: FilterOptions): Promise<PaginatedResponse<Recording>> {
    const response = await this.api.get('/api/recordings', { params: filters });
    return response.data;
  }

  async getActiveRecordings(): Promise<ApiResponse<ActiveRecording[]>> {
    const response = await this.api.get('/api/recordings/active');
    return response.data;
  }

  async getRecordingById(id: string): Promise<ApiResponse<Recording>> {
    const response = await this.api.get(`/api/recordings/${id}`);
    return response.data;
  }

  async createRecording(data: RecordingFormData): Promise<ApiResponse<Recording>> {
    const response = await this.api.post('/api/recordings', data);
    return response.data;
  }

  async startRecording(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/api/recordings/${id}/start`);
    return response.data;
  }

  async stopRecording(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/api/recordings/${id}/stop`);
    return response.data;
  }

  async deleteRecording(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.delete(`/api/recordings/${id}`);
    return response.data;
  }

  async generateDownloadUrl(id: string, expires?: number): Promise<ApiResponse<DownloadUrl>> {
    const response = await this.api.get(`/api/recordings/${id}/download`, {
      params: { expires }
    });
    return response.data;
  }

  async generateStreamUrl(id: string, expires?: number): Promise<ApiResponse<StreamUrl>> {
    const response = await this.api.get(`/api/recordings/${id}/stream`, {
      params: { expires }
    });
    return response.data;
  }

  // Match endpoints
  async getMatches(filters?: FilterOptions): Promise<PaginatedResponse<Match>> {
    const response = await this.api.get('/api/matches', { params: filters });
    return response.data;
  }

  async getUpcomingMatches(limit?: number, days?: number): Promise<ApiResponse<Match[]>> {
    const response = await this.api.get('/api/matches/upcoming', {
      params: { limit, days }
    });
    return response.data;
  }

  async getTodayMatches(): Promise<ApiResponse<Match[]>> {
    const response = await this.api.get('/api/matches/today');
    return response.data;
  }

  async getMatchById(id: string): Promise<ApiResponse<Match>> {
    const response = await this.api.get(`/api/matches/${id}`);
    return response.data;
  }

  async createMatch(data: MatchFormData): Promise<ApiResponse<Match>> {
    const response = await this.api.post('/api/matches', data);
    return response.data;
  }

  async updateMatch(id: string, data: Partial<MatchFormData>): Promise<ApiResponse<Match>> {
    const response = await this.api.put(`/api/matches/${id}`, data);
    return response.data;
  }

  async deleteMatch(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.delete(`/api/matches/${id}`);
    return response.data;
  }

  async toggleAutoRecord(id: string, autoRecord: boolean): Promise<ApiResponse<Match>> {
    const response = await this.api.post(`/api/matches/${id}/auto-record`, {
      auto_record: autoRecord
    });
    return response.data;
  }

  async searchMatches(query: string, limit?: number): Promise<ApiResponse<Match[]>> {
    const response = await this.api.get(`/api/matches/search/${encodeURIComponent(query)}`, {
      params: { limit }
    });
    return response.data;
  }

  async getMatchesByCompetition(code: string, limit?: number): Promise<ApiResponse<Match[]>> {
    const response = await this.api.get(`/api/matches/competition/${code}`, {
      params: { limit }
    });
    return response.data;
  }

  async syncMatches(days?: number, force?: boolean): Promise<ApiResponse<any>> {
    const response = await this.api.post('/api/matches/sync', { days, force });
    return response.data;
  }

  // Schedule endpoints
  async getSchedules(filters?: FilterOptions): Promise<PaginatedResponse<Schedule>> {
    const response = await this.api.get('/api/schedules', { params: filters });
    return response.data;
  }

  async getUpcomingSchedules(limit?: number): Promise<ApiResponse<Schedule[]>> {
    const response = await this.api.get('/api/schedules/upcoming', {
      params: { limit }
    });
    return response.data;
  }

  async getActiveSchedules(): Promise<ApiResponse<Schedule[]>> {
    const response = await this.api.get('/api/schedules/active');
    return response.data;
  }

  async getScheduleStats(): Promise<ApiResponse<Stats>> {
    const response = await this.api.get('/api/schedules/stats');
    return response.data;
  }

  async getScheduleById(id: string): Promise<ApiResponse<Schedule>> {
    const response = await this.api.get(`/api/schedules/${id}`);
    return response.data;
  }

  async createSchedule(data: ScheduleFormData): Promise<ApiResponse<Schedule>> {
    const response = await this.api.post('/api/schedules', data);
    return response.data;
  }

  async updateSchedule(id: string, data: Partial<ScheduleFormData>): Promise<ApiResponse<Schedule>> {
    const response = await this.api.put(`/api/schedules/${id}`, data);
    return response.data;
  }

  async deleteSchedule(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.delete(`/api/schedules/${id}`);
    return response.data;
  }

  async executeSchedule(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/api/schedules/${id}/execute`);
    return response.data;
  }

  async bulkCreateSchedules(schedules: ScheduleFormData[]): Promise<ApiResponse<any>> {
    const response = await this.api.post('/api/schedules/bulk-create', { schedules });
    return response.data;
  }

  // Video endpoints
  async getVideos(filters?: FilterOptions): Promise<ApiResponse<Recording[]>> {
    const response = await this.api.get('/api/videos', { params: filters });
    return response.data;
  }

  async getVideoInfo(id: string): Promise<ApiResponse<VideoInfo>> {
    const response = await this.api.get(`/api/videos/${id}/info`);
    return response.data;
  }

  async streamVideo(id: string, quality?: string): Promise<ApiResponse<StreamUrl>> {
    const response = await this.api.get(`/api/videos/${id}/stream`, {
      params: { quality }
    });
    return response.data;
  }

  async downloadVideo(id: string): Promise<ApiResponse<DownloadUrl>> {
    const response = await this.api.get(`/api/videos/${id}/download`);
    return response.data;
  }

  async generateTempUrl(id: string, expires?: number, operation?: string): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/api/videos/${id}/generate-url`, {
      expires,
      operation
    });
    return response.data;
  }

  async getThumbnail(id: string, timestamp?: number): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/api/videos/${id}/thumbnail`, {
      params: { timestamp }
    });
    return response.data;
  }

  async deleteVideo(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.delete(`/api/videos/${id}`);
    return response.data;
  }

  // Utility methods
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDuration(seconds: number): string {
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

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  getRelativeTime(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
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

const apiService = new ApiService();
export default apiService;