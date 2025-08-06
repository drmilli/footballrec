import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  YouTube as YouTubeIcon,
  Sports as SportsIcon,
  LiveTv as LiveTvIcon,
  Public as PublicIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  VideoCall as RecordIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import apiService from '../../services/api';

interface StreamSource {
  id: string;
  name: string;
  status: string;
  hasApiKey: boolean;
}

interface Stream {
  id: string;
  title: string;
  url: string;
  quality: string[];
  status: string;
  source: string;
  competition?: string;
  teams?: string[];
  channel?: string;
  thumbnail?: string;
}

const StreamSources: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [recordingTitle, setRecordingTitle] = useState('');
  const [recordingDescription, setRecordingDescription] = useState('');
  const [recordingQuality, setRecordingQuality] = useState('best');

  // Fetch stream sources
  const { data: sources, isLoading: sourcesLoading } = useQuery({
    queryKey: ['streamSources'],
    queryFn: () => apiService.getStreamSources(),
  });

  // Fetch live streams
  const { data: liveStreams, isLoading: streamsLoading, refetch: refetchStreams } = useQuery({
    queryKey: ['liveStreams', selectedSource],
    queryFn: () => 
      selectedSource === 'all' 
        ? apiService.getAllLiveStreams()
        : apiService.getStreamsBySource(selectedSource),
    enabled: selectedTab === 1,
  });

  // Test source connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: (sourceId: string) => apiService.testStreamSource(sourceId),
    onSuccess: (data, sourceId) => {
      const status = data.data.status;
      const message = status === 'connected' 
        ? `${sourceId} connection successful`
        : `${sourceId} connection failed: ${data.data.message}`;
      
      showNotification(message, status === 'connected' ? 'success' : 'error');
      queryClient.invalidateQueries({ queryKey: ['streamSources'] });
    },
    onError: (error, sourceId) => {
      showNotification(`Failed to test ${sourceId} connection`, 'error');
    },
  });

  // Create recording from stream mutation
  const createRecordingMutation = useMutation({
    mutationFn: (recordingData: any) => apiService.createRecording(recordingData),
    onSuccess: (data) => {
      showNotification('Recording created successfully', 'success');
      setRecordDialogOpen(false);
      setSelectedStream(null);
      setRecordingTitle('');
      setRecordingDescription('');
      if (data.success && data.data) {
        navigate(`/recordings/${data.data.id}`);
      }
    },
    onError: () => {
      showNotification('Failed to create recording', 'error');
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleTestConnection = (sourceId: string) => {
    testConnectionMutation.mutate(sourceId);
  };

  const handleRecordStream = (stream: Stream) => {
    setSelectedStream(stream);
    setRecordingTitle(stream.title);
    setRecordingDescription(`Recording from ${stream.source}: ${stream.title}`);
    setRecordDialogOpen(true);
  };

  const handleCreateRecording = () => {
    if (!selectedStream) return;

    const recordingData = {
      title: recordingTitle,
      description: recordingDescription,
      stream_url: selectedStream.url,
      quality: recordingQuality,
      format: 'mp4',
    };

    createRecordingMutation.mutate(recordingData);
  };

  const getSourceIcon = (sourceId: string) => {
    switch (sourceId) {
      case 'youtube':
        return <YouTubeIcon color="error" />;
      case 'supersport':
        return <SportsIcon color="primary" />;
      case 'fifa':
        return <PublicIcon color="success" />;
      case 'caftv':
        return <LiveTvIcon color="warning" />;
      default:
        return <LiveTvIcon />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'configured':
      case 'connected':
        return <CheckIcon color="success" />;
      case 'not_configured':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <WarningIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'configured':
      case 'connected':
        return 'success';
      case 'not_configured':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Stream Sources
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['streamSources'] });
            refetchStreams();
          }}
        >
          Refresh All
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label="Sources" />
          <Tab label="Live Streams" />
        </Tabs>
      </Box>

      {/* Sources Tab */}
      {selectedTab === 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {sourcesLoading ? (
            <Box sx={{ width: '100%' }}>
              <LinearProgress />
            </Box>
          ) : sources && sources.length > 0 ? (
            sources.map((source: StreamSource) => (
              <Box key={source.id} sx={{ flexBasis: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' } }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {getSourceIcon(source.id)}
                      <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
                        {source.name}
                      </Typography>
                      {getStatusIcon(source.status)}
                    </Box>
                    
                    <Chip
                      label={source.status}
                      color={getStatusColor(source.status)}
                      size="small"
                      sx={{ mb: 2 }}
                    />
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {source.hasApiKey 
                        ? 'API key configured' 
                        : 'API key required for full functionality'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleTestConnection(source.id)}
                        disabled={testConnectionMutation.isPending}
                      >
                        Test Connection
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                          setSelectedSource(source.id);
                          setSelectedTab(1);
                        }}
                      >
                        View Streams
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))
          ) : (
            <Box sx={{ width: '100%' }}>
              <Alert severity="info">
                No stream sources available. Please check your configuration.
              </Alert>
            </Box>
          )}
        </Box>
      )}

      {/* Live Streams Tab */}
      {selectedTab === 1 && (
        <Box>
          {/* Source Filter */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Source</InputLabel>
                  <Select
                    value={selectedSource}
                    label="Source"
                    onChange={(e) => setSelectedSource(e.target.value)}
                  >
                    <MenuItem value="all">All Sources</MenuItem>
                    <MenuItem value="supersport">SuperSport</MenuItem>
                    <MenuItem value="youtube">YouTube Live Sport</MenuItem>
                    <MenuItem value="fifa">FIFA+</MenuItem>
                    <MenuItem value="caftv">CAF TV</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => refetchStreams()}
                  disabled={streamsLoading}
                >
                  Refresh Streams
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Streams List */}
          {streamsLoading ? (
            <LinearProgress />
          ) : liveStreams && liveStreams.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {liveStreams.map((stream: Stream) => (
                <Box key={stream.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            {getSourceIcon(stream.source)}
                            <Typography variant="h6" sx={{ ml: 1 }}>
                              {stream.title}
                            </Typography>
                            <Chip
                              label={stream.status}
                              color={stream.status === 'live' ? 'error' : 'default'}
                              size="small"
                              sx={{ ml: 2 }}
                            />
                          </Box>
                          
                          {stream.competition && (
                            <Typography variant="body2" color="text.secondary">
                              {stream.competition}
                            </Typography>
                          )}
                          
                          {stream.teams && stream.teams.length > 0 && (
                            <Typography variant="body2" color="text.secondary">
                              {stream.teams.join(' vs ')}
                            </Typography>
                          )}
                          
                          {stream.channel && (
                            <Typography variant="body2" color="text.secondary">
                              Channel: {stream.channel}
                            </Typography>
                          )}
                          
                          <Typography variant="caption" color="text.secondary">
                            Quality: {stream.quality.join(', ')}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            color="primary"
                            onClick={() => window.open(stream.url, '_blank')}
                            title="Open Stream"
                          >
                            <PlayIcon />
                          </IconButton>
                          <IconButton
                            color="secondary"
                            onClick={() => handleRecordStream(stream)}
                            title="Record Stream"
                          >
                            <RecordIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          ) : (
            <Alert severity="info">
              No live streams available from the selected source.
            </Alert>
          )}
        </Box>
      )}

      {/* Record Stream Dialog */}
      <Dialog open={recordDialogOpen} onClose={() => setRecordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Recording from Stream</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Recording Title"
              value={recordingTitle}
              onChange={(e) => setRecordingTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={recordingDescription}
              onChange={(e) => setRecordingDescription(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Quality</InputLabel>
              <Select
                value={recordingQuality}
                label="Quality"
                onChange={(e) => setRecordingQuality(e.target.value)}
              >
                <MenuItem value="best">Best Available</MenuItem>
                <MenuItem value="1080p">1080p</MenuItem>
                <MenuItem value="720p">720p</MenuItem>
                <MenuItem value="480p">480p</MenuItem>
                <MenuItem value="auto">Auto</MenuItem>
              </Select>
            </FormControl>
            
            {selectedStream && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Stream URL: {selectedStream.url}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecordDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateRecording}
            variant="contained"
            disabled={!recordingTitle.trim() || createRecordingMutation.isPending}
          >
            Create Recording
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StreamSources;