import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import branchesService from '../../services/branchesService';
import inventoryService from '../../services/inventoryService';

// Registrar componentes de ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const InventoryReport = () => {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(
    user.role !== 'admin' ? user.branch_id : ''
  );
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Cargar sucursales si es admin
        if (user.role === 'admin') {
          const branchesData = await branchesService.getBranches();
          setBranches(branchesData);
        }
        
        // Cargar inventario
        const inventoryData = await inventoryService.getInventory({
          branch_id: selectedBranch || null
        });
        setInventory(inventoryData);
      } catch (err) {
        console.error("Error fetching inventory data:", err);
        setError("Error al cargar los datos del inventario. Por favor, intente nuevamente.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedBranch, user.branch_id, user.role]);
  
  const handleBranchChange = (event) => {
    setSelectedBranch(event.target.value);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Preparar datos para análisis
  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Agrupar por categoría
  const categoriesMap = new Map();
  inventory.forEach(item => {
    const category = item.category || 'Sin categoría';
    if (!categoriesMap.has(category)) {
      categoriesMap.set(category, {
        totalItems: 0,
        totalValue: 0,
        products: []
      });
    }
    
    const categoryData = categoriesMap.get(category);
    categoryData.totalItems += item.quantity;
    categoryData.totalValue += item.price * item.quantity;
    categoryData.products.push(item);
  });
  
  // Convertir mapa a array para gráficos
  const categoriesData = Array.from(categoriesMap.entries()).map(([name, data]) => ({
    name,
    ...data
  }));
  
  // Productos con bajo stock
  const lowStockItems = inventory.filter(item => item.quantity <= 5);
  
  // Datos para gráficos
  const categoryValuesChartData = {
    labels: categoriesData.map(c => c.name),
    datasets: [
      {
        label: 'Valor de Inventario',
        data: categoriesData.map(c => c.totalValue),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
          'rgba(255, 159, 64, 0.5)',
          'rgba(201, 203, 207, 0.5)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(201, 203, 207, 1)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  const categoryItemsChartData = {
    labels: categoriesData.map(c => c.name),
    datasets: [
      {
        label: 'Cantidad de Productos',
        data: categoriesData.map(c => c.totalItems),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reporte de Inventario
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {user.role === 'admin' && (
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select
                fullWidth
                label="Sucursal"
                value={selectedBranch}
                onChange={handleBranchChange}
              >
                <MenuItem value="">Todas</MenuItem>
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}
        </Grid>
      </Paper>
      
      {/* Tarjetas de resumen */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'primary.light',
              color: 'white'
            }}
          >
            <Typography component="h2" variant="h6" gutterBottom>
              Total de Productos
            </Typography>
            <Typography component="p" variant="h4">
              {totalItems.toLocaleString()}
            </Typography>
            <Box sx={{ mt: 'auto', opacity: 0.7 }}>
              <Typography variant="body2">
                Unidades en inventario
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'success.light',
              color: 'white'
            }}
          >
            <Typography component="h2" variant="h6" gutterBottom>
              Valor Total
            </Typography>
            <Typography component="p" variant="h4">
              ${totalValue.toLocaleString()}
            </Typography>
            <Box sx={{ mt: 'auto', opacity: 0.7 }}>
              <Typography variant="body2">
                Inventario valorizado
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'warning.light',
              color: 'white'
            }}
          >
            <Typography component="h2" variant="h6" gutterBottom>
              Productos con Stock Bajo
            </Typography>
            <Typography component="p" variant="h4">
              {lowStockItems.length}
            </Typography>
            <Box sx={{ mt: 'auto', opacity: 0.7 }}>
              <Typography variant="body2">
                5 o menos unidades
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'info.light',
              color: 'white'
            }}
          >
            <Typography component="h2" variant="h6" gutterBottom>
              Categorías
            </Typography>
            <Typography component="p" variant="h4">
              {categoriesData.length}
            </Typography>
            <Box sx={{ mt: 'auto', opacity: 0.7 }}>
              <Typography variant="body2">
                Diferentes categorías
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Gráficos */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Valor por Categoría
            </Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <Doughnut data={categoryValuesChartData} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Cantidad por Categoría
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar 
                data={categoryItemsChartData}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Tabla de productos con stock bajo */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom color="warning.main">
          Productos con Stock Bajo
        </Typography>
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell align="right">Precio</TableCell>
                <TableCell align="right">Valor</TableCell>
                {user.role === 'admin' && <TableCell>Sucursal</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {lowStockItems.length > 0 ? (
                lowStockItems.map((item) => (
                  <TableRow key={`${item.branch_id}-${item.product_id}`}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>
                      {item.category ? (
                        <Chip label={item.category} size="small" />
                      ) : (
                        <Chip label="Sin categoría" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ 
                      fontWeight: 'bold',
                      color: item.quantity <= 0 ? 'error.main' : 'warning.main'
                    }}>
                      {item.quantity}
                    </TableCell>
                    <TableCell align="right">${item.price.toLocaleString()}</TableCell>
                    <TableCell align="right">${(item.price * item.quantity).toLocaleString()}</TableCell>
                    {user.role === 'admin' && <TableCell>{item.branch_name}</TableCell>}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={user.role === 'admin' ? 6 : 5} align="center">
                    No hay productos con stock bajo.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Tabla resumen por categoría */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Resumen por Categoría
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Categoría</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell align="right">Valor</TableCell>
                <TableCell align="right">% del Valor Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categoriesData.map((category) => (
                <TableRow key={category.name}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell align="right">{category.totalItems.toLocaleString()}</TableCell>
                  <TableCell align="right">${category.totalValue.toLocaleString()}</TableCell>
                  <TableCell align="right">
                    {totalValue > 0 
                      ? ((category.totalValue / totalValue) * 100).toFixed(2) 
                      : '0'}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default InventoryReport;
