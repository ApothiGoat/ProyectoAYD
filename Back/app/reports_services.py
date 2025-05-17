import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from . import db_service
from config import DB_CONFIG

def generate_sales_metrics(period='monthly', branch_id=None):
    """Generar métricas de ventas por periodo"""
    conn = db_service.get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    # Configurar rango de fechas según el periodo
    today = datetime.now().date()
    
    if period == 'daily':
        date_from = today - timedelta(days=30)
        group_by = "DATE(s.sale_date)"
        period_format = "to_char(s.sale_date, 'YYYY-MM-DD')"
    elif period == 'weekly':
        date_from = today - timedelta(weeks=12)
        group_by = "DATE_TRUNC('week', s.sale_date)"
        period_format = "to_char(DATE_TRUNC('week', s.sale_date), 'YYYY-MM-DD')"
    elif period == 'yearly':
        date_from = today - relativedelta(years=5)
        group_by = "DATE_TRUNC('year', s.sale_date)"
        period_format = "to_char(DATE_TRUNC('year', s.sale_date), 'YYYY')"
    else:  # monthly (default)
        date_from = today - relativedelta(months=12)
        group_by = "DATE_TRUNC('month', s.sale_date)"
        period_format = "to_char(DATE_TRUNC('month', s.sale_date), 'YYYY-MM')"
    
    # Obtener ventas totales para el periodo
    total_query = """
        SELECT 
            SUM(s.total_amount) as total_sales,
            COUNT(DISTINCT s.id) as total_transactions,
            SUM(si.quantity) as total_products
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        WHERE s.sale_date >= %s
    """
    params = [date_from]
    
    if branch_id:
        total_query += " AND s.branch_id = %s"
        params.append(branch_id)
    
    cur.execute(total_query, params)
    totals = cur.fetchone()
    
    # Obtener ventas por periodo
    period_query = f"""
        SELECT 
            {period_format} as period,
            {group_by} as period_date,
            SUM(s.total_amount) as amount,
            COUNT(DISTINCT s.id) as transactions,
            SUM(si.quantity) as products
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        WHERE s.sale_date >= %s
    """
    
    period_params = [date_from]
    
    if branch_id:
        period_query += " AND s.branch_id = %s"
        period_params.append(branch_id)
    
    period_query += f" GROUP BY {group_by}, {period_format} ORDER BY {group_by}"
    
    cur.execute(period_query, period_params)
    periods = cur.fetchall()
    
    # Obtener top productos
    products_query = """
        SELECT 
            p.id,
            p.name,
            p.category,
            SUM(si.quantity) as total_quantity,
            SUM(si.quantity * si.price) as total_amount
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE s.sale_date >= %s
    """
    
    products_params = [date_from]
    
    if branch_id:
        products_query += " AND s.branch_id = %s"
        products_params.append(branch_id)
    
    products_query += " GROUP BY p.id, p.name, p.category ORDER BY total_amount DESC LIMIT 10"
    
    cur.execute(products_query, products_params)
    top_products = cur.fetchall()
    
    # Construir respuesta
    period_sales = []
    for p in periods:
        period_sales.append({
            'period': p['period'],
            'period_date': p['period_date'].strftime('%Y-%m-%d') if p['period_date'] else None,
            'amount': float(p['amount']),
            'transactions': p['transactions'],
            'products': p['products']
        })
    
    top_products_list = []
    for p in top_products:
        top_products_list.append({
            'id': p['id'],
            'name': p['name'],
            'category': p['category'],
            'total_quantity': p['total_quantity'],
            'total_amount': float(p['total_amount'])
        })
    
    metrics = {
        'totalSales': float(totals['total_sales'] or 0),
        'totalTransactions': totals['total_transactions'] or 0,
        'totalProducts': totals['total_products'] or 0,
        'periodSales': period_sales,
        'topProducts': top_products_list,
        'period': period,
        'dateFrom': date_from.strftime('%Y-%m-%d'),
        'dateTo': today.strftime('%Y-%m-%d'),
        'branch_id': branch_id
    }
    
    cur.close()
    conn.close()
    
    return metrics

