if (!salesMetrics) {
    return (
      <Box>
        <Alert severity="info">No hay datos disponibles para el reporte.</Alert>
      </Box>
    );
  }
  
  // Preparar datos para los gráficos
  const salesChartData = {
    labels: salesMetrics.periodSales.map(ps => ps.period),
    datasets: [
      {
        label: 'Ventas',
        data: salesMetrics.periodSales.map(ps => ps.amount),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgba(53, 162, 235, 1)',
        borderWidth: 2,
        tension: 0.3
      }
    ]
  };
  
  const transactionsChartData = {
    labels: salesMetrics.periodSales.map(ps => ps.period),
    datasets: [
      {
        label: 'Transacciones',
        data: salesMetrics.periodSales.map(ps => ps.transactions),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2
      }
    ]
  };
  
  const topProductsChartData = {
    labels: salesMetrics.topProducts.slice(0, 5).map(p => p.name),
    datasets: [
      {
        label: 'Ventas por Producto',
        data: salesMetrics.topProducts.slice(0, 5).map(p => p.total_amount),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Ventas por Período'
      },
    },
  };
  
  const periodsMap = {
    daily: 'diario',
    weekly: 'semanal',
    monthly: 'mensual',
    yearly: 'anual'
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reporte de Ventas
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Período"
              name="period"
              value={filters.period}
              onChange={handleFilterChange}
            >
              <MenuItem value="daily">Diario</MenuItem>
              <MenuItem value="weekly">Semanal</MenuItem>
              <MenuItem value="monthly">Mensual</MenuItem>
              <MenuItem value="yearly">Anual</MenuItem>
            </TextField>
          </Grid>
          
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
              Ventas Totales
            </Typography>
            <Typography component="p" variant="h4">
              ${salesMetrics.totalSales.toLocaleString()}
            </Typography>
            <Box sx={{ mt: 'auto', opacity: 0.7 }}>
              <Typography variant="body2">
                {`Acumulado ${periodsMap[filters.period]}`}
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
              Transacciones
            </Typography>
            <Typography component="p" variant="h4">
              {salesMetrics.totalTransactions.toLocaleString()}
            </Typography>
            <Box sx={{ mt: 'auto', opacity: 0.7 }}>
              <Typography variant="body2">
                {`Acumulado ${periodsMap[filters.period]}`}
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
              Productos Vendidos
            </Typography>
            <Typography component="p" variant="h4">
              {salesMetrics.totalProducts.toLocaleString()}
            </Typography>
            <Box sx={{ mt: 'auto', opacity: 0.7 }}>
              <Typography variant="body2">
                {`Acumulado ${periodsMap[filters.period]}`}
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
              Venta Promedio
            </Typography>
            <Typography component="p" variant="h4">
              ${salesMetrics.totalTransactions > 0 
                ? (salesMetrics.totalSales / salesMetrics.totalTransactions).toLocaleString(undefined, {maximumFractionDigits: 2}) 
                : '0'}
            </Typography>
            <Box sx={{ mt: 'auto', opacity: 0.7 }}>
              <Typography variant="body2">
                Por transacción
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Gráficos */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Tendencia de Ventas ({periodsMap[filters.period]})
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line data={salesChartData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Productos más Vendidos
            </Typography>
            <Box sx={{ height: 300 }}>
              <Pie data={topProductsChartData} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Transacciones por Período
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar data={transactionsChartData} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Detalle Ventas por Período
            </Typography>
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Período</TableCell>
                    <TableCell align="right">Ventas</TableCell>
                    <TableCell align="right">Transacciones</TableCell>
                    <TableCell align="right">Productos</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {salesMetrics.periodSales.map((period) => (
                    <TableRow key={period.period}>
                      <TableCell>{period.period}</TableCell>
                      <TableCell align="right">${period.amount.toLocaleString()}</TableCell>
                      <TableCell align="right">{period.transactions}</TableCell>
                      <TableCell align="right">{period.products}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Tabla Top Productos */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Top 10 Productos más Vendidos
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell align="right">Ventas Totales</TableCell>
                <TableCell align="right">% del Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {salesMetrics.topProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category || 'Sin categoría'}</TableCell>
                  <TableCell align="right">{product.total_quantity}</TableCell>
                  <TableCell align="right">${product.total_amount.toLocaleString()}</TableCell>
                  <TableCell align="right">
                    {salesMetrics.totalSales > 0 
                      ? ((product.total_amount / salesMetrics.totalSales) * 100).toFixed(2) 
                      : '0'}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      <Box sx={{ textAlign: 'center', mt: 2, color: 'text.secondary' }}>
        <Typography variant="body2">
          Datos del {salesMetrics.dateFrom} al {salesMetrics.dateTo}
        </Typography>
      </Box>
    </Box>
  );
;

export default SalesReport;