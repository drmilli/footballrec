import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Select,
  LinearProgress,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '../../contexts/NotificationContext';
import apiService from '../../services/api';
import { Recording } from '../../types';

const Recordings: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch recordings
  const { data: recordings, isLoading, error, refetch } = useQuery({
    queryKey: ['recordings', searchTerm, statusFilter],
    queryFn: () => apiService.getRecordings({
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
  });

  // Mutations
  const startRecordingMutation = useMutation({
    mutationFn: (id: string) => apiService.startRecording(id),
    onSuccess: () => {
      showNotification('Recording started successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      queryClient.invalidateQueries({ queryKey: ['activeRecordings'] });
    },
    onError: () => {
      showNotification('Failed to start recording', 'error');
    },
  });

  const stopRecordingMutation = useMutation({
    mutationFn: (id: string) => apiService.stopRecording(id),
    onSuccess: () => {
      showNotification('Recording stopped successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      queryClient.invalidateQueries({ queryKey: ['activeRecordings'] });
    },
    onError: () => {
      showNotification('Failed to stop recording', 'error');
    },
  });

  const deleteRecordingMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteRecording(id),
    onSuccess: () => {
      showNotification('Recording deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      setDeleteDialogOpen(false);
      setSelectedRecording(null);
    },
    onError: () => {
      showNotification('Failed to delete recording', 'error');
    },
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, recording: Recording) => {
    setAnchorEl(event.currentTarget);
    setSelectedRecording(recording);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRecording(null);
  };

  const handleStartRecording = (id: string) => {
    startRecordingMutation.mutate(id);
    handleMenuClose();
  };

  const handleStopRecording = (id: string) => {
    stopRecordingMutation.mutate(id);
    handleMenuClose();
  };

  const handleDeleteRecording = () => {
    if (selectedRecording) {
      deleteRecordingMutation.mutate(selectedRecording.id);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const downloadUrl = await apiService.getDownloadUrl(id);
      window.open(downloadUrl.url, '_blank');
    } catch (error) {
      showNotification('Failed to generate download URL', 'error');
    }
    handleMenuClose();
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
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load recordings. Please try again.
        </Alert>
        <Button variant="outlined" onClick={() => refetch()}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Recordings
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/recordings/new')}
          >
            New Recording
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="Search recordings"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="recording">Recording</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Recordings Table */}
      <Card>
        <CardContent>
          {isLoading ? (
            <LinearProgress />
          ) : recordings && recordings.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>File Size</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recordings.map((recording) => (
                    <TableRow key={recording.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" noWrap>
                            {recording.title}
                          </Typography>
                          {recording.description && (
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {recording.description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={recording.status}
                          color={getStatusColor(recording.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {recording.duration > 0 ? formatDuration(recording.duration) : '-'}
                      </TableCell>
                      <TableCell>
                        {recording.file_size > 0 ? formatFileSize(recording.file_size) : '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(recording.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/recordings/${recording.id}`)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, recording)}
                          >
                            <MoreIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No recordings found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create your first recording to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/recordings/new')}
              >
                Create Recording
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedRecording?.status === 'pending' && (
          <MenuItem onClick={() => handleStartRecording(selectedRecording.id)}>
            <PlayIcon sx={{ mr: 1 }} />
            Start Recording
          </MenuItem>
        )}
        {selectedRecording?.status === 'recording' && (
          <MenuItem onClick={() => handleStopRecording(selectedRecording.id)}>
            <StopIcon sx={{ mr: 1 }} />
            Stop Recording
          </MenuItem>
        )}
        {selectedRecording?.status === 'completed' && selectedRecording?.s3_url && (
          <MenuItem onClick={() => handleDownload(selectedRecording.id)}>
            <DownloadIcon sx={{ mr: 1 }} />
            Download
          </MenuItem>
        )}
        <MenuItem onClick={() => setDeleteDialogOpen(true)}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Recording</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedRecording?.title}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteRecording}
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

export default Recordings;