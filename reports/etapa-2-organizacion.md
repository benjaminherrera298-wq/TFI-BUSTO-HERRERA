# TFI Veterinaria: organización de carpetas y archivos, etapa 2

Fecha: 18 de noviembre de 2026. Rama: `dev/benja`.

Se reorganizaron los archivos existentes para distinguir componentes compartidos, datos locales, servicios y código pendiente de migrar a componentes Vue. No se refactorizaron funciones ni se crearon vistas nuevas.

## Estado inicial y cambios de la etapa 1

Antes de modificar archivos se consultaron Git, el [informe de la etapa 1](etapa-1-revision.md), las importaciones del código y las verificaciones existentes.

Git ya mostraba los cambios de la etapa 1: `.gitignore`, `README.md`, `package.json`, `scripts/audit-system.mjs`, `reports/etapa-1-revision.md` y los dos archivos dentro de `tests/`. Se conservaron. La comparación de esta etapa se realizó contra ese estado de trabajo, no únicamente contra el último commit.

No se realizaron commits, merges ni pushes. No se instalaron dependencias ni se modificaron `package.json`, `package-lock.json`, `.gitignore`, `index.html` o `vite.config.js` durante esta etapa.

## Estructura final

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

La estructura tiene los mismos 13 archivos de producción, distribuidos según sus responsabilidades. Solo se crearon tres carpetas con contenido: `data/`, `legacy/` y `components/shared/`.

Se mantienen los archivos y carpetas exteriores a `src/`, incluidos `public/assets/`, `scripts/`, `tests/`, los informes anteriores y la configuración. `dist/` se regeneró con la compilación y continúa fuera del control de versiones.

## Archivos movidos

| Ubicación anterior | Ubicación actual | Motivo |
| --- | --- | --- |
| `src/services/samplePractice.js` | `src/data/samplePractice.js` | Contiene la carga de datos ficticios, separada de las operaciones del sistema. |
| `src/services/petAvatars.js` | `src/data/petAvatars.js` | Contiene el catálogo local de retratos y sus funciones de generación y búsqueda. |
| `src/services/veterinaryApplication.js` | `src/legacy/veterinaryApplication.js` | Identifica el módulo compartido que todavía mezcla generación de pantallas, estado y negocio. |
| `src/services/screenRenderer.js` | `src/legacy/screenRenderer.js` | Mantiene junto al módulo anterior el adaptador de HTML a nodos Vue que necesita para funcionar. |
| `src/components/ToastMessage.vue` | `src/components/shared/ToastMessage.vue` | Expresa que la notificación es un componente reutilizable de Vue. |

`legacy` significa aquí código existente que se conservará durante la transición. No significa código eliminado ni deshabilitado: esos dos archivos siguen siendo necesarios para ejecutar la aplicación.

Los informes de la etapa 1 y de la auditoría de noviembre conservan sus rutas originales porque describen estados históricos. La tabla anterior permite encontrar esos archivos en su ubicación actual. No se reescribieron los informes anteriores.

## Importaciones corregidas

Se actualizaron 12 importaciones en seis archivos. Se conservaron los nombres importados y el estilo de las rutas existentes; por ejemplo, los imports de JavaScript en `App.vue` siguen sin extensión, como antes.

| Archivo | Cambios de rutas |
| --- | --- |
| `src/App.vue` | `./components/ToastMessage.vue` → `./components/shared/ToastMessage.vue`; `./services/screenRenderer` → `./legacy/screenRenderer`; `./services/veterinaryApplication` → `./legacy/veterinaryApplication`. |
| `src/legacy/veterinaryApplication.js` | `./attentionFacade.js` y `./validation.js` → `../services/attentionFacade.js` y `../services/validation.js`; `./samplePractice.js` y `./petAvatars.js` → `../data/samplePractice.js` y `../data/petAvatars.js`. |
| `scripts/audit-system.mjs` | Importación de la entrada de la aplicación desde `../src/legacy/veterinaryApplication.js`. Se conserva el destino del JSON agregado en la etapa 1. |
| `scripts/verify-personal-agenda.mjs` | Importación de la entrada de la aplicación desde `../src/legacy/veterinaryApplication.js`. |
| `scripts/verify-pet-avatars.mjs` | Entrada de la aplicación desde `../src/legacy/veterinaryApplication.js` y catálogo desde `../src/data/petAvatars.js`. |
| `tests/samplePractice.test.js` | Carga de datos ficticios desde `../src/data/samplePractice.js`. |

