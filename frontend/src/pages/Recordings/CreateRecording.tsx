import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '../../contexts/NotificationContext';
import apiService from '../../services/api';
import { RecordingFormData } from '../../types';

const CreateRecording: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const { control, handleSubmit, formState: { errors } } = useForm<RecordingFormData>({
    defaultValues: {
      title: '',
      description: '',
      stream_url: '',
      quality: 'best',
      format: 'mp4',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: RecordingFormData) => apiService.createRecording(data),
    onSuccess: (response) => {
      showNotification('Recording created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      navigate(`/recordings/${response.data?.id}`);
    },
    onError: (error: any) => {
      showNotification(error.response?.data?.error || 'Failed to create recording', 'error');
    },
  });

  const onSubmit = (data: RecordingFormData) => {
    createMutation.mutate(data);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/recordings')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          Create New Recording
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Controller
                  name="title"
                  control={control}
                  rules={{ required: 'Title is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Recording Title"
                      fullWidth
                      error={!!errors.title}
                      helperText={errors.title?.message}
                      placeholder="e.g., Manchester United vs Liverpool"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Description (Optional)"
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Additional details about the recording..."
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="stream_url"
                  control={control}
                  rules={{
                    required: 'Stream URL is required',
                    pattern: {
                      value: /^https?:\/\/.+/,
                      message: 'Please enter a valid HTTP/HTTPS URL'
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Stream URL"
                      fullWidth
                      error={!!errors.stream_url}
                      helperText={errors.stream_url?.message || 'Enter the URL of the stream to record'}
                      placeholder="https://example.com/stream.m3u8"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="quality"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Quality</InputLabel>
                      <Select {...field} label="Quality">
                        <MenuItem value="best">Best Available</MenuItem>
                        <MenuItem value="good">Good</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="format"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Format</InputLabel>
                      <Select {...field} label="Format">
                        <MenuItem value="mp4">MP4</MenuItem>
                        <MenuItem value="mkv">MKV</MenuItem>
                        <MenuItem value="ts">TS</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info">
                  The recording will be created and can be started immediately or scheduled for later.
                  Make sure the stream URL is accessible and supports the selected format.
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/recordings')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Recording'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateRecording;