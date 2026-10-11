# Sistema de Gestión Veterinaria · Vue 3

## Ejecutar
Requiere Node.js 20.19+ o 22.12+ (recomendado: Node 24).

Desde esta carpeta:
```sh
npm install
npm run dev
```
Abrí la dirección que indique Vite. En Windows, si PowerShell bloquea npm.ps1, usá `npm.cmd` en lugar de `npm`.

## Accesos por rol
- Acceso general: `/`
- Administrador: `/?rol=admin`
- Veterinario: `/?rol=veterinario`
- Propietario: `/?rol=propietario`
- Superadministrador: `/?rol=superadmin`

Se conserva el fragmento `#qr=...` para perfiles públicos. Los datos siguen guardándose en localStorage con la misma clave del proyecto original. Para compartir datos con una versión previa deben servirse desde el mismo origen (dominio y puerto).

## Estructura
```text
src/
  App.vue                       Inicio, eventos y ciclo de vida
  main.js                       Montaje de Vue
  components/ToastMessage.vue   Notificaciones reactivas
  services/
    veterinaryApplication.js   Lógica compartida y generadores de pantallas
    screenRenderer.js          Conversión de pantallas a nodos de Vue
  styles/styles.css            Diseño original
```

## Alcance de la migración
Se utiliza Vue 3 y Vite, con un único módulo de negocio para los cuatro roles. Vue monta la aplicación, administra los eventos principales y renderiza las pantallas mediante nodos virtuales. Las funciones que generan el contenido de cada pantalla se conservan como cadenas HTML y se convierten a nodos Vue con un adaptador; aún no están divididas en componentes `.vue` individuales. Algunas actualizaciones puntuales de formularios conservan acceso directo al DOM para mantener el comportamiento original.

La inicialización y la suscripción de almacenamiento tienen limpieza al desmontar. Los estilos y el comportamiento del prototipo local se conservaron.

## Compilar
```sh
npm run build
npm run preview
```
La carpeta `dist/` contiene la compilación preparada para un servidor estático. No abras el index.html fuente con doble clic: esta versión necesita Vite o un servidor para `dist/`.

La configuración inicial usa el código de prueba `123456`; las cuentas demo se muestran en el inicio de sesión. La aplicación mantiene el modelo de cuentas y permisos simulados del proyecto original.
