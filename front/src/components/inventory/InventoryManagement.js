import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  Autocomplete,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  Snackbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import inventoryService from '../../services/inventoryService';
import branchesService from '../../services/branchesService';
import productsService from '../../services/productsService';

const InventoryManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [savingInventory, setSavingInventory] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Cargar sucursales
        if (user.role === 'admin') {
          const branchesData = await branchesService.getBranches();
          setBranches(branchesData);
        }
        
        // Cargar productos
        const productsData = await productsService.getProducts();
        setProducts(productsData);
        
        // Si el usuario no es admin, precargar su sucursal
        if (user.role !== 'admin' && user.branch_id) {
          formik.setFieldValue('branch_id', user.branch_id);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Error al cargar los datos. Por favor, intente nuevamente.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.branch_id, user.role]);
  
  const validationSchema = Yup.object({
    branch_id: Yup.number().required('La sucursal es obligatoria'),
    product_id: Yup.number().required('El producto es obligatorio'),
    quantity: Yup.number()
      .required('La cantidad es obligatoria')
      .integer('Debe ser un número entero')
      .min(1, 'Debe ser al menos 1')
  });
  
  const formik = useFormik({
    initialValues: {
      branch_id: user.role !== 'admin' ? user.branch_id : '',
      product_id: '',
      quantity: 1
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setSavingInventory(true);
        setError(null);
        
        // Crear objeto de inventario
        const inventoryData = {
          branch_id: parseInt(values.branch_id),
          product_id: parseInt(values.product_id),
          quantity: parseInt(values.quantity)
        };
        
        // Enviar a la API
        await inventoryService.addInventory(inventoryData);
        
        // Mostrar mensaje de éxito
        setSnackbarMessage('Inventario actualizado correctamente');
        setSnackbarOpen(true);
        
        // Resetear el formulario
        formik.resetForm();
        setSelectedProduct(null);
      } catch (err) {
        console.error("Error updating inventory:", err);
        setError(err.response?.data?.error || "Error al actualizar el inventario. Por favor, intente nuevamente.");
      } finally {
        setSavingInventory(false);
      }
    }
  });
  
  const handleProductChange = (event, newValue) => {
    setSelectedProduct(newValue);
    if (newValue) {
      formik.setFieldValue('product_id', newValue.id);
    } else {
      formik.setFieldValue('product_id', '');
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Verificar permisos
  if (user.role !== 'admin' && user.role !== 'manager') {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          No tiene permisos para gestionar el inventario.
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/inventory')}
        >
          Volver al inventario
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          onClick={() => navigate('/inventory')} 
          sx={{ mr: 1 }}
          aria-label="volver"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">Gestionar Inventario</Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Agregar Stock
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            {user.role === 'admin' && (
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  id="branch_id"
                  name="branch_id"
                  label="Sucursal"
                  value={formik.values.branch_id}
                  onChange={formik.handleChange}
                  error={formik.touched.branch_id && Boolean(formik.errors.branch_id)}
                  helperText={formik.touched.branch_id && formik.errors.branch_id}
                >
                  <MenuItem value="">Seleccionar sucursal</MenuItem>
                  {branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            
            <Grid item xs={12} md={user.role === 'admin' ? 6 : 12}>
              <Autocomplete
                id="product-select"
                options={products}
                getOptionLabel={(option) => `${option.name} - $${option.price}`}
                value={selectedProduct}
                onChange={handleProductChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Seleccionar Producto"
                    variant="outlined"
                    fullWidth
                    error={formik.touched.product_id && Boolean(formik.errors.product_id)}
                    helperText={formik.touched.product_id && formik.errors.product_id}
                  />
                )}
                disabled={!formik.values.branch_id}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                id="quantity"
                name="quantity"
                label="Cantidad a Agregar"
                type="number"
                value={formik.values.quantity}
                onChange={formik.handleChange}
                error={formik.touched.quantity && Boolean(formik.errors.quantity)}
                helperText={formik.touched.quantity && formik.errors.quantity}
                InputProps={{ inputProps: { min: 1 } }}
                disabled={!formik.values.product_id}
              />
            </Grid>
            
            {selectedProduct && (
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Precio Unitario"
                  value={`$${selectedProduct.price.toLocaleString()}`}
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
            )}
            
            {selectedProduct && (
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Valor Total"
                  value={`$${(selectedProduct.price * formik.values.quantity).toLocaleString()}`}
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
            )}
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/inventory')}
              sx={{ mr: 1 }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              disabled={savingInventory || !formik.values.product_id}
            >
              {savingInventory ? <CircularProgress size={24} /> : 'Guardar'}
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

export default InventoryManagement;
