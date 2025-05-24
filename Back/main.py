# Importar servicios con manejo de errores
try:
    # Usar versiones mock (sin PostgreSQL)
    import mock_db_service as db_service
    import auth_service  
    import mock_reports_service as reports_service
    import logger
    import schemas_fastapi as schemas
except ImportError as e:
    print(f"❌ Error importando módulos: {e}")
    print("📁 Verifica que tienes estos archivos:")
    print("   - mock_db_service.py")
    print("   - auth_service.py") 
    print("   - mock_reports_service.py")
    print("   - logger.py")
    print("   - schemas_fastapi.py")
    print("   - config.py")
    exit(from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import jwt
import datetime
import traceback

# Importar servicios con manejo de errores
try:
    # Intentar importar desde la carpeta app
    from app import auth_service, reports_service, logger
    from app import schemas
    # Usar versión mock de db_service (sin PostgreSQL)
    import mock_db_service as db_service
except ImportError:
    try:
        # Si están en la raíz del proyecto
        import auth_service  
        import reports_service
        import logger
        import schemas_fastapi as schemas
        # Usar versión mock de db_service (sin PostgreSQL)
        import mock_db_service as db_service
    except ImportError as e:
        print(f"❌ Error importando módulos: {e}")
        print("📁 Verifica que tienes estos archivos:")
        print("   - mock_db_service.py")
        print("   - auth_service.py") 
        print("   - reports_service.py")
        print("   - logger.py")
        print("   - schemas_fastapi.py")
        print("   - config.py")
        exit(1)

try:
    from config import SECRET_KEY, JWT_SECRET, JWT_EXPIRATION
except ImportError:
    print("❌ Error: No se encuentra config.py")
    print("📝 Crea el archivo config.py con las variables necesarias")
    exit(1)

# Crear aplicación FastAPI
app = FastAPI(
    title="ERP System API",
    description="Sistema ERP para gestión de ventas, inventario y sucursales",
    version="1.0.0",
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc"  # ReDoc
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurar autenticación
security = HTTPBearer()

# Variable global para almacenar info del usuario autenticado
class CurrentUser:
    def __init__(self):
        self.user_id = None
        self.username = None
        self.role = None
        self.branch_id = None

current_user = CurrentUser()

# Dependencia para autenticación
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        
        # Actualizar información del usuario actual
        current_user.user_id = payload['user_id']
        current_user.username = payload['username']
        current_user.role = payload['role']
        current_user.branch_id = payload.get('branch_id')
        
        return current_user
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )

# Dependencia para solo administradores
async def admin_required(user: CurrentUser = Depends(get_current_user)):
    if user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No autorizado - Se requieren permisos de administrador"
        )
    return user

# Dependencia para administradores y managers
async def manager_required(user: CurrentUser = Depends(get_current_user)):
    if user.role not in ['admin', 'manager']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No autorizado - Se requieren permisos de administrador o manager"
        )
    return user

# Manejador de errores global
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.log_error(str(exc), traceback.format_exc())
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Error interno del servidor"
    )

# ========== MODELOS PYDANTIC BÁSICOS ==========

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

# ========== ENDPOINTS ==========

# Endpoint de información
@app.get("/", tags=["Info"])
async def root():
    return {
        "message": "ERP System API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "online"
    }

# ========== AUTENTICACIÓN ==========

@app.post("/api/login", tags=["Autenticación"])
async def login(credentials: LoginRequest):
    result = auth_service.login(credentials.username, credentials.password)
    
    if result.get('success'):
        logger.log_event('LOGIN_SUCCESS', user=credentials.username)
        return result
    
    logger.log_event('LOGIN_FAILED', user=credentials.username)
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=result.get('message', 'Error de autenticación')
    )

@app.post("/api/register", tags=["Autenticación"])
async def register_user(user_data: UserCreate, admin: CurrentUser = Depends(admin_required)):
    # Validar datos usando schemas legacy
    user_dict = user_data.dict()
    if hasattr(schemas, 'validate_user'):
        if not schemas.validate_user(user_dict):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Datos de usuario inválidos"
            )
    
    result = auth_service.register_user(user_dict)
    
    if result.get('success'):
        logger.log_event('USER_CREATED', created_by=admin.username, user=user_data.username)
        return {
            "message": "Usuario creado correctamente",
            "user_id": result.get('user_id')
        }
    
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=result.get('message', 'Error al crear usuario')
    )

# ========== VENTAS ==========

@app.get("/api/sales", tags=["Ventas"])
async def get_sales(
    branch_id: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    user: CurrentUser = Depends(get_current_user)
):
    # Restricción por rol: si no es admin, solo ve ventas de su sucursal
    if user.role != 'admin' and user.branch_id and branch_id != user.branch_id:
        branch_id = user.branch_id
    
    sales = db_service.get_sales(branch_id, date_from, date_to)
    return sales

@app.post("/api/sales", tags=["Ventas"])
async def create_sale(sale_data: SaleCreate, user: CurrentUser = Depends(get_current_user)):
    sale_dict = sale_data.dict()
    
    # Restricción por rol: solo puede crear ventas en su sucursal
    if user.role != 'admin' and user.branch_id and user.branch_id != sale_dict.get('branch_id'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No autorizado para crear ventas en esta sucursal"
        )
    
    # Verificar stock
    inventory_check = db_service.check_inventory(sale_dict)
    if not inventory_check['success']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=inventory_check['message']
        )
    
    # Agregar información de usuario que registra
    sale_dict['created_by'] = user.user_id
    
    # Guardar venta en base de datos
    sale_id = db_service.insert_sale(sale_dict)
    
    # Actualizar inventario
    db_service.update_inventory(sale_dict)
    
    # Registrar evento
    logger.log_event('SALE_CREATED', user=user.username, sale_id=sale_id)
    
    return {
        'sale_id': sale_id,
        'status': 'completed'
    }

