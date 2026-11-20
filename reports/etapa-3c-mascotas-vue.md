# Etapa 3C — Listado de mascotas en Vue

Fecha: 19 de noviembre de 2026.

## Resultado y alcance

Se migró únicamente el listado de mascotas. Ahora lo dibuja `PetsView.vue`, que utiliza `PetCard.vue` para las tarjetas del propietario. Ambos usan `<script setup>`, templates, props y emits; no utilizan `v-html` ni generan cadenas HTML.

El perfil de mascota, los formularios de alta y edición, la historia clínica, las atenciones y el QR siguen con su implementación anterior. No se instalaron dependencias ni se realizaron commits, merges o pushes.

## Revisión antes de modificar

Se revisaron Git, los informes de Catálogo y Avisos, sus componentes y el contrato de `App.vue` con el renderizador. Había cambios de Avisos y documentación sin commit; se conservaron. La referencia visual es una copia del estado de trabajo al comenzar esta etapa, incluidos esos cambios, y no solamente el último commit.

El análisis de `petsView()` mostró dos presentaciones que podían separarse sin migrar otras operaciones:

| Presentación | Comportamiento anterior que se conserva |
| --- | --- |
| Propietario | Tarjetas de sus mascotas activas, sin buscador ni paginación. Foto o avatar, color personalizable, nombre, código, QR simulado e ingreso al perfil. |
| Administrador y superadministrador | Tabla de mascotas activas e inactivas, búsqueda, filtro por especie y páginas de ocho registros. Botones de alta, edición, QR, simulación de escaneo y cambio de estado. |
| Veterinario | La misma tabla y filtros. No aparecen alta, edición, QR ni simulación de escaneo en el encabezado/listado. Se conserva el botón de activar o desactivar: la función anterior `mayEdit()` ya permite esa operación sobre mascotas. |

La búsqueda sigue usando el JSON de la mascota y de su propietario completo, sin distinguir mayúsculas. El filtro de especie conserva igualdad exacta, sin cambiar el orden de los registros.

Los vínculos con propietarios dependen de `ownerId`. El listado solamente entrega el identificador de la mascota al abrir su perfil; allí permanecen la selección de pestaña, las atenciones, los registros clínicos, los tickets y los recordatorios. La pestaña inicial sigue siendo Historia clínica para veterinarios y Resumen para los demás roles.

## Componentes y comunicación

```text
App.vue
  └─ showPets → screenRenderer.setComponent
       └─ PetsView.vue
            └─ PetCard.vue (una por mascota del propietario)
```

`PetsView.vue` recibe el nombre de la veterinaria, las filas visibles, la búsqueda, la especie, los permisos y los datos de paginación. Presenta tarjetas o tabla según `isOwner`. Cada fila contiene la mascota, el nombre de su propietario y la información necesaria para mostrar la imagen y el fondo.

`PetCard.vue` recibe una mascota, su imagen, el fondo, la paleta de colores y si el selector está abierto. Su responsabilidad es mostrar la tarjeta y avisar qué botón se pulsó. No guarda datos ni cambia directamente sus props.

Un ejemplo del recorrido completo:

1. Se pulsa Ingresar al perfil en `PetCard.vue`.
2. La tarjeta emite `open` con el identificador de la mascota.
3. `PetsView.vue` recibe ese evento y lo vuelve a emitir hacia la aplicación.
4. El callback entregado por `petsView()` invoca `action('pet', id)`.
5. La navegación anterior abre el perfil y el renderizador desmonta el listado Vue.

Los otros eventos de la vista son `search`, `filter`, `page`, `create`, `scan`, `owner`, `edit`, `toggle`, `qr`, `photo`, `color` y `pickColor`. Este último transporta `{ petId, colorId }`. Los eventos de las tarjetas son `open`, `qr`, `photo`, `color` y `pickColor`.

Los botones y filtros detienen la propagación del evento nativo con `.stop`. Así, una acción emitida por Vue no vuelve a ejecutarse por la delegación anterior del contenedor raíz. Se mantienen los atributos `data-action`, `data-id` y los identificadores utilizados por la aplicación.

Hay una excepción intencional: el input oculto `owner-pet-photo-input` deja propagar su cambio de archivo. El manejador anterior sigue validando, leyendo y guardando la imagen. No se creó un segundo proceso de carga.

## Integración y funciones que permanecen

`petsView()` deja de devolver HTML y prepara las props para `ui.showPets()`. La selección por propietario, actividad, búsqueda, especie y página permanece en la aplicación anterior, con sus mismas reglas. Las imágenes respetan la preferencia entre foto y avatar que ya usaba `petPhoto()`; esta última función no se modificó y sigue utilizándose en los perfiles.

`App.vue` agrega la importación de la vista y conecta `showPets` con `screens.setComponent`. En `renderContent()`, la rama `pets` retorna después de montar el componente, como ya hacen Catálogo y Avisos. No se llama también a `setHtml` sobre ese mismo contenido.

`screenRenderer.js` no necesitó cambios en esta etapa: su implementación existente actualiza la misma instancia cuando cambia una prop y desmonta las regiones internas antes de reemplazar un contenedor padre.

Se conservan en `legacy/`, entre otras, estas funciones y operaciones:

- `canPet()`, `pets()`, `matches()` y `mayEdit()`: acceso y reglas existentes.
- `navigate()`, `petProfile()`, `ownerProfile()` y sus pestañas: navegación y perfiles.
- `editForm()` y los manejadores de guardado: altas, ediciones y validaciones.
- `ownerPetImageModal()`, las acciones de avatar, foto y color, y el cambio de archivo: personalización y persistencia.
- `showQR()`, `qrSvg()`, `publicProfile()` y las acciones de escaneo simulado: identificación anterior.
- Las operaciones clínicas, de atenciones, recordatorios, cobros, tickets e impresión.

No hay una copia persistente del estado en los componentes: la base, usuario, búsqueda, filtro y página siguen perteneciendo a la aplicación anterior. Al guardar o recibir un evento `storage`, se vuelven a entregar las props y Vue actualiza la vista.

El QR continúa simulado. Se comprobó el identificador ficticio `qr-pet-1` y el enlace `#qr=qr-pet-1`. No se cambió ninguna clave de `localStorage`, regla de identificación o asociación entre registros.

## Archivos de esta etapa

| Archivo | Cambio |
| --- | --- |
| `src/views/pets/PetsView.vue` | Vista nueva para tarjetas, tabla, buscador, filtro y paginación. |
| `src/components/pets/PetCard.vue` | Tarjeta nueva del propietario, con props y eventos. |
| `src/App.vue` | Importación de la vista y conexión `showPets`. |
| `src/legacy/veterinaryApplication.js` | Preparación de las props y callbacks del listado; retorno temprano en su rama de navegación. |
| `tests/petsView.test.js` | Renderizado, permisos recibidos, estados vacíos, composición, eventos, actualización y desmontaje. |
| `tests/petCard.test.js` | Tarjeta, imágenes, texto escapado, eventos, props sin mutaciones y desmontaje. |
| `tests/petsIntegration.test.js` | Entrada real de la aplicación, cuatro roles, filtros, páginas, operaciones anteriores, QR, guardas y sincronización. |
| `tests/helpers/loadVueComponent.js` | Compilación de los imports relativos de componentes hijos `.vue` para probar la composición real. |
| `tests/helpers/mountVueComponent.js` | Host de Vue en memoria compartido por las pruebas nuevas de componentes. |
| `tests/catalogIntegration.test.js`, `tests/noticesIntegration.test.js` | Adaptación del entorno para renderizar la vista real de mascotas al navegar hacia ella. La expectativa de esa pantalla pasa de `legacy` a `pets`. |
| `scripts/audit-system.mjs`, `scripts/verify-personal-agenda.mjs`, `scripts/verify-pet-avatars.mjs` | Conexión `showPets` en los entornos de prueba y espera del renderizado real del componente. Se conservan las comprobaciones funcionales. |
| `README.md` y este informe | Estructura, responsabilidades, comunicación y resultados. |

Los cambios previos de Avisos en el renderizador, sus pruebas y sus informes se conservaron. Durante el trabajo apareció además un espacio inicial en `src/services/attentionFacade.js`, ajeno a esta migración; se dejó intacto. No se modificó la lógica de ese servicio.

Los tres archivos CSS, los datos demo, el catálogo de avatares, los componentes de Catálogo y Avisos y el renderizador permanecen idénticos a la copia anterior a esta etapa.

## Pruebas automáticas antes y después

En PowerShell se utilizó `npm.cmd`, equivalente a los comandos solicitados.

| Verificación | Antes | Resultado final |
| --- | --- | --- |
| `npm test` | 42 aprobadas | 53 aprobadas, 0 fallos. Se agregaron 11 pruebas. |
| `npm run test:regression` | Los cuatro scripts aprobados | Los cuatro scripts aprobados. Auditoría: 32 PASS, 0 FINDING, 0 HARNESS_ERROR. |
| `npm run build` | Fallo de permisos del cargador de configuración | Mismo fallo, antes de compilar la aplicación. |
| `npm run build -- --configLoader native` | Correcta, 23 módulos | Correcta, 25 módulos. Sin imports rotos ni errores de compilación. |
| `git diff --check` | — | Correcto. Git avisa sobre conversión LF/CRLF en algunos archivos; no son errores de espacios del diff. |

El fallo habitual sigue siendo `Cannot read directory "../../..": Access is denied` al resolver `vite.config.js` mediante esbuild. No se cambió la configuración para ocultarlo: el cargador nativo permitió compilar el proyecto.

Las regresiones conservan las verificaciones de atenciones, agenda, imágenes, permisos, validaciones y rollback de almacenamiento. Se utilizan los componentes reales compilados con las herramientas que ya incluye Vue, sin instalar un framework de pruebas nuevo.

## Navegador real

Se utilizó Chrome headless **157.0.8103.79** con Playwright **1.57.0**, disponibles en el entorno. Se crearon contextos nuevos cuyo almacenamiento inicial estaba vacío, exclusivamente con cuentas y registros ficticios. No se conectó ningún perfil habitual ni se borraron datos reales.

