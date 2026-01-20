"""
Script auxiliar para ejecutar el backend desde cualquier ubicación
Este script debe estar en la raíz del proyecto
"""
import os
import sys
import subprocess
from pathlib import Path

# Obtener el directorio donde está este script (raíz del proyecto)
ROOT_DIR = Path(__file__).parent.resolve()
BACKEND_RUN = ROOT_DIR / 'backend' / 'run.py'

# Verificar que el archivo existe
if not BACKEND_RUN.exists():
    print(f"[ERROR] No se encontró: {BACKEND_RUN}")
    print(f"[ERROR] Asegúrate de ejecutar este script desde la raíz del proyecto")
    sys.exit(1)

# Cambiar al directorio raíz
os.chdir(str(ROOT_DIR))

# Ejecutar el script del backend
print(f"[INFO] Ejecutando backend desde: {ROOT_DIR}")
print(f"[INFO] Script: {BACKEND_RUN}\n")

try:
    # Ejecutar usando el mismo intérprete de Python
    subprocess.run([sys.executable, str(BACKEND_RUN)], check=True)
except KeyboardInterrupt:
    print("\n[INFO] Proceso detenido por el usuario")
    sys.exit(0)
except subprocess.CalledProcessError as e:
    print(f"\n[ERROR] Error al ejecutar backend: {e}")
    sys.exit(1)
