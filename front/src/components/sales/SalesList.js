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
  Chip,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-data-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-data-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import salesService from '../../services/salesService';
import branchesService from '../../services/branchesService';

const SalesList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState({
    branch_id: user.role !== 'admin' ? user.branch_id : '',
    date_from: null,
    date_to: null
  });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Cargar sucursales
        const branchesData = await branchesService.getBranches();
        setBranches(branchesData);
        
        // Cargar ventas con filtros iniciales
        const salesData = await salesService.getSales({
          branch_id: filters.branch_id || null
        });
        setSales(salesData);
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
  
  const handleDateChange = (name) => (date) => {
    setFilters({
      ...filters,
      [name]: date
    });
  };
  
  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Preparar filtros para la API
      const apiFilters = {
        branch_id: filters.branch_id || null,
        date_from: filters.date_from ? format(filters.date_from, 'yyyy-MM-dd') : null,
        date_to: filters.date_to ? format(filters.date_to, 'yyyy-MM-dd') : null
      };
      
      const salesData = await salesService.getSales(apiFilters);
      setSales(salesData);
    } catch (err) {
      console.error("Error searching sales:", err);
      setError("Error al buscar ventas. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  const resetFilters = () => {
    setFilters({
      branch_id: user.role !== 'admin' ? user.branch_id : '',
      date_from: null,
      date_to: null
    });
    
    // Recargar datos sin filtros (excepto branch_id para no-admins)
    handleSearch();
  };
  
  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 70
    },
    {
      field: 'sale_date',
      headerName: 'Fecha',
      width: 120,
      renderCell: (params) => (
        format(new Date(params.value), 'dd/MM/yyyy')
      )
    },
    {
      field: 'branch_name',
      headerName: 'Sucursal',
      width: 180
    },
    {
      field: 'total_amount',
      headerName: 'Total',
      width: 120,
      renderCell: (params) => (
        `$${parseFloat(params.value).toLocaleString()}`
      )
    },
    {
      field: 'items',
      headerName: 'Productos',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={`${params.value.length} items`} 
          size="small" 
          color="info"
        />
      )
    },
    {
      field: 'created_by_username',
      headerName: 'Registrado por',
      width: 150
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 100,
      renderCell: (params) => (
        <Tooltip title="Ver detalles">
          <IconButton
            color="primary"
            size="small"
            onClick={() => navigate(`/sales/${params.row.id}`)}
          >
            <VisibilityIcon />
          </IconButton>
        </Tooltip>
      )
    }
  ];
  
  return (
    <Box>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs>
          <Typography variant="h4">Ventas</Typography>
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
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/sales/new')}
          >
            Nueva Venta
          </Button>
        </Grid>
      </Grid>
      
      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Sucursal"
                name="branch_id"
                value={filters.branch_id}
                onChange={handleFilterChange}
                disabled={user.role !== 'admin'}
              >
                <MenuItem value="">Todas</MenuItem>
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Desde"
                  value={filters.date_from}
                  onChange={handleDateChange('date_from')}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Hasta"
                  value={filters.date_to}
                  onChange={handleDateChange('date_to')}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
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
          rows={sales}
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

export default SalesList;
