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
  views/
    catalog/
      CatalogView.vue
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

`components/shared/` contiene componentes reutilizables de Vue. `views/` contiene las pantallas ya migradas: por ahora, únicamente Catálogo. `data/` reúne la carga de datos ficticios y el catálogo de avatares. `services/` conserva las operaciones de atención y las validaciones ya separadas. `legacy/` mantiene la navegación y las pantallas que todavía se generan mediante HTML.

Fuera de `src/` se mantienen `public/assets/`, `scripts/`, `tests/`, `reports/` y los archivos de configuración del proyecto.

## Alcance de la migración
Se utiliza Vue 3 y Vite. En la etapa 2 se organizaron los archivos existentes por responsabilidad. En esta primera parte de la etapa 3 se migró únicamente Catálogo a `views/catalog/CatalogView.vue`, con un template real, propiedades reactivas y eventos Vue. No utiliza `v-html`.

La navegación y las operaciones siguen bajo el control de `legacy/veterinaryApplication.js`. Para Catálogo, ese módulo entrega datos y recibe acciones mediante una función `showCatalog` conectada desde `App.vue`. El renderizador comparte la limpieza de contenedores entre la vista nueva y las pantallas anteriores, de modo que se desmontan antes de reemplazar su contenedor padre.

Las demás pantallas y los formularios de alta y edición conservan su implementación anterior. La vista nueva reutiliza sus permisos, filtros, formato monetario, validaciones y operaciones. No se instalaron Vue Router, Pinia ni otras dependencias.

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

`npm test` ejecuta las pruebas de validaciones, datos de demostración y la primera vista Vue con el ejecutor incluido en Node.js. Las pruebas de Catálogo compilan el archivo `.vue` con las herramientas ya incluidas en Vue y comprueban su presentación y eventos en memoria. `npm run test:regression` mantiene las verificaciones de atenciones, agenda, avatares y auditoría; la auditoría renderiza también el componente real del catálogo. No acceden a los datos del navegador y no reemplazan una revisión visual en un navegador real.

La auditoría escribe `reports/audit-system-latest.json`, un resultado generado que Git ignora. Los informes históricos se conservan.

Si la carga habitual de la configuración de Vite falla por permisos del entorno, se puede probar el cargador nativo:

```sh
npm run build -- --configLoader native
```

El [informe de la etapa 1](reports/etapa-1-revision.md) conserva el diagnóstico inicial. El [informe de la etapa 2](reports/etapa-2-organizacion.md) documenta la reorganización de archivos. El [informe de la primera vista Vue](reports/etapa-3-primera-vista-vue.md) explica la migración de Catálogo, su integración y las verificaciones. Los informes anteriores describen el estado de cada etapa y se conservan como referencia histórica.
