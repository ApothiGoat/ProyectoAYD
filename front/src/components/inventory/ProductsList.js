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
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import productsService from '../../services/productsService';

const ProductsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState({
    category: '',
    name: ''
  });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Cargar productos
        const productsData = await productsService.getProducts();
        setProducts(productsData);
        
        // Obtener categorías únicas
        const uniqueCategories = [...new Set(productsData.filter(p => p.category).map(p => p.category))];
        setCategories(uniqueCategories);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Error al cargar los productos. Por favor, intente nuevamente.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
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
      
      // Hacer la búsqueda con los filtros
      const productsData = await productsService.getProducts(filters);
      setProducts(productsData);
    } catch (err) {
      console.error("Error searching products:", err);
      setError("Error al buscar productos. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };
  
  const resetFilters = () => {
    setFilters({
      category: '',
      name: ''
    });
    
    // Recargar productos sin filtros
    fetchProducts();
  };
  
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsData = await productsService.getProducts();
      setProducts(productsData);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Error al cargar los productos.");
    } finally {
      setLoading(false);
    }
  };
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 70
    },
    {
      field: 'name',
      headerName: 'Nombre',
      width: 250
    },
    {
      field: 'description',
      headerName: 'Descripción',
      width: 300,
      renderCell: (params) => (
        <Tooltip title={params.value || ''}>
          <span>
            {params.value && params.value.length > 50
              ? params.value.substring(0, 50) + '...'
              : params.value || ''}
          </span>
        </Tooltip>
      )
    },
    {
      field: 'category',
      headerName: 'Categoría',
      width: 150,
      renderCell: (params) => (
        params.value ? (
          <Chip label={params.value} size="small" />
        ) : (
          <Chip label="Sin categoría" size="small" variant="outlined" />
        )
      )
    },
    {
      field: 'price',
      headerName: 'Precio',
      width: 120,
      align: 'right',
      renderCell: (params) => (
        `$${parseFloat(params.value).toLocaleString()}`
      )
    },
    {
      field: 'created_at',
      headerName: 'Fecha Creación',
      width: 180,
      valueFormatter: (params) => {
        const date = new Date(params.value);
        return date.toLocaleDateString();
      }
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 100,
      renderCell: (params) => (
        user.role === 'admin' ? (
          <Tooltip title="Editar">
            <IconButton
              color="primary"
              size="small"
              onClick={() => navigate(`/products/${params.row.id}`)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
        ) : null
      )
    }
  ];
  
  return (
    <Box>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs>
          <Typography variant="h4">Productos</Typography>
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
          {user.role === 'admin' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/products/new')}
            >
              Nuevo Producto
            </Button>
          )}
        </Grid>
      </Grid>
      
      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
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
            
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Nombre del Producto"
                name="name"
                value={filters.name}
                onChange={handleFilterChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={12} md={4}>
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
          rows={products}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          loading={loading}
          components={{
            LoadingOverlay: CircularProgress,
          }}
        />
      </Paper>
    </Box>
  );
};

export default ProductsList;
