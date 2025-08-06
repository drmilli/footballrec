import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
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
  Paper,
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
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as RecordIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Sports as SportsIcon,
  Schedule as ScheduleIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '../../contexts/NotificationContext';
import apiService from '../../services/api';
import { Match } from '../../types';

const Matches: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  
  // State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [competitionFilter, setCompetitionFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch matches
  const { data: matchesResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['matches', page, rowsPerPage, searchTerm, statusFilter, competitionFilter],
    queryFn: () => apiService.getMatches({
      page: page + 1,
      limit: rowsPerPage,
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      competition: competitionFilter !== 'all' ? competitionFilter : undefined,
    }),
  });

  const matches = matchesResponse?.success ? matchesResponse.data : [];
  const totalCount = matchesResponse?.pagination?.totalCount || 0;

  // Mutations
  const deleteMatchMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteMatch(id),
    onSuccess: () => {
      showNotification('Match deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setDeleteDialogOpen(false);
      setSelectedMatch(null);
    },
    onError: () => {
      showNotification('Failed to delete match', 'error');
    },
  });

  const toggleAutoRecordMutation = useMutation({
    mutationFn: ({ id, autoRecord }: { id: string; autoRecord: boolean }) =>
      apiService.toggleAutoRecord(id, autoRecord),
    onSuccess: () => {
      showNotification('Auto-record setting updated', 'success');
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
    onError: () => {
      showNotification('Failed to update auto-record setting', 'error');
    },
  });

  // Event handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, match: Match) => {
    setAnchorEl(event.currentTarget);
    setSelectedMatch(match);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMatch(null);
  };

  const handleEdit = () => {
    if (selectedMatch) {
      navigate(`/matches/${selectedMatch.id}/edit`);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleAutoRecordToggle = (match: Match) => {
    toggleAutoRecordMutation.mutate({
      id: match.id,
      autoRecord: !match.auto_record,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'error';
      case 'finished':
        return 'success';
      case 'scheduled':
        return 'primary';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load matches. Please try again.
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
          <SportsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Matches
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
            onClick={() => navigate('/matches/new')}
          >
            Add Match
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search matches..."
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
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="live">Live</MenuItem>
                  <MenuItem value="finished">Finished</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Competition</InputLabel>
                <Select
                  value={competitionFilter}
                  label="Competition"
                  onChange={(e) => setCompetitionFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="Premier League">Premier League</MenuItem>
                  <MenuItem value="Champions League">Champions League</MenuItem>
                  <MenuItem value="La Liga">La Liga</MenuItem>
                  <MenuItem value="Bundesliga">Bundesliga</MenuItem>
                  <MenuItem value="Serie A">Serie A</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Matches Table */}
      <Card>
        <CardContent>
          {isLoading ? (
            <LinearProgress />
          ) : matches && matches.length > 0 ? (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Match</TableCell>
                      <TableCell>Competition</TableCell>
                      <TableCell>Date & Time</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Auto Record</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {matches.map((match) => (
                      <TableRow key={match.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" noWrap>
                              {match.home_team} vs {match.away_team}
                            </Typography>
                            {match.stream_url && (
                              <Typography variant="body2" color="text.secondary" noWrap>
                                Stream available
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {match.competition || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {formatDate(match.match_date)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={match.status}
                            color={getStatusColor(match.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={match.auto_record}
                                onChange={() => handleAutoRecordToggle(match)}
                                size="small"
                              />
                            }
                            label=""
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={(e) => handleMenuOpen(e, match)}
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
              <SportsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No matches found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {searchTerm || statusFilter !== 'all' || competitionFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'Add your first match to get started'
                }
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/matches/new')}
              >
                Add Match
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

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
          <MenuItemComponent onClick={() => {
            if (selectedMatch) {
              navigate(`/matches/${selectedMatch.id}`);
            }
            handleMenuClose();
          }}>
            <ScheduleIcon sx={{ mr: 1, fontSize: 20 }} />
            View Details
          </MenuItemComponent>
          {selectedMatch?.stream_url && (
            <MenuItemComponent onClick={() => {
              if (selectedMatch?.stream_url) {
                window.open(selectedMatch.stream_url, '_blank');
              }
              handleMenuClose();
            }}>
              <RecordIcon sx={{ mr: 1, fontSize: 20 }} />
              Open Stream
            </MenuItemComponent>
          )}
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
            Are you sure you want to delete the match "{selectedMatch?.home_team} vs {selectedMatch?.away_team}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (selectedMatch) {
                deleteMatchMutation.mutate(selectedMatch.id);
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

export default Matches;