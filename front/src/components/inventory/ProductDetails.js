import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import { format } from 'date-fns';
import productsService from '../../services/productsService';
import ProductForm from './ProductForm';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Esta función necesita ser implementada en el servicio
        const productData = await productsService.getProductById(id);
        setProduct(productData);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Error al cargar los datos del producto. Por favor, intente nuevamente.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);
  
  // Verificar permisos para editar
  const canEdit = user.role === 'admin';
  
  const handleEdit = () => {
    setEditing(true);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
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
          <Typography variant="h4">Detalles del Producto</Typography>
        </Box>
        
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/products')}
        >
          Volver a la lista
        </Button>
      </Box>
    );
  }
  
  if (!product) {
    return (
      <Box>
        <Alert severity="info">No se encontraron datos para este producto.</Alert>
      </Box>
    );
  }
  
  if (editing) {
    return <ProductForm initialValues={product} isEdit={true} />;
  }
  
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
        <Typography variant="h4">Detalles del Producto</Typography>
        {canEdit && (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            sx={{ ml: 'auto' }}
            onClick={handleEdit}
          >
            Editar
          </Button>
        )}
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Información Básica
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                ID
              </Typography>
              <Typography variant="body1">
                {product.id}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Nombre
              </Typography>
              <Typography variant="body1">
                {product.name}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Precio
              </Typography>
              <Typography variant="body1">
                ${parseFloat(product.price).toLocaleString()}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Categoría
              </Typography>
              {product.category ? (
                <Chip label={product.category} size="small" />
              ) : (
                <Typography variant="body1">Sin categoría</Typography>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Detalles Adicionales
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Fecha de Creación
              </Typography>
              <Typography variant="body1">
                {format(new Date(product.created_at), 'dd/MM/yyyy HH:mm:ss')}
              </Typography>
            </Box>
            
            {/* Puedes agregar más detalles según necesites */}
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Descripción
            </Typography>
            <Typography variant="body1">
              {product.description || 'Sin descripción'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/products')}
        >
          Volver a la lista
        </Button>
      </Box>
    </Box>
  );
};

export default ProductDetails;
