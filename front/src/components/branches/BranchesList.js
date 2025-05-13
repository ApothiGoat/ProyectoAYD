import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PlaceIcon from '@mui/icons-material/Place';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import branchesService from '../../services/branchesService';

const BranchesList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const branchesData = await branchesService.getBranches();
        setBranches(branchesData);
      } catch (err) {
        console.error("Error fetching branches:", err);
        setError("Error al cargar las sucursales. Por favor, intente nuevamente.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchBranches();
  }, []);
  
  // Verificar permisos para editar/agregar
  const canManageBranches = user.role === 'admin';
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs>
          <Typography variant="h4">Sucursales</Typography>
        </Grid>
        {canManageBranches && (
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/branches/new')}
            >
              Nueva Sucursal
            </Button>
          </Grid>
        )}
      </Grid>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {branches.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            No hay sucursales registradas.
          </Typography>
          {canManageBranches && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/branches/new')}
              sx={{ mt: 2 }}
            >
              Agregar Sucursal
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {branches.map((branch) => (
            <Grid item xs={12} sm={6} md={4} key={branch.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" component="div">
                      {branch.name}
                    </Typography>
                    {canManageBranches && (
                      <Tooltip title="Editar">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => navigate(`/branches/${branch.id}`)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PlaceIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {branch.address || 'Sin dirección'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {branch.phone || 'Sin teléfono'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Encargado: {branch.manager || 'No asignado'}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => {
                      // Aquí podrías redirigir a una vista detallada de la sucursal
                      if (canManageBranches) {
                        navigate(`/branches/${branch.id}`);
                      } else {
                        // O mostrar inventario de la sucursal para usuarios no admin
                        navigate(`/inventory?branch_id=${branch.id}`);
                      }
                    }}
                  >
                    {canManageBranches ? 'Editar' : 'Ver Inventario'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default BranchesList;
