"""
Módulo de APIs

Estructura modular de manifiestos:
- manifiestos_folders: Gestión de carpetas y overview
- manifiestos_upload: Subida de archivos PDF
- manifiestos_data: Consulta de datos (PDFs, manifiestos, conductores)
- manifiestos_processing: Procesamiento de manifiestos
- manifiestos_qr: Operaciones QR (legacy - requiere migración)
- manifiestos_pdf_ops: Operaciones sobre PDFs (páginas, thumbnails, etc.)
"""
# Importar blueprints para que Flask los registre
from app.api import (
    auth, 
    usuarios, 
    operaciones, 
    gastos,
    manifiestos_folders,
    manifiestos_upload,
    manifiestos_data,
    manifiestos_processing,
    manifiestos_qr,
    manifiestos_pdf_ops
)

__all__ = [
    'auth', 
    'usuarios', 
    'operaciones', 
    'gastos',
    'manifiestos_folders',
    'manifiestos_upload',
    'manifiestos_data',
    'manifiestos_processing',
    'manifiestos_qr',
    'manifiestos_pdf_ops'
]
