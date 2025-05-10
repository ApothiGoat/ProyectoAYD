# ProyectoAYD
Este repositorio es de un proyecto de el curso analisis de datos 


# ERP Empresarial Simplificado

## Descripción General

ERP Empresarial Simplificado es un sistema de gestión empresarial que permite administrar ventas, inventario, sucursales y visualizar métricas de desempeño. Diseñado con una arquitectura cliente-servidor, consta de un backend desarrollado en Python (Flask) y un frontend en React, comunicándose a través de endpoints RESTful.

## Características Principales

-  Dashboard con Métricas**: Visualización de KPIs y gráficos de rendimiento
-  Gestión de Sucursales**: Administración completa de locales comerciales
-  Sistema de Ventas**: Registro y seguimiento de transacciones
-  Control de Inventario**: Gestión de productos por sucursal
-  Administración de Usuarios**: Autenticación y control de acceso por roles
-  Reportes**: Generación de informes personalizables

## Arquitectura del Sistema

El sistema sigue una arquitectura de capas claramente definidas:

## Requisitos Técnicos

### Requisitos del Sistema
- **Sistema Operativo**: Linux (recomendado Ubuntu 20.04 o superior)
- **Memoria RAM**: Mínimo 2GB (4GB recomendado)
- **Almacenamiento**: 10GB mínimo
- **Procesador**: 2 núcleos o más

### Software Necesario
- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Nginx (para producción)

## Instalación y Configuración

### 1. Preparación del Entorno

bash
# Actualizar paquetes
sudo apt update && sudo apt upgrade -y

# Instalar dependencias básicas
sudo apt install -y python3 python3-pip python3-venv git curl

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalar Nginx (para producción)
sudo apt install -y nginx

### 2. Configuración de la Base de Datos

bash
# Acceder a PostgreSQL
sudo -u postgres psql

# Dentro de PostgreSQL, crear base de datos y usuario
CREATE DATABASE erp_db;
CREATE USER erp_user WITH ENCRYPTED PASSWORD 'tu_contraseña_segura';
GRANT ALL PRIVILEGES ON DATABASE erp_db TO erp_user;
\q

# Importar esquema inicial (si existe)
psql -U erp_user -d erp_db -a -f schema.sql

### 3. Instalación del Backend

bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/erp-backend.git
cd erp-backend

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno (crear archivo .env)
echo "DB_HOST=localhost
DB_NAME=erp_db
DB_USER=erp_user
DB_PASSWORD=tu_contraseña_segura
SECRET_KEY=$(openssl rand -hex 32)
FLASK_ENV=development" > .env

# Iniciar el servidor de desarrollo
flask run --host=0.0.0.0 --port=5000

### 4. Instalación del Frontend

bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/erp-frontend.git
cd erp-frontend

# Instalar dependencias
npm install

# Configurar la URL del backend (crear archivo .env)
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Iniciar servidor de desarrollo
npm start

### 5. Configuración para Producción (EC2)

#### Backend

bash
# Crear servicio systemd
sudo nano /etc/systemd/system/erp-backend.service

# Contenido del servicio
[Unit]
Description=ERP Backend Service
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/erp-backend
ExecStart=/home/ubuntu/erp-backend/venv/bin/gunicorn -b 0.0.0.0:5000 app.main:app
Restart=always

[Install]
WantedBy=multi-user.target

# Habilitar e iniciar el servicio
sudo systemctl enable erp-backend.service
sudo systemctl start erp-backend.service

#### Frontend

bash
# Construir aplicación para producción
cd /home/ubuntu/erp-frontend
npm run build

# Configurar Nginx
sudo nano /etc/nginx/sites-available/erp

