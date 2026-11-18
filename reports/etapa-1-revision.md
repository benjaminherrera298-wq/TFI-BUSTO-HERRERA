# TFI Veterinaria: revisión y preparación, etapa 1

Fecha: 18 de noviembre de 2026. Rama revisada: `dev/benja`.

La etapa 1 queda terminada. No se migraron pantallas ni se reorganizaron los módulos de producción. El diagnóstico se basa en los archivos del repositorio y las verificaciones ejecutadas en esta revisión.

## Estado inicial y alcance

- `git status --short` estaba vacío: no había cambios previos pendientes.
- No se realizaron commits, merges ni pushes.
- Se conservaron las dependencias y `package-lock.json`. No se instalaron bibliotecas.
- No se abrieron perfiles de navegador ni se leyeron, borraron o reiniciaron sus datos.
- No se modificaron archivos dentro de `src/`, `public/`, `index.html` ni `vite.config.js`.
- No cambiaron las claves de almacenamiento, los roles, las relaciones de datos, los códigos de mascotas ni los estilos.

## Carpetas y archivos presentes

Este árbol muestra los archivos de trabajo del proyecto al comenzar la revisión. Las carpetas generadas y herramientas se explican debajo.

```text
proyecto-vue/
  .gitignore
  README.md
  index.html
  package.json
  package-lock.json
  vite.config.js
  public/assets/veterinary-owner-dog.png
  reports/
    testing-2026-11-06.md
    testing-2026-11-06-results.json
  scripts/
    audit-system.mjs
    verify-attention-facade.mjs
    verify-personal-agenda.mjs
    verify-pet-avatars.mjs
  src/
    main.js
    App.vue
    components/ToastMessage.vue
    services/
      attentionFacade.js
      attentionRecords.js
      petAvatars.js
      samplePractice.js
      screenRenderer.js
      validation.js
      veterinaryApplication.js
    styles/
      styles.css
      referenceTheme.css
      print.css
```

También existen `.git/`, `node_modules/`, `dist/`, `.worktrees/` y nueve carpetas `.visual-*`. `.git/` contiene el control de versiones, `node_modules/` las dependencias y `dist/` la salida de compilación. `.worktrees/` estaba vacía. Las carpetas `.visual-*` no son módulos de la aplicación; ya estaban excluidas de Git. No se borró ninguna de estas carpetas.

| Archivo | Responsabilidad comprobada |
| --- | --- |
| `index.html` | Documento HTML en español, tema oscuro inicial, contenedor `#vue-app` y entrada `/src/main.js`. |
| `src/main.js` | Importa Vue, `App.vue` y los tres CSS, en ese orden; monta la aplicación en `#vue-app`. |
| `src/App.vue` | Conecta Vue con el módulo actual: recibe eventos, inicia la aplicación, proporciona contenedores y muestra notificaciones. |
| `src/components/ToastMessage.vue` | Componente Vue que recibe `message` y `visible`, muestra el texto y aplica la clase `show`. |
| `src/services/veterinaryApplication.js` | Módulo de 7.725 líneas: datos iniciales, estado, permisos, persistencia, navegación, HTML de pantallas, formularios, eventos, atención, cobros, QR e impresión. |
| `src/services/screenRenderer.js` | Adaptador que transforma HTML en nodos virtuales Vue y los monta en contenedores concretos. |
| `src/services/attentionFacade.js` | Coordina el registro y la edición de consultas y vacunas. Prepara los datos, valida permisos y usa un único guardado para el flujo. |
| `src/services/attentionRecords.js` | Modifica historia clínica, ticket, sala de espera y recordatorio. Recibe los datos y las funciones necesarias por parámetros. |
| `src/services/validation.js` | Validación y normalización de textos, personas, documentos, contacto, contraseñas, números, fechas, horas, entidades y mediciones. |
| `src/services/samplePractice.js` | Agrega datos ficticios a una base y marca `samplePracticeVersion` para evitar repetir la carga. |
| `src/services/petAvatars.js` | Genera un catálogo local de 20 retratos SVG y exporta el catálogo y `findPetAvatar()`. |
| `src/styles/styles.css` | Estilos originales de la aplicación. |
| `src/styles/referenceTheme.css` | Estilos adicionales del tema y la presentación. Se carga después de los originales. |
| `src/styles/print.css` | Reglas de impresión del diálogo anidado dentro de Vue. Se carga al final. |
| `public/assets/veterinary-owner-dog.png` | Imagen estática utilizada por la interfaz. |
| `scripts/` | Verificaciones ejecutables con Node; no dependen de un navegador real. |
| `reports/` | Informe y resultados de una auditoría anterior. El Markdown contiene también una actualización del 10 de noviembre. |
| `package.json` | Dependencias y comandos de ejecución, compilación y pruebas. |
| `package-lock.json` | Versiones resueltas de las dependencias. |
| `vite.config.js` | Habilita los componentes Vue y configura `base: './'`. |
| `.gitignore` | Exclusiones de archivos generados y herramientas locales. |

