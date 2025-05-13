import psycopg2
import psycopg2.extras
from datetime import datetime
from config import DB_CONFIG

def get_connection():
    """Establece conexión con la base de datos PostgreSQL"""
    conn = psycopg2.connect(
        host=DB_CONFIG['host'],
        database=DB_CONFIG['database'],
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password']
    )
    return conn

def get_user_by_username(username):
    """Obtener usuario por nombre de usuario"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    cur.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cur.fetchone()
    
    cur.close()
    conn.close()
    
    if user:
        return dict(user)
    return None

def create_user(user_data):
    """Crear un nuevo usuario"""
    conn = get_connection()
    cur = conn.cursor()
    
    try:
        cur.execute(
            "INSERT INTO users (username, password, full_name, email, role, branch_id) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
            (
                user_data['username'],
                user_data['password'],  # La contraseña ya debería estar hash
                user_data['full_name'],
                user_data.get('email'),
                user_data['role'],
                user_data.get('branch_id')
            )
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        return user_id
    except psycopg2.Error as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()

def user_exists(username):
    """Verificar si un usuario ya existe"""
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT 1 FROM users WHERE username = %s", (username,))
    exists = cur.fetchone() is not None
    
    cur.close()
    conn.close()
    
    return exists

def get_sales(branch_id=None, date_from=None, date_to=None):
    """Obtiene ventas con filtros opcionales"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    query = "SELECT s.*, u.username as created_by_username, b.name as branch_name FROM sales s " \
            "JOIN users u ON s.created_by = u.id " \
            "JOIN branches b ON s.branch_id = b.id " \
            "WHERE 1=1"
    params = []
    
    if branch_id:
        query += " AND s.branch_id = %s"
        params.append(branch_id)
    
    if date_from:
        query += " AND s.sale_date >= %s"
        params.append(date_from)
    
    if date_to:
        query += " AND s.sale_date <= %s"
        params.append(date_to)
    
    query += " ORDER BY s.sale_date DESC"
    
    cur.execute(query, params)
    sales = cur.fetchall()
    
    # Convertir a formato JSON
    sales_list = []
    for sale in sales:
        sale_dict = dict(sale)
        sale_dict['sale_date'] = sale_dict['sale_date'].strftime("%Y-%m-%d")
        sale_dict['created_at'] = sale_dict['created_at'].strftime("%Y-%m-%d %H:%M:%S")
        sale_dict['items'] = get_sale_items(sale_dict['id'])
        sales_list.append(sale_dict)
    
    cur.close()
    conn.close()
    
    return sales_list

def get_sale_by_id(sale_id):
    """Obtener venta por ID con sus items"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    cur.execute(
        "SELECT s.*, u.username as created_by_username, b.name as branch_name FROM sales s " \
        "JOIN users u ON s.created_by = u.id " \
        "JOIN branches b ON s.branch_id = b.id " \
        "WHERE s.id = %s", (sale_id,)
    )
    sale = cur.fetchone()
    
    if not sale:
        cur.close()
        conn.close()
        return None
    
    sale_dict = dict(sale)
    sale_dict['sale_date'] = sale_dict['sale_date'].strftime("%Y-%m-%d")
    sale_dict['created_at'] = sale_dict['created_at'].strftime("%Y-%m-%d %H:%M:%S")
    sale_dict['items'] = get_sale_items(sale_dict['id'])
    
    cur.close()
    conn.close()
    
    return sale_dict

def get_sale_items(sale_id):
    """Obtener items de una venta"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    cur.execute(
        "SELECT si.*, p.name as product_name, p.category FROM sale_items si " \
        "JOIN products p ON si.product_id = p.id " \
        "WHERE si.sale_id = %s", (sale_id,)
    )
    items = cur.fetchall()
    
    # Convertir a formato JSON
    items_list = []
    for item in items:
        items_list.append(dict(item))
    
    cur.close()
    conn.close()
    
    return items_list

