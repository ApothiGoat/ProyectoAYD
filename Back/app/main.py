from flask import Flask, request, jsonify, g
from flask_cors import CORS
import jwt
import datetime
from functools import wraps
import traceback

# Importar servicios
from . import schemas
from . import db_service
from . import auth_service
from . import reports_service
from . import logger
from config import SECRET_KEY, JWT_SECRET, JWT_EXPIRATION

# Crear aplicación Flask
app = Flask(__name__)
CORS(app)

# Middleware de autenticación
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Extraer token del header de autorización
        auth_header = request.headers.get('Authorization')
        if auth_header:
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Token no proporcionado'}), 401
        
        try:
            # Decodificar token
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            g.user_id = data['user_id']
            g.username = data['username']
            g.role = data['role']
        except:
            return jsonify({'error': 'Token inválido o expirado'}), 401
            
        return f(*args, **kwargs)
    
    return decorated

# Manejador de errores global
@app.errorhandler(Exception)
def handle_error(e):
    logger.log_error(str(e), traceback.format_exc())
    return jsonify({'error': 'Ha ocurrido un error en el servidor'}), 500

# Endpoints de autenticación
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Se requieren usuario y contraseña'}), 400
    
    result = auth_service.login(data.get('username'), data.get('password'))
    
    if result.get('success'):
        # Registrar evento
        logger.log_event('LOGIN_SUCCESS', user=data.get('username'))
        return jsonify(result)
    
    # Registrar intento fallido
    logger.log_event('LOGIN_FAILED', user=data.get('username'))
    return jsonify({'error': result.get('message', 'Error de autenticación')}), 401

@app.route('/api/register', methods=['POST'])
@token_required
def register():
    # Solo administradores pueden registrar usuarios
    if g.role != 'admin':
        return jsonify({'error': 'No autorizado'}), 403
    
    data = request.get_json()
    
    # Validar datos
    if not schemas.validate_user(data):
        return jsonify({'error': 'Datos de usuario inválidos'}), 400
    
    result = auth_service.register_user(data)
    
    if result.get('success'):
        logger.log_event('USER_CREATED', created_by=g.username, user=data.get('username'))
        return jsonify({'message': 'Usuario creado correctamente', 'user_id': result.get('user_id')})
    
    return jsonify({'error': result.get('message', 'Error al crear usuario')}), 400

# Endpoints de ventas
@app.route('/api/sales', methods=['GET'])
@token_required
def get_sales():
    branch_id = request.args.get('branch_id')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    # Restricción por rol: si no es admin, solo ve ventas de su sucursal
    if g.role != 'admin' and g.branch_id and g.branch_id != branch_id:
        branch_id = g.branch_id  # Forzar a solo ver su sucursal
    
    sales = db_service.get_sales(branch_id, date_from, date_to)
    return jsonify(sales)

@app.route('/api/sales', methods=['POST'])
@token_required
def create_sale():
    sale_data = request.get_json()
    
    # Validar estructura JSON
    if not schemas.validate_sale(sale_data):
        return jsonify({'error': 'Datos de venta inválidos'}), 400
    
    # Restricción por rol: solo puede crear ventas en su sucursal
    if g.role != 'admin' and g.branch_id and g.branch_id != sale_data.get('branch_id'):
        return jsonify({'error': 'No autorizado para crear ventas en esta sucursal'}), 403
    
    # Verificar stock
    inventory_check = db_service.check_inventory(sale_data)
    if not inventory_check['success']:
        return jsonify({'error': inventory_check['message']}), 400
    
    # Agregar información de usuario que registra
    sale_data['created_by'] = g.user_id
    
    # Guardar venta en base de datos
    sale_id = db_service.insert_sale(sale_data)
    
    # Actualizar inventario
    db_service.update_inventory(sale_data)
    
    # Registrar evento
    logger.log_event('SALE_CREATED', user=g.username, sale_id=sale_id)
    
    return jsonify({
        'sale_id': sale_id,
        'status': 'completed'
    })

@app.route('/api/sales/<int:sale_id>', methods=['GET'])
@token_required
def get_sale_details(sale_id):
    sale = db_service.get_sale_by_id(sale_id)
    
    if not sale:
        return jsonify({'error': 'Venta no encontrada'}), 404
    
    # Verificar permisos: admin ve todo, otros solo ven ventas de su sucursal
    if g.role != 'admin' and g.branch_id and g.branch_id != sale.get('branch_id'):
        return jsonify({'error': 'No autorizado'}), 403
    
    return jsonify(sale)

# Endpoints de sucursales
@app.route('/api/branches', methods=['GET'])
@token_required
def get_branches():
    branches = db_service.get_branches()
    return jsonify(branches)

