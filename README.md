# 🏛️ SOCIAL MANAGER SWARM
**Arquitectura de Viralización Autónoma & Gestión de Identidades Múltiples**

---

### 📜 Manifiesto
En la era de la economía de la atención, la omnipresencia no es una opción; es un mandato. Este sistema no es un simple programador de publicaciones. Es un **Enjambre Digital (Digital Swarm)** diseñado para amplificar narrativas, dominar nichos y simular comportamiento orgánico a escala masiva.

Desarrollado con precisión diplomática por **Consultora Talleyrand**.

---

## 🚀 Capacidades del Sistema

### 1. Gestión Centralizada (The Master Brain)
Todo el enjambre se controla desde un único archivo: `Master_Social_Creds.xlsx`.
- **Hoja ACCOUNTS:** Gestiona 10, 50 o 100 identidades con sus credenciales, proxies y estados.
- **Hoja CONTENT_LINES:** Define la estrategia. ¿Qué opina el enjambre sobre IA? ¿Sobre política? ¿Sobre café?
- **Hoja CALENDAR:** El tablero de ajedrez donde se orquestan los movimientos (posts).

### 2. Motor de Identidad (Persona Engine) 🎭
El sistema no publica texto plano. Inyecta personalidad:
- **El Visionario Tech:** Optimista, usa emojis de cohetes, habla de futuro.
- **El Shitposter:** Caótico, minúsculas, memes, sin filtros.
- **El Analista:** Serio, datos duros, hilos profundos.
*Cada cuenta tiene una voz única para evitar la detección de patrones.*

### 3. Ejecución Asíncrona (Queue Worker) ⚙️
Para evitar bloqueos de IP y colapso de hardware:
- **Concurrencia Controlada:** Procesa bloques de 3 cuentas simultáneamente.
- **Aislamiento de Sesión:** Cada agente vive en su propio contenedor de cookies/cache.
- **Wait Times Humanos:** Tiempos de espera aleatorios entre acciones.

---

## 🛠️ Manual Operativo

### Fase 1: Inicialización
1.  Clonar el repositorio.
2.  Instalar dependencias: `npm install`
3.  Configurar variables de entorno:
    - Copiar `.env.template` a `.env`.
    - Rellenar las contraseñas en `.env`.
4.  Generar la matriz de control: `npm run init` (Crea el Excel base inyectando las credenciales).

### Fase 2: Configuración del Enjambre
Abra `Master_Social_Creds.xlsx` y configure sus activos:
- **Username/Password:** Credenciales de acceso.
- **Proxy:** OBLIGATORIO para >5 cuentas (`http://user:pass@ip:port`).
- **Status:** Marque como `active` las cuentas listas para despliegue.

### Fase 3: Despliegue
Ejecute el orquestador:
```bash
npm start
```
El sistema leerá el Excel, detectará tareas pendientes (`status: approved`) y lanzará los agentes necesarios.

### Fase 4: Generación de Contenido (IA)
Para poblar el calendario con ideas frescas basadas en las personalidades:
```bash
node scripts/content_engine.js
```

---

## 🔒 Protocolo de Seguridad & Anti-Ban

1.  **IP Rotation:** Cada identidad debe estar vinculada a una IP residencial estática (Sticky IP) en el Excel.
2.  **Fingerprint:** El navegador Puppeteer está configurado para evadir detección básica de bots.
3.  **Rate Limits:** El scheduler respeta los límites de la API (no oficial) simulando pausas humanas.

---

## 🏗️ Arquitectura Técnica

`Scheduler.js` (Cerebro) 
   │
   ├──> Lee Excel (Estado del Mundo)
   │
   ├──> Filtra Tareas (`approved` + `time <= now`)
   │
   └──> Despacha a `Worker Queue` (Max 3 threads)
           │
           ├──> `Worker A` (Cuenta 1) --> Login --> Post --> Logout
           ├──> `Worker B` (Cuenta 2) --> Login --> Post --> Logout
           └──> ...

---

**© 2026 Consultora Talleyrand.**
*Digital Diplomacy & Strategic Automation.*
