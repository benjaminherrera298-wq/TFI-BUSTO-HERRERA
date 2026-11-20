# Etapa 4 — Servicios de negocio

Fecha: 20 de noviembre de 2026.

## Resultado

Se completó la separación de operaciones en servicios JavaScript sencillos. `veterinaryApplication.js` pasó de **4.078 a 2.027 líneas** aproximadamente. Conserva la navegación, los datos para las vistas, la lectura de formularios y los mensajes; los servicios se encargan de las operaciones y del guardado.

No se modificaron las vistas, componentes, estilos, dependencias ni contratos de props y eventos. Se conservaron los cambios anteriores sin commit, los cuatro roles, las relaciones, las claves y estructuras de `localStorage` y el QR simulado. No se hicieron commits, merges ni pushes.

## Organización

| Archivo nuevo en `src/services/` | Operaciones principales |
| --- | --- |
| `permissions.js` | `isAdmin`, `canPet`, `mayEdit`, acceso a agenda y opciones por rol. Conserva las excepciones existentes. |
| `authService.js` | Inicio de sesión, recuperación, restablecimiento, verificación y validación del administrador inicial. |
| `storageService.js` | `load`, `persist`, `commit`, `withDataLock`, compatibilidad de datos anteriores e inicialización. Si falla el guardado, restaura la base. |
| `peopleService.js` | Búsquedas y vínculos, mascotas permitidas, códigos, avatares, colores y fotos. |
| `entityService.js` | Altas y ediciones de las nueve entidades, relaciones, cuentas vinculadas y cambio de estado. La preparación de cada tipo tiene funciones privadas descriptivas. |
| `clinicalService.js` | Ingresos y estados de sala, deduplicación, motivos, notificaciones del ingreso y guardado clínico. `saveAttention` llama a la fachada existente. |
| `agendaService.js` | Anotaciones por cuenta, cuidados del propietario y `upsertCareReminder`, compartido con la clínica. |
| `ticketService.js` | Consulta de tickets y cobro: precios, total, estado y snapshots de mascota y propietario. |
| `administrationService.js` | Configuración, horarios publicados, avisos y lectura de notificaciones. |
| `createServices.js` | Conecta los servicios y sus dependencias mediante una función; no es un contenedor ni una biblioteca nueva. |

Se reutilizan `attentionFacade.js`, `attentionRecords.js` y `validation.js`. Los datos de demostración, la navegación y la paleta de tarjetas se trasladaron a archivos de `data/`. Las funciones independientes de fechas, formatos e imágenes quedaron en `utils/`.

Todos los servicios reciben **el mismo objeto `state`**. No guardan otra copia de la base: al recargar una pestaña o restaurar un guardado fallido, consultan `state.db` actualizado. Los formularios entregan valores y archivos, sin pasar elementos del DOM a los servicios.

## Verificaciones

Se verificaron los grupos durante la extracción: persistencia y permisos; consultas y entidades; autenticación; clínica, agenda y cobros; acciones y conexión final. Las regresiones de integración siguieron aprobadas después de corregir los problemas detectados durante el trabajo.

| Control | Inicial | Final |
| --- | --- | --- |
| `npm test` | 108 aprobadas | **128 aprobadas, 0 fallos** |
| `npm run test:regression` | Cuatro scripts aprobados | Cuatro scripts aprobados; auditoría **32 PASS, 0 FINDING, 0 HARNESS_ERROR** |
| `npm run build -- --configLoader native` | Correcto | Correcto |
| `git diff --check` | Correcto | Correcto; avisos LF/CRLF de Git sin errores de espacios |

Se añadieron 20 pruebas directas de servicios, sin pantallas: permisos, recuperación, restauración de datos, carga compatible, altas y relaciones, personalización, códigos, agenda por cuenta, recordatorios, sala, guardado clínico conjunto, cobro y notificaciones. También cubren el rechazo del acceso a `localStorage` y la independencia entre instancias.

En **Chrome headless con Playwright** se aprobaron **56 comprobaciones** con cuentas ficticias y contextos aislados:

- Acceso, correo recordado, recuperación y los cuatro roles: 9.
- Formularios de las nueve entidades, perfiles, fotos, vínculos, sincronización y QR: 22.
- Consultas, vacunas, medicamentos, edición, privacidad, cobro e impresión: 11.
- Agenda, cuidados, horarios, servicios, usuarios, configuración y notificaciones: 14.

No aparecieron excepciones JavaScript ni advertencias Vue inesperadas. Se mantiene el 404 previo del favicon. No se repitieron comparaciones visuales: las interfaces y los CSS permanecen idénticos a la referencia inicial. No se accedió a datos del navegador habitual.

La evidencia local está en `.migration-final/stage4/`, excluida de Git: referencia inicial, resultados de comandos y resultados de los cuatro recorridos de navegador.

## Correcciones y pendientes

Al dividir la preparación de entidades, una prueba detectó que se estaba aplicando la validación de mascota a otros tipos. Se restituyeron las condiciones por entidad y se agregó una prueba específica. También se conservó el manejo de errores cuando el navegador rechaza incluso el acceso a `localStorage`.

No quedaron bloqueos de esta etapa. El archivo principal sigue siendo el coordinador de interfaz por diseño; no se cambió la navegación ni se introdujeron Vue Router o Pinia.

Permanecen para una revisión posterior los problemas previos de permisos del build habitual, favicon, ubicación de algunos mensajes de error y pruebas de agenda dependientes de fechas. No se abordaron las etapas 5 o 6, ni backend, ni QR real. Las verificaciones de navegador no certifican otros navegadores o dispositivos físicos.
