# flash — PVL.ONE Intermodal Transport Mission

Actividad gamificada de Port Virtual Lab (Escola Europea): misión de transporte intermodal
Tecnomaq LT-2000, Egipto → Bari. Web App de Google Apps Script (HtmlService).

## Archivos
- `Code.gs` — servidor Apps Script (login por código de equipo, guardado de resultados en la hoja).
- `Index.html` — interfaz de la misión (tareas, temporizador, XP, badges, quiz).

## Despliegue
1. script.google.com > nuevo proyecto. Pega `Code.gs` y crea un archivo HTML llamado `Index`.
2. Configuración del proyecto > Propiedades del script: añade `ERP_USER` y `ERP_PASS`
   (login inicial compartido del ERP; no se guardan en el repositorio).
3. Implementar > Nueva implementación > Aplicación web (Ejecutar como: Yo).
4. Comparte la URL `/exec` con los equipos.

> No subas contraseñas ni credenciales al repositorio: el repo es público.
