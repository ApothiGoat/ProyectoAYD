from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    
    # Permitir solicitudes CORS
    CORS(app)
    
    # Importar y registrar las rutas directamente
    from . import main
    
    return app
    