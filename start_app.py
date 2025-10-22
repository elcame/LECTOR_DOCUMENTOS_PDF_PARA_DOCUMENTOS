#!/usr/bin/env python3
"""
Script de inicio para Lector de Manifiestos
Abre automáticamente el navegador y ejecuta la aplicación
"""

import webbrowser
import time
import subprocess
import sys
import os
import threading

def open_browser_delayed():
    """Abrir el navegador después de que el servidor esté listo"""
    time.sleep(2)  # Esperar a que el servidor esté completamente iniciado
    webbrowser.open('http://127.0.0.1:5000')
    print("\n🌐 Navegador abierto automáticamente!")
    print("💡 Si no se abre automáticamente, ve a: http://127.0.0.1:5000")

def main():
    print("🚀 Iniciando Lector de Manifiestos...")
    print("📄 Preparando aplicación...")
    
    # Iniciar el hilo para abrir el navegador
    browser_thread = threading.Thread(target=open_browser_delayed)
    browser_thread.daemon = True
    browser_thread.start()
    
    # Ejecutar la aplicación principal
    try:
        # Si estamos en un entorno PyInstaller
        if getattr(sys, 'frozen', False):
            # Ejecutar el módulo app directamente
            import app
        else:
            # Ejecutar con subprocess
            subprocess.run([sys.executable, 'app.py'])
    except KeyboardInterrupt:
        print("\n👋 Aplicación cerrada por el usuario")
    except Exception as e:
        print(f"❌ Error al ejecutar la aplicación: {e}")
        input("Presiona Enter para salir...")

if __name__ == '__main__':
    main()
