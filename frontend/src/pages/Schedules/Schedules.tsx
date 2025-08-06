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
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
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
  Tabs,
  Tab,
  Paper,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Schedule as ScheduleIcon,
  CalendarToday as CalendarIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Refresh as RefreshIcon,
  EventAvailable as ActiveIcon,
  EventBusy as InactiveIcon,
  CheckCircle as CompletedIcon,
  Error as FailedIcon,
  AccessTime as PendingIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '../../contexts/NotificationContext';
import apiService from '../../services/api';
import { Schedule } from '../../types';

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
      id={`schedules-tabpanel-${index}`}
      aria-labelledby={`schedules-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const Schedules: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  
  // State
  const [selectedTab, setSelectedTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch schedules
  const { data: schedulesResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['schedules', page, rowsPerPage, statusFilter],
    queryFn: () => apiService.getSchedules({
      page: page + 1,
      limit: rowsPerPage,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
  });

  // Fetch upcoming schedules
  const { data: upcomingResponse, isLoading: upcomingLoading } = useQuery({
    queryKey: ['schedules', 'upcoming'],
    queryFn: () => apiService.getUpcomingSchedules(10),
  });

  // Fetch active schedules
  const { data: activeResponse, isLoading: activeLoading } = useQuery({
    queryKey: ['schedules', 'active'],
    queryFn: () => apiService.getActiveSchedules(),
  });

  // Fetch schedule stats
  const { data: statsResponse } = useQuery({
    queryKey: ['schedules', 'stats'],
    queryFn: () => apiService.getScheduleStats(),
  });

  const schedules = schedulesResponse?.success ? schedulesResponse.data : [];
  const totalCount = schedulesResponse?.pagination?.totalCount || 0;
  const upcomingSchedules = upcomingResponse?.success ? upcomingResponse.data : [];
  const activeSchedules = activeResponse?.success ? activeResponse.data : [];
  const stats = statsResponse?.success ? statsResponse.data : null;

  // Mutations
  const deleteScheduleMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteSchedule(id),
    onSuccess: () => {
      showNotification('Schedule deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setDeleteDialogOpen(false);
      setSelectedSchedule(null);
    },
    onError: () => {
      showNotification('Failed to delete schedule', 'error');
    },
  });

  const executeScheduleMutation = useMutation({
    mutationFn: (id: string) => apiService.executeSchedule(id),
    onSuccess: () => {
      showNotification('Schedule executed successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: () => {
      showNotification('Failed to execute schedule', 'error');
    },
  });

  // Event handlers
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, schedule: Schedule) => {
    setAnchorEl(event.currentTarget);
    setSelectedSchedule(schedule);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSchedule(null);
  };

  const handleEdit = () => {
    if (selectedSchedule) {
      navigate(`/schedules/${selectedSchedule.id}/edit`);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleExecute = () => {
    if (selectedSchedule) {
      executeScheduleMutation.mutate(selectedSchedule.id);
    }
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <ActiveIcon sx={{ fontSize: 16 }} />;
      case 'completed':
        return <CompletedIcon sx={{ fontSize: 16 }} />;
      case 'pending':
        return <PendingIcon sx={{ fontSize: 16 }} />;
      case 'failed':
        return <FailedIcon sx={{ fontSize: 16 }} />;
      default:
        return <InactiveIcon sx={{ fontSize: 16 }} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMs < 0) {
      return 'Past due';
    } else if (diffMins < 60) {
      return `in ${diffMins} minutes`;
    } else if (diffHours < 24) {
      return `in ${diffHours} hours`;
    } else {
      return `in ${diffDays} days`;
    }
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load schedules. Please try again.
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
          <ScheduleIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Schedules
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/schedules/new')}
          >
            Add Schedule
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Card sx={{ minWidth: 150 }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total Schedules
              </Typography>
              <Typography variant="h4">
                {stats.total_schedules}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 150 }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Active
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.active_schedules}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 150 }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Pending
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.pending_schedules}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 150 }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Completed
              </Typography>
              <Typography variant="h4" color="info.main">
                {stats.completed_schedules}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label="All Schedules" />
          <Tab label="Upcoming" />
          <Tab label="Active" />
        </Tabs>
      </Box>

      {/* All Schedules Tab */}
      <TabPanel value={selectedTab} index={0}>
        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters
              </Button>
              {showFilters && (
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Schedules Table */}
        <Card>
          <CardContent>
            {isLoading ? (
              <LinearProgress />
            ) : schedules && schedules.length > 0 ? (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Schedule</TableCell>
                        <TableCell>Match/Recording</TableCell>
                        <TableCell>Scheduled Start</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Auto Generated</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {schedules.map((schedule) => (
                        <TableRow key={schedule.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                Schedule #{schedule.id.substring(0, 8)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              {schedule.home_team && schedule.away_team ? (
                                <Typography variant="subtitle2" noWrap>
                                  {schedule.home_team} vs {schedule.away_team}
                                </Typography>
                              ) : (
                                <Typography variant="subtitle2" noWrap>
                                  {schedule.recording_title || 'Recording'}
                                </Typography>
                              )}
                              {schedule.competition && (
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  {schedule.competition}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(schedule.scheduled_start)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatRelativeTime(schedule.scheduled_start)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(schedule.status)}
                              label={schedule.status}
                              color={getStatusColor(schedule.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={schedule.auto_generated ? 'Auto' : 'Manual'}
                              variant={schedule.auto_generated ? 'filled' : 'outlined'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              onClick={(e) => handleMenuOpen(e, schedule)}
                              size="small"
                            >
                              <MoreIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={totalCount}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ScheduleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No schedules found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Create your first schedule to get started
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/schedules/new')}
                >
                  Add Schedule
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Upcoming Schedules Tab */}
      <TabPanel value={selectedTab} index={1}>
        <Card>
          <CardHeader title="Upcoming Schedules" />
          <CardContent>
            {upcomingLoading ? (
              <LinearProgress />
            ) : upcomingSchedules && upcomingSchedules.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {upcomingSchedules.map((schedule) => (
                  <Paper key={schedule.id} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1">
                          {schedule.home_team && schedule.away_team
                            ? `${schedule.home_team} vs ${schedule.away_team}`
                            : schedule.recording_title || 'Recording'
                          }
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(schedule.scheduled_start)} • {formatRelativeTime(schedule.scheduled_start)}
                        </Typography>
                        {schedule.competition && (
                          <Typography variant="body2" color="text.secondary">
                            {schedule.competition}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          icon={getStatusIcon(schedule.status)}
                          label={schedule.status}
                          color={getStatusColor(schedule.status)}
                          size="small"
                        />
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, schedule)}
                          size="small"
                        >
                          <MoreIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ScheduleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No upcoming schedules
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All schedules are completed or there are no schedules created yet.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Active Schedules Tab */}
      <TabPanel value={selectedTab} index={2}>
        <Card>
          <CardHeader title="Active Schedules" />
          <CardContent>
            {activeLoading ? (
              <LinearProgress />
            ) : activeSchedules && activeSchedules.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {activeSchedules.map((schedule) => (
                  <Paper key={schedule.id} sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ActiveIcon />
                          <Typography variant="subtitle1">
                            {schedule.home_team && schedule.away_team
                              ? `${schedule.home_team} vs ${schedule.away_team}`
                              : schedule.recording_title || 'Recording'
                            }
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          Started: {schedule.executed_at ? formatDate(schedule.executed_at) : 'N/A'}
                        </Typography>
                        {schedule.competition && (
                          <Typography variant="body2">
                            {schedule.competition}
                          </Typography>
                        )}
                      </Box>
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, schedule)}
                        size="small"
                      >
                        <MoreIcon />
                      </IconButton>
                    </Box>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ActiveIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No active schedules
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No schedules are currently running.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuList>
          <MenuItemComponent onClick={handleEdit}>
            <EditIcon sx={{ mr: 1, fontSize: 20 }} />
            Edit
          </MenuItemComponent>
          {selectedSchedule?.status === 'pending' && (
            <MenuItemComponent onClick={handleExecute}>
              <PlayIcon sx={{ mr: 1, fontSize: 20 }} />
              Execute Now
            </MenuItemComponent>
          )}
          <MenuItemComponent onClick={() => {
            if (selectedSchedule) {
              navigate(`/schedules/${selectedSchedule.id}`);
            }
            handleMenuClose();
          }}>
            <CalendarIcon sx={{ mr: 1, fontSize: 20 }} />
            View Details
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
            Are you sure you want to delete this schedule? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (selectedSchedule) {
                deleteScheduleMutation.mutate(selectedSchedule.id);
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

export default Schedules;