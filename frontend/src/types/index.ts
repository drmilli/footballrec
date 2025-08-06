export interface Recording {
  id: string;
  title: string;
  description?: string;
  stream_url: string;
  status: 'pending' | 'recording' | 'completed' | 'failed' | 'stopped';
  file_path?: string;
  s3_key?: string;
  s3_url?: string;
  duration: number;
  file_size: number;
  format: string;
  quality: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  metadata?: Record<string, any>;
}

export interface Match {
  id: string;
  external_id?: string;
  home_team: string;
  away_team: string;
  competition?: string;
  match_date: string;
  status: 'scheduled' | 'live' | 'finished' | 'cancelled';
  stream_url?: string;
  recording_id?: string;
  auto_record: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface Schedule {
  id: string;
  match_id?: string;
  recording_id?: string;
  scheduled_start: string;
  scheduled_end?: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';
  cron_expression?: string;
  auto_generated: boolean;
  created_at: string;
  executed_at?: string;
  metadata?: Record<string, any>;
  // Joined fields
  home_team?: string;
  away_team?: string;
  competition?: string;
  recording_title?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  count?: number;
}

export interface VideoInfo {
  id: string;
  title: string;
  description?: string;
  duration: number;
  fileSize: number;
  format: string;
  quality: string;
  status: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  isAvailable: boolean;
  s3Info?: {
    size: number;
    lastModified: string;
    contentType: string;
  };
}

export interface StreamUrl {
  streamUrl: string;
  title: string;
  duration: number;
  format: string;
  quality: string;
  fileSize: number;
  expiresAt: string;
}

export interface DownloadUrl {
  downloadUrl: string;
  filename: string;
  fileSize: number;
  format: string;
  expiresAt: string;
}

export interface ActiveRecording {
  id: string;
  title: string;
  startTime: number;
  duration: number;
}

export interface RecordingFormData {
  title: string;
  description?: string;
  stream_url: string;
  quality: 'best' | 'good' | 'medium';
  format: 'mp4' | 'mkv' | 'ts';
}

export interface MatchFormData {
  home_team: string;
  away_team: string;
  competition?: string;
  match_date: string;
  stream_url?: string;
  auto_record: boolean;
}

export interface ScheduleFormData {
  match_id?: string;
  recording_id?: string;
  scheduled_start: string;
  scheduled_end?: string;
  cron_expression?: string;
}

export interface Stats {
  total_schedules: number;
  pending_schedules: number;
  active_schedules: number;
  completed_schedules: number;
  failed_schedules: number;
}

export interface Theme {
  palette: {
    mode: 'light' | 'dark';
    primary: {
      main: string;
    };
    secondary: {
      main: string;
    };
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface NotificationContextType {
  showNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

// Utility types
export type RecordingStatus = Recording['status'];
export type MatchStatus = Match['status'];
export type ScheduleStatus = Schedule['status'];

export interface TableColumn<T> {
  id: keyof T;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any) => string;
}

export interface FilterOptions {
  search?: string;
  status?: string;
  competition?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  page?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchResult<T> {
  results: T[];
  query: string;
  count: number;
}