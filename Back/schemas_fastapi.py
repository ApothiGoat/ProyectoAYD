"""
Schemas simplificados para FastAPI
Mantiene compatibilidad con el código existente
"""

import re
import datetime
from pydantic import BaseModel
from typing import Optional, List

# ========== MODELOS PYDANTIC PARA FASTAPI ==========

class LoginRequest(BaseModel):
    username: str
    password: str

class SaleItem(BaseModel):
    product_id: int
    quantity: int
    price: float

class SaleCreate(BaseModel):
    branch_id: int
    sale_date: str  # formato YYYY-MM-DD
    total_amount: float
    items: List[SaleItem]

class BranchCreate(BaseModel):
    name: str
    address: str
    phone: Optional[str] = None
    manager: Optional[str] = None

class BranchUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    manager: Optional[str] = None

class InventoryAdd(BaseModel):
    branch_id: int
    product_id: int
    quantity: int

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: float

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    email: Optional[str] = None
    role: str
    branch_id: Optional[int] = None

# ========== FUNCIONES DE VALIDACIÓN LEGACY ==========

def validate_sale(sale_data):
    """Validar estructura de datos de venta"""
    if not isinstance(sale_data, dict):
        return False
    
    required_fields = ['branch_id', 'sale_date', 'total_amount', 'items']
    if not all(field in sale_data for field in required_fields):
        return False
    
    if not isinstance(sale_data['branch_id'], int):
        return False
    
    if not isinstance(sale_data['total_amount'], (int, float)):
        return False
    
    if not isinstance(sale_data['items'], list) or len(sale_data['items']) == 0:
        return False
    
    try:
        if isinstance(sale_data['sale_date'], str):
            datetime.datetime.strptime(sale_data['sale_date'], '%Y-%m-%d')
    except ValueError:
        return False
    
    for item in sale_data['items']:
        if not validate_sale_item(item):
            return False
    
    return True

def validate_sale_item(item):
    """Validar estructura de ítem de venta"""
    if not isinstance(item, dict):
        return False
    
    required_fields = ['product_id', 'quantity', 'price']
    if not all(field in item for field in required_fields):
        return False
    
    if not isinstance(item['product_id'], int):
        return False
    
    if not isinstance(item['quantity'], int) or item['quantity'] <= 0:
        return False
    
    if not isinstance(item['price'], (int, float)) or item['price'] < 0:
        return False
    
    return True

def validate_branch(branch_data):
    """Validar estructura de datos de sucursal"""
    if not isinstance(branch_data, dict):
        return False
    
    required_fields = ['name', 'address']
    if not all(field in branch_data for field in required_fields):
        return False
    
    if not isinstance(branch_data['name'], str) or len(branch_data['name']) < 3:
        return False
    
    if not isinstance(branch_data['address'], str) or len(branch_data['address']) < 5:
        return False
    
    if 'phone' in branch_data and branch_data['phone']:
        if not isinstance(branch_data['phone'], str) or not re.match(r'^\+?[\d\s\-\(\)]{7,20}$', branch_data['phone']):
            return False
    
    if 'manager' in branch_data and branch_data['manager']:
        if not isinstance(branch_data['manager'], str) or len(branch_data['manager']) < 3:
            return False
    
    return True

def validate_branch_update(branch_data):
    """Validar estructura para actualización de sucursal"""
    if not isinstance(branch_data, dict) or len(branch_data) == 0:
        return False
    
    valid_fields = ['name', 'address', 'phone', 'manager']
    if not any(field in branch_data for field in valid_fields):
        return False
    
    if 'name' in branch_data and (not isinstance(branch_data['name'], str) or len(branch_data['name']) < 3):
        return False
    
    if 'address' in branch_data and (not isinstance(branch_data['address'], str) or len(branch_data['address']) < 5):
        return False
    
    if 'phone' in branch_data and branch_data['phone']:
        if not isinstance(branch_data['phone'], str) or not re.match(r'^\+?[\d\s\-\(\)]{7,20}$', branch_data['phone']):
            return False
    
    if 'manager' in branch_data and branch_data['manager']:
        if not isinstance(branch_data['manager'], str) or len(branch_data['manager']) < 3:
            return False
    
    return True

def validate_inventory(inventory_data):
    """Validar estructura de datos de inventario"""
    if not isinstance(inventory_data, dict):
        return False
    
    required_fields = ['branch_id', 'product_id', 'quantity']
    if not all(field in inventory_data for field in required_fields):
        return False
    
    if not isinstance(inventory_data['branch_id'], int):
        return False
    
    if not isinstance(inventory_data['product_id'], int):
        return False
    
    if not isinstance(inventory_data['quantity'], int):
        return False
    
    return True

def validate_product(product_data):
    """Validar estructura de datos de producto"""
    if not isinstance(product_data, dict):
        return False
    
    required_fields = ['name', 'price']
    if not all(field in product_data for field in required_fields):
        return False
    
    if not isinstance(product_data['name'], str) or len(product_data['name']) < 2:
        return False
    
    if not isinstance(product_data['price'], (int, float)) or product_data['price'] < 0:
        return False
    
    if 'description' in product_data and product_data['description']:
        if not isinstance(product_data['description'], str):
            return False
    
    if 'category' in product_data and product_data['category']:
        if not isinstance(product_data['category'], str):
            return False
    
    return True

def validate_user(user_data):
    """Validar estructura de datos de usuario"""
    if not isinstance(user_data, dict):
        return False
    
    required_fields = ['username', 'password', 'full_name', 'role']
    if not all(field in user_data for field in required_fields):
        return False
    
    if not isinstance(user_data['username'], str) or len(user_data['username']) < 3:
        return False
    
    if not isinstance(user_data['password'], str) or len(user_data['password']) < 6:
        return False
    
    if not isinstance(user_data['full_name'], str) or len(user_data['full_name']) < 3:
        return False
    
    if not isinstance(user_data['role'], str) or user_data['role'] not in ['admin', 'manager', 'employee']:
        return False
    
    if 'email' in user_data and user_data['email']:
        if not isinstance(user_data['email'], str) or not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', user_data['email']):
            return False
    
    if 'branch_id' in user_data and user_data['branch_id']:
        if not isinstance(user_data['branch_id'], int):
            return False
    
    return True

# Alias para compatibilidad
validate_user_dict = validate_user