## Cómo arranca y cómo muestra una pantalla

1. `index.html` carga `src/main.js`.
2. `main.js` ejecuta `createApp(App).mount('#vue-app')`.
3. `App.vue` crea referencias para el contenedor y el toast, y una instancia de `createScreenRenderer()`.
4. En `onMounted`, convierte el parámetro de URL `rol` a los valores internos: `admin`, `vet`, `owner` o `superadmin`. Un valor ausente o desconocido deja el acceso general.
5. Llama a `startVeterinaryApplication()` con `root`, `lockedRole`, `setHtml`, `notify` y `on`. Estas son las conexiones entre el módulo y Vue.
6. El módulo recupera el tema, carga la base local, prepara los datos demo y aplica compatibilidad con bases anteriores. Presenta el inicio de sesión o la configuración según el estado de la base. Si encuentra `#qr=...`, busca ese identificador y puede abrir el perfil público.
7. Al iniciar sesión, `shell()` genera la estructura del panel. `navigate()` cambia variables como `route` y `selectedPet`; `renderContent()` selecciona la función que corresponde a la sección.
8. Funciones como `petsView()`, `petProfile()`, `agendaView()`, `waitingRoomView()` y `dailyHistoryView()` devuelven cadenas HTML. `ui.setHtml()` entrega esas cadenas al adaptador.

`screenRenderer.js` crea un elemento `<template>`, asigna el HTML a su `innerHTML`, recorre sus nodos y los transforma mediante `h()`. Después ejecuta `render()` con un `Fragment`. No utiliza la directiva `v-html`, pero el contenido sigue naciendo como texto HTML. Las directivas Vue que se escribieran dentro de esas cadenas no se compilarían como un template `.vue`.

El adaptador descarta atributos de eventos inline, con una excepción específica para filtrar cantidades de medicamentos. Lleva un registro de los contenedores montados, limpia regiones hijas antes de reemplazar sus padres y utiliza una clave nueva para cada pantalla. El render es síncrono porque el módulo consulta formularios inmediatamente después de generarlos.

Los botones se identifican con `data-action` y los formularios con `data-form`. `App.vue` delega `click`, `submit`, `input` y `change` al módulo. Allí `action()` y `submitForm()` deciden qué ejecutar. Algunas modificaciones también usan `querySelector`, `.value`, `.hidden`, `.textContent`, `insertAdjacentHTML()` y eliminación directa de nodos.

Al desmontarse, `App.vue` cancela el temporizador del toast, llama a la limpieza del módulo y desmonta los nodos del adaptador. La limpieza del módulo elimina su suscripción al evento `storage`.

## Uso actual de Vue y problemas de organización

**Vue sí se utiliza**, tanto para el montaje y ciclo de vida como para eventos, notificaciones y nodos virtuales. El problema es que la estructura de las pantallas y su estado todavía se administran principalmente fuera de los componentes.

- Solo existen dos componentes `.vue`: `App.vue` y `ToastMessage.vue`. No hay vistas Vue de mascotas, agenda o atención.
- `db`, `user`, `route`, filtros y selecciones son variables locales de `startVeterinaryApplication()`, no estado reactivo de Vue. Los cambios se muestran mediante llamadas manuales a `shell()` y `renderContent()`.
- El módulo principal reúne responsabilidades que cambian por motivos distintos. Por ejemplo, `saveEntity()` conoce validaciones, fotos, permisos, cuentas, propietarios, veterinarios, servicios y horarios; además decide cómo actualizar la pantalla.
- `action()` y `submitForm()` contienen grandes selecciones de acciones y formularios. Agregar una funcionalidad exige intervenir en un archivo compartido por todos los roles.
- Los controles repetidos se generan con `field()`, `select()`, `area()`, `button()`, `table()` y `modal()`, en lugar de componentes con propiedades y eventos.
- La interfaz depende de selectores e identificadores DOM concretos. Cambiar un formulario puede afectar el manejador que busca sus campos.
- La carpeta `services/` mezcla negocio, validación, datos demo, recursos gráficos y adaptación visual; el nombre no describe todas sus responsabilidades.
- `screenRenderer.js` es un puente útil durante una transición, pero no separa por sí mismo las pantallas. En el estado actual no debe eliminarse.
- `attentionFacade.js`, `attentionRecords.js` y `validation.js` ya son separaciones aprovechables. Conviene conservarlas y extender ese criterio gradualmente.

No hay Vue Router ni Pinia instalados. La navegación interna usa variables y funciones propias. No hace falta agregar estas bibliotecas para empezar a organizar componentes.

## Funcionalidades que deben conservar sus vínculos

| Relación | Dependencia concreta |
| --- | --- |
| Cuenta y perfil | `users.ownerId` vincula con propietarios y `users.vetId` con veterinarios. Los permisos y accesos dependen de esos vínculos y del estado activo. |
| Mascota y propietario | `pets.ownerId` determina a quién pertenece la mascota y qué puede consultar el propietario. |
| Identificación e ingreso | Cada mascota conserva `qr` y `code`, este último de cinco dígitos. La identificación lleva al ingreso en sala de espera con un motivo. |
| Sala y atención | El ingreso conserva mascota, propietario, veterinario asignado y estado. La atención valida que ese ingreso siga disponible y no haya sido atendido. |
| Atención e historia | La historia conserva `petId`, `ownerId`, `vetId`, autor y `waitingEntryId`; la atención puede actualizar el peso de la mascota. |
| Historia y ticket | Se enlazan con `record.ticketId` y `ticket.clinicalId`. El ingreso también recibe `ticketId` y `attentionId`. |
| Atención y recordatorio | Una próxima fecha puede crear o actualizar un recordatorio identificado por `clinicalId`; el calendario del propietario lo muestra mediante `petId`. |
| Ticket y cobro | Administración carga los precios y la atención/servicios. El cobro verifica el total y guarda una copia de datos de mascota y propietario. Editar la atención no debe alterar un ticket pagado. |
| Servicios y horarios | Los horarios dependen de servicios asignados a veterinarios y de los días y límites generales de la clínica. |
| Configuración y presentación | Nombre, logo, contacto y horarios se reutilizan en varias pantallas y comprobantes. Los avisos se administran desde Configuración y los consulta el propietario. |

La agenda interna y la del propietario son diferentes. Administrador, veterinario y superadministrador usan `agendaNotes`, con anotaciones privadas por `userId`. El propietario utiliza los cuidados de sus mascotas, guardados en `reminders`. El código conserva compatibilidad con datos antiguos de reservas; las pruebas verifican que sus acciones anteriores no creen reservas nuevas.

El QR existente es **simulado**: `qrSvg()` dibuja una figura a partir de `pet.qr`, y la interfaz indica que no se escanea con cámara. Se conservan la simulación, el código de cinco dígitos y el fragmento `#qr=...`. Convertirlo en un QR estándar cambiaría el comportamiento y queda fuera de esta etapa.

La persistencia usa las claves `veterinaria-prototipo-v1`, `veterinaria-prototipo-v1-email` y `veterinaria-theme`. `commit()` conserva una copia de la base y la restaura si falla la persistencia. `withDataLock()` utiliza Web Locks cuando está disponible para coordinar ciertas operaciones. El evento `storage` sincroniza cambios de otras pestañas. Estas reglas deben acompañar la futura separación.

## Qué conviene separar en las etapas posteriores

| Tipo | Código actual que corresponde allí |
| --- | --- |
| Vistas `.vue` | Inicio de sesión y recuperación; inicio del panel; mascotas y ficha; perfiles de propietario y veterinario; agenda interna y calendario del propietario; horarios; catálogo; avisos; recordatorios; sala de espera; historia del día; notificaciones; usuarios; configuración; perfil público. |
| Componentes de una funcionalidad | Tarjeta de mascota, ficha clínica, formulario de atención/vacuna, filas de medicamentos, formulario y detalle de ticket, tarjeta de ingreso y calendario. Se crean cuando se migre la pantalla correspondiente. |
| Componentes compartidos | Marco del panel con navegación, diálogo reutilizable, encabezado, tabla y controles de formulario cuando exista repetición real. `ToastMessage.vue` se conserva. |
| Servicios | Carga y guardado de la base, compatibilidad de datos, acceso y permisos, operaciones de mascotas/propietarios, agenda, sala, atenciones, cobros y recordatorios. Deben recibir datos y devolver resultados sin fabricar HTML ni buscar nodos DOM. |
| Funciones auxiliares | `localDate()`, `addDays()`, `pretty()`, `money()`, `normMeds()` y cálculos de calendario. Deben conservar sus reglas actuales al extraerse. |
| Datos y recursos locales | Cuentas y datos demo, `populateSamplePractice()` y catálogo de avatares. |
| Adaptación temporal | Los dos módulos actuales de generación y conversión de pantallas, mientras haya secciones sin migrar. |

No conviene construir un formulario universal que contemple todas las entidades ni una capa de clases genéricas. Las funciones por tema y componentes concretos son suficientes para este TFI.

## Pruebas y compilación ejecutadas

Entorno comprobado: Node `24.15.0`, npm `11.12.1`, Vue instalado `3.5.43`, Vite `7.3.7` y plugin Vue `6.0.10`.

Antes de editar se intentó la compilación habitual y se ejecutaron los tres scripts de verificación. Después se ejecutaron las nuevas pruebas y los cuatro scripts mediante el comando conjunto. La compilación con cargador nativo produjo los archivos de `dist/` correctamente.

| Comando | Resultado |
| --- | --- |
| `npm.cmd run build` | Falló al cargar `vite.config.js`: esbuild informó acceso denegado a un directorio superior y no pudo resolver la configuración. |
| `npm.cmd run build -- --configLoader native` | Compilación correcta: 21 módulos transformados. Este cargador evita el paso que falla por permisos; no se cambió la configuración del proyecto. |
| `node scripts/verify-attention-facade.mjs` | Correcto: consulta, vacuna, edición, vínculos, recordatorios, medicamentos, conservación del ticket cobrado y fallo de guardado. |
| `node scripts/verify-personal-agenda.mjs` | Correcto: alta/edición/baja, vistas, persistencia simulada, permisos entre cuentas, fechas, reversión y agenda del propietario. |
| `node scripts/verify-pet-avatars.mjs` | Correcto: catálogo de 20 avatares, selección por mascota, conservación de fotos, carga simulada, permisos y reversión. |
| `node scripts/audit-system.mjs` | 32 escenarios correctos; 0 hallazgos y 0 errores del entorno de prueba. Incluye 34 combinaciones de sección y rol. |
| `npm.cmd test` | 20 pruebas correctas; 0 fallidas y 0 omitidas. |
| `npm.cmd run test:regression` | Los tres verificadores anteriores y la auditoría terminaron correctamente. |
| `git diff --check` | Sin errores de espacios en los cambios. |

El informe JSON de esta ejecución es `reports/audit-system-latest.json`. Se genera al ejecutar la auditoría y se ignora en Git para conservar los informes históricos y evitar cambios por cada ejecución. Algunos títulos de escenarios describen problemas históricos; el estado `PASS` significa que la condición comprobada pasó, no que ese problema siga presente.

Las pruebas nuevas cubren validaciones, fechas reales y bisiestas, límite explícito de fecha, horas, importes, enteros, decimales y datos opcionales. También comprueban que la carga demo conserve registros previos, identificadores únicos, vínculos y que repetirla no duplique información. Usan fechas fijas y bases en memoria.

Se eligió `node:test` y `node:assert/strict`, incluidos en Node. Son suficientes para estas funciones JavaScript independientes; Vitest no aporta una necesidad concreta en esta etapa.

### Límites de las verificaciones

- Los scripts de integración reemplazan `localStorage`, DOM y eventos con objetos en memoria. Las eliminaciones que hacen son sobre sus datos ficticios, no sobre el navegador del usuario.
- Esos scripts sustituyen `setHtml()`: no prueban el adaptador real `screenRenderer.js`, el comportamiento completo de Vue ni la presentación del navegador.
- La compilación sí procesa `App.vue` y `ToastMessage.vue`, pero eso no reemplaza una prueba de interacción real.
- No se ejecutaron revisión visual, vista móvil, validación nativa de formularios, impresión real, navegación por URL de los roles en un navegador ni escaneo con cámara. Esta etapa no modifica la interfaz y utiliza verificaciones aisladas para preservar los datos del usuario.
- La auditoría de impresión revisa selectores y estructura; un resultado correcto no garantiza cómo imprimirá cada navegador.
- `verify-personal-agenda.mjs` contiene escenarios que esperan noviembre de 2026 y depende parcialmente de la fecha del sistema. Pasó en esta revisión; más adelante conviene controlar su reloj para evitar fallos al cambiar de mes. No se alteró el script en esta etapa.
- Las funciones internas de fechas, formato monetario y normalización aún están encerradas en el módulo principal. Se identificaron como futuras candidatas a pruebas directas, pero no se extrajeron ni se copiaron para probar una segunda implementación.

## Correcciones realizadas y motivo de cada archivo

| Archivo | Cambio |
| --- | --- |
| `.gitignore` | Se agregaron `.worktrees/`, `.vite/`, `coverage/`, archivos `.log`, `Thumbs.db` y el resultado regenerable de la auditoría. Se conservaron todas las exclusiones anteriores. |
| `package.json` | Se agregaron `test` y `test:regression`. Se mantuvieron `dev`, `build` y `preview` sin cambios. |
| `scripts/audit-system.mjs` | Solo cambia el destino del JSON a `audit-system-latest.json`; conserva las comprobaciones y los códigos de salida. Evita sobrescribir el resultado histórico con fecha fija. |
| `tests/validation.test.js` | Se agregaron 18 pruebas independientes sobre las reglas existentes. No modifica validadores de producción. |
| `tests/samplePractice.test.js` | Se agregaron dos pruebas de integridad y carga única de los datos demo. |
| `README.md` | Se documentaron los comandos de pruebas, el resultado generado, la alternativa de compilación y el enlace a este informe. |
| `reports/etapa-1-revision.md` | Este diagnóstico, sus resultados y la propuesta para las etapas posteriores. |

## Propuesta de estructura

Es una propuesta para implementar progresivamente, no un árbol creado en esta etapa. Los nombres de carpetas y archivos siguen una convención en inglés, como los módulos existentes. Los textos visibles de la aplicación continúan en español.

```text
src/
  main.js
  App.vue
  views/                  # Pantallas completas, agrupadas por funcionalidad
    auth/                 # LoginView.vue, RecoveryView.vue, SetupView.vue
    pets/                 # PetsView.vue, PetProfileView.vue, PublicPetView.vue
    people/               # OwnersView.vue, OwnerProfileView.vue, VetsView.vue, VetProfileView.vue
    agenda/               # PersonalAgendaView.vue, OwnerAgendaView.vue, SchedulesView.vue
    attention/            # WaitingRoomView.vue, DailyHistoryView.vue
    administration/       # HomeView.vue, UsersView.vue, SettingsView.vue
    community/            # CatalogView.vue, NoticesView.vue, RemindersView.vue, NotificationsView.vue
  components/
    shared/               # AppLayout.vue, AppModal.vue, ToastMessage.vue
    pets/                 # PetCard.vue, PetImagePicker.vue
    attention/            # AttentionForm.vue, ClinicalRecordCard.vue, TicketDetail.vue
  services/
    storage.js            # Carga, persistencia y compatibilidad de la base
    auth.js               # Acceso y permisos
    pets.js               # Operaciones de mascotas y propietarios
    agenda.js             # Anotaciones y cuidados, con sus permisos separados
    administration.js    # Cuentas, profesionales, servicios y configuración
    attentionFacade.js
    attentionRecords.js
    tickets.js            # Cobros y conservación del comprobante
    validation.js
  utils/
    dates.js
    formatters.js
    medications.js
  data/
    samplePractice.js
    petAvatars.js
  legacy/                 # Puente temporal; se retira al terminar la migración
    veterinaryApplication.js
    screenRenderer.js
  styles/                 # Los tres CSS actuales, conservando su orden
tests/
scripts/
reports/
public/assets/
```

Las vistas representan secciones; los componentes representan piezas dentro de ellas. `services/` ejecuta operaciones sobre los datos; `utils/` reúne cálculos y formatos reutilizables; `data/` contiene recursos locales. `legacy/` señala el código de transición que todavía genera pantallas de la forma actual.

No se deben crear todos estos archivos y directorios de una vez. Una carpeta por funcionalidad se justifica cuando contenga vistas o componentes reales. Los archivos indicados como nuevos se implementarán cuando llegue su etapa. `App.vue` podrá elegir la vista mediante un estado sencillo; esa decisión no exige instalar Vue Router o Pinia.

## Qué hacer exactamente en la etapa 2, cuando se autorice

La etapa 2 debe reorganizar archivos existentes; todavía no debe convertir pantallas ni separar nuevas operaciones de negocio.

1. Comprobar nuevamente Git y ejecutar `npm test`, `npm run test:regression` y la compilación como referencia.
2. Mover `samplePractice.js` y `petAvatars.js` de `services/` a `data/`. Ajustar sus importaciones en el módulo principal y en las pruebas.
3. Mover los dos módulos de transición a `legacy/`, conservando íntegro su contenido salvo las rutas de importación. Ajustar `App.vue` y los scripts que importan la entrada de la aplicación. No cambiar el contrato `root/setHtml/notify/on/lockedRole`.
4. Mover el toast existente a `components/shared/` y actualizar su importación. Conservar las clases, identificadores, propiedades y texto accesible.
5. Mantener `attentionFacade.js`, `attentionRecords.js` y `validation.js` dentro de `services/`. Dejar los CSS y recursos estáticos en sus ubicaciones actuales.
6. Actualizar README e informe con las rutas reales resultantes. Crear únicamente las carpetas que reciban archivos.
7. Repetir las mismas pruebas y la compilación. Comprobar que el diff contenga movimientos y ajustes de rutas, sin cambios de reglas, datos, claves, QR, estilos ni entidades.

Al terminar esa etapa, realizar una revisión manual con un contexto de navegador aislado y datos ficticios: acceso de los cuatro roles, fichas, agenda, identificación, atención, cobro e impresión. Así se comprueba la integración real sin usar ni reiniciar el perfil habitual. Si no se dispone de ese entorno, documentar la limitación expresamente.

La creación de vistas `.vue` corresponde a la etapa 3. La extracción de lógica por módulos corresponde a la etapa 4. Nada de esa propuesta se implementó durante esta revisión.
