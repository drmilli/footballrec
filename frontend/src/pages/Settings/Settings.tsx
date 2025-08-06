import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardHeader,
  TextField,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Divider,
  Alert,
  Tabs,
  Tab,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  VideoSettings as VideoIcon,
  Schedule as ScheduleIcon,
  Stream as StreamIcon,
  CloudUpload as CloudIcon,
  Storage as DatabaseIcon,
  Api as ApiIcon,
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '../../contexts/NotificationContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

interface SettingsData {
  recording: {
    defaultQuality: string;
    defaultFormat: string;
    autoStart: boolean;
    maxDuration: number;
    storageLocation: string;
  };
  notifications: {
    emailEnabled: boolean;
    pushEnabled: boolean;
    recordingStart: boolean;
    recordingComplete: boolean;
    recordingFailed: boolean;
    scheduleReminders: boolean;
  };
  storage: {
    s3Enabled: boolean;
    s3Bucket: string;
    s3Region: string;
    localPath: string;
    autoCleanup: boolean;
    retentionDays: number;
  };
  streaming: {
    bufferSize: number;
    timeout: number;
    retryAttempts: number;
    userAgent: string;
  };
  system: {
    logLevel: string;
    maxConcurrentRecordings: number;
    apiTimeout: number;
    debugMode: boolean;
  };
}

