import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Menu,
  MenuList,
  MenuItem as MenuItemComponent,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Tooltip,
  Paper,
  Avatar,
} from '@mui/material';
import {
  VideoLibrary as VideoIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  PlayArrow as PlayIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Refresh as RefreshIcon,
  ViewList as ListIcon,
  ViewModule as GridIcon,
  Fullscreen as FullscreenIcon,
  Share as ShareIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  Storage as StorageIcon,
  HighQuality as QualityIcon,
  AccessTime as DurationIcon,
  CalendarToday as DateIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '../../contexts/NotificationContext';
import apiService from '../../services/api';
import { Recording } from '../../types';

const Videos: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  
  // State
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [qualityFilter, setQualityFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVideo, setSelectedVideo] = useState<Recording | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 12;

  // Fetch videos
  const { data: videosResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['videos', page, searchTerm, statusFilter, qualityFilter],
    queryFn: () => apiService.getVideos({
      page,
      limit: itemsPerPage,
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      quality: qualityFilter !== 'all' ? qualityFilter : undefined,
    }),
  });

  const videos = videosResponse?.success ? videosResponse.data : [];
  const totalPages = Math.ceil((videosResponse?.pagination?.totalCount || 0) / itemsPerPage);

  // Mutations
  const deleteVideoMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteVideo(id),
    onSuccess: () => {
      showNotification('Video deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      setDeleteDialogOpen(false);
      setSelectedVideo(null);
    },
    onError: () => {
      showNotification('Failed to delete video', 'error');
    },
  });

  const downloadVideoMutation = useMutation({
    mutationFn: (id: string) => apiService.downloadVideo(id),
    onSuccess: (response) => {
      if (response.success && response.data) {
        window.open(response.data.downloadUrl, '_blank');
        showNotification('Download started', 'success');
      }
    },
    onError: () => {
      showNotification('Failed to start download', 'error');
    },
  });

  // Event handlers
  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, video: Recording) => {
    setAnchorEl(event.currentTarget);
    setSelectedVideo(video);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedVideo(null);
  };

  const handlePlay = (video: Recording) => {
    navigate(`/videos/${video.id}/player`);
    handleMenuClose();
  };

  const handleDownload = (video: Recording) => {
    downloadVideoMutation.mutate(video.id);
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleShare = (video: Recording) => {
    const shareUrl = `${window.location.origin}/videos/${video.id}`;
    navigator.clipboard.writeText(shareUrl);
    showNotification('Share link copied to clipboard', 'success');
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'recording':
        return 'error';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getVideoThumbnail = (video: Recording) => {
    // Generate a placeholder thumbnail based on video title
    const colors = ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2', '#0288d1'];
    const colorIndex = video.id.charCodeAt(0) % colors.length;
    return colors[colorIndex];
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load videos. Please try again.
        </Alert>
        <Button variant="contained" onClick={() => refetch()}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <VideoIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Video Library
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={viewMode === 'grid' ? 'List View' : 'Grid View'}>
            <IconButton
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <ListIcon /> : <GridIcon />}
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search videos..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
              }}
              sx={{ minWidth: 250 }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </Box>

          {showFilters && (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="recording">Recording</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Quality</InputLabel>
                <Select
                  value={qualityFilter}
                  label="Quality"
                  onChange={(e) => setQualityFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="1080p">1080p</MenuItem>
                  <MenuItem value="720p">720p</MenuItem>
                  <MenuItem value="480p">480p</MenuItem>
                  <MenuItem value="360p">360p</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Videos Content */}
      {isLoading ? (
        <LinearProgress />
      ) : videos && videos.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            /* Grid View */
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: '1fr', 
                sm: 'repeat(2, 1fr)', 
                md: 'repeat(3, 1fr)', 
                lg: 'repeat(4, 1fr)' 
              }, 
              gap: 3,
              mb: 3 
            }}>
              {videos.map((video) => (
                <Card key={video.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      sx={{ 
                        height: 200, 
                        bgcolor: getVideoThumbnail(video),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}
                    >
                      <Avatar
                        sx={{ 
                          width: 64, 
                          height: 64, 
                          bgcolor: 'rgba(255,255,255,0.2)',
                          cursor: 'pointer'
                        }}
                        onClick={() => handlePlay(video)}
                      >
                        <PlayIcon sx={{ fontSize: 32, color: 'white' }} />
                      </Avatar>
                    </CardMedia>
                    <Box sx={{ 
                      position: 'absolute', 
                      top: 8, 
                      right: 8,
                      display: 'flex',
                      gap: 1
                    }}>
                      <Chip
                        label={video.status}
                        color={getStatusColor(video.status)}
                        size="small"
                      />
                      {video.duration > 0 && (
                        <Chip
                          icon={<DurationIcon sx={{ fontSize: 14 }} />}
                          label={formatDuration(video.duration)}
                          size="small"
                          variant="outlined"
                          sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white' }}
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="div" noWrap>
                      {video.title}
                    </Typography>
                    {video.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {video.description}
                      </Typography>
                    )}
                    
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip
                        icon={<QualityIcon sx={{ fontSize: 14 }} />}
                        label={video.quality}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<StorageIcon sx={{ fontSize: 14 }} />}
                        label={formatFileSize(video.file_size)}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<DateIcon sx={{ fontSize: 14 }} />}
                        label={formatDate(video.created_at)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<PlayIcon />}
                      onClick={() => handlePlay(video)}
                    >
                      Play
                    </Button>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, video)}
                    >
                      <MoreIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              ))}
            </Box>
          ) : (
            /* List View */
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              {videos.map((video) => (
                <Paper key={video.id} sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{ 
                        width: 64, 
                        height: 64, 
                        bgcolor: getVideoThumbnail(video),
                        cursor: 'pointer'
                      }}
                      onClick={() => handlePlay(video)}
                    >
                      <PlayIcon sx={{ fontSize: 24, color: 'white' }} />
                    </Avatar>
                    
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" noWrap>
                        {video.title}
                      </Typography>
                      {video.description && (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {video.description}
                        </Typography>
                      )}
                      <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={video.status}
                          color={getStatusColor(video.status)}
                          size="small"
                        />
                        <Chip
                          icon={<QualityIcon sx={{ fontSize: 14 }} />}
                          label={video.quality}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          icon={<DurationIcon sx={{ fontSize: 14 }} />}
                          label={formatDuration(video.duration)}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          icon={<StorageIcon sx={{ fontSize: 14 }} />}
                          label={formatFileSize(video.file_size)}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          icon={<DateIcon sx={{ fontSize: 14 }} />}
                          label={formatDate(video.created_at)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<PlayIcon />}
                        onClick={() => handlePlay(video)}
                      >
                        Play
                      </Button>
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, video)}
                      >
                        <MoreIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <VideoIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No videos found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {searchTerm || statusFilter !== 'all' || qualityFilter !== 'all'
              ? 'Try adjusting your search criteria'
              : 'Start recording to build your video library'
            }
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/recordings/new')}
          >
            Create Recording
          </Button>
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuList>
          <MenuItemComponent onClick={() => selectedVideo && handlePlay(selectedVideo)}>
            <PlayIcon sx={{ mr: 1, fontSize: 20 }} />
            Play
          </MenuItemComponent>
          <MenuItemComponent onClick={() => selectedVideo && handlePlay(selectedVideo)}>
            <FullscreenIcon sx={{ mr: 1, fontSize: 20 }} />
            Fullscreen
          </MenuItemComponent>
          <MenuItemComponent onClick={() => selectedVideo && handleDownload(selectedVideo)}>
            <DownloadIcon sx={{ mr: 1, fontSize: 20 }} />
            Download
          </MenuItemComponent>
          <MenuItemComponent onClick={() => selectedVideo && handleShare(selectedVideo)}>
            <ShareIcon sx={{ mr: 1, fontSize: 20 }} />
            Share
          </MenuItemComponent>
          <MenuItemComponent onClick={() => {
            if (selectedVideo) {
              navigate(`/recordings/${selectedVideo.id}`);
            }
            handleMenuClose();
          }}>
            <InfoIcon sx={{ mr: 1, fontSize: 20 }} />
            Details
          </MenuItemComponent>
          <MenuItemComponent onClick={handleDelete} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
            Delete
          </MenuItemComponent>
        </MenuList>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedVideo?.title}"?
            This action cannot be undone and will remove the video file permanently.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (selectedVideo) {
                deleteVideoMutation.mutate(selectedVideo.id);
              }
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

export default Videos;