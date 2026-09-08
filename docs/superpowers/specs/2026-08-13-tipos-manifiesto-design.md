# Tipos de manifiesto

Fecha: 2026-08-13

## Objetivo

Clasificar carpetas y manifiestos con un catálogo de nombres (por ejemplo Nacional, Exportación, Urbano). El catálogo vive en **Administrador de operación**, no en Administración.

## Decisiones

- Catálogo `tipos_manifiesto`: crear, editar nombre y desactivar. No se borra si ya se usó.
- El tipo se elige en **Cargar y procesar** (paso Carpeta) de una lista existente. No se crea desde el asistente.
- El tipo se guarda en la carpeta (`carpetas_meta`) y se denormaliza en cada manifiesto (`tipo_id`, `tipo_nombre`).
- Al cambiar el tipo de una carpeta se pregunta si también se aplica a sus manifiestos.
- Cada manifiesto suelto puede cambiar de tipo en la tabla.

## Navegación

| Control | Destino |
| --- | --- |
| Tipos de manifiesto | `/administrador-operacion/tipos` |

## API

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/tipos-manifiesto` | Listar (`active_only`) |
| POST | `/api/tipos-manifiesto` | Crear |
| PUT | `/api/tipos-manifiesto/<id>` | Renombrar (propaga `tipo_nombre`) |
| DELETE | `/api/tipos-manifiesto/<id>` | Desactivar |
| POST | `/api/manifiestos/folder_tipo` | Asignar tipo a carpeta (`apply_to_manifiestos`) |
| POST | `/api/manifiestos/process_folder` | Acepta `tipo_id` opcional |
| POST | `/api/manifiestos/update_field` | `field=tipo_id` también guarda `tipo_nombre` |