`screenRenderer.js` solo importa funciones de Vue, por lo que no necesitó cambios internos. Tampoco necesitaron cambios `attentionFacade.js`, `attentionRecords.js`, `validation.js`, `verify-attention-facade.mjs` ni `validation.test.js`.

Los scripts y las pruebas mantienen sus comprobaciones, entradas y resultados esperados. No se modificaron condiciones para hacer pasar las pruebas.

## Comparación inicial y final

Se usó `npm.cmd` en PowerShell, equivalente a los comandos `npm` del proyecto.

| Verificación | Antes de los movimientos | Después de los movimientos |
| --- | --- | --- |
| `npm test` | 20 correctas, 0 fallidas, 0 omitidas. | 20 correctas, 0 fallidas, 0 omitidas. |
| `npm run test:regression` | Los cuatro scripts terminaron correctamente. | Los cuatro scripts terminaron correctamente. |
| Auditoría incluida en regresión | 32 escenarios correctos, 0 hallazgos, 0 errores de ejecución. | 32 escenarios correctos, 0 hallazgos, 0 errores de ejecución. |
| `npm run build` | Falló por acceso denegado al cargar la configuración con esbuild. | Falló por el mismo acceso denegado. |
| `npm run build -- --configLoader native` | Compilación correcta, 21 módulos transformados. | Compilación correcta, 21 módulos transformados. |

Los resultados coinciden con los registrados en la etapa 1. La auditoría incluye 34 combinaciones de sección y rol. Las verificaciones existentes cubren atenciones, vacunas, vínculos, edición de tickets cobrados, agenda, permisos entre cuentas, avatares, fotos y fallos simulados de persistencia.

El JSON regenerable sigue en `reports/audit-system-latest.json`. Los informes históricos no fueron sobrescritos.

### Comprobaciones adicionales

- Se comprobó la resolución de las 20 importaciones locales del código, los scripts y las pruebas: ninguna ruta rota.
- No quedaron referencias a las ubicaciones antiguas en `src/`, `scripts/`, `tests/` ni en la estructura vigente del README. Las referencias históricas y la tabla de movimientos se mantienen identificadas como tales.
- Se compararon los archivos con una captura de su contenido al comenzar esta etapa. Los únicos seis archivos de código o pruebas que cambiaron su contenido difieren exclusivamente en líneas de importación.
- Los otros cuatro archivos movidos conservan exactamente sus bytes: `samplePractice.js`, `petAvatars.js`, `screenRenderer.js` y `ToastMessage.vue`.
- Se compararon mediante SHA-256 los cuatro archivos generados dentro de `dist/`: HTML, JavaScript, CSS e imagen. Todos son idénticos a los de la compilación inicial.
- `git diff --check` terminó sin errores de espacios.

La igualdad de los archivos compilados y del código fuera de sus imports aporta evidencia de que esta reorganización no altera las reglas ni la presentación.

## Problemas encontrados y límites

La compilación habitual sigue encontrando el permiso denegado documentado en la etapa 1: esbuild informa `Cannot read directory "../../..": Access is denied` al cargar `vite.config.js`. El cargador nativo funciona antes y después de los movimientos. No se modificó la configuración para ocultar ese problema del entorno.

Se consultó Computer Use para comprobar si había acceso a un navegador de pruebas. La herramienta devolvió `The browser access host is unavailable` y no ofreció navegadores conectados. Por eso no se realizó una revisión visual con navegador aislado. No se abrió ni manipuló el perfil habitual del usuario.

