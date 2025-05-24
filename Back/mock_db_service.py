"""
Servicio de reportes simulado (mock) para pruebas
"""

from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

def generate_sales_metrics(period='monthly', branch_id=None):
    """Generar métricas de ventas por periodo (simulado)"""
    
    # Datos simulados para métricas
    if period == 'daily':
        period_sales = [
            {'period': '2025-05-20', 'period_date': '2025-05-20', 'amount': 5000.0, 'transactions': 3, 'products': 5},
            {'period': '2025-05-21', 'period_date': '2025-05-21', 'amount': 7500.0, 'transactions': 5, 'products': 8},
            {'period': '2025-05-22', 'period_date': '2025-05-22', 'amount': 12000.0, 'transactions': 7, 'products': 12},
            {'period': '2025-05-23', 'period_date': '2025-05-23', 'amount': 15250.0, 'transactions': 1, 'products': 2}
        ]
    elif period == 'weekly':
        period_sales = [
            {'period': '2025-05-05', 'period_date': '2025-05-05', 'amount': 45000.0, 'transactions': 25, 'products': 50},
            {'period': '2025-05-12', 'period_date': '2025-05-12', 'amount': 52000.0, 'transactions': 30, 'products': 65},
            {'period': '2025-05-19', 'period_date': '2025-05-19', 'amount': 39750.0, 'transactions': 16, 'products': 27}
        ]
    elif period == 'yearly':
        period_sales = [
            {'period': '2023', 'period_date': '2023-01-01', 'amount': 850000.0, 'transactions': 450, 'products': 1200},
            {'period': '2024', 'period_date': '2024-01-01', 'amount': 920000.0, 'transactions': 520, 'products': 1350},
            {'period': '2025', 'period_date': '2025-01-01', 'amount': 156750.0, 'transactions': 71, 'products': 144}
        ]
    else:  # monthly
        period_sales = [
            {'period': '2024-11', 'period_date': '2024-11-01', 'amount': 75000.0, 'transactions': 45, 'products': 120},
            {'period': '2024-12', 'period_date': '2024-12-01', 'amount': 95000.0, 'transactions': 60, 'products': 150},
            {'period': '2025-01', 'period_date': '2025-01-01', 'amount': 68000.0, 'transactions': 40, 'products': 95},
            {'period': '2025-02', 'period_date': '2025-02-01', 'amount': 72000.0, 'transactions': 42, 'products': 105},
            {'period': '2025-03', 'period_date': '2025-03-01', 'amount': 80000.0, 'transactions': 48, 'products': 125},
            {'period': '2025-04', 'period_date': '2025-04-01', 'amount': 85000.0, 'transactions': 52, 'products': 135},
            {'period': '2025-05', 'period_date': '2025-05-01', 'amount': 39750.0, 'transactions': 16, 'products': 27}
        ]
    
    top_products = [
        {'id': 1, 'name': 'Laptop HP', 'category': 'Electrónicos', 'total_quantity': 25, 'total_amount': 375000.0},
        {'id': 2, 'name': 'Mouse Logitech', 'category': 'Accesorios', 'total_quantity': 120, 'total_amount': 30000.0},
        {'id': 3, 'name': 'Teclado Mecánico', 'category': 'Accesorios', 'total_quantity': 45, 'total_amount': 36000.0}
    ]
    
    # Ajustar datos si hay filtro de sucursal
    if branch_id:
        # Reducir valores para simular datos de una sola sucursal
        for sale in period_sales:
            sale['amount'] *= 0.6
            sale['transactions'] = int(sale['transactions'] * 0.6)
            sale['products'] = int(sale['products'] * 0.6)
        
        for product in top_products:
            product['total_quantity'] = int(product['total_quantity'] * 0.6)
            product['total_amount'] *= 0.6
    
    total_sales = sum(sale['amount'] for sale in period_sales)
    total_transactions = sum(sale['transactions'] for sale in period_sales)
    total_products = sum(sale['products'] for sale in period_sales)
    
    metrics = {
        'totalSales': total_sales,
        'totalTransactions': total_transactions,
        'totalProducts': total_products,
        'periodSales': period_sales,
        'topProducts': top_products,
        'period': period,
        'dateFrom': (datetime.now().date() - timedelta(days=365)).strftime('%Y-%m-%d'),
        'dateTo': datetime.now().date().strftime('%Y-%m-%d'),
        'branch_id': branch_id
    }
    
    return metrics