@app.get("/api/sales/{sale_id}", tags=["Ventas"])
async def get_sale_details(sale_id: int, user: CurrentUser = Depends(get_current_user)):
    sale = db_service.get_sale_by_id(sale_id)
    
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venta no encontrada"
        )
    
    # Verificar permisos: admin ve todo, otros solo ven ventas de su sucursal
    if user.role != 'admin' and user.branch_id and user.branch_id != sale.get('branch_id'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No autorizado"
        )
    
    return sale

# ========== SUCURSALES ==========

@app.get("/api/branches", tags=["Sucursales"])
async def get_branches(user: CurrentUser = Depends(get_current_user)):
    branches = db_service.get_branches()
    return branches

@app.post("/api/branches", tags=["Sucursales"])
async def create_branch(branch_data: BranchCreate, admin: CurrentUser = Depends(admin_required)):
    branch_dict = branch_data.dict()
    
    # Guardar sucursal en base de datos
    branch_id = db_service.insert_branch(branch_dict)
    
    # Registrar evento
    logger.log_event('BRANCH_CREATED', user=admin.username, branch_id=branch_id)
    
    return {
        'branch_id': branch_id,
        'status': 'completed'
    }

@app.put("/api/branches/{branch_id}", tags=["Sucursales"])
async def update_branch(branch_id: int, branch_data: BranchUpdate, admin: CurrentUser = Depends(admin_required)):
    # Verificar que la sucursal existe
    if not db_service.branch_exists(branch_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sucursal no encontrada"
        )
    
    # Actualizar sucursal
    branch_dict = branch_data.dict(exclude_unset=True)  # Solo campos que fueron enviados
    db_service.update_branch(branch_id, branch_dict)
    
    # Registrar evento
    logger.log_event('BRANCH_UPDATED', user=admin.username, branch_id=branch_id)
    
    return {
        'branch_id': branch_id,
        'status': 'updated'
    }

# ========== INVENTARIO ==========

@app.get("/api/inventory", tags=["Inventario"])
async def get_inventory(
    branch_id: Optional[int] = None,
    product_id: Optional[int] = None,
    user: CurrentUser = Depends(get_current_user)
):
    # Restricción por rol: si no es admin, solo ve inventario de su sucursal
    if user.role != 'admin' and user.branch_id and branch_id != user.branch_id:
        branch_id = user.branch_id
    
    inventory = db_service.get_inventory(branch_id, product_id)
    return inventory

@app.post("/api/inventory", tags=["Inventario"])
async def add_inventory(inventory_data: InventoryAdd, user: CurrentUser = Depends(manager_required)):
    inventory_dict = inventory_data.dict()
    
    # Verificar permiso por sucursal
    if user.role != 'admin' and user.branch_id and user.branch_id != inventory_dict.get('branch_id'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No autorizado para modificar inventario de esta sucursal"
        )
    
    # Ejecutar operación
    inventory_id = db_service.add_inventory(inventory_dict)
    
    # Registrar evento
    logger.log_event('INVENTORY_ADDED', 
                    user=user.username, 
                    branch_id=inventory_dict.get('branch_id'),
                    product_id=inventory_dict.get('product_id'),
                    quantity=inventory_dict.get('quantity'))
    
    return {
        'inventory_id': inventory_id,
        'status': 'completed'
    }

# ========== PRODUCTOS ==========

@app.get("/api/products", tags=["Productos"])
async def get_products(
    category: Optional[str] = None,
    name: Optional[str] = None,
    user: CurrentUser = Depends(get_current_user)
):
    products = db_service.get_products(category, name)
    return products

@app.post("/api/products", tags=["Productos"])
async def create_product(product_data: ProductCreate, admin: CurrentUser = Depends(admin_required)):
    product_dict = product_data.dict()
    
    # Guardar producto
    product_id = db_service.insert_product(product_dict)
    
    # Registrar evento
    logger.log_event('PRODUCT_CREATED', user=admin.username, product_id=product_id)
    
    return {
        'product_id': product_id,
        'status': 'completed'
    }

# ========== MÉTRICAS ==========

@app.get("/api/metrics/sales", tags=["Métricas"])
async def get_sales_metrics(
    period: str = "monthly",
    branch_id: Optional[int] = None,
    user: CurrentUser = Depends(get_current_user)
):
    # Restricción por rol: si no es admin, solo ve métricas de su sucursal
    if user.role != 'admin' and user.branch_id:
        branch_id = user.branch_id
    
    metrics = reports_service.generate_sales_metrics(period, branch_id)
    return metrics

@app.get("/api/metrics/performance", tags=["Métricas"])
async def get_branch_performance(user: CurrentUser = Depends(get_current_user)):
    # Solo administradores pueden ver el rendimiento de todas las sucursales
    if user.role != 'admin':
        metrics = reports_service.generate_branch_performance(user.branch_id)
    else:
        metrics = reports_service.generate_branch_performance()
    
    return metrics

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
    