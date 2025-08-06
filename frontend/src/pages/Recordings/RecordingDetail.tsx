import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  Divider,
  IconButton,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Paper,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  VideoLibrary as VideoIcon,
  Schedule as ScheduleIcon,
  CloudUpload as CloudIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '../../contexts/NotificationContext';
import apiService from '../../services/api';

const RecordingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch recording details
  const { data: recording, isLoading, error, refetch } = useQuery({
    queryKey: ['recording', id],
    queryFn: () => apiService.getRecordingById(id!),
    enabled: !!id,
  });

  // Mutations
  const startRecordingMutation = useMutation({
    mutationFn: () => apiService.startRecording(id!),
    onSuccess: () => {
      showNotification('Recording started successfully', 'success');
      refetch();
    },
    onError: () => {
      showNotification('Failed to start recording', 'error');
    },
  });

  const stopRecordingMutation = useMutation({
    mutationFn: () => apiService.stopRecording(id!),
    onSuccess: () => {
      showNotification('Recording stopped successfully', 'success');
      refetch();
    },
    onError: () => {
      showNotification('Failed to stop recording', 'error');
    },
  });

  const deleteRecordingMutation = useMutation({
    mutationFn: () => apiService.deleteRecording(id!),
    onSuccess: () => {
      showNotification('Recording deleted successfully', 'success');
      navigate('/recordings');
    },
    onError: () => {
      showNotification('Failed to delete recording', 'error');
    },
  });

  const handleDownload = async () => {
    try {
      const downloadUrl = await apiService.getDownloadUrl(id!);
      window.open(downloadUrl.url, '_blank');
    } catch (error) {
      showNotification('Failed to generate download URL', 'error');
    }
  };

  const handlePlayVideo = async () => {
    try {
      navigate(`/videos/${id}/player`);
    } catch (error) {
      showNotification('Failed to open video player', 'error');
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

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (error) {
    return (
      <Box>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/recordings')}
          sx={{ mb: 2 }}
        >
          Back to Recordings
        </Button>
        <Alert severity="error">
          Failed to load recording details. Please try again.
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/recordings')}
          sx={{ mb: 2 }}
        >
          Back to Recordings
        </Button>
        <LinearProgress />
      </Box>
    );
  }

  if (!recording) {
    return (
      <Box>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/recordings')}
          sx={{ mb: 2 }}
        >
          Back to Recordings
        </Button>
        <Alert severity="warning">
          Recording not found.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/recordings')}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {recording.title}
          </Typography>
          <Chip
            label={recording.status}
            color={getStatusColor(recording.status)}
            size="medium"
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          {recording.status === 'pending' && (
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={() => startRecordingMutation.mutate()}
              disabled={startRecordingMutation.isPending}
            >
              Start Recording
            </Button>
          )}
          {recording.status === 'recording' && (
            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={() => stopRecordingMutation.mutate()}
              disabled={stopRecordingMutation.isPending}
            >
              Stop Recording
            </Button>
          )}
          {recording.status === 'completed' && recording.s3_url && (
            <>
              <Button
                variant="outlined"
                startIcon={<VideoIcon />}
                onClick={handlePlayVideo}
              >
                Play Video
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
              >
                Download
              </Button>
            </>
          )}
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Recording Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recording Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Title
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {recording.title}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={recording.status}
                    color={getStatusColor(recording.status)}
                    size="small"
                  />
                </Grid>
                {recording.description && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {recording.description}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Stream URL
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {recording.stream_url}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Technical Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Format
                  </Typography>
                  <Typography variant="body1">
                    {recording.format || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Quality
                  </Typography>
                  <Typography variant="body1">
                    {recording.quality || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="body1">
                    {recording.duration > 0 ? formatDuration(recording.duration) : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    File Size
                  </Typography>
                  <Typography variant="body1">
                    {recording.file_size > 0 ? formatFileSize(recording.file_size) : 'N/A'}
                  </Typography>
                </Grid>
                {recording.file_path && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      File Path
                    </Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                      {recording.file_path}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Error Information */}
          {recording.error_message && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="error">
                  Error Details
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                  <Typography variant="body2">
                    {recording.error_message}
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Timeline */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Timeline
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Created"
                    secondary={new Date(recording.created_at).toLocaleString()}
                  />
                </ListItem>
                {recording.started_at && (
                  <ListItem>
                    <ListItemText
                      primary="Started"
                      secondary={new Date(recording.started_at).toLocaleString()}
                    />
                  </ListItem>
                )}
                {recording.completed_at && (
                  <ListItem>
                    <ListItemText
                      primary="Completed"
                      secondary={new Date(recording.completed_at).toLocaleString()}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Storage Information */}
          {recording.s3_url && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <CloudIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Cloud Storage
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  This recording is stored in the cloud and available for download.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                  fullWidth
                >
                  Download from Cloud
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Recording</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{recording.title}"?
            This action cannot be undone and will remove all associated files.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => deleteRecordingMutation.mutate()}
            color="error"
            disabled={deleteRecordingMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecordingDetail;