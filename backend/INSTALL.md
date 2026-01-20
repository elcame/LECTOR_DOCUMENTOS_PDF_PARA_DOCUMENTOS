# Guía de Instalación de Dependencias

## Instalación Estándar

```bash
# 1. Actualizar pip y herramientas
python -m pip install --upgrade pip setuptools wheel

# 2. Instalar dependencias
pip install -r requirements.txt
```

## Si tienes problemas con Pillow o pyzbar

### Opción 1: Instalación paso a paso

```bash
# Actualizar herramientas
python -m pip install --upgrade pip setuptools wheel

# Instalar dependencias base
pip install Flask Flask-CORS Werkzeug python-dotenv

# Instalar Firebase
pip install firebase-admin google-cloud-firestore

# Instalar Pillow (puede requerir compilación)
pip install Pillow

# Instalar procesamiento de datos
pip install pandas numpy PyMuPDF openpyxl

# pyzbar es opcional (requiere librerías del sistema)
# pip install pyzbar
```

### Opción 2: Instalación mínima (solo esenciales)

```bash
# Instalar solo lo esencial para que el backend funcione
pip install -r requirements-minimal.txt
```

### Opción 3: Instalar Pillow desde wheel precompilado

```bash
# Forzar instalación desde wheel (sin compilar)
pip install --only-binary :all: Pillow
```

## Solución de Problemas

### Error: KeyError '__version__'
```bash
# Actualizar setuptools
pip install --upgrade --force-reinstall setuptools
pip install --upgrade wheel
```

### Error al compilar Pillow
```bash
# Limpiar caché e instalar desde wheel
pip cache purge
pip install --only-binary :all: Pillow
```

### Error con pyzbar
```bash
# pyzbar es opcional, puedes comentarlo en requirements.txt
# O instalar desde binario:
pip install pyzbar-bin
```

## Verificar Instalación

```bash
# Verificar que las dependencias principales están instaladas
python -c "import flask, firebase_admin, pandas; print('OK')"
```

## Notas

- **Pillow**: Puede requerir compilación en Windows. Usa `--only-binary :all:` si tienes problemas.
- **pyzbar**: Requiere librerías del sistema (zbar). Es opcional si no procesas códigos QR.
- **Python 3.13**: Algunos paquetes pueden no estar completamente compatibles. Considera usar Python 3.11 o 3.12.
