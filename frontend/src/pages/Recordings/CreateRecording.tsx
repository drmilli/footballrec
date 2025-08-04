import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import apiService from '../../services/api';
import { RecordingFormData } from '../../types';

const CreateRecording: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RecordingFormData>({
    defaultValues: {
      title: '',
      description: '',
      stream_url: '',
      quality: 'best',
      format: 'mp4',
    },
  });

  const createRecordingMutation = useMutation({
    mutationFn: (data: RecordingFormData) => apiService.createRecording(data),
    onSuccess: (response) => {
      showNotification('Recording created successfully!', 'success');
      navigate(`/recordings/${response.data?.id}`);
    },
    onError: (error: any) => {
      showNotification(
        error.response?.data?.message || 'Failed to create recording',
        'error'
      );
    },
  });

  const onSubmit = (data: RecordingFormData) => {
    createRecordingMutation.mutate(data);
  };

  const handleCancel = () => {
    reset();
    navigate('/recordings');
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Recording
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Set up a new manual recording by providing the stream URL and recording details.
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
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

              <Grid size={{ xs: 12 }}>
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
                      error={!!errors.description}
                      helperText={errors.description?.message}
                      placeholder="Add any additional details about this recording..."
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  name="stream_url"
                  control={control}
                  rules={{
                    required: 'Stream URL is required',
                    pattern: {
                      value: /^https?:\/\/.+/,
                      message: 'Please enter a valid URL starting with http:// or https://',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Stream URL"
                      fullWidth
                      error={!!errors.stream_url}
                      helperText={errors.stream_url?.message}
                      placeholder="https://example.com/stream.m3u8"
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="quality"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Quality</InputLabel>
                      <Select {...field} label="Quality">
                        <MenuItem value="best">Best Available</MenuItem>
                        <MenuItem value="1080p">1080p</MenuItem>
                        <MenuItem value="720p">720p</MenuItem>
                        <MenuItem value="480p">480p</MenuItem>
                        <MenuItem value="360p">360p</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
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

              <Grid size={{ xs: 12 }}>
                <Alert severity="info">
                  The recording will be created and can be started immediately or scheduled for later.
                  Make sure the stream URL is accessible and supports the selected format.
                </Alert>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={createRecordingMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={createRecordingMutation.isPending}
                  >
                    {createRecordingMutation.isPending ? 'Creating...' : 'Create Recording'}
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