def generate_branch_performance(branch_id=None):
    """Generar métricas de desempeño por sucursal (simulado)"""
    
    if branch_id:
        # Datos para una sucursal específica
        branch_data = [
            {
                'id': branch_id,
                'name': f'Sucursal {branch_id}',
                'manager': 'Manager Específico',
                'totalSales': 45,
                'totalAmount': 245000.0,
                'avgSale': 5444.44,
                'salesPerDay': 1.5,
                'uniqueProducts': 15,
                'totalProducts': 85,
                'performance': 245000.0,
                'totalInventory': 175,
                'inventoryValue': 425000.0
            }
        ]
        active_branches = 1
        total_branches = 1
    else:
        # Datos para todas las sucursales
        branch_data = [
            {
                'id': 1,
                'name': 'Sucursal Central',
                'manager': 'Juan Pérez',
                'totalSales': 45,
                'totalAmount': 245000.0,
                'avgSale': 5444.44,
                'salesPerDay': 1.5,
                'uniqueProducts': 15,
                'totalProducts': 85,
                'performance': 245000.0,
                'totalInventory': 175,
                'inventoryValue': 425000.0
            },
            {
                'id': 2,
                'name': 'Sucursal Norte',
                'manager': 'María García',
                'totalSales': 28,
                'totalAmount': 156000.0,
                'avgSale': 5571.43,
                'salesPerDay': 0.93,
                'uniqueProducts': 12,
                'totalProducts': 52,
                'performance': 156000.0,
                'totalInventory': 95,
                'inventoryValue': 287500.0
            }
        ]
        active_branches = 2
        total_branches = 2
    
    metrics = {
        'activeBranches': active_branches,
        'totalBranches': total_branches,
        'branchData': branch_data,
        'dateFrom': (datetime.now().date() - timedelta(days=30)).strftime('%Y-%m-%d'),
        'dateTo': datetime.now().date().strftime('%Y-%m-%d')
    }
    
    return metrics

def generate_inventory_metrics(branch_id=None):
    """Generar métricas de inventario (simulado)"""
    
    if branch_id:
        total_items = 175
        total_value = 425000.0
        unique_products = 15
        unique_categories = 3
        category_data = [
            {'category': 'Electrónicos', 'totalItems': 125, 'totalValue': 375000.0, 'uniqueProducts': 8},
            {'category': 'Accesorios', 'totalItems': 50, 'totalValue': 50000.0, 'uniqueProducts': 7}
        ]
    else:
        total_items = 270
        total_value = 712500.0
        unique_products = 18
        unique_categories = 3
        category_data = [
            {'category': 'Electrónicos', 'totalItems': 200, 'totalValue': 600000.0, 'uniqueProducts': 10},
            {'category': 'Accesorios', 'totalItems': 70, 'totalValue': 112500.0, 'uniqueProducts': 8}
        ]
    
    low_stock_data = [
        {
            'id': 3,
            'name': 'Teclado Mecánico',
            'category': 'Accesorios',
            'quantity': 3,
            'price': 800.0,
            'value': 2400.0,
            'branchId': 1,
            'branchName': 'Sucursal Central'
        }
    ]
    
    metrics = {
        'totalItems': total_items,
        'totalValue': total_value,
        'uniqueProducts': unique_products,
        'uniqueCategories': unique_categories,
        'categories': category_data,
        'lowStock': low_stock_data
    }
    
    return metrics