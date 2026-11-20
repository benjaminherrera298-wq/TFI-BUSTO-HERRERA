# TFI Veterinaria: migración de Avisos a Vue, etapa 3B

Fecha: 19 de noviembre de 2026. Rama: `dev/benja`. Base revisada: `7b59957`.

Se migró únicamente Avisos a `src/views/notices/NoticesView.vue`, siguiendo el puente utilizado por Catálogo. La vista se utiliza tanto para la consulta del propietario como para el bloque de administración de avisos dentro de Configuración. El formulario general de Configuración y las demás pantallas continúan en `legacy/`.

No se realizaron commits, merges ni pushes, ni se comenzó la etapa 4. El informe pendiente de la etapa 3A se conservó sin modificaciones.

## Revisión y dependencias existentes

Antes de modificar se revisaron Git, los informes de las etapas 3 y 3A, `CatalogView.vue`, `App.vue`, el renderizador y las funciones relacionadas con avisos. Las 31 pruebas iniciales y los cuatro verificadores pasaron; la compilación funcionó con el cargador nativo.

Avisos tenía tres puntos de uso:

| Lugar | Funcionamiento conservado |
| --- | --- |
| Pantalla Avisos del propietario | Consulta de avisos activos, ya publicados y todavía vigentes. |
| Bloque de avisos en Configuración | Administrador y superadministrador ven todos los avisos y pueden crearlos, editarlos, publicarlos, desactivarlos o eliminarlos. |
| Resumen en la ficha de mascota | Conserva su HTML anterior y muestra los primeros dos resultados de `visibleNotices()`. |

El administrador y el superadministrador siguen gestionando avisos desde Configuración, sin una nueva entrada en su menú. El propietario conserva su entrada Avisos. El veterinario no obtiene acceso a ninguna función nueva. La redirección anterior de Avisos a Configuración para administradores sigue intacta.

La base continúa siendo `db.notices`. No se agregó otro almacenamiento ni se cambiaron las claves de `localStorage`.

## Componente y comunicación

`NoticesView.vue` utiliza `<script setup>` y un `<template>` real con `v-if`, `v-for`, interpolaciones y eventos. No utiliza `v-html` ni convierte una cadena del generador anterior.

Recibe estas propiedades:

- `clinicName`: nombre que se muestra junto a cada publicación y en el encabezado de consulta.
- `notices`: avisos ya seleccionados por las reglas y la búsqueda existentes.
- `canManage`: permiso ya calculado por `isAdmin()`.
- `inSettings`: selecciona el encabezado y el estado vacío propios del bloque administrativo.
- `query`: texto actual de búsqueda.
- `formatDate`: reutiliza `pretty()`, sin copiar su formato de fechas.

Emite `search`, `create`, `edit`, `toggle` y `delete`. Los eventos se conectan con los manejadores anteriores y conservan su tratamiento de errores. Las operaciones siguen usando los formularios, validadores, confirmaciones y guardado existentes.

```text
legacy: navegación, datos, permisos y operaciones
  → showNotices(target, props), conectado desde App.vue
  → screenRenderer.setComponent()
  → NoticesView.vue
  → eventos Vue hacia los manejadores existentes
```

Las propiedades son reactivas. No se duplicaron la base, el rol, la ruta ni los filtros en un segundo estado local. Las fechas de publicación y vencimiento tampoco se vuelven a calcular dentro de la vista.

Los botones conservan sus atributos `data-action` y `data-id`; el buscador conserva `list-search`, su etiqueta accesible y su texto de ayuda. Los eventos nuevos usan `.stop` para que el delegado anterior no los ejecute una segunda vez.

## Integración sin migrar Configuración

`App.vue` agrega únicamente la importación y la conexión `showNotices`, igual que `showCatalog`.

En la ruta Avisos, `renderContent()` monta la vista y termina con `return`, evitando que el renderizador de HTML la reemplace después.

