import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container, CssBaseline, Typography } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import Dashboard from './components/dashboard/Dashboard';

function App() {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4f8 0%, #d7e3ec 100%)',
    }}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ mt: 2, mb: 4, flex: 1 }}>
        <Box className="erp-logo">
          <BusinessIcon className="erp-logo-icon" fontSize="large" />
          <Typography variant="h5" className="erp-logo-text">
            ERP Empresarial
          </Typography>
        </Box>
        <Box className="dashboard-container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </Box>
      </Container>
    </Box>
  );
}

export default App;