const Settings: React.FC = () => {
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  
  // State
  const [selectedTab, setSelectedTab] = useState(0);
  const [settings, setSettings] = useState<SettingsData>({
    recording: {
      defaultQuality: 'best',
      defaultFormat: 'mp4',
      autoStart: false,
      maxDuration: 7200, // 2 hours in seconds
      storageLocation: '/recordings',
    },
    notifications: {
      emailEnabled: true,
      pushEnabled: false,
      recordingStart: true,
      recordingComplete: true,
      recordingFailed: true,
      scheduleReminders: true,
    },
    storage: {
      s3Enabled: false,
      s3Bucket: '',
      s3Region: 'us-east-1',
      localPath: '/var/recordings',
      autoCleanup: false,
      retentionDays: 30,
    },
    streaming: {
      bufferSize: 8192,
      timeout: 30,
      retryAttempts: 3,
      userAgent: 'StreamRecorder/1.0',
    },
    system: {
      logLevel: 'info',
      maxConcurrentRecordings: 5,
      apiTimeout: 30,
      debugMode: false,
    },
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Simulated API calls (replace with actual API calls)
  const { data: systemInfo } = useQuery({
    queryKey: ['system-info'],
    queryFn: async () => ({
      version: '1.0.0',
      uptime: '2 days, 14 hours',
      totalRecordings: 156,
      totalSize: '45.2 GB',
      activeRecordings: 2,
      diskSpace: '78% used',
    }),
  });

  // Mutations
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: SettingsData) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return newSettings;
    },
    onSuccess: () => {
      showNotification('Settings saved successfully', 'success');
      setHasChanges(false);
    },
    onError: () => {
      showNotification('Failed to save settings', 'error');
    },
  });

  const resetSettingsMutation = useMutation({
    mutationFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {};
    },
    onSuccess: () => {
      showNotification('Settings reset to defaults', 'success');
      setHasChanges(false);
      setResetDialogOpen(false);
      // Reset to default values
      setSettings({
        recording: {
          defaultQuality: 'best',
          defaultFormat: 'mp4',
          autoStart: false,
          maxDuration: 7200,
          storageLocation: '/recordings',
        },
        notifications: {
          emailEnabled: true,
          pushEnabled: false,
          recordingStart: true,
          recordingComplete: true,
          recordingFailed: true,
          scheduleReminders: true,
        },
        storage: {
          s3Enabled: false,
          s3Bucket: '',
          s3Region: 'us-east-1',
          localPath: '/var/recordings',
          autoCleanup: false,
          retentionDays: 30,
        },
        streaming: {
          bufferSize: 8192,
          timeout: 30,
          retryAttempts: 3,
          userAgent: 'StreamRecorder/1.0',
        },
        system: {
          logLevel: 'info',
          maxConcurrentRecordings: 5,
          apiTimeout: 30,
          debugMode: false,
        },
      });
    },
    onError: () => {
      showNotification('Failed to reset settings', 'error');
    },
  });

  // Event handlers
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleSettingChange = (category: keyof SettingsData, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const handleReset = () => {
    setResetDialogOpen(true);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SettingsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Settings
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleReset}
            disabled={resetSettingsMutation.isPending}
          >
            Reset to Defaults
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!hasChanges || saveSettingsMutation.isPending}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      {/* Changes Alert */}
      {hasChanges && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have unsaved changes. Click "Save Changes" to apply them.
        </Alert>
      )}

      {/* System Info */}
      {systemInfo && (
        <Card sx={{ mb: 3 }}>
          <CardHeader title="System Information" />
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip icon={<InfoIcon />} label={`Version: ${systemInfo.version}`} />
              <Chip icon={<CheckIcon />} label={`Uptime: ${systemInfo.uptime}`} />
              <Chip icon={<DatabaseIcon />} label={`Recordings: ${systemInfo.totalRecordings}`} />
              <Chip icon={<StorageIcon />} label={`Storage: ${systemInfo.totalSize}`} />
              <Chip icon={<StreamIcon />} label={`Active: ${systemInfo.activeRecordings}`} />
              <Chip 
                icon={<WarningIcon />} 
                label={`Disk: ${systemInfo.diskSpace}`}
                color={systemInfo.diskSpace.includes('78%') ? 'warning' : 'default'}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Settings Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab icon={<VideoIcon />} label="Recording" />
          <Tab icon={<NotificationsIcon />} label="Notifications" />
          <Tab icon={<StorageIcon />} label="Storage" />
          <Tab icon={<StreamIcon />} label="Streaming" />
          <Tab icon={<SecurityIcon />} label="System" />
        </Tabs>
      </Box>

      {/* Recording Settings */}
      <TabPanel value={selectedTab} index={0}>
        <Card>
          <CardHeader title="Recording Settings" />
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Default Quality</InputLabel>
                <Select
                  value={settings.recording.defaultQuality}
                  label="Default Quality"
                  onChange={(e) => handleSettingChange('recording', 'defaultQuality', e.target.value)}
                >
                  <MenuItem value="best">Best Available</MenuItem>
                  <MenuItem value="1080p">1080p</MenuItem>
                  <MenuItem value="720p">720p</MenuItem>
                  <MenuItem value="480p">480p</MenuItem>
                  <MenuItem value="360p">360p</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Default Format</InputLabel>
                <Select
                  value={settings.recording.defaultFormat}
                  label="Default Format"
                  onChange={(e) => handleSettingChange('recording', 'defaultFormat', e.target.value)}
                >
                  <MenuItem value="mp4">MP4</MenuItem>
                  <MenuItem value="mkv">MKV</MenuItem>
                  <MenuItem value="ts">TS</MenuItem>
                  <MenuItem value="flv">FLV</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Max Duration (seconds)"
                type="number"
                value={settings.recording.maxDuration}
                onChange={(e) => handleSettingChange('recording', 'maxDuration', parseInt(e.target.value))}
                helperText={`Current: ${formatDuration(settings.recording.maxDuration)}`}
                fullWidth
              />

              <TextField
                label="Storage Location"
                value={settings.recording.storageLocation}
                onChange={(e) => handleSettingChange('recording', 'storageLocation', e.target.value)}
                fullWidth
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.recording.autoStart}
                    onChange={(e) => handleSettingChange('recording', 'autoStart', e.target.checked)}
                  />
                }
                label="Auto-start recordings for scheduled matches"
              />
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Notification Settings */}
      <TabPanel value={selectedTab} index={1}>
        <Card>
          <CardHeader title="Notification Settings" />
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Notification Channels</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.notifications.emailEnabled}
                          onChange={(e) => handleSettingChange('notifications', 'emailEnabled', e.target.checked)}
                        />
                      }
                      label="Email Notifications"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.notifications.pushEnabled}
                          onChange={(e) => handleSettingChange('notifications', 'pushEnabled', e.target.checked)}
                        />
                      }
                      label="Push Notifications"
                    />
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Recording Events</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.notifications.recordingStart}
                          onChange={(e) => handleSettingChange('notifications', 'recordingStart', e.target.checked)}
                        />
                      }
                      label="Recording Started"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.notifications.recordingComplete}
                          onChange={(e) => handleSettingChange('notifications', 'recordingComplete', e.target.checked)}
                        />
                      }
                      label="Recording Completed"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.notifications.recordingFailed}
                          onChange={(e) => handleSettingChange('notifications', 'recordingFailed', e.target.checked)}
                        />
                      }
                      label="Recording Failed"
                    />
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Schedule Events</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.scheduleReminders}
                        onChange={(e) => handleSettingChange('notifications', 'scheduleReminders', e.target.checked)}
                      />
                    }
                    label="Schedule Reminders"
                  />
                </AccordionDetails>
              </Accordion>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Storage Settings */}
      <TabPanel value={selectedTab} index={2}>
        <Card>
          <CardHeader title="Storage Settings" />
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Local Storage</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Local Storage Path"
                      value={settings.storage.localPath}
                      onChange={(e) => handleSettingChange('storage', 'localPath', e.target.value)}
                      fullWidth
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.storage.autoCleanup}
                          onChange={(e) => handleSettingChange('storage', 'autoCleanup', e.target.checked)}
                        />
                      }
                      label="Auto-cleanup old recordings"
                    />
                    {settings.storage.autoCleanup && (
                      <TextField
                        label="Retention Days"
                        type="number"
                        value={settings.storage.retentionDays}
                        onChange={(e) => handleSettingChange('storage', 'retentionDays', parseInt(e.target.value))}
                        helperText="Recordings older than this will be automatically deleted"
                      />
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Cloud Storage (S3)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.storage.s3Enabled}
                          onChange={(e) => handleSettingChange('storage', 's3Enabled', e.target.checked)}
                        />
                      }
                      label="Enable S3 Storage"
                    />
                    {settings.storage.s3Enabled && (
                      <>
                        <TextField
                          label="S3 Bucket Name"
                          value={settings.storage.s3Bucket}
                          onChange={(e) => handleSettingChange('storage', 's3Bucket', e.target.value)}
                          fullWidth
                        />
                        <FormControl fullWidth>
                          <InputLabel>AWS Region</InputLabel>
                          <Select
                            value={settings.storage.s3Region}
                            label="AWS Region"
                            onChange={(e) => handleSettingChange('storage', 's3Region', e.target.value)}
                          >
                            <MenuItem value="us-east-1">US East (N. Virginia)</MenuItem>
                            <MenuItem value="us-west-1">US West (N. California)</MenuItem>
                            <MenuItem value="us-west-2">US West (Oregon)</MenuItem>
                            <MenuItem value="eu-west-1">Europe (Ireland)</MenuItem>
                            <MenuItem value="eu-central-1">Europe (Frankfurt)</MenuItem>
                            <MenuItem value="ap-southeast-1">Asia Pacific (Singapore)</MenuItem>
                          </Select>
                        </FormControl>
                      </>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Streaming Settings */}
      <TabPanel value={selectedTab} index={3}>
        <Card>
          <CardHeader title="Streaming Settings" />
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Buffer Size (KB)"
                type="number"
                value={settings.streaming.bufferSize}
                onChange={(e) => handleSettingChange('streaming', 'bufferSize', parseInt(e.target.value))}
                helperText="Buffer size for stream processing"
                fullWidth
              />

              <TextField
                label="Connection Timeout (seconds)"
                type="number"
                value={settings.streaming.timeout}
                onChange={(e) => handleSettingChange('streaming', 'timeout', parseInt(e.target.value))}
                helperText="Timeout for stream connections"
                fullWidth
              />

              <TextField
                label="Retry Attempts"
                type="number"
                value={settings.streaming.retryAttempts}
                onChange={(e) => handleSettingChange('streaming', 'retryAttempts', parseInt(e.target.value))}
                helperText="Number of retry attempts for failed streams"
                fullWidth
              />

              <TextField
                label="User Agent"
                value={settings.streaming.userAgent}
                onChange={(e) => handleSettingChange('streaming', 'userAgent', e.target.value)}
                helperText="User agent string for stream requests"
                fullWidth
              />
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* System Settings */}
      <TabPanel value={selectedTab} index={4}>
        <Card>
          <CardHeader title="System Settings" />
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Log Level</InputLabel>
                <Select
                  value={settings.system.logLevel}
                  label="Log Level"
                  onChange={(e) => handleSettingChange('system', 'logLevel', e.target.value)}
                >
                  <MenuItem value="debug">Debug</MenuItem>
                  <MenuItem value="info">Info</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Max Concurrent Recordings"
                type="number"
                value={settings.system.maxConcurrentRecordings}
                onChange={(e) => handleSettingChange('system', 'maxConcurrentRecordings', parseInt(e.target.value))}
                helperText="Maximum number of simultaneous recordings"
                fullWidth
              />

              <TextField
                label="API Timeout (seconds)"
                type="number"
                value={settings.system.apiTimeout}
                onChange={(e) => handleSettingChange('system', 'apiTimeout', parseInt(e.target.value))}
                helperText="Timeout for API requests"
                fullWidth
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.system.debugMode}
                    onChange={(e) => handleSettingChange('system', 'debugMode', e.target.checked)}
                  />
                }
                label="Debug Mode (verbose logging)"
              />
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>Reset Settings</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset all settings to their default values? 
            This action cannot be undone and will overwrite all current settings.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => resetSettingsMutation.mutate()}
            color="error"
            variant="contained"
            disabled={resetSettingsMutation.isPending}
          >
            Reset All Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;