En Configuración se conserva el `section` existente de avisos y se agrega el identificador `settings-notices`. Primero se genera el HTML anterior de Configuración y luego se monta la vista únicamente dentro de esa sección. No se agregó un contenedor visual adicional ni se creó un componente de Configuración.

Buscar avisos actualiza solamente ese componente. No reconstruye el formulario general de Configuración y, por lo tanto, conserva sus campos mientras se escribe. Guardar, publicar, desactivar, eliminar o recibir cambios por `storage` sigue actualizando la vista con los datos vigentes.

### Desmontaje de regiones anidadas

El bloque administrativo introduce tres niveles de contenedores registrados: `app → content → settings-notices`.

Se detectó que recorrerlos de padres a hijos podía retirar el host antes de desmontar el componente. Se cambió el recorrido de limpieza al orden inverso, de hijos a padres. Es el mismo criterio que ya utilizaba `dispose()`.

La prueba del renderizador se amplió para comprobar que Avisos se desmonte antes de retirar su host y antes de retirar `content`, sin dejar una instancia montada en un elemento desconectado.

## Reglas, presentación y consumidores conservados

`visibleNotices()` permanece sin cambios. Para el propietario exige un aviso activo, publicación menor o igual a hoy y vencimiento vacío o mayor o igual a hoy. Por lo tanto, un aviso publicado hoy ya se ve y uno que vence hoy todavía se ve.

Los administradores siguen viendo todos, incluidos borradores, futuros y vencidos. Se mantiene el orden de la base y la búsqueda sobre el JSON del aviso, sin distinguir mayúsculas en español.

El texto y la apariencia se conservaron:

- Encabezado `Avisos` para consulta y `Avisos de la veterinaria` para administración.
- Tarjetas `.card.notice`, título, mensaje, fecha, vencimiento y estados `Publicado`/`Borrador`.
- Botones `+ Nuevo aviso`, `Editar`, `Publicar`/`Desactivar` y `Eliminar`.
- Mensaje `No hay avisos para mostrar.` solamente dentro de Configuración cuando corresponde. La consulta del propietario conserva su comportamiento vacío anterior.

No se modificó CSS, la vista Catálogo, los servicios, los datos de demostración, el QR ni las reglas de otras funcionalidades. `petProfile()` también permanece sin cambios y sigue consumiendo `visibleNotices()`.

La primera comparación visual detectó 166 píxeles distintos en las fechas con vencimiento. El texto era el mismo, pero un `<template v-if>` lo dividía en nodos separados y Chrome lo dibujaba con una pequeña diferencia. Se reemplazó por interpolaciones adyacentes dentro de un único nodo de texto, conservando `formatDate` y el contenido. La repetición de esa comparación dio cero diferencias; no se cambió CSS ni se redujo la exigencia de la prueba.

## Archivos creados y modificados

| Archivo | Cambio |
| --- | --- |
| `src/views/notices/NoticesView.vue` | Vista Vue nueva, compartida por consulta y bloque administrativo. |
| `src/App.vue` | Importación y conexión de `showNotices`. |
| `src/legacy/veterinaryApplication.js` | `noticesView()` ahora prepara datos y eventos; se ajusta su montaje en la ruta y en el host de Configuración. |
| `src/legacy/screenRenderer.js` | Limpieza de regiones anidadas de hijos a padres. |
| `tests/noticesView.test.js` | Cinco pruebas del componente real, sus propiedades, contenido y eventos. |
| `tests/noticesIntegration.test.js` | Seis grupos de pruebas sobre permisos, fechas, operaciones, Configuración, mascota, navegación y sincronización. |
| `tests/screenRenderer.test.js` | Extensión del caso existente para comprobar tres niveles de desmontaje. |
| `scripts/audit-system.mjs` | Adaptación del entorno de pruebas para renderizar Avisos con Vue, incluso dentro del host administrativo. |
| `scripts/verify-personal-agenda.mjs` | La misma adaptación para conservar sus verificaciones de publicación y navegación. |
| `README.md` | Árbol actual, funcionamiento de ambas vistas y enlace a este informe. |
| `reports/etapa-3b-avisos-vue.md` | Este informe. |

Los scripts mantienen sus escenarios, datos y comprobaciones anteriores. Solo se adaptaron los contenedores ficticios y la espera del renderizado real del componente. No se cambiaron pruebas para ocultar fallos.

## Pruebas automáticas y compilación

En PowerShell se usó `npm.cmd`, equivalente a `npm`.

| Verificación | Antes | Después |
| --- | --- | --- |
| `npm test` | 31 correctas. | 42 correctas, 0 fallidas y 0 omitidas. |
| `npm run test:regression` | Cuatro verificadores correctos. | Cuatro verificadores correctos. |
| Auditoría incluida en regresión | 32 escenarios correctos, 0 hallazgos y 0 errores de ejecución. | Mismos resultados. |
| `npm run build` | Fallo conocido de permisos de esbuild. | Mismo fallo al cargar `vite.config.js`. |
| `npm run build -- --configLoader native` | Compilación correcta, 22 módulos. | Compilación correcta, 23 módulos. |
| Importaciones locales | Revisadas al analizar el proyecto. | 28 rutas comprobadas, ninguna rota. |
| `git diff --check` | Cambios anteriores conservados. | Sin errores de espacios. |

Las once pruebas nuevas cubren renderizado del `.vue` real, texto escapado, ambos encabezados, estados vacíos, propiedades actualizadas sin sustituir el buscador, emisiones únicas y propagación detenida. La integración comprueba fechas inclusivas, permisos de los cuatro roles, operaciones y confirmaciones, rechazo de acciones alteradas del propietario, guardado de Configuración, resumen de mascota, cambios entre pestañas y salida de sesión.

La ampliación de la prueba de desmontaje ejecuta el adaptador con Vue y un árbol mínimo en memoria; no pretende verificar por sí sola el diseño ni el foco de un navegador.

## Pruebas reales en navegador

Se ejecutó **Chrome 157.0.8103.79 real en modo headless**, controlado con el Playwright 1.57.0 ya disponible en el entorno. No se instaló ninguna dependencia en el proyecto ni se descargó un navegador.

Se inició un navegador temporal y se crearon contextos nuevos, comprobando que sus cookies y orígenes almacenados estuvieran vacíos. No se utilizó un perfil existente ni se importó almacenamiento del usuario. La base ficticia utilizó cuentas `@avisos.example`, una mascota de prueba y seis avisos con distintos estados y fechas. Solo se escribió dentro de esos contextos aislados, sin borrar ni reiniciar el almacenamiento habitual.

Las fechas se calcularon con la misma zona horaria de los contextos: `America/Argentina/Buenos_Aires`, con referencia al 19 de noviembre de 2026. No se dependió de la zona horaria del proceso de Node para decidir qué aviso vencía.

La ejecución final terminó con **20 grupos correctos, 2 observaciones previas y 0 fallos**. Se comprobó lo siguiente:

| Área | Resultado observado |
| --- | --- |
| Publicación y vencimiento | El propietario ve tres de los seis avisos: los vigentes sin vencimiento, el publicado y vencido hoy y el tercer aviso vigente. No ve el futuro, el borrador ni el vencido ayer. |
| Búsqueda | Se conserva la búsqueda sobre el JSON, incluso por un dato no impreso en la tarjeta. El buscador mantiene nodo, foco y cursor al escribir. |
| Propietario | No aparecen controles administrativos. Los intentos alterados de administrar no modifican los datos. |
| Administrador y superadministrador | Ambos ven todos los avisos en Configuración y pueden crear, editar, publicar, desactivar y eliminar mediante los formularios y confirmaciones anteriores. Se comprueba una sola apertura de diálogo y una sola escritura por operación de guardado. |
| Confirmaciones | Publicar, desactivar y eliminar requieren confirmación. Cancelar la eliminación conserva el aviso. |
| Formulario general | Buscar avisos conserva el formulario de Configuración y sus campos sin guardar. Las operaciones de avisos no cambian la configuración guardada. |
| Veterinario | No obtiene acceso a Avisos ni a Configuración mediante navegación alterada. |
| Mascota y sincronización | Su resumen mantiene los primeros dos avisos vigentes. Los cambios desde otra pestaña del contexto ficticio llegan mediante `storage`. |
| Navegación y desmontaje | Se recorre entre Avisos, Catálogo y la ficha. Al salir de Configuración se comprueba, tres veces, que la instancia de Avisos se desmonte antes de retirar su host. |
| Consola | Cero excepciones JavaScript, cero avisos de Vue/consola, cero errores de consola inesperados y cero solicitudes fallidas por transporte. Los 404 del favicon se registran por separado. |

El navegador y todos sus contextos se cerraron al terminar. Estas comprobaciones ejecutan eventos y diálogos nativos de Chrome; no se presentan como una simulación del DOM.

### Comparación visual

Se preparó una copia del commit `7b59957` mediante `git archive` dentro de `.visual-notices-3b/baseline/`, sin cambiar de rama ni reemplazar archivos actuales. Se sirvieron ambas versiones con Vite y cargador nativo: actual en `127.0.0.1:5189` y anterior en `127.0.0.1:5190`.

Ambas versiones recibieron los mismos datos ficticios, tema oscuro, idioma, zona horaria y tamaño de ventana. Se esperó la carga de fuentes y se compararon capturas completas con `pixelmatch`, con umbral cero y contando los bordes suavizados. También se inspeccionaron capturas del resultado.

| Pantalla y rol | Tamaño de ventana | Píxeles distintos |
| --- | --- | --- |
| Avisos del propietario | 1440 × 1000 | 0 |
| Avisos del propietario | 390 × 844 | 0 |
| Configuración del administrador, incluido el bloque de avisos | 1440 × 1000 | 0 |
| Configuración del administrador, incluido el bloque de avisos | 390 × 844 | 0 |

Las tarjetas quedaron dentro del ancho disponible y no se detectó desbordamiento horizontal. Las capturas de Configuración incluyen el formulario general: el resultado también comprueba que no se rediseñó esa pantalla.

Las pruebas de tamaño móvil usan una ventana de Chrome de escritorio de 390 px de ancho. No equivalen a probar un teléfono físico, teclado virtual, gestos táctiles ni otros motores de navegador. La comparación visual se limita a los roles y al tema indicados.

### Observaciones anteriores a la migración

1. **Ubicación del error de expiración.** Una fecha de expiración anterior a la publicación se rechaza correctamente y no produce guardado. Sin embargo, el mensaje aparece en el formulario general de Configuración, fuera del modal. Se reprodujo la misma ubicación y contenido en la versión anterior y en la actual. La causa es que ambos formularios conservan `id="form-error"` y `fail()` utiliza el primero que encuentra. No se cambió esa función ni se presentó como correcto el mensaje dentro del modal.
2. **Favicon ausente.** Se registró un HTTP 404 de `/favicon.ico` en el servidor actual y otro en el anterior. Estos mensajes no son excepciones de JavaScript y se conservaron como observación, sin afirmar que la consola estuviera completamente vacía.

Estas observaciones se documentan para una revisión posterior. No se cambiaron las validaciones, los identificadores de los formularios ni los recursos de otras funcionalidades para resolverlas en esta etapa.

### Evidencia local

El arnés `verify.cjs`, `results.json`, la copia anterior y las capturas quedaron en `.visual-notices-3b/`, ya excluida por `.visual-*/`. Los cuatro juegos de capturas usan los prefijos `owner-desktop`, `owner-mobile`, `admin-desktop` y `admin-mobile`, con sufijos `current`, `baseline` y `diff`.

Son artefactos locales de prueba, no archivos de producción ni nuevas dependencias. El arnés utiliza `NOTICES_PLAYWRIGHT_MODULE` para localizar la instalación existente de Playwright.

## Alcance final

La entrega se limita a Avisos y a su integración. La migración de Configuración general y la separación completa de lógica de negocio permanecen pendientes. No se comenzó otra pantalla ni la etapa 4.