def insert_sale(sale_data):
    """Insertar nueva venta en la base de datos"""
    conn = get_connection()
    cur = conn.cursor()
    
    try:
        # Insertar encabezado de venta
        cur.execute(
            "INSERT INTO sales (branch_id, sale_date, total_amount, created_by) VALUES (%s, %s, %s, %s) RETURNING id",
            (sale_data['branch_id'], sale_data['sale_date'], sale_data['total_amount'], sale_data['created_by'])
        )
        sale_id = cur.fetchone()[0]
        
        # Insertar items de venta
        for item in sale_data['items']:
            cur.execute(
                "INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (%s, %s, %s, %s)",
                (sale_id, item['product_id'], item['quantity'], item['price'])
            )
        
        conn.commit()
        return sale_id
    except psycopg2.Error as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()

def check_inventory(sale_data):
    """Verificar si hay suficiente inventario para una venta"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    for item in sale_data['items']:
        cur.execute(
            "SELECT quantity, p.name FROM inventory i " \
            "JOIN products p ON i.product_id = p.id " \
            "WHERE i.branch_id = %s AND i.product_id = %s",
            (sale_data['branch_id'], item['product_id'])
        )
        result = cur.fetchone()
        
        if not result:
            cur.close()
            conn.close()
            return {
                'success': False,
                'message': f"El producto con ID {item['product_id']} no existe en el inventario de esta sucursal"
            }
        
        if result['quantity'] < item['quantity']:
            cur.close()
            conn.close()
            return {
                'success': False,
                'message': f"Stock insuficiente para el producto '{result['name']}'. Disponible: {result['quantity']}, Solicitado: {item['quantity']}"
            }
    
    cur.close()
    conn.close()
    
    return {'success': True}

def update_inventory(sale_data):
    """Actualizar inventario después de una venta"""
    conn = get_connection()
    cur = conn.cursor()
    
    try:
        for item in sale_data['items']:
            cur.execute(
                "UPDATE inventory SET quantity = quantity - %s, last_updated = CURRENT_TIMESTAMP " \
                "WHERE branch_id = %s AND product_id = %s",
                (item['quantity'], sale_data['branch_id'], item['product_id'])
            )
        
        conn.commit()
    except psycopg2.Error as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()

def get_branches():
    """Obtener todas las sucursales"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    cur.execute("SELECT * FROM branches ORDER BY name")
    branches = cur.fetchall()
    
    # Convertir a formato JSON
    branches_list = []
    for branch in branches:
        branch_dict = dict(branch)
        branch_dict['created_at'] = branch_dict['created_at'].strftime("%Y-%m-%d %H:%M:%S")
        branches_list.append(branch_dict)
    
    cur.close()
    conn.close()
    
    return branches_list

def insert_branch(branch_data):
    """Insertar nueva sucursal"""
    conn = get_connection()
    cur = conn.cursor()
    
    try:
        cur.execute(
            "INSERT INTO branches (name, address, phone, manager) VALUES (%s, %s, %s, %s) RETURNING id",
            (
                branch_data['name'],
                branch_data['address'],
                branch_data.get('phone'),
                branch_data.get('manager')
            )
        )
        branch_id = cur.fetchone()[0]
        conn.commit()
        return branch_id
    except psycopg2.Error as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()

def branch_exists(branch_id):
    """Verificar si una sucursal existe"""
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT 1 FROM branches WHERE id = %s", (branch_id,))
    exists = cur.fetchone() is not None
    
    cur.close()
    conn.close()
    
    return exists

def update_branch(branch_id, branch_data):
    """Actualizar información de sucursal"""
    conn = get_connection()
    cur = conn.cursor()
    
    # Construir la consulta dinámicamente con los campos a actualizar
    query_parts = []
    params = []
    
    if 'name' in branch_data:
        query_parts.append("name = %s")
        params.append(branch_data['name'])
    
    if 'address' in branch_data:
        query_parts.append("address = %s")
        params.append(branch_data['address'])
    
    if 'phone' in branch_data:
        query_parts.append("phone = %s")
        params.append(branch_data['phone'])
    
    if 'manager' in branch_data:
        query_parts.append("manager = %s")
        params.append(branch_data['manager'])
    
    if not query_parts:
        return False
    
    query = f"UPDATE branches SET {', '.join(query_parts)} WHERE id = %s"
    params.append(branch_id)
    
    try:
        cur.execute(query, params)
        conn.commit()
        return True
    except psycopg2.Error as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()

