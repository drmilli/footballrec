import React from 'react';
import { Box, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';

const MatchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Match Detail
      </Typography>
      <Typography variant="body1">
        Match ID: {id} - Coming soon!
      </Typography>
    </Box>
  );
};

export default MatchDetail;