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
  MenuItem,
  Divider,
  Snackbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import productsService from '../../services/productsService';

const ProductForm = ({ initialValues = null, isEdit = false }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const categories = [
    'Computadoras',
    'Monitores',
    'Accesorios',
    'Almacenamiento',
    'Redes',
    'Impresoras',
    'Componentes',
    'Software',
    'Otros'
  ];
  
  const validationSchema = Yup.object({
    name: Yup.string()
      .required('El nombre es obligatorio')
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre debe tener máximo 100 caracteres'),
    price: Yup.number()
      .required('El precio es obligatorio')
      .positive('El precio debe ser positivo')
      .typeError('El precio debe ser un número'),
    description: Yup.string()
      .max(500, 'La descripción debe tener máximo 500 caracteres'),
    category: Yup.string()
  });
  
  const defaultValues = {
    name: '',
    price: '',
    description: '',
    category: ''
  };
  
  const formik = useFormik({
    initialValues: initialValues || defaultValues,
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        
        // Crear objeto de producto
        const productData = {
          name: values.name,
          price: parseFloat(values.price),
          description: values.description || null,
          category: values.category || null
        };
        
        if (isEdit && initialValues?.id) {
          // Actualizar producto existente
          await productsService.updateProduct(initialValues.id, productData);
          setSnackbarMessage('Producto actualizado correctamente');
        } else {
          // Crear nuevo producto
          await productsService.createProduct(productData);
          setSnackbarMessage('Producto creado correctamente');
        }
        
        setSnackbarOpen(true);
        
        // Redireccionar después de unos segundos
        setTimeout(() => {
          navigate('/products');
        }, 2000);
      } catch (err) {
        console.error("Error saving product:", err);
        setError(err.response?.data?.error || "Error al guardar el producto. Por favor, intente nuevamente.");
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
          onClick={() => navigate('/products')} 
          sx={{ mr: 1 }}
          aria-label="volver"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
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
                label="Nombre del Producto"
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
                id="price"
                name="price"
                label="Precio"
                type="number"
                InputProps={{
                  startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>,
                }}
                value={formik.values.price}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.price && Boolean(formik.errors.price)}
                helperText={formik.touched.price && formik.errors.price}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                id="category"
                name="category"
                label="Categoría"
                value={formik.values.category || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.category && Boolean(formik.errors.category)}
                helperText={formik.touched.category && formik.errors.category}
              >
                <MenuItem value="">Sin categoría</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="description"
                name="description"
                label="Descripción"
                multiline
                rows={4}
                value={formik.values.description || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
              />
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/products')}
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

export default ProductForm;
