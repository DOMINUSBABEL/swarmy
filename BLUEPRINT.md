# SOCIAL MANAGER - BLUEPRINT V1.0

## Propósito
Automatizar la gestión masiva de cuentas de redes sociales desde un único archivo maestro (Excel), orquestando la creación de contenido, publicación y monitorización de distintas líneas editoriales.

## 1. Arquitectura de Datos (Excel Maestro)
El archivo `Master_Social_Manager.xlsx` será la única fuente de verdad (SSOT).

### Hoja 1: `ACCOUNTS` (Credenciales y Config)
- `account_id`: Identificador único (ej: `aguabonita_ig`, `esteban_x`).
- `platform`: `instagram`, `twitter`, `linkedin`, `facebook`, `tiktok`.
- `username`: Usuario.
- `password`: Contraseña (Encriptada o Referencia a .env).
- `auth_token`: Token de sesión (Cookies/JWT) para evitar 2FA repetitivo.
- `proxy`: IP dedicada (opcional, para evitar ban por multicuenta).
- `status`: `active`, `suspended`, `review_needed`.
- `content_lines`: Array de líneas asignadas (ej: `["educacion", "promocion", "humor"]`).

### Hoja 2: `CONTENT_LINES` (Estrategia)
- `line_id`: ID de la línea (ej: `educacion_cafe`).
- `description`: Descripción del tono y objetivo.
- `prompt_template`: Prompt base para la IA generadora.
- `frequency`: Frecuencia de publicación (ej: `daily`, `mwf`).
- `target_audience`: Público objetivo.

### Hoja 3: `CALENDAR` (Parrilla de Contenido)
- `post_id`: ID único.
- `account_id`: Cuenta destino.
- `line_id`: Línea editorial.
- `scheduled_date`: Fecha y hora de publicación.
- `status`: `draft`, `approved`, `published`, `failed`.
- `content_text`: Copy del post.
- `media_path`: Ruta local o URL de la imagen/video.
- `hashtags`: Hashtags específicos.

## 2. Stack Tecnológico
- **Orquestador:** Node.js (Clawdbot).
- **Base de Datos:** Excel (`xlsx` library) + JSON local (caché).
- **Automatización Web:** Puppeteer (Chrome Headless) para login y publicación donde no haya API.
- **Generación de Contenido:** Gemini Pro / GPT-4o (Texto e Imágenes).
- **Proxies:** Gestión de IPs rotativas si se escalan >5 cuentas.

## 3. Flujo de Trabajo (Workflow)

1.  **Planificación (Humano + IA):**
    - El humano define las líneas en `CONTENT_LINES`.
    - La IA genera ideas en `CALENDAR` con estado `draft`.
2.  **Aprobación (Humano):**
    - El humano revisa el Excel y cambia estado a `approved`.
3.  **Ejecución (Bot):**
    - Cronjob revisa `CALENDAR` cada 15 min.
    - Si encuentra `status: approved` y `scheduled_date <= now()`:
        - Inicia sesión en la cuenta (`ACCOUNTS`).
        - Publica el contenido.
        - Actualiza `status` a `published` en el Excel.

## 4. Seguridad
- Las contraseñas en el Excel deben tratarse con cuidado.
- Se recomienda usar cookies de sesión (`auth_token`) extraídas previamente para evitar logins sospechosos constantes.
- **IMPORTANTE:** El archivo Excel no se sube a repositorios públicos.

## 5. Roadmap Fase 1
- [ ] Crear estructura de carpetas y `package.json`.
- [ ] Crear script `generate_master_excel.js` para inicializar la plantilla.
- [ ] Crear script `post_twitter.js` (Prueba de concepto con Puppeteer).
- [ ] Crear script `scheduler.js` para leer el Excel y despachar tareas.
