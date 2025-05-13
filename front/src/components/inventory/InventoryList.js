import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import WarningIcon from '@mui/icons-material/Warning';
import inventoryService from '../../services/inventoryService';
import branchesService from '../../services/branchesService';
import productsService from '../../services/productsService';

const InventoryList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState({
    branch_id: user.role !== 'admin' ? user.branch_id : '',
    category: '',
    product_name: ''
  });
  
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
        
        // Obtener categorías únicas de productos
        const productsData = await productsService.getProducts();
        const uniqueCategories = [...new Set(productsData.filter(p => p.category).map(p => p.category))];
        setCategories(uniqueCategories);
        
        // Cargar inventario con filtros iniciales
        const inventoryData = await inventoryService.getInventory({
          branch_id: filters.branch_id || null
        });
        setInventory(inventoryData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Error al cargar los datos. Por favor, intente nuevamente.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [filters.branch_id, user.branch_id, user.role]);
  
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Filtrar inventario según los criterios
      const filteredInventory = await inventoryService.getInventory({
        branch_id: filters.branch_id || null
      });
      
      // Filtros adicionales en el cliente
      let filteredData = filteredInventory;
      
      if (filters.category) {
        filteredData = filteredData.filter(item => item.category === filters.category);
      }
      
      if (filters.product_name) {
        const searchTerm = filters.product_name.toLowerCase();
        filteredData = filteredData.filter(item => 
          item.product_name.toLowerCase().includes(searchTerm)
        );
      }
      
      setInventory(filteredData);
    } catch (err) {
      console.error("Error searching inventory:", err);
      setError("Error al buscar inventario. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };
  
  const resetFilters = () => {
    setFilters({
      branch_id: user.role !== 'admin' ? user.branch_id : '',
      category: '',
      product_name: ''
    });
    
    // Recargar datos
    handleSearch();
  };
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  const columns = [
    {
      field: 'product_name',
      headerName: 'Producto',
      width: 250,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {params.row.quantity <= 5 && (
            <Tooltip title="Stock bajo">
              <WarningIcon sx={{ color: 'warning.main', mr: 1, fontSize: 20 }} />
            </Tooltip>
          )}
          {params.value}
        </Box>
      )
    },
    {
      field: 'category',
      headerName: 'Categoría',
      width: 150,
      valueGetter: (params) => params.row.category || 'Sin categoría'
    },
    {
      field: 'quantity',
      headerName: 'Cantidad',
      width: 120,
      align: 'right',
      renderCell: (params) => (
        <Box sx={{ 
          fontWeight: params.value <= 5 ? 'bold' : 'normal',
          color: params.value <= 0 ? 'error.main' : params.value <= 5 ? 'warning.main' : 'inherit'
        }}>
          {params.value}
        </Box>
      )
    },
    {
      field: 'price',
      headerName: 'Precio Unitario',
      width: 150,
      align: 'right',
      renderCell: (params) => (
        `$${parseFloat(params.value).toLocaleString()}`
      )
    },
    {
      field: 'total_value',
      headerName: 'Valor Total',
      width: 150,
      align: 'right',
      renderCell: (params) => (
        `$${parseFloat(params.value).toLocaleString()}`
      )
    },
    {
      field: 'branch_name',
      headerName: 'Sucursal',
      width: 180,
      hide: user.role !== 'admin'
    },
    {
      field: 'last_updated',
      headerName: 'Última Actualización',
      width: 200,
      valueFormatter: (params) => {
        const date = new Date(params.value);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      }
    }
  ];
  
  return (
    <Box>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs>
          <Typography variant="h4">Inventario</Typography>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={toggleFilters}
            sx={{ mr: 1 }}
          >
            {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
          </Button>
          {(user.role === 'admin' || user.role === 'manager') && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/inventory/manage')}
            >
              Gestionar Inventario
            </Button>
          )}
        </Grid>
      </Grid>
      
      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            {user.role === 'admin' && (
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Sucursal"
                  name="branch_id"
                  value={filters.branch_id}
                  onChange={handleFilterChange}
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
            
            <Grid item xs={12} sm={6} md={user.role === 'admin' ? 3 : 4}>
              <TextField
                select
                fullWidth
                label="Categoría"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <MenuItem value="">Todas</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6} md={user.role === 'admin' ? 3 : 4}>
              <TextField
                fullWidth
                label="Nombre del Producto"
                name="product_name"
                value={filters.product_name}
                onChange={handleFilterChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={user.role === 'admin' ? 3 : 4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SearchIcon />}
                  onClick={handleSearch}
                  fullWidth
                >
                  Buscar
                </Button>
                <Button
                  variant="outlined"
                  onClick={resetFilters}
                >
                  Limpiar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={inventory}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          loading={loading}
          components={{
            LoadingOverlay: CircularProgress,
          }}
          getRowId={(row) => `${row.branch_id}-${row.product_id}`}
        />
      </Paper>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/reports/inventory')}
        >
          Ver Reporte de Inventario
        </Button>
      </Box>
    </Box>
  );
};

export default InventoryList;
