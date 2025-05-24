#!/usr/bin/env python3
"""
Archivo principal para ejecutar la aplicación FastAPI
Ejecutar con: python run.py
"""

import uvicorn
import os

if __name__ == "__main__":
    # Configuración para desarrollo
    port = int(os.getenv('PORT', 8000))
    reload = os.getenv('FLASK_ENV') == 'development'
    
    print("🚀 Iniciando servidor FastAPI")
    print(f"🔧 Puerto: {port}")
    print(f"🔄 Auto-reload: {reload}")
    print(f"📍 URL: http://localhost:{port}")
    print(f"📖 Documentación Swagger: http://localhost:{port}/docs")
    print(f"📋 Documentación ReDoc: http://localhost:{port}/redoc")
    print("=" * 50)
    
    uvicorn.run(
        "main:app",  # Archivo main.py, variable app
        host="0.0.0.0",
        port=port,
        reload=reload,
        log_level="info"
    )
    