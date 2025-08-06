import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
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
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNotification } from '../../contexts/NotificationContext';
import apiService from '../../services/api';

const RecordingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
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
      const response = await apiService.getDownloadUrl(id!);
      if (response.success && response.data) {
        window.open(response.data.downloadUrl, '_blank');
      } else {
        throw new Error(response.error || 'Failed to get download URL');
      }
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

  if (!recording || !recording.success || !recording.data) {
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

  const recordingData = recording.data;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/recordings')}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {recordingData.title}
          </Typography>
          <Chip
            label={recordingData.status}
            color={getStatusColor(recordingData.status)}
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
          {recordingData.status === 'pending' && (
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={() => startRecordingMutation.mutate()}
              disabled={startRecordingMutation.isPending}
            >
              Start Recording
            </Button>
          )}
          {recordingData.status === 'recording' && (
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
          {recordingData.status === 'completed' && recordingData.s3_url && (
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

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Recording Information */}
        <Box sx={{ flex: 2 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recording Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Title
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {recordingData.title}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={recordingData.status}
                    color={getStatusColor(recordingData.status)}
                    size="small"
                  />
                </Box>
                {recordingData.description && (
                  <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {recordingData.description}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Stream URL
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {recordingData.stream_url}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Technical Details
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Format
                  </Typography>
                  <Typography variant="body1">
                    {recordingData.format || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Quality
                  </Typography>
                  <Typography variant="body1">
                    {recordingData.quality || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="body1">
                    {recordingData.duration > 0 ? formatDuration(recordingData.duration) : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    File Size
                  </Typography>
                  <Typography variant="body1">
                    {recordingData.file_size > 0 ? formatFileSize(recordingData.file_size) : 'N/A'}
                  </Typography>
                </Box>
                {recordingData.file_path && (
                  <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      File Path
                    </Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                      {recordingData.file_path}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Error Information */}
          {recordingData.error_message && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="error">
                  Error Details
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                  <Typography variant="body2">
                    {recordingData.error_message}
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Timeline */}
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Timeline
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Created"
                    secondary={new Date(recordingData.created_at).toLocaleString()}
                  />
                </ListItem>
                {recordingData.started_at && (
                  <ListItem>
                    <ListItemText
                      primary="Started"
                      secondary={new Date(recordingData.started_at).toLocaleString()}
                    />
                  </ListItem>
                )}
                {recordingData.completed_at && (
                  <ListItem>
                    <ListItemText
                      primary="Completed"
                      secondary={new Date(recordingData.completed_at).toLocaleString()}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Storage Information */}
          {recordingData.s3_url && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Storage
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="S3 Storage"
                      secondary="Available in cloud storage"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{recordingData.title}"?
            This action cannot be undone and will remove all associated files.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              deleteRecordingMutation.mutate();
              setDeleteDialogOpen(false);
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecordingDetail;