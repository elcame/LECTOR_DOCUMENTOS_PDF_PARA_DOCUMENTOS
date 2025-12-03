# Dockerfile para despliegue en Railway, Fly.io u otras plataformas
FROM python:3.11-slim

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# Copiar requirements y instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Agregar gunicorn para producción
RUN pip install --no-cache-dir gunicorn

# Copiar código de la aplicación
COPY . .

# Crear directorios de almacenamiento persistente
RUN mkdir -p /data/MANIFIESTOS /data/EXCEL /data/data

# Variables de entorno
ENV PYTHONUNBUFFERED=1
ENV STORAGE_TYPE=local
ENV BASE_FOLDER=MANIFIESTOS
ENV EXCEL_FOLDER=EXCEL
ENV DATA_FOLDER=data

# Exponer puerto
EXPOSE 8080

# Comando para iniciar la aplicación
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--timeout", "120", "app:app"]

