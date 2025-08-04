import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// Components
import Layout from './components/Layout/Layout';
import NotificationProvider from './contexts/NotificationContext';

// Pages
import Dashboard from './pages/Dashboard/Dashboard';
import Recordings from './pages/Recordings/Recordings';
import RecordingDetail from './pages/Recordings/RecordingDetail';
import CreateRecording from './pages/Recordings/CreateRecording';
import Matches from './pages/Matches/Matches';
import MatchDetail from './pages/Matches/MatchDetail';
import CreateMatch from './pages/Matches/CreateMatch';
import Schedules from './pages/Schedules/Schedules';
import CreateSchedule from './pages/Schedules/CreateSchedule';
import Videos from './pages/Videos/Videos';
import VideoPlayer from './pages/Videos/VideoPlayer';
import Settings from './pages/Settings/Settings';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid rgba(0,0,0,0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#f8f9fa',
        },
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <CssBaseline />
          <NotificationProvider>
            <Router>
              <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                <Layout>
                  <Routes>
                    {/* Dashboard */}
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />

                    {/* Recordings */}
                    <Route path="/recordings" element={<Recordings />} />
                    <Route path="/recordings/new" element={<CreateRecording />} />
                    <Route path="/recordings/:id" element={<RecordingDetail />} />

                    {/* Matches */}
                    <Route path="/matches" element={<Matches />} />
                    <Route path="/matches/new" element={<CreateMatch />} />
                    <Route path="/matches/:id" element={<MatchDetail />} />

                    {/* Schedules */}
                    <Route path="/schedules" element={<Schedules />} />
                    <Route path="/schedules/new" element={<CreateSchedule />} />

                    {/* Videos */}
                    <Route path="/videos" element={<Videos />} />
                    <Route path="/videos/:id/player" element={<VideoPlayer />} />

                    {/* Settings */}
                    <Route path="/settings" element={<Settings />} />

                    {/* 404 */}
                    <Route path="*" element={<Dashboard />} />
                  </Routes>
                </Layout>
              </Box>
            </Router>
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
