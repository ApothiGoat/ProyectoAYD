import logging
import json
import os
from datetime import datetime
from config import LOG_LEVEL, LOG_FILE

# Configurar el logger
logging.basicConfig(
    filename=LOG_FILE,
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger('erp_system')

# Agregar handler para la consola
console_handler = logging.StreamHandler()
console_handler.setLevel(getattr(logging, LOG_LEVEL))
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

def log_event(event_type, **kwargs):
    """Registrar un evento del sistema"""
    # Crear objeto de evento
    event = {
        'timestamp': datetime.now().isoformat(),
        'event_type': event_type,
        'details': kwargs
    }
    
    # Registrar en el log
    logger.info(f"EVENT: {event_type} - {json.dumps(kwargs)}")
    
    # Aquí podrías también almacenar el evento en la base de datos
    # db_service.insert_system_log(event_type, kwargs)
    
    return event

def log_error(error_message, stack_trace=None):
    """Registrar un error del sistema"""
    # Crear objeto de error
    error = {
        'timestamp': datetime.now().isoformat(),
        'error_message': error_message,
        'stack_trace': stack_trace
    }
    
    # Registrar en el log
    logger.error(f"ERROR: {error_message}")
    if stack_trace:
        logger.error(f"TRACE: {stack_trace}")
    
    # Aquí podrías también almacenar el error en la base de datos
    
    return error
    