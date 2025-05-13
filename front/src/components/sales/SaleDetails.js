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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import { format } from 'date-fns';
import salesService from '../../services/salesService';

const SaleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchSale = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const saleData = await salesService.getSaleById(id);
        setSale(saleData);
        
        // Verificar permisos (si no es admin y no es su sucursal)
        if (user.role !== 'admin' && user.branch_id && saleData.branch_id !== user.branch_id) {
          setError("No tiene permisos para ver esta venta.");
        }
      } catch (err) {
        console.error("Error fetching sale:", err);
        setError("Error al cargar los datos de la venta. Por favor, intente nuevamente.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSale();
  }, [id, user.branch_id, user.role]);
  
  const handlePrint = () => {
    window.print();
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
            onClick={() => navigate('/sales')} 
            sx={{ mr: 1 }}
            aria-label="volver"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">Detalles de Venta</Typography>
        </Box>
        
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/sales')}
        >
          Volver a la lista
        </Button>
      </Box>
    );
  }
  
  if (!sale) {
    return (
      <Box>
        <Alert severity="info">No se encontraron datos para esta venta.</Alert>
      </Box>
    );
  }
  
  // Calcular total (por seguridad, recalcular en el cliente)
  const totalAmount = sale.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  return (
    <Box id="sale-details-container">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }} className="no-print">
        <IconButton 
          onClick={() => navigate('/sales')} 
          sx={{ mr: 1 }}
          aria-label="volver"
          className="no-print"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">Detalles de Venta</Typography>
        <Box sx={{ ml: 'auto' }}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            className="no-print"
          >
            Imprimir
          </Button>
        </Box>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" gutterBottom>
              Información de Venta
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                ID de Venta
              </Typography>
              <Typography variant="body1">
                #{sale.id}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Fecha
              </Typography>
              <Typography variant="body1">
                {format(new Date(sale.sale_date), 'dd/MM/yyyy')}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Sucursal
              </Typography>
              <Typography variant="body1">
                {sale.branch_name}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" gutterBottom>
              Detalles de Registro
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Registrado por
              </Typography>
              <Typography variant="body1">
                {sale.created_by_username}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Fecha y hora de registro
              </Typography>
              <Typography variant="body1">
                {format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm:ss')}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Estado
              </Typography>
              <Chip label="Completada" color="success" size="small" />
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          Productos
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell align="right">Precio</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell align="right">Subtotal</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sale.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell>{item.category || 'Sin categoría'}</TableCell>
                  <TableCell align="right">${item.price.toLocaleString()}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">${(item.price * item.quantity).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>
                  Total:
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  ${totalAmount.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      <Box sx={{ mt: 3 }} className="no-print">
        <Button
          variant="contained"
          onClick={() => navigate('/sales/new')}
          sx={{ mr: 2 }}
        >
          Nueva Venta
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate('/sales')}
        >
          Volver a la lista
        </Button>
      </Box>
    </Box>
  );
};

export default SaleDetails;