# Contenido de la configuración
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    
    location / {
        root /home/ubuntu/erp-frontend/build;
        try_files $uri /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/erp /etc/nginx/sites-enabled/
sudo systemctl restart nginx

## Estructura de Directorios

### Backend

/backend
├── app/
│   ├── __init__.py
│   ├── main.py             # Punto de entrada y rutas principales
│   ├── schemas.py          # Validación de datos JSON
│   ├── db_service.py       # Operaciones de base de datos
│   ├── auth_service.py     # Autenticación y autorización
│   ├── reports_service.py  # Generación de informes
│   └── logger.py           # Sistema de logs
├── config.py               # Configuraciones
├── requirements.txt        # Dependencias de Python
└── README.md

### Frontend

/frontend
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   └── MetricsChart.jsx
│   │   ├── sales/
│   │   ├── branches/
│   │   ├── inventory/
│   │   └── common/
│   ├── services/
│   │   └── api.js          # Comunicación con el backend
│   ├── App.js
│   └── index.js
├── package.json
└── README.md

## Endpoints API

### Autenticación

- `POST /api/login`: Iniciar sesión
  ```json
  {
    "username": "usuario",
    "password": "contraseña"
  }
  ```

### Ventas

- `GET /api/sales`: Obtener ventas (soporta filtros via query params)
- `POST /api/sales`: Crear nueva venta
  ```json
  {
    "branch_id": 1,
    "sale_date": "2025-05-09",
    "total_amount": 150.75,
    "items": [
      {
        "product_id": 101,
        "quantity": 2,
        "price": 75.38
      }
    ]
  }
  ```

### Sucursales

- `GET /api/branches`: Obtener todas las sucursales
- `POST /api/branches`: Crear nueva sucursal
  ```json
  {
    "name": "Sucursal Central",
    "address": "Avenida Principal 123",
    "phone": "555-123-4567",
    "manager": "Juan Pérez"
  }
  ```

### Inventario

- `GET /api/inventory`: Obtener inventario (filtrar por sucursal con `?branch_id=1`)

### Métricas

- `GET /api/metrics/sales`: Métricas de ventas (soporta `?period=monthly&branch_id=1`)
- `GET /api/metrics/performance`: Métricas de rendimiento por sucursal

## Guía de Uso

### Iniciar Sesión

1. Accede a la aplicación en tu navegador
2. Ingresa tus credenciales de usuario
3. El sistema te redirigirá al dashboard principal

### Registrar una Venta

1. Navega a la sección "Ventas" desde el menú lateral
2. Haz clic en "Nueva Venta"
3. Selecciona la sucursal donde se realiza la venta
4. Agrega los productos vendidos, especificando cantidad
5. El sistema calculará automáticamente el total
6. Confirma la venta

### Consultar Métricas

1. Accede al Dashboard desde el menú principal
2. Selecciona el periodo de tiempo deseado (diario, semanal, mensual, anual)
3. Visualiza los KPIs principales y gráficos de rendimiento
4. Para métricas específicas por sucursal, selecciona la sucursal del desplegable

### Gestionar Inventario

1. Navega a la sección "Inventario"
2. Selecciona la sucursal para ver su inventario actual
3. Filtra por categoría o busca productos específicos
4. Visualiza existencias y valores de inventario

## Solución de Problemas

### El servidor backend no inicia

Verifica:
- Conexión a la base de datos (credenciales correctas)
- Permisos de los archivos
- Logs de error en `/var/log/erp-backend.log`

```bash
# Ver logs del servicio
sudo journalctl -u erp-backend.service
```

### No se puede acceder al frontend

Verifica:
- Configuración de Nginx
- Construcción correcta del frontend
- Logs de error en `/var/log/nginx/error.log`

```bash
# Verificar sintaxis de configuración Nginx
sudo nginx -t
```

### Errores de conexión a la API

Verifica:
- El backend está ejecutándose
- CORS está configurado correctamente
- URL de API correcta en la configuración frontend

## Mantenimiento

### Respaldos de Base de Datos

bash
# Crear respaldo
pg_dump -U erp_user -d erp_db > backup_$(date +%Y%m%d).sql

# Restaurar respaldo
psql -U erp_user -d erp_db < backup_20250509.sql


### Actualización del Sistema

bash
# Actualizar backend
cd /home/ubuntu/erp-backend
git pull
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart erp-backend

# Actualizar frontend
cd /home/ubuntu/erp-frontend
git pull
npm install
npm run build


## Seguridad

- Las contraseñas se almacenan con hash usando bcrypt
- Se implementa autenticación JWT con tokens de expiración
- Todas las entradas de usuario se validan y sanitizan
- Se implementa protección CSRF en formularios
- Los logs almacenan eventos críticos para auditoría

## Contribuir al Proyecto

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Realiza tus cambios
4. Ejecuta las pruebas
5. Envía un Pull Request

## Licencia

Este proyecto está licenciado bajo los términos de la licencia MIT.

---

## Contacto y Soporte

Para más información o soporte técnico:
- Email: soporte@empresa.com
- Issue Tracker: https://github.com/tu-usuario/erp/issues
