import bcrypt
import jwt
import datetime
from . import db_service
from config import JWT_SECRET, JWT_EXPIRATION

def hash_password(password):
    """Generar hash de contraseña con bcrypt"""
    # Generar salt y hash
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password, hashed_password):
    """Verificar si la contraseña coincide con el hash"""
    plain_password_bytes = plain_password.encode('utf-8')
    hashed_password_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_password_bytes, hashed_password_bytes)

def generate_token(user):
    """Generar token JWT para el usuario"""
    payload = {
        'user_id': user['id'],
        'username': user['username'],
        'role': user['role'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=JWT_EXPIRATION)
    }
    
    # Agregar branch_id al token si existe
    if user.get('branch_id'):
        payload['branch_id'] = user['branch_id']
    
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def login(username, password):
    """Autenticar usuario y generar token"""
    user = db_service.get_user_by_username(username)
    
    if not user:
        return {'success': False, 'message': 'Usuario no encontrado'}
    
    if not verify_password(password, user['password']):
        return {'success': False, 'message': 'Contraseña incorrecta'}
    
    token = generate_token(user)
    
    return {
        'success': True,
        'token': token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'full_name': user['full_name'],
            'role': user['role'],
            'branch_id': user.get('branch_id')
        }
    }

def register_user(user_data):
    """Registrar un nuevo usuario"""
    # Verificar si el usuario ya existe
    if db_service.user_exists(user_data['username']):
        return {'success': False, 'message': 'El nombre de usuario ya está en uso'}
    
    # Validar branch_id si se proporciona
    if user_data.get('branch_id') and not db_service.branch_exists(user_data['branch_id']):
        return {'success': False, 'message': 'La sucursal seleccionada no existe'}
    
    # Hash de la contraseña
    user_data['password'] = hash_password(user_data['password'])
    
    # Crear usuario
    try:
        user_id = db_service.create_user(user_data)
        return {'success': True, 'user_id': user_id}
    except Exception as e:
        return {'success': False, 'message': str(e)}
