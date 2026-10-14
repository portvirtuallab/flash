# flash — PVL.ONE Intermodal Transport Mission

Actividad gamificada de Port Virtual Lab (Escola Europea): misión de transporte intermodal
Tecnomaq LT-2000, Egipto → Bari.

- **Web (GitHub Pages):** https://portvirtuallab.github.io/flash/
- **Datos (Google Sheets):** a través de una Web App de Apps Script (`Code.gs`).

## Cómo funciona
```
GitHub Pages (index.html)  --fetch POST-->  Apps Script Web App (Code.gs)  -->  Google Sheet
                                             · login por código de equipo     · Sheet2  (equipos)
                                             · corrige las tareas y el quiz   · State   (progreso por equipo)
                                             · controla el tiempo y repetir   · Results (registro de eventos)
```
El servidor es quien manda: corrige, guarda el progreso y no acepta tareas repetidas ni
envíos fuera de tiempo. Si un equipo recarga la página o cambia de ordenador, vuelve a entrar
con su código y recupera su progreso.

## Archivos
| Archivo | Qué es |
|---|---|
| `index.html` | La misión (lo que publica GitHub Pages). |
| `config.js` | URL de la Web App de Apps Script (`apiUrl`). |
| `Code.gs` | API en Apps Script. **No** contiene respuestas. |
| `mission-key.json` | Respuestas, puntos y pistas. **Privado: no está en el repo** (`.gitignore`). |

## Puesta en marcha (una vez)
1. **Apps Script:** script.google.com → nuevo proyecto → pega `Code.gs` (no hace falta HTML).
2. **Propiedades del script** (Configuración del proyecto → Propiedades del script):
   - `ERP_USER` / `ERP_PASS`: login inicial compartido del ERP.
   - `MISSION_KEY`: pega el contenido completo de `mission-key.json`.
3. **Implementar → Nueva implementación → Aplicación web**
   - Ejecutar como: **Yo** · Quién tiene acceso: **Cualquier usuario** (necesario para que GitHub Pages pueda llamarla).
4. Copia la URL `/exec` en `config.js` (`apiUrl`), haz commit y push.
5. **GitHub Pages:** Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)` → Save.

Si cambias `Code.gs`, vuelve a implementar con *Gestionar implementaciones → Editar → Nueva versión*
para que la URL `/exec` no cambie.

## Entre sesiones
- Para repetir la actividad con los mismos códigos: en el editor de Apps Script ejecuta
  `resetAllProgress()` (borra la hoja `State`; el registro `Results` se conserva).
- Para cambiar respuestas o pistas: edita `mission-key.json` y vuelve a pegarlo en `MISSION_KEY`.

## Seguridad
- No subas contraseñas ni respuestas al repositorio: es público.
- Tras 15 códigos erróneos en un minuto, la API se bloquea 1 minuto (evita adivinar los códigos de 4 dígitos).
