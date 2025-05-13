import React from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Button,
  Divider,
  Avatar,
  List,
  ListItem
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import InventoryIcon from '@mui/icons-material/Inventory';
import StoreIcon from '@mui/icons-material/Store';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UpdateIcon from '@mui/icons-material/Update';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';

const Dashboard = () => {
  return (
    <Box>
      <Box className="dashboard-header">
        <Typography variant="h4" className="dashboard-title">
          Dashboard
        </Typography>
        <Typography variant="subtitle1" className="dashboard-subtitle">
          Bienvenido al panel de control. Aquí tienes un resumen de la actividad reciente.
        </Typography>
      </Box>
      
      {/* Tarjetas principales */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            className="dashboard-card metric-card"
            sx={{ bgcolor: '#2a6db0', color: 'white' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }} className="metric-title">
              <AttachMoneyIcon sx={{ mr: 1 }} />
              <Typography>Ventas Totales</Typography>
            </Box>
            <Typography className="metric-value">
              $24,300
            </Typography>
            <Box className="metric-subtitle">
              <TrendingUpIcon sx={{ fontSize: 18, mr: 0.5, color: '#4caf50' }} />
              <Typography variant="body2">
                <strong>+15%</strong> desde el mes pasado
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            className="dashboard-card metric-card"
            sx={{ bgcolor: '#2e7d32', color: 'white' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }} className="metric-title">
              <InventoryIcon sx={{ mr: 1 }} />
              <Typography>Inventario</Typography>
            </Box>
            <Typography className="metric-value">
              1,254
            </Typography>
            <Box className="metric-subtitle">
              <CheckCircleIcon sx={{ fontSize: 18, mr: 0.5 }} />
              <Typography variant="body2">
                Productos disponibles
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            className="dashboard-card metric-card"
            sx={{ bgcolor: '#ed6c02', color: 'white' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }} className="metric-title">
              <StoreIcon sx={{ mr: 1 }} />
              <Typography>Sucursales</Typography>
            </Box>
            <Typography className="metric-value">
              3
            </Typography>
            <Box className="metric-subtitle">
              <Typography variant="body2">
                Todas operando normalmente
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            className="dashboard-card metric-card"
            sx={{ bgcolor: '#0288d1', color: 'white' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }} className="metric-title">
              <PeopleIcon sx={{ mr: 1 }} />
              <Typography>Empleados</Typography>
            </Box>
            <Typography className="metric-value">
              15
            </Typography>
            <Box className="metric-subtitle">
              <Typography variant="body2">
                3 administradores, 12 empleados
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Sección de acciones y notificaciones */}
      <Grid container spacing={3} mb={4}>
        {/* Columna de Acciones Rápidas */}
        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent sx={{ pb: 2 }}>
              <Typography className="section-title">
                Acciones Rápidas
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    startIcon={<AddShoppingCartIcon />}
                    className="action-button"
                  >
                    Nueva Venta
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    startIcon={<InventoryIcon />}
                    className="action-button"
                  >
                    Gestionar Inventario
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="warning"
                    startIcon={<StoreIcon />}
                    className="action-button"
                  >
                    Ver Sucursales
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="info"
                    startIcon={<ManageAccountsIcon />}
                    className="action-button"
                  >
                    Administrar Usuarios
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Columna de Notificaciones */}
        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent sx={{ pb: 2 }}>
              <Typography className="section-title">
                Notificaciones
              </Typography>
              <List sx={{ width: '100%', p: 0 }}>
                <ListItem className="notification-item">
                  <Avatar sx={{ bgcolor: '#f44336' }} className="notification-avatar">
                    <WarningIcon />
                  </Avatar>
                  <Box>
                    <Typography className="notification-title">
                      Stock bajo de Laptop HP
                    </Typography>
                    <Typography className="notification-subtitle">
                      Quedan solo 2 unidades en Sucursal Central
                    </Typography>
                  </Box>
                </ListItem>
                
                <ListItem className="notification-item">
                  <Avatar sx={{ bgcolor: '#4caf50' }} className="notification-avatar">
                    <ShoppingCartIcon />
                  </Avatar>
                  <Box>
                    <Typography className="notification-title">
                      Venta completada #1082
                    </Typography>
                    <Typography className="notification-subtitle">
                      $1,299.99 - Monitor Dell 27 pulgadas (hace 30 minutos)
                    </Typography>
                  </Box>
                </ListItem>
                
                <ListItem className="notification-item">
                  <Avatar sx={{ bgcolor: '#2196f3' }} className="notification-avatar">
                    <UpdateIcon />
                  </Avatar>
                  <Box>
                    <Typography className="notification-title">
                      Actualización de precios
                    </Typography>
                    <Typography className="notification-subtitle">
                      Se actualizaron los precios de 5 productos (hace 2 horas)
                    </Typography>
                  </Box>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Resumen del sistema */}
      <Card className="dashboard-card">
        <CardContent>
          <Typography className="section-title">
            Resumen del Sistema
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total de Productos:
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                156 productos en catálogo
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Ventas del Día:
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                12 ventas • $3,450
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Último Acceso:
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                Hoy, 3:15 PM
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
