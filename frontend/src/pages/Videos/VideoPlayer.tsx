import React from 'react';
import { Box, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';

const VideoPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Video Player
      </Typography>
      <Typography variant="body1">
        Video ID: {id} - Coming soon!
      </Typography>
    </Box>
  );
};

export default VideoPlayer;