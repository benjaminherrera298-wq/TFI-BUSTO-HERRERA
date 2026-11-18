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
  main.js
  App.vue
  components/
    shared/
      ToastMessage.vue
  data/
    samplePractice.js
    petAvatars.js
  legacy/
    veterinaryApplication.js
    screenRenderer.js
  services/
    attentionFacade.js
    attentionRecords.js
    validation.js
  styles/
    styles.css
    referenceTheme.css
    print.css
```

`components/shared/` contiene componentes reutilizables de Vue. `data/` reúne la carga de datos ficticios y el catálogo de avatares. `services/` conserva las operaciones de atención y las validaciones ya separadas. `legacy/` identifica los módulos que todavía generan las pantallas mediante HTML y su adaptador a Vue.

Fuera de `src/` se mantienen `public/assets/`, `scripts/`, `tests/`, `reports/` y los archivos de configuración del proyecto.

## Alcance de la migración
Se utiliza Vue 3 y Vite. Vue monta la aplicación, administra los eventos principales y renderiza las pantallas mediante nodos virtuales. En la etapa 2 se organizaron los archivos existentes por responsabilidad; `App.vue` mantiene su funcionamiento y solo cambió las rutas de tres importaciones.

Las funciones que generan el contenido de cada pantalla siguen en `legacy/veterinaryApplication.js` como cadenas HTML y se convierten a nodos Vue mediante `legacy/screenRenderer.js`. Todavía no están divididas en vistas `.vue` individuales. Algunas actualizaciones puntuales de formularios conservan acceso directo al DOM para mantener el comportamiento original. Esa migración corresponde a la etapa 3.

La inicialización y la suscripción de almacenamiento tienen limpieza al desmontar. Los estilos y el comportamiento del prototipo local se conservaron.

El QR continúa siendo simulado, con los mismos identificadores, códigos de cinco dígitos y enlaces `#qr=...`. El QR real se implementará después de las etapas de organización y migración a Vue.

## Compilar
```sh
npm run build
npm run preview
```
La carpeta `dist/` contiene la compilación preparada para un servidor estático. No abras el index.html fuente con doble clic: esta versión necesita Vite o un servidor para `dist/`.

La configuración inicial usa el código de prueba `123456`; las cuentas demo se muestran en el inicio de sesión. La aplicación mantiene el modelo de cuentas y permisos simulados del proyecto original.

## Verificaciones

```sh
npm test
npm run test:regression
```

`npm test` ejecuta las pruebas independientes de validaciones y datos de demostración con el ejecutor incluido en Node.js. `npm run test:regression` mantiene las verificaciones de atenciones, agenda, avatares y auditoría. Utilizan datos ficticios en memoria y no acceden a los datos del navegador.

La auditoría escribe `reports/audit-system-latest.json`, un resultado generado que Git ignora. Los informes históricos se conservan.

Si la carga habitual de la configuración de Vite falla por permisos del entorno, se puede probar el cargador nativo:

```sh
npm run build -- --configLoader native
```

El [informe de la etapa 1](reports/etapa-1-revision.md) conserva el diagnóstico y las rutas que existían antes de la reorganización. El [informe de la etapa 2](reports/etapa-2-organizacion.md) documenta la estructura vigente, los movimientos, las importaciones corregidas y la comparación de las verificaciones. Las rutas de los informes anteriores son referencias históricas; la tabla de movimientos de etapa 2 indica sus ubicaciones actuales.
