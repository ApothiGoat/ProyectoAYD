import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  Snackbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import branchesService from '../../services/branchesService';

const BranchForm = ({ initialValues = null, isEdit = false }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const phoneRegExp = /^\+?[\d\s\-\(\)]{7,20}$/;
  
  const validationSchema = Yup.object({
    name: Yup.string()
      .required('El nombre es obligatorio')
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(100, 'El nombre debe tener máximo 100 caracteres'),
    address: Yup.string()
      .required('La dirección es obligatoria')
      .min(5, 'La dirección debe tener al menos 5 caracteres')
      .max(200, 'La dirección debe tener máximo 200 caracteres'),
    phone: Yup.string()
      .matches(phoneRegExp, 'El formato del teléfono no es válido')
      .nullable(),
    manager: Yup.string()
      .min(3, 'El nombre del encargado debe tener al menos 3 caracteres')
      .max(100, 'El nombre del encargado debe tener máximo 100 caracteres')
      .nullable()
  });
  
  const defaultValues = {
    name: '',
    address: '',
    phone: '',
    manager: ''
  };
  
  const formik = useFormik({
    initialValues: initialValues || defaultValues,
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        
        // Crear objeto de sucursal
        const branchData = {
          name: values.name,
          address: values.address,
          phone: values.phone || null,
          manager: values.manager || null
        };
        
        if (isEdit && initialValues?.id) {
          // Actualizar sucursal existente
          await branchesService.updateBranch(initialValues.id, branchData);
          setSnackbarMessage('Sucursal actualizada correctamente');
        } else {
          // Crear nueva sucursal
          await branchesService.createBranch(branchData);
          setSnackbarMessage('Sucursal creada correctamente');
        }
        
        setSnackbarOpen(true);
        
        // Redireccionar después de unos segundos
        setTimeout(() => {
          navigate('/branches');
        }, 2000);
      } catch (err) {
        console.error("Error saving branch:", err);
        setError(err.response?.data?.error || "Error al guardar la sucursal. Por favor, intente nuevamente.");
      } finally {
        setLoading(false);
      }
    }
  });
  
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          onClick={() => navigate('/branches')} 
          sx={{ mr: 1 }}
          aria-label="volver"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          {isEdit ? 'Editar Sucursal' : 'Nueva Sucursal'}
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3 }}>
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="name"
                name="name"
                label="Nombre de la Sucursal"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="phone"
                name="phone"
                label="Teléfono"
                value={formik.values.phone || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.phone && Boolean(formik.errors.phone)}
                helperText={formik.touched.phone && formik.errors.phone}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="address"
                name="address"
                label="Dirección"
                value={formik.values.address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.address && Boolean(formik.errors.address)}
                helperText={formik.touched.address && formik.errors.address}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="manager"
                name="manager"
                label="Encargado"
                value={formik.values.manager || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.manager && Boolean(formik.errors.manager)}
                helperText={formik.touched.manager && formik.errors.manager}
              />
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/branches')}
              sx={{ mr: 1 }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : isEdit ? 'Actualizar' : 'Guardar'}
            </Button>
          </Box>
        </form>
      </Paper>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default BranchForm;