La ejecución completa final terminó con **21 comprobaciones aprobadas y 0 fallos**:

| Área | Qué se comprobó |
| --- | --- |
| Cuatro roles | Datos visibles y controles del listado para administrador, superadministrador, veterinario y propietario. |
| Búsqueda y filtros | Búsqueda por datos del propietario y campos internos del JSON; especie, estado vacío, páginas de ocho y reinicio de página al buscar. |
| Foco y Vue | El buscador conserva nodo, foco, cursor e instancia de la vista al escribir. |
| Administración | Los formularios anteriores abren una vez; editar y cambiar el estado renuevan la tabla y producen una escritura por guardado. Se comprobó para administrador y superadministrador. El alta abre el formulario existente; su validación y guardado también permanecen cubiertos por las regresiones existentes. |
| Veterinario | Conserva la activación/desactivación que permite la aplicación anterior. No se inventaron permisos nuevos ni se quitaron botones existentes. |
| Tarjetas | Selección y restauración de color; selección de avatar conservando la foto; restauración de foto; carga real de un PNG ficticio por el input anterior. Una sola escritura por operación. |
| Propietario | No ve mascotas ajenas o inactivas. Los intentos alterados de administrar o personalizar mascotas ajenas no modifican el almacenamiento. |
| Perfiles y desmontaje | Los cuatro roles abren el perfil correcto, conservan la pestaña inicial y vuelven al listado. La instancia de PetsView queda desmontada al salir. También funciona el enlace al propietario. |
| Integración | Cambios de otra pestaña ficticia actualizan el listado mediante `storage`. Funcionan los recorridos hacia Catálogo y Configuración, donde continúa montándose Avisos, y el regreso a Mascotas. |
| QR | Se conserva el modal simulado, su identificador y el enlace público. |
| Móvil | Navegación, apertura de perfil y regreso; selector de color del propietario; búsqueda con foco y filtro de especie del administrador. |
| Consola | Cero excepciones JavaScript, cero advertencias y cero errores inesperados. Se registró por separado el 404 de `/favicon.ico`, presente también en la versión anterior. |

### Comparación visual

Se sirvió la copia anterior en `127.0.0.1:5192` y la versión actual en `127.0.0.1:5191`. Ambas usaron la misma base ficticia, tema oscuro, idioma, zona horaria y ventana. Se esperó la carga de fuentes e imágenes y se capturaron páginas completas. También se inspeccionaron las capturas.

La ejecución final comparó con `pixelmatch`, umbral cero e incluyendo los bordes suavizados. Además se comprobaron las posiciones, dimensiones y estilos calculados de encabezados, tarjetas, tablas, imágenes y botones.

| Presentación | Ventana | Captura completa | Píxeles distintos finales |
| --- | --- | --- | --- |
| Tarjetas del propietario | 1440 × 1000 | 1440 × 1834 | 0 |
| Tarjetas del propietario | 390 × 844 | 390 × 4486 | 0 |
| Tabla del administrador | 1440 × 1000 | 1440 × 1253 | 0 |
| Tabla del administrador | 390 × 844 | 390 × 1475 | 0 |

No hubo desbordamiento horizontal del documento. En móvil se mantiene la tabla con desplazamiento horizontal dentro de su contenedor, como antes.

Las primeras capturas presentaron diferencias de rasterizado de hasta tres niveles de color en algunos bordes. Se desactivó la GPU para estabilizar el navegador de pruebas y se verificaron también las geometrías y estilos; no se cambió el CSS de la aplicación. La ejecución completa final exige igualdad estricta y obtuvo cero píxeles diferentes en las cuatro parejas.

### Problemas encontrados y límites

No se detectaron errores funcionales introducidos por esta migración. Durante la preparación de las pruebas se corrigieron dos expectativas equivocadas del arnés: el veterinario ya puede cambiar el estado de una mascota y el fragmento público utiliza el valor `qr`, no su `id` interno. Se revisó el código anterior y se mantuvo su comportamiento; no se cambiaron las reglas para satisfacer las pruebas.

Permanecen el problema de permisos del build habitual y el favicon ausente. No se resolvieron problemas ajenos al listado.

Las pruebas móviles usan una ventana de Chrome de escritorio. No se probaron teléfonos físicos, gestos táctiles, teclado virtual ni otros navegadores. La comparación visual se limita a propietario y administrador en tema oscuro; los otros dos roles tuvieron pruebas funcionales reales. No se verificó impresión física ni se implementó escaneo real de QR.

La evidencia local está en `.visual-pets-3c/`: `verify.cjs`, `results.json`, `baseline-meta.json`, la copia anterior y las capturas con sufijos `before`, `after` y `diff`. Esa carpeta ya queda excluida por `.visual-*/`; no forma parte de producción ni agrega dependencias. Los contextos y el proceso de Chrome se cerraron al terminar.

## Trabajo pendiente

El perfil completo, los formularios, la historia clínica y las atenciones todavía no son vistas Vue. Su migración y una posterior separación de servicios requieren otra etapa acordada. El QR definitivo continúa pendiente. Esta entrega termina en el listado de mascotas y no comienza otra pantalla ni la etapa 4.