def get_inventory(branch_id=None, product_id=None):
    """Obtener inventario con filtros opcionales"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    query = """
        SELECT i.*, p.name as product_name, p.description, p.category, p.price, 
               b.name as branch_name
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        JOIN branches b ON i.branch_id = b.id
        WHERE 1=1
    """
    params = []
    
    if branch_id:
        query += " AND i.branch_id = %s"
        params.append(branch_id)
    
    if product_id:
        query += " AND i.product_id = %s"
        params.append(product_id)
    
    query += " ORDER BY p.name"
    
    cur.execute(query, params)
    inventory = cur.fetchall()
    
    # Convertir a formato JSON
    inventory_list = []
    for item in inventory:
        item_dict = dict(item)
        item_dict['last_updated'] = item_dict['last_updated'].strftime("%Y-%m-%d %H:%M:%S")
        item_dict['total_value'] = float(item_dict['quantity']) * float(item_dict['price'])
        inventory_list.append(item_dict)
    
    cur.close()
    conn.close()
    
    return inventory_list

def add_inventory(inventory_data):
    """Añadir o actualizar inventario"""
    conn = get_connection()
    cur = conn.cursor()
    
    try:
        # Verificar si ya existe ese producto en esa sucursal
        cur.execute(
            "SELECT id, quantity FROM inventory WHERE branch_id = %s AND product_id = %s",
            (inventory_data['branch_id'], inventory_data['product_id'])
        )
        existing = cur.fetchone()
        
        if existing:
            # Actualizar cantidad existente
            cur.execute(
                "UPDATE inventory SET quantity = quantity + %s, last_updated = CURRENT_TIMESTAMP WHERE id = %s",
                (inventory_data['quantity'], existing[0])
            )
            inventory_id = existing[0]
        else:
            # Insertar nuevo registro
            cur.execute(
                "INSERT INTO inventory (branch_id, product_id, quantity) VALUES (%s, %s, %s) RETURNING id",
                (inventory_data['branch_id'], inventory_data['product_id'], inventory_data['quantity'])
            )
            inventory_id = cur.fetchone()[0]
        
        conn.commit()
        return inventory_id
    except psycopg2.Error as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()

def get_products(category=None, name_filter=None):
    """Obtener productos con filtros opcionales"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    query = "SELECT * FROM products WHERE 1=1"
    params = []
    
    if category:
        query += " AND category = %s"
        params.append(category)
    
    if name_filter:
        query += " AND name ILIKE %s"
        params.append(f"%{name_filter}%")
    
    query += " ORDER BY name"
    
    cur.execute(query, params)
    products = cur.fetchall()
    
    # Convertir a formato JSON
    products_list = []
    for product in products:
        product_dict = dict(product)
        product_dict['created_at'] = product_dict['created_at'].strftime("%Y-%m-%d %H:%M:%S")
        products_list.append(product_dict)
    
    cur.close()
    conn.close()
    
    return products_list

def insert_product(product_data):
    """Insertar nuevo producto"""
    conn = get_connection()
    cur = conn.cursor()
    
    try:
        cur.execute(
            "INSERT INTO products (name, description, category, price) VALUES (%s, %s, %s, %s) RETURNING id",
            (
                product_data['name'],
                product_data.get('description'),
                product_data.get('category'),
                product_data['price']
            )
        )
        product_id = cur.fetchone()[0]
        conn.commit()
        return product_id
    except psycopg2.Error as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()

def get_categories():
    """Obtener lista de categorías de productos"""
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category")
    categories = [row[0] for row in cur.fetchall()]
    
    cur.close()
    conn.close()
    
    return categories
