import axios from 'axios';
import {
  Recording,
  Match,
  Schedule,
  ApiResponse,
  PaginatedResponse,
  VideoInfo,
  StreamUrl,
  DownloadUrl,
  ActiveRecording,
  RecordingFormData,
  MatchFormData,
  ScheduleFormData,
  Stats,
} from '../types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
api.interceptors.request.use(
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

// Response interceptor for error handling
api.interceptors.response.use(
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

class ApiService {
  // Recording endpoints
  async getRecordings(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<Recording>> {
    const response = await api.get('/recordings', { params });
    return response.data;
  }

  async getRecording(id: string): Promise<ApiResponse<Recording>> {
    const response = await api.get(`/recordings/${id}`);
    return response.data;
  }

  async createRecording(data: RecordingFormData): Promise<ApiResponse<Recording>> {
    const response = await api.post('/recordings', data);
    return response.data;
  }

  async updateRecording(id: string, data: Partial<RecordingFormData>): Promise<ApiResponse<Recording>> {
    const response = await api.put(`/recordings/${id}`, data);
    return response.data;
  }

  async deleteRecording(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/recordings/${id}`);
    return response.data;
  }

  async startRecording(id: string): Promise<ApiResponse<Recording>> {
    const response = await api.post(`/recordings/${id}/start`);
    return response.data;
  }

  async stopRecording(id: string): Promise<ApiResponse<Recording>> {
    const response = await api.post(`/recordings/${id}/stop`);
    return response.data;
  }

  async getActiveRecordings(): Promise<ApiResponse<ActiveRecording[]>> {
    const response = await api.get('/recordings/active');
    return response.data;
  }

  async getRecordingDownloadUrl(id: string): Promise<ApiResponse<DownloadUrl>> {
    const response = await api.get(`/recordings/${id}/download-url`);
    return response.data;
  }

  async getRecordingStreamUrl(id: string): Promise<ApiResponse<StreamUrl>> {
    const response = await api.get(`/recordings/${id}/stream-url`);
    return response.data;
  }

  // Match endpoints
  async getMatches(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    competition?: string;
  }): Promise<PaginatedResponse<Match>> {
    const response = await api.get('/matches', { params });
    return response.data;
  }

  async getMatch(id: string): Promise<ApiResponse<Match>> {
    const response = await api.get(`/matches/${id}`);
    return response.data;
  }

  async createMatch(data: MatchFormData): Promise<ApiResponse<Match>> {
    const response = await api.post('/matches', data);
    return response.data;
  }

  async updateMatch(id: string, data: Partial<MatchFormData>): Promise<ApiResponse<Match>> {
    const response = await api.put(`/matches/${id}`, data);
    return response.data;
  }

  async deleteMatch(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/matches/${id}`);
    return response.data;
  }

  async getUpcomingMatches(limit?: number): Promise<ApiResponse<Match[]>> {
    const response = await api.get('/matches/upcoming', { params: { limit } });
    return response.data;
  }

  async getTodayMatches(): Promise<ApiResponse<Match[]>> {
    const response = await api.get('/matches/today');
    return response.data;
  }

  async toggleAutoRecord(id: string): Promise<ApiResponse<Match>> {
    const response = await api.post(`/matches/${id}/toggle-auto-record`);
    return response.data;
  }

  async searchMatches(query: string): Promise<ApiResponse<Match[]>> {
    const response = await api.get('/matches/search', { params: { q: query } });
    return response.data;
  }

  async getMatchesByCompetition(competition: string): Promise<ApiResponse<Match[]>> {
    const response = await api.get(`/matches/competition/${competition}`);
    return response.data;
  }

  async syncMatches(): Promise<ApiResponse<{ synced: number; created: number }>> {
    const response = await api.post('/matches/sync');
    return response.data;
  }

  // Schedule endpoints
  async getSchedules(params?: {
    page?: number;
    limit?: number;
    status?: string;
    match_id?: string;
  }): Promise<PaginatedResponse<Schedule>> {
    const response = await api.get('/schedules', { params });
    return response.data;
  }

  async getSchedule(id: string): Promise<ApiResponse<Schedule>> {
    const response = await api.get(`/schedules/${id}`);
    return response.data;
  }

  async createSchedule(data: ScheduleFormData): Promise<ApiResponse<Schedule>> {
    const response = await api.post('/schedules', data);
    return response.data;
  }

  async updateSchedule(id: string, data: Partial<ScheduleFormData>): Promise<ApiResponse<Schedule>> {
    const response = await api.put(`/schedules/${id}`, data);
    return response.data;
  }

  async deleteSchedule(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/schedules/${id}`);
    return response.data;
  }

  async getUpcomingSchedules(limit?: number): Promise<ApiResponse<Schedule[]>> {
    const response = await api.get('/schedules/upcoming', { params: { limit } });
    return response.data;
  }

  async getActiveSchedules(): Promise<ApiResponse<Schedule[]>> {
    const response = await api.get('/schedules/active');
    return response.data;
  }

  async getScheduleStats(): Promise<ApiResponse<Stats>> {
    const response = await api.get('/schedules/stats');
    return response.data;
  }

  async executeSchedule(id: string): Promise<ApiResponse<Schedule>> {
    const response = await api.post(`/schedules/${id}/execute`);
    return response.data;
  }

  async bulkCreateSchedules(data: { match_ids: string[] }): Promise<ApiResponse<Schedule[]>> {
    const response = await api.post('/schedules/bulk-create', data);
    return response.data;
  }

  // Video endpoints
  async getVideos(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<Recording[]>> {
    const response = await api.get('/videos', { params });
    return response.data;
  }

  async getVideoInfo(id: string): Promise<ApiResponse<VideoInfo>> {
    const response = await api.get(`/videos/${id}/info`);
    return response.data;
  }

  async getVideoStreamUrl(id: string): Promise<ApiResponse<StreamUrl>> {
    const response = await api.get(`/videos/${id}/stream`);
    return response.data;
  }

  async getVideoDownloadUrl(id: string): Promise<ApiResponse<DownloadUrl>> {
    const response = await api.get(`/videos/${id}/download`);
    return response.data;
  }

  async generateTempUrl(id: string, action: 'stream' | 'download'): Promise<ApiResponse<{ url: string; expiresAt: string }>> {
    const response = await api.post(`/videos/${id}/temp-url`, { action });
    return response.data;
  }

  async deleteVideo(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/videos/${id}`);
    return response.data;
  }

  // Utility methods
  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString();
  }

  formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m ${seconds % 60}s`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

const apiService = new ApiService();
export default apiService;