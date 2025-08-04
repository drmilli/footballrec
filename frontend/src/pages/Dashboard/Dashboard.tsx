import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Divider,
  Paper,
  ListItemButton,
} from '@mui/material';
import {
  VideoCall as RecordingIcon,
  SportsFootball as MatchIcon,
  Schedule as ScheduleIcon,
  VideoLibrary as VideoIcon,
  Stop as StopIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import apiService from '../../services/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  // Fetch dashboard data
  const { data: recordings, isLoading: recordingsLoading } = useQuery({
    queryKey: ['recordings'],
    queryFn: () => apiService.getRecordings({ limit: 5 }),
  });

  const { data: activeRecordings, refetch: refetchActive } = useQuery({
    queryKey: ['activeRecordings'],
    queryFn: () => apiService.getActiveRecordings(),
    refetchInterval: 5000,
  });

  const { data: upcomingMatches } = useQuery({
    queryKey: ['upcomingMatches'],
    queryFn: () => apiService.getUpcomingMatches(5),
  });

  const { data: videos } = useQuery({
    queryKey: ['videos'],
    queryFn: () => apiService.getVideos({ limit: 5 }),
  });

  const { data: scheduleStats } = useQuery({
    queryKey: ['scheduleStats'],
    queryFn: () => apiService.getScheduleStats(),
  });

  const handleStopRecording = async (id: string) => {
    try {
      await apiService.stopRecording(id);
      showNotification('Recording stopped successfully', 'success');
      refetchActive();
    } catch (error) {
      showNotification('Failed to stop recording', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recording':
        return 'error';
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m ${seconds % 60}s`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={() => window.location.reload()}
        >
          Refresh
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <RecordingIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Active Recordings
                </Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {activeRecordings?.data?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                currently recording
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MatchIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Upcoming Matches
                </Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {upcomingMatches?.data?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                upcoming
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ScheduleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Scheduled
                </Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {scheduleStats?.data?.pending_schedules || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <VideoIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Videos
                </Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {videos?.data?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                available
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Recordings */}
        {activeRecordings?.data && activeRecordings.data.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Active Recordings
                </Typography>
                <List>
                  {activeRecordings.data.map((recording, index) => (
                    <React.Fragment key={recording.id}>
                      <ListItem>
                        <ListItemIcon>
                          <RecordingIcon color="error" />
                        </ListItemIcon>
                        <ListItemText
                          primary={recording.title}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                              <Chip
                                label="recording"
                                color="error"
                                size="small"
                              />
                              {recording.startTime && (
                                <Typography variant="body2" color="text.secondary">
                                  Started: {new Date(recording.startTime).toLocaleTimeString()}
                                </Typography>
                              )}
                              {recording.duration > 0 && (
                                <Typography variant="body2" color="text.secondary">
                                  Duration: {formatDuration(recording.duration)}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress sx={{ width: 100, mr: 2 }} />
                          <IconButton
                            color="error"
                            onClick={() => handleStopRecording(recording.id)}
                            size="small"
                          >
                            <StopIcon />
                          </IconButton>
                        </Box>
                      </ListItem>
                      {activeRecordings.data && index < activeRecordings.data.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Recent Recordings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Recent Recordings
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/recordings')}
                >
                  View All
                </Button>
              </Box>
              {recordingsLoading ? (
                <LinearProgress />
              ) : (
                <List>
                  {recordings?.data?.slice(0, 5).map((recording, index) => (
                    <React.Fragment key={recording.id}>
                      <ListItemButton
                        onClick={() => navigate(`/recordings/${recording.id}`)}
                      >
                        <ListItemIcon>
                          <RecordingIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={recording.title}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Chip
                                label={recording.status}
                                color={getStatusColor(recording.status) as any}
                                size="small"
                              />
                              {recording.duration > 0 && (
                                <Typography variant="body2" color="text.secondary">
                                  {formatDuration(recording.duration)}
                                </Typography>
                              )}
                              {recording.file_size > 0 && (
                                <Typography variant="body2" color="text.secondary">
                                  {formatFileSize(recording.file_size)}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItemButton>
                      {recordings?.data && index < recordings.data.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                  {(!recordings?.data || recordings.data.length === 0) && (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                      No recordings yet
                    </Typography>
                  )}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Matches */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Upcoming Matches
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/matches')}
                >
                  View All
                </Button>
              </Box>
              <List>
                {upcomingMatches?.data?.slice(0, 5).map((match, index) => (
                  <React.Fragment key={match.id}>
                    <ListItemButton
                      onClick={() => navigate(`/matches/${match.id}`)}
                    >
                      <ListItemIcon>
                        <MatchIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${match.home_team} vs ${match.away_team}`}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(match.match_date).toLocaleDateString()} at{' '}
                              {new Date(match.match_date).toLocaleTimeString()}
                            </Typography>
                            {match.auto_record && (
                              <Chip label="Auto Record" color="success" size="small" />
                            )}
                            {match.competition && (
                              <Chip label={match.competition} variant="outlined" size="small" />
                            )}
                          </Box>
                        }
                      />
                    </ListItemButton>
                    {upcomingMatches?.data && index < upcomingMatches.data.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
                {(!upcomingMatches?.data || upcomingMatches.data.length === 0) && (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                    No upcoming matches
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/recordings/create')}
              >
                New Recording
              </Button>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => navigate('/matches/create')}
              >
                Add Match
              </Button>
              <Button
                variant="outlined"
                startIcon={<ScheduleIcon />}
                onClick={() => navigate('/schedules/create')}
              >
                Create Schedule
              </Button>
              <Button
                variant="outlined"
                startIcon={<VideoIcon />}
                onClick={() => navigate('/videos')}
              >
                Browse Videos
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;