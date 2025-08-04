import React from 'react';
import { Box, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';

const RecordingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Recording Detail
      </Typography>
      <Typography variant="body1">
        Recording ID: {id} - Coming soon!
      </Typography>
    </Box>
  );
};

export default RecordingDetail;