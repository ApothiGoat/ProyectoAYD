from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    
    # Permitir solicitudes CORS
    CORS(app)
    
    # Importar y registrar blueprints aquí si se desea organizar las rutas
    # from .routes.sales import sales_bp
    # app.register_blueprint(sales_bp)
    
    return app