@app.route('/api/branches', methods=['POST'])
@token_required
def create_branch():
    # Solo administradores pueden crear sucursales
    if g.role != 'admin':
        return jsonify({'error': 'No autorizado'}), 403
    
    branch_data = request.get_json()
    
    # Validar estructura JSON
    if not schemas.validate_branch(branch_data):
        return jsonify({'error': 'Datos de sucursal inválidos'}), 400
    
    # Guardar sucursal en base de datos
    branch_id = db_service.insert_branch(branch_data)
    
    # Registrar evento
    logger.log_event('BRANCH_CREATED', user=g.username, branch_id=branch_id)
    
    return jsonify({
        'branch_id': branch_id,
        'status': 'completed'
    })

@app.route('/api/branches/<int:branch_id>', methods=['PUT'])
@token_required
def update_branch(branch_id):
    # Solo administradores pueden actualizar sucursales
    if g.role != 'admin':
        return jsonify({'error': 'No autorizado'}), 403
    
    branch_data = request.get_json()
    
    # Validar estructura JSON
    if not schemas.validate_branch_update(branch_data):
        return jsonify({'error': 'Datos de sucursal inválidos'}), 400
    
    # Verificar que la sucursal existe
    if not db_service.branch_exists(branch_id):
        return jsonify({'error': 'Sucursal no encontrada'}), 404
    
    # Actualizar sucursal
    db_service.update_branch(branch_id, branch_data)
    
    # Registrar evento
    logger.log_event('BRANCH_UPDATED', user=g.username, branch_id=branch_id)
    
    return jsonify({
        'branch_id': branch_id,
        'status': 'updated'
    })

# Endpoints de inventario
@app.route('/api/inventory', methods=['GET'])
@token_required
def get_inventory():
    branch_id = request.args.get('branch_id')
    product_id = request.args.get('product_id')
    
    # Restricción por rol: si no es admin, solo ve inventario de su sucursal
    if g.role != 'admin' and g.branch_id and g.branch_id != branch_id:
        branch_id = g.branch_id  # Forzar a solo ver su sucursal
    
    inventory = db_service.get_inventory(branch_id, product_id)
    return jsonify(inventory)

@app.route('/api/inventory', methods=['POST'])
@token_required
def add_inventory():
    # Solo administradores y encargados pueden añadir inventario
    if g.role not in ['admin', 'manager']:
        return jsonify({'error': 'No autorizado'}), 403
    
    inventory_data = request.get_json()
    
    # Validar estructura JSON
    if not schemas.validate_inventory(inventory_data):
        return jsonify({'error': 'Datos de inventario inválidos'}), 400
    
    # Verificar permiso por sucursal
    if g.role != 'admin' and g.branch_id and g.branch_id != inventory_data.get('branch_id'):
        return jsonify({'error': 'No autorizado para modificar inventario de esta sucursal'}), 403
    
    # Ejecutar operación
    inventory_id = db_service.add_inventory(inventory_data)
    
    # Registrar evento
    logger.log_event('INVENTORY_ADDED', user=g.username, 
                    branch_id=inventory_data.get('branch_id'),
                    product_id=inventory_data.get('product_id'),
                    quantity=inventory_data.get('quantity'))
    
    return jsonify({
        'inventory_id': inventory_id,
        'status': 'completed'
    })

# Endpoints de productos
@app.route('/api/products', methods=['GET'])
@token_required
def get_products():
    category = request.args.get('category')
    name_filter = request.args.get('name')
    
    products = db_service.get_products(category, name_filter)
    return jsonify(products)

@app.route('/api/products', methods=['POST'])
@token_required
def create_product():
    # Solo administradores pueden crear productos
    if g.role != 'admin':
        return jsonify({'error': 'No autorizado'}), 403
    
    product_data = request.get_json()
    
    # Validar estructura JSON
    if not schemas.validate_product(product_data):
        return jsonify({'error': 'Datos de producto inválidos'}), 400
    
    # Guardar producto
    product_id = db_service.insert_product(product_data)
    
    # Registrar evento
    logger.log_event('PRODUCT_CREATED', user=g.username, product_id=product_id)
    
    return jsonify({
        'product_id': product_id,
        'status': 'completed'
    })

# Endpoints de métricas
@app.route('/api/metrics/sales', methods=['GET'])
@token_required
def get_sales_metrics():
    period = request.args.get('period', 'monthly')
    branch_id = request.args.get('branch_id')
    
    # Restricción por rol: si no es admin, solo ve métricas de su sucursal
    if g.role != 'admin' and g.branch_id:
        branch_id = g.branch_id
    
    metrics = reports_service.generate_sales_metrics(period, branch_id)
    return jsonify(metrics)

@app.route('/api/metrics/performance', methods=['GET'])
@token_required
def get_branch_performance():
    # Solo administradores pueden ver el rendimiento de todas las sucursales
    if g.role != 'admin':
        metrics = reports_service.generate_branch_performance(g.branch_id)
    else:
        metrics = reports_service.generate_branch_performance()
    
    return jsonify(metrics)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)), debug=DEBUG)