# 📄 Extractor de Datos de Manifiestos

Una aplicación web moderna para extraer datos estructurados de archivos PDF de manifiestos de transporte.

## 🚀 Características

- **Interfaz Web Moderna**: Diseño responsive con drag & drop
- **Procesamiento Automático**: Extrae datos de múltiples PDFs simultáneamente
- **Exportación a Excel**: Genera archivos Excel organizados automáticamente
- **Datos Extraídos**:
  - Fecha de inicio y retorno
  - Hora de inicio y retorno
  - Mes en español
  - Load ID
  - Conductor
  - Placa del vehículo
  - KOF
  - Remesa KBQ
  - Destino y origen
  - Empresa

## 🛠️ Instalación

### Requisitos
- Python 3.8 o superior
- pip (gestor de paquetes de Python)

### Pasos de instalación

1. **Clona o descarga el proyecto**
   ```bash
   git clone <url-del-repositorio>
   cd LECTOR-DE-MANIFIESTOS
   ```

2. **Instala las dependencias**
   ```bash
   pip install -r requirements.txt
   ```

3. **Ejecuta la aplicación**
   ```bash
   python app.py
   ```

4. **Abre tu navegador**
   - Ve a: `http://localhost:5000`
   - O usa: `http://127.0.0.1:5000`

## 📖 Uso

### Aplicación Web (Recomendado)

1. **Abrir la aplicación**: Navega a `http://localhost:5000`
2. **Seleccionar archivos**: Arrastra y suelta los PDFs o haz clic para seleccionar
3. **Procesar**: Haz clic en "Procesar archivos PDF"
4. **Descargar**: Descarga el archivo Excel generado

### Aplicación de Escritorio (Tkinter)

1. **Ejecutar aplicación de escritorio**:
   ```bash
   python CODIGO.py
   ```

2. **Seleccionar carpeta**: Usa el botón para elegir la carpeta con PDFs
3. **Ver resultados**: Los datos se mostrarán en la interfaz
4. **Archivos Excel**: Se guardan automáticamente en la carpeta `reportes/`

## 📁 Estructura del Proyecto

```
LECTOR-DE-MANIFIESTOS/
├── app.py                 # Aplicación Flask (Web)
├── CODIGO.py             # Aplicación Tkinter (Escritorio)
├── requirements.txt      # Dependencias de Python
├── README.md            # Este archivo
├── templates/
│   └── index.html       # Interfaz web
├── reportes/            # Archivos Excel generados
├── uploads/             # Archivos temporales (Web)
└── 01-02-2025/         # Carpeta de ejemplo con PDFs
```

## 🔧 Configuración

### Variables de Entorno (Opcional)

Puedes configurar estas variables de entorno:

- `FLASK_ENV`: `development` o `production`
- `FLASK_DEBUG`: `True` o `False`
- `UPLOAD_FOLDER`: Carpeta para archivos temporales (default: `uploads`)

### Personalización

Para modificar las expresiones regulares de extracción, edita la función `datosmanifiesto()` en `app.py` o `CODIGO.py`.

## 📊 Datos Extraídos

La aplicación extrae automáticamente:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Fecha Inicio | Fecha de inicio del viaje | 09.05.2025 |
| Fecha Retorno | Fecha de retorno | 09.05.2025 |
| Hora Inicio | Hora de inicio | 08:11:21 |
| Hora Retorno | Hora de retorno | 11:30:24 |
| Mes | Mes en español | MAYO |
| Load ID | Identificador de carga | 4392919 |
| Conductor | Nombre del conductor | WALTER ANTONIO NARVAEZ |
| Placa | Placa del vehículo | XMC195 |
| KOF | Código KOF | 602487807 |
| Remesa | Número de remesa KBQ | KBQ63643 |
| Destino | Ciudad de destino | Barranquilla |
| Origen | Ciudad de origen | BARRANQUILLA |
| Empresa | Nombre de la empresa | CAMELO ARENAS GUILLERMO ANDRES |

## 🐛 Solución de Problemas

### Error: "No module named 'fitz'"
```bash
pip install PyMuPDF
```

### Error: "No module named 'pandas'"
```bash
pip install pandas
```

### Error: "No module named 'flask'"
```bash
pip install Flask
```

### Error de permisos en Windows
Ejecuta el terminal como administrador o usa un entorno virtual.

## 📝 Notas

- Los archivos PDF se procesan temporalmente y se eliminan después del procesamiento
- Los archivos Excel se guardan en la carpeta `reportes/` con timestamp
- La aplicación es compatible con Windows, macOS y Linux
- Se recomienda usar la versión web para mejor experiencia de usuario

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes problemas o preguntas:

1. Revisa la sección de solución de problemas
2. Verifica que todas las dependencias estén instaladas
3. Asegúrate de usar Python 3.8 o superior
4. Crea un issue en el repositorio

---

**Desarrollado con ❤️ para facilitar el procesamiento de manifiestos de transporte**