def generate_branch_performance(branch_id=None):
    """Generar métricas de desempeño por sucursal"""
    conn = db_service.get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    # Fecha desde (últimos 30 días)
    date_from = datetime.now().date() - timedelta(days=30)
    
    # Consulta de rendimiento por sucursal
    query = """
        SELECT 
            b.id,
            b.name,
            b.manager,
            COUNT(DISTINCT s.id) as total_sales,
            SUM(s.total_amount) as total_amount,
            AVG(s.total_amount) as avg_sale,
            COUNT(DISTINCT s.id) / 30.0 as sales_per_day,
            COUNT(DISTINCT p.id) as unique_products,
            SUM(si.quantity) as total_products
        FROM branches b
        LEFT JOIN sales s ON b.id = s.branch_id AND s.sale_date >= %s
        LEFT JOIN sale_items si ON s.id = si.sale_id
        LEFT JOIN products p ON si.product_id = p.id
    """
    
    params = [date_from]
    
    if branch_id:
        query += " WHERE b.id = %s"
        params.append(branch_id)
    
    query += " GROUP BY b.id, b.name, b.manager ORDER BY total_amount DESC NULLS LAST"
    
    cur.execute(query, params)
    branches = cur.fetchall()
    
    # Calcular cantidad de sucursales activas (con ventas en el periodo)
    active_branches = 0
    for branch in branches:
        if branch['total_sales'] and branch['total_sales'] > 0:
            active_branches += 1
    
    # Construir respuesta
    branch_data = []
    for branch in branches:
        # Calcular métrica de desempeño
        performance = 0
        if branch['total_sales'] and branch['avg_sale'] and branch['sales_per_day']:
            performance = float(branch['total_amount'] or 0)
        
        branch_data.append({
            'id': branch['id'],
            'name': branch['name'],
            'manager': branch['manager'],
            'totalSales': branch['total_sales'] or 0,
            'totalAmount': float(branch['total_amount'] or 0),
            'avgSale': float(branch['avg_sale'] or 0),
            'salesPerDay': float(branch['sales_per_day'] or 0),
            'uniqueProducts': branch['unique_products'] or 0,
            'totalProducts': branch['total_products'] or 0,
            'performance': performance
        })
    
    # Obtener inventario total por sucursal
    inv_query = """
        SELECT 
            b.id,
            SUM(i.quantity) as total_inventory,
            SUM(i.quantity * p.price) as inventory_value
        FROM branches b
        LEFT JOIN inventory i ON b.id = i.branch_id
        LEFT JOIN products p ON i.product_id = p.id
    """
    
    inv_params = []
    
    if branch_id:
        inv_query += " WHERE b.id = %s"
        inv_params.append(branch_id)
    
    inv_query += " GROUP BY b.id"
    
    cur.execute(inv_query, inv_params)
    inventory_data = cur.fetchall()
    
    # Agregar datos de inventario a cada sucursal
    for inv in inventory_data:
        for branch in branch_data:
            if branch['id'] == inv['id']:
                branch['totalInventory'] = inv['total_inventory'] or 0
                branch['inventoryValue'] = float(inv['inventory_value'] or 0)
                break
    
    metrics = {
        'activeBranches': active_branches,
        'totalBranches': len(branches),
        'branchData': branch_data,
        'dateFrom': date_from.strftime('%Y-%m-%d'),
        'dateTo': datetime.now().date().strftime('%Y-%m-%d')
    }
    
    cur.close()
    conn.close()
    
    return metrics

def generate_inventory_metrics(branch_id=None):
    """Generar métricas de inventario"""
    conn = db_service.get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    # Consulta de inventario
    query = """
        SELECT 
            SUM(i.quantity) as total_items,
            SUM(i.quantity * p.price) as total_value,
            COUNT(DISTINCT p.id) as unique_products,
            COUNT(DISTINCT p.category) as unique_categories
        FROM inventory i
        JOIN products p ON i.product_id = p.id
    """
    
    params = []
    
    if branch_id:
        query += " WHERE i.branch_id = %s"
        params.append(branch_id)
    
    cur.execute(query, params)
    totals = cur.fetchone()
    
    # Consulta por categoría
    cat_query = """
        SELECT 
            p.category,
            SUM(i.quantity) as total_items,
            SUM(i.quantity * p.price) as total_value,
            COUNT(DISTINCT p.id) as unique_products
        FROM inventory i
        JOIN products p ON i.product_id = p.id
    """
    
    cat_params = []
    
    if branch_id:
        cat_query += " WHERE i.branch_id = %s"
        cat_params.append(branch_id)
    
    cat_query += " GROUP BY p.category ORDER BY total_value DESC"
    
    cur.execute(cat_query, cat_params)
    categories = cur.fetchall()
    
    # Consulta de productos con bajo stock
    low_stock_query = """
        SELECT 
            p.id,
            p.name,
            p.category,
            i.quantity,
            p.price,
            b.id as branch_id,
            b.name as branch_name
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        JOIN branches b ON i.branch_id = b.id
        WHERE i.quantity <= 5
    """
    
    low_stock_params = []
    
    if branch_id:
        low_stock_query += " AND i.branch_id = %s"
        low_stock_params.append(branch_id)
    
    low_stock_query += " ORDER BY i.quantity ASC"
    
    cur.execute(low_stock_query, low_stock_params)
    low_stock = cur.fetchall()
    
    # Construir respuesta
    category_data = []
    for cat in categories:
        category_data.append({
            'category': cat['category'] or 'Sin categoría',
            'totalItems': cat['total_items'],
            'totalValue': float(cat['total_value'] or 0),
            'uniqueProducts': cat['unique_products']
        })
    
    low_stock_data = []
    for item in low_stock:
        low_stock_data.append({
            'id': item['id'],
            'name': item['name'],
            'category': item['category'],
            'quantity': item['quantity'],
            'price': float(item['price']),
            'value': float(item['price'] * item['quantity']),
            'branchId': item['branch_id'],
            'branchName': item['branch_name']
        })
    
    metrics = {
        'totalItems': totals['total_items'] or 0,
        'totalValue': float(totals['total_value'] or 0),
        'uniqueProducts': totals['unique_products'] or 0,
        'uniqueCategories': totals['unique_categories'] or 0,
        'categories': category_data,
        'lowStock': low_stock_data
    }
    
    cur.close()
    conn.close()
    
    return metrics
    