import os
from dotenv import load_dotenv

# Cargar variables de entorno desde archivo .env
load_dotenv()

# Configuración general
DEBUG = os.getenv('FLASK_ENV') == 'development'
SECRET_KEY = os.getenv('SECRET_KEY', 'clave-secreta-por-defecto')

# Configuración de base de datos
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'erp_db'),
    'user': os.getenv('DB_USER', 'erp_user'),
    'password': os.getenv('DB_PASSWORD', ''),
}

# Configuración de JWT
JWT_SECRET = os.getenv('JWT_SECRET', SECRET_KEY)
JWT_EXPIRATION = int(os.getenv('JWT_EXPIRATION', 86400))  # 24 horas por defecto

# Configuración de logs
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_FILE = os.getenv('LOG_FILE', 'app.log')