Las pruebas automatizadas utilizan bases ficticias y almacenamiento en memoria. No acceden al `localStorage` real del navegador. Como en la etapa 1, los scripts de integración reemplazan el DOM y `setHtml()`; la compilación procesa los componentes reales, pero no reemplaza una revisión visual, móvil o de impresión.

El escenario de agenda dependiente de noviembre de 2026 permanece sin cambios. Pasó tanto al inicio como al final de esta etapa; controlar su reloj sigue siendo una mejora pendiente ajena a estos movimientos.

## Funcionalidades conservadas y responsabilidades dentro de legacy

`App.vue` conserva su estructura, referencias, ciclo de vida, eventos y limpieza. El contrato de inicialización sigue siendo `root`, `lockedRole`, `setHtml`, `notify` y `on`.

`legacy/veterinaryApplication.js` sigue gestionando:

- Inicio de sesión, recuperación simulada, cuatro roles y permisos.
- Estado de la aplicación, navegación y generación de HTML de las pantallas.
- Usuarios, propietarios, veterinarios, mascotas, servicios y horarios.
- Formularios y coordinación con los servicios de atenciones e historia clínica.
- Sala de espera, tickets, cobros y comprobantes.
- Agendas, cuidados, notificaciones y avisos.
- Carga inicial, compatibilidad de datos, persistencia y sincronización entre pestañas.
- Identificación de mascotas, QR simulado, enlaces públicos, descarga e impresión.
- Actualizaciones puntuales del DOM que todavía usa el prototipo.

`legacy/screenRenderer.js` continúa transformando las cadenas HTML en nodos Vue, renderizando los contenedores y limpiándolos al desmontar. Todavía no hay vistas nuevas ni cambios de navegación.

No se modificaron CSS, identificadores HTML, eventos, textos visibles, funciones, parámetros ni valores de retorno. Se conservaron las claves `veterinaria-prototipo-v1`, `veterinaria-prototipo-v1-email` y `veterinaria-theme`, así como los vínculos entre mascotas, propietarios, atenciones, recordatorios y tickets.

El QR continúa siendo simulado. No se alteraron `qr`, los códigos de cinco dígitos ni `#qr=...`. No se instalaron bibliotecas ni se agregó cámara. La implementación de un QR real se hará después de las etapas de organización y migración a Vue.

## Documentación actualizada

El README ahora muestra el árbol completo vigente, explica la responsabilidad de cada carpeta y distingue la organización ya realizada de la migración pendiente. También enlaza este informe y aclara cómo interpretar las rutas de los documentos históricos.

Este informe registra los cinco movimientos, los 12 imports corregidos, las verificaciones iniciales y finales, el problema de permisos y el límite de acceso al navegador. Los archivos de la etapa 1 se conservaron; solo `README.md`, `scripts/audit-system.mjs` y `tests/samplePractice.test.js` recibieron los ajustes adicionales indicados para esta etapa.

## Trabajo pendiente para la etapa 3

1. Elegir una primera pantalla acotada para migrar, por ejemplo el catálogo o los avisos, y describir sus datos y acciones actuales.
2. Crear su vista `.vue` y los componentes específicos que realmente necesite. Mantener el HTML, las clases, los textos, los permisos y el comportamiento observable.
3. Pasar los datos mediante propiedades y comunicar las acciones mediante eventos, usando estado reactivo sencillo donde corresponda.
4. Conservar el puente de `legacy/` para las pantallas que aún no se migren. No eliminarlo hasta que todas sus responsabilidades tengan una alternativa verificada.
5. Repetir las pruebas y la compilación tras cada migración y realizar la revisión en un navegador aislado cuando esté disponible. Las pruebas nuevas deben comprobar comportamiento real.

La separación adicional de lógica de negocio sigue correspondiendo a la etapa 4. No es necesario instalar Vue Router, Pinia ni otras herramientas para iniciar la migración progresiva.

La etapa 2 termina con archivos organizados y verificaciones comparables a la etapa 1. No se avanzó a la etapa 3.
