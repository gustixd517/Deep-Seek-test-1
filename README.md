# KAOS · Colación 2026

Página web para registrar a los invitados de la colación del curso **KAOS**. Cada alumno puede invitar hasta **19 personas**.

## Cómo abrirla

No requiere instalación ni servidor. Abre `index.html` en un navegador moderno (Chrome, Edge, Firefox o Safari).

También puedes servirla localmente si prefieres una URL:

```powershell
python -m http.server 8080
# Luego abre http://localhost:8080
```

## Qué incluye

- Creación de un pase por alumno, con nombre y código único.
- Límite estricto de 19 invitados por pase.
- Registro de nombre, vínculo y alergias/menú especial de cada invitado.
- Edición y eliminación de invitados, con opción de deshacer.
- Contador visual de cupos y pase de alumno.
- Resumen general del curso con todos los pases, invitados y cupos disponibles.
- Exportación a CSV compatible con Excel (`;` como separador y BOM UTF-8).
- Persistencia automática en `localStorage`.
- Diseño responsive, navegación por teclado y soporte para movimiento reducido.

## Personalización rápida

- **Colores:** variables al inicio de `styles.css` (`--violet`, `--blue`, `--cyan`, etc.).
- **Cupo por alumno:** constante `MAX_GUESTS` en `app.js` (por defecto `19`).
- **Año y textos:** en `index.html`; el año también aparece en `app.js`.
- **Vínculos disponibles:** arreglo `RELATIONS` en `app.js`.

## Sobre los datos

Los registros se guardan **en el navegador del dispositivo** donde se usan. El resumen general incluye únicamente los pases de ese dispositivo. Para conservar la información o compartirla con la organización, usa **Exportar CSV**.

Si la intención es que muchos alumnos registren sus invitados desde sus propios teléfonos y todos vean una lista centralizada, hace falta conectar la página a una base de datos o backend compartido. La interfaz y el modelo de datos ya están preparados para ese siguiente paso.

## Estructura

```text
index.html    Estructura de la página y modales
styles.css    Identidad visual morado/azul y diseño responsive
app.js        Lógica de pases, invitados, persistencia y CSV
```
