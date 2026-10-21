# flash — Port Virtual Flash

Actividad gamificada de Port Virtual Lab (Escola Europea): misión de transporte intermodal
Tecnomaq LT-2000, Egipto → Bari. Todo se publica con GitHub Pages; los datos viven en Google Sheets
a través de una Web App de Apps Script (`Code.gs`).

## Páginas
| Dirección | Para quién | Qué es |
|---|---|---|
| [`/`](https://portvirtuallab.github.io/flash/) | Alumnos | Bienvenida (*Welcome Participants* → *Ready to go*) |
| [`/launch/`](https://portvirtuallab.github.io/flash/launch/) | Alumnos | Previa (*LAUNCH*) |
| [`/mission/`](https://portvirtuallab.github.io/flash/mission/) | Alumnos | La misión (login con el código del equipo) |
| [`/docs/`](https://portvirtuallab.github.io/flash/docs/) | Alumnos | Documentos de referencia (carta, factura y packing list, EUR.1, instrucciones de embarque, datasheet, cotización PlayForwarding, plantilla rellenable del informe) |
| [`/demo/`](https://portvirtuallab.github.io/flash/demo/) | Demo | La misión real en modo demo: código `0000`, no corrige ni guarda nada |
| [`/trainer/`](https://portvirtuallab.github.io/flash/trainer/) | Formador | Panel: presentación, ruleta, bienvenida, marcador, demo, Kahoot |
| [`/trainer/roulette/`](https://portvirtuallab.github.io/flash/trainer/roulette/) | Formador | Ruleta de equipos (código TRAINER) |
| [`/trainer/scoreboard/`](https://portvirtuallab.github.io/flash/trainer/scoreboard/) | Formador | Marcador en directo (código TRAINER) |

## Cómo funciona
```
GitHub Pages  --fetch POST-->  Apps Script Web App (Code.gs)  -->  Google Sheet
                                · login por código de equipo     · Sheet1       (alumnos: firstname, lastname, email, gender)
                                · corrige tareas y quiz          · Sheet2       (equipos y credenciales)
                                · tiempo y no repetir            · State        (progreso por equipo)
                                · ruleta, correos y marcador     · Results      (registro de eventos)
                                  (solo con el código TRAINER)   · Assignments  (último reparto de la ruleta)
```
El servidor es quien manda: corrige, guarda el progreso y no acepta tareas repetidas ni envíos fuera de
tiempo. La hoja **no** tiene que ser pública: nada lee la hoja directamente.

## Archivos
| Archivo | Qué es |
|---|---|
| `index.html`, `launch/`, `mission/`, `demo/`, `trainer/` | Las páginas |
| `assets/site.css`, `assets/trainer.js` | Estilos comunes y acceso del formador |
| `config.js` | URL de la Web App de Apps Script (`apiUrl`) |
| `Code.gs` | API en Apps Script. **No** contiene respuestas |
| `mission-key.json` | Respuestas, puntos y pistas. **Privado: no está en el repo** (`.gitignore`) |

## Documentos de referencia (`/docs/`)
- Todos leen sus datos de **`docs/case.js`**: cambia un valor ahí (valor, medidas, pesos, empresas, puertos) y cambia en todos los documentos.
- Las fechas son **desplazamientos en días** respecto al día en que se abre la página (`dates` en `case.js`).
- Cada documento se imprime o guarda en PDF en A4 con el botón *Print / Save as PDF*.
- La cotización de PlayForwarding contiene a propósito incoherencias para la tarea 2. La lista está en las notas privadas del formador, fuera del repositorio.

## Puesta en marcha
1. **Apps Script:** pega `Code.gs` en el proyecto.
2. **Propiedades del script:** `ERP_USER`, `ERP_PASS` y `MISSION_KEY` (contenido de `mission-key.json`).
3. **Implementar → Gestionar implementaciones → Editar → Nueva versión**, acceso **Cualquier usuario**.
   La URL `/exec` no cambia. Si es la primera vez con la ruleta, Google pide permiso para enviar correos.
4. **GitHub Pages:** Settings → Pages → `main` / `(root)`.

## En cada sesión
- **Antes:** en el editor de Apps Script ejecuta `resetAllProgress()` (borra `State`; `Results` se conserva).
- **Ruleta:** `/trainer/roulette/` con el código del equipo **TRAINER**. *Generate Teams* reparte a los
  alumnos de `Sheet1` (mezclando géneros) entre los equipos de `Sheet2` (sin TRAINER ni SALES TEAM),
  guarda el reparto en `Assignments` y permite enviar a cada alumno un correo con su equipo y su código.
- **Durante:** `/trainer/scoreboard/` muestra en directo puntos, tareas, quiz, pistas y tiempo de cada equipo.

## Seguridad
- No subas contraseñas ni respuestas al repositorio: es público.
- Tras 15 códigos erróneos en un minuto, la API se bloquea 1 minuto (evita adivinar los códigos de 4 dígitos).
- Las páginas del formador solo funcionan con el código TRAINER; sin él no muestran datos.
