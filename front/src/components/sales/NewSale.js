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
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Autocomplete,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { format } from 'date-fns';
import branchesService from '../../services/branchesService';
import productsService from '../../services/productsService';
import inventoryService from '../../services/inventoryService';
import salesService from '../../services/salesService';

const NewSale = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [saleItems, setSaleItems] = useState([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successSaleId, setSuccessSaleId] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Cargar sucursales
        const branchesData = await branchesService.getBranches();
        setBranches(branchesData);
        
        // Cargar productos
        const productsData = await productsService.getProducts();
        setProducts(productsData);
        
        // Si el usuario no es admin, precargar su sucursal
        if (user.role !== 'admin' && user.branch_id) {
          formik.setFieldValue('branch_id', user.branch_id);
          // Cargar inventario de la sucursal
          loadInventory(user.branch_id);
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
  
  const loadInventory = async (branchId) => {
    if (!branchId) return;
    
    try {
      const inventoryData = await inventoryService.getInventory({ branch_id: branchId });
      setInventory(inventoryData);
    } catch (err) {
      console.error("Error loading inventory:", err);
      setError("Error al cargar el inventario. Por favor, intente nuevamente.");
    }
  };
  
  const validationSchema = Yup.object({
    branch_id: Yup.number().required('La sucursal es obligatoria'),
    sale_date: Yup.date().required('La fecha es obligatoria')
  });
  
  const formik = useFormik({
    initialValues: {
      branch_id: user.role !== 'admin' ? user.branch_id : '',
      sale_date: format(new Date(), 'yyyy-MM-dd')
    },
    validationSchema,
    onSubmit: async (values) => {
      if (saleItems.length === 0) {
        setError("Debe agregar al menos un producto a la venta.");
        return;
      }
      
      try {
        setSavingOrder(true);
        setError(null);
        
        // Calcular total
        const totalAmount = saleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Crear objeto de venta
        const saleData = {
          branch_id: parseInt(values.branch_id),
          sale_date: values.sale_date,
          total_amount: totalAmount,
          items: saleItems.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price
          }))
        };
        
        // Enviar a la API
        const response = await salesService.createSale(saleData);
        
        // Mostrar diálogo de éxito
        setSuccessSaleId(response.sale_id);
        setSuccessDialogOpen(true);
      } catch (err) {
        console.error("Error creating sale:", err);
        setError(err.response?.data?.error || "Error al crear la venta. Por favor, intente nuevamente.");
      } finally {
        setSavingOrder(false);
      }
    }
  });
  
  const handleBranchChange = async (event) => {
    const branchId = event.target.value;
    formik.setFieldValue('branch_id', branchId);
    
    // Limpiar items al cambiar de sucursal
    setSaleItems([]);
    setSelectedProduct(null);
    
    // Cargar inventario de la sucursal
    await loadInventory(branchId);
  };
  
  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) {
      return;
    }
    
    // Verificar inventario
    const inventoryItem = inventory.find(item => item.product_id === selectedProduct.id);
    if (!inventoryItem || inventoryItem.quantity < quantity) {
      setError(`Stock insuficiente. Disponible: ${inventoryItem ? inventoryItem.quantity : 0}`);
      return;
    }
    
    // Verificar si el producto ya está en la lista
    const existingItemIndex = saleItems.findIndex(item => item.product_id === selectedProduct.id);
    
    if (existingItemIndex >= 0) {
      // Actualizar cantidad si ya existe
      const updatedItems = [...saleItems];
      const newQuantity = updatedItems[existingItemIndex].quantity + quantity;
      
      // Verificar inventario para cantidad actualizada
      if (inventoryItem.quantity < newQuantity) {
        setError(`Stock insuficiente. Disponible: ${inventoryItem.quantity}`);
        return;
      }
      
      updatedItems[existingItemIndex].quantity = newQuantity;
      setSaleItems(updatedItems);
    } else {
      // Agregar nuevo item
      setSaleItems([
        ...saleItems,
        {
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          price: selectedProduct.price,
          quantity: quantity
        }
      ]);
    }
    
    // Limpiar selección
    setSelectedProduct(null);
    setQuantity(1);
    setError(null);
  };
  
  const handleRemoveItem = (index) => {
    const updatedItems = [...saleItems];
    updatedItems.splice(index, 1);
    setSaleItems(updatedItems);
  };
  
  const handleViewSale = () => {
    setSuccessDialogOpen(false);
    navigate(`/sales/${successSaleId}`);
  };
  
  const handleNewSale = () => {
    setSuccessDialogOpen(false);
    // Resetear formulario
    formik.resetForm();
    setSaleItems([]);
    setSelectedProduct(null);
    setQuantity(1);
  };
  
  // Calcular total
  const totalAmount = saleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Filtrar productos disponibles en inventario
  const availableProducts = inventory
    .filter(item => item.quantity > 0)
    .map(item => {
      const product = products.find(p => p.id === item.product_id);
      return {
        ...product,
        stock: item.quantity
      };
    });
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
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
        <Typography variant="h4">Nueva Venta</Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="branch_id"
                name="branch_id"
                label="Sucursal"
                select
                value={formik.values.branch_id}
                onChange={handleBranchChange}
                error={formik.touched.branch_id && Boolean(formik.errors.branch_id)}
                helperText={formik.touched.branch_id && formik.errors.branch_id}
                disabled={user.role !== 'admin'}
              >
                <MenuItem value="">Seleccionar sucursal</MenuItem>
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="sale_date"
                name="sale_date"
                label="Fecha"
                type="date"
                value={formik.values.sale_date}
                onChange={formik.handleChange}
                error={formik.touched.sale_date && Boolean(formik.errors.sale_date)}
                helperText={formik.touched.sale_date && formik.errors.sale_date}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" gutterBottom>
            Agregar Productos
          </Typography>
          
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} md={6}>
              <Autocomplete
                id="product-select"
                options={availableProducts}
                getOptionLabel={(option) => `${option.name} - $${option.price} (Stock: ${option.stock})`}
                value={selectedProduct}
                onChange={(event, newValue) => {
                  setSelectedProduct(newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Seleccionar Producto"
                    variant="outlined"
                    fullWidth
                  />
                )}
                disabled={!formik.values.branch_id}
              />
            </Grid>
            
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                label="Cantidad"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                inputProps={{ min: 1 }}
                disabled={!selectedProduct}
              />
            </Grid>
            
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                label="Precio"
                type="number"
                value={selectedProduct?.price || ''}
                disabled
                InputProps={{
                  startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddItem}
                disabled={!selectedProduct || quantity <= 0}
                fullWidth
              >
                Agregar
              </Button>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3 }}>
            {saleItems.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell align="right">Precio</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {saleItems.map((item, index) => (
                      <TableRow key={item.product_id}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell align="right">${item.price.toLocaleString()}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">${(item.price * item.quantity).toLocaleString()}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                        Total:
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        ${totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  No hay productos agregados a la venta.
                </Typography>
              </Box>
            )}
          </Box>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/sales')}
              sx={{ mr: 1 }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              disabled={savingOrder || saleItems.length === 0}
            >
              {savingOrder ? <CircularProgress size={24} /> : 'Guardar Venta'}
            </Button>
          </Box>
        </form>
      </Paper>
      
      {/* Diálogo de éxito */}
      <Dialog
        open={successDialogOpen}
        onClose={handleViewSale}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" sx={{ display: 'flex', alignItems: 'center' }}>
          <CheckCircleIcon color="success" sx={{ mr: 1 }} />
          Venta Registrada con Éxito
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            La venta ha sido registrada correctamente con el ID #{successSaleId}.
            ¿Qué desea hacer a continuación?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNewSale} color="primary">
            Nueva Venta
          </Button>
          <Button onClick={handleViewSale} color="primary" autoFocus variant="contained">
            Ver Detalles
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NewSale;
