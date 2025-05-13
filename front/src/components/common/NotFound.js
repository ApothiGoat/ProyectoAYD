import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <Box sx={{ textAlign: 'center', py: 5 }}>
      <Typography variant="h4" gutterBottom>
        Página no encontrada
      </Typography>
      <Typography variant="body1" paragraph>
        La página que buscas no existe o ha sido movida.
      </Typography>
      <Button 
        variant="contained" 
        onClick={() => navigate('/dashboard')}
      >
        Volver al Dashboard
      </Button>
    </Box>
  );
};

export default NotFound;
