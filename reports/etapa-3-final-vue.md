# Etapa 3 — Migración visual a Vue 3

Fecha de cierre: 20 de noviembre de 2026.

## Resultado

**La migración visual de la Etapa 3 quedó terminada.** Las 23 vistas y los formularios y diálogos existentes utilizan componentes Vue reales. Se conservaron Catálogo, Avisos, PetsView y PetCard, y los cambios anteriores sin commit.

El controlador ya no genera HTML de pantallas. Se retiraron sus generadores sin consumidores y el conversor de HTML de `screenRenderer.js`. Este último solamente monta componentes, actualiza sus props y desmonta sus regiones internas antes de reemplazar un padre. No se utiliza `v-html`.

No se instalaron dependencias, no se cambiaron los estilos ni las claves o estructuras de almacenamiento, y no se hicieron commits, merges o pushes. El cambio preexistente en `attentionFacade.js` se conservó.

## Inventario final

Todas las interfaces de esta tabla están migradas. Las rutas son relativas a `src/`.

| Pantallas | Vistas |
| --- | --- |
| Acceso, recuperación y configuración inicial | `views/auth/LoginView.vue`, `RecoveryView.vue`, `SetupView.vue` |
| Inicio | `views/home/HomeView.vue` |
| Catálogo y Avisos, ya existentes | `views/catalog/CatalogView.vue`, `views/notices/NoticesView.vue` |
| Listado y perfil de mascotas | `views/pets/PetsView.vue`, `PetProfileView.vue` |
| Propietarios y veterinarios: listados y perfiles | `views/people/OwnersView.vue`, `OwnerProfileView.vue`, `VeterinariansView.vue`, `VetProfileView.vue` |
| Sala de espera e historia del día | `views/clinical/WaitingRoomView.vue`, `DailyHistoryView.vue` |
| Agenda personal y calendario de cuidados | `views/agenda/PersonalAgendaView.vue`, `OwnerAgendaView.vue` |
| Horarios del personal y del propietario | `views/schedules/SchedulesView.vue`, `OwnerSchedulesView.vue` |
| Recordatorios | `views/reminders/RemindersView.vue` |
| Servicios, usuarios, configuración y notificaciones | `views/administration/ServicesView.vue`, `UsersView.vue`, `SettingsView.vue`, `NotificationsView.vue` |

También quedaron migradas estas interfaces internas:

| Interfaz | Componentes principales |
| --- | --- |
| Navegación, encabezado y acceso | `layout/ApplicationShell.vue`, `AuthLayout.vue` y componentes de `home/` |
| Nueve formularios de entidades | `forms/EntityForm.vue`, con campos explícitos según entidad y vínculos de usuario según rol |
| Configuración, propietario desde una mascota y contraseñas | `forms/ClinicFields.vue`, `InlineOwnerForm.vue`, `ResetPasswordForm.vue` |
| Fotos y avatares de mascotas | `pets/PetImage.vue`, `PetImagePicker.vue`; se conserva `PetCard.vue` |
| Atención, medicamentos y registro clínico | `clinical/AttentionForm.vue`, `MedicationRow.vue`, `ClinicalForm.vue`, `ClinicalRecordCard.vue` |
| Impresión de historia clínica | `clinical/ClinicalHistoryPrint.vue` |
| Anotaciones y recordatorios de cuidados | Componentes de `agenda/` para tarjetas, días y formularios |
| Cobro y comprobante | `tickets/ChargeTicketForm.vue`, `ChargeMedicationRow.vue`, `TicketReceipt.vue` |
| QR simulado, identificación, ingreso y vista pública | Componentes de `identification/`, incluidos `QrSymbol.vue`, `PetQrDialog.vue`, `QrScanDialog.vue`, `ScanResultDialog.vue`, `EntryReasonDialog.vue` y `PublicPetDialog.vue` |
| Modales, confirmaciones, tablas y estados compartidos | `shared/ModalFrame.vue`, `ConfirmationDialog.vue`, `RecordListLayout.vue`, `Pagination.vue`, `StatusBadge.vue`, `AppIcon.vue` y el Toast existente |

El árbol completo está en el README y el registro explícito en `views/viewComponents.js`. Hay 23 vistas y 37 componentes, además de `App.vue`. No quedan pantallas pendientes de conversión visual.

## Cómo funciona ahora Vue

`veterinaryApplication.js` selecciona datos y permisos y entrega props a una vista. `App.vue` busca esa vista en el registro y la monta. Los templates utilizan `v-for`, `v-if` y bindings; los formularios usan reactividad para sus borradores cuando hace falta.

Los componentes emiten acciones hacia la aplicación. Por ejemplo, una tarjeta emite el identificador de la mascota y el controlador abre su perfil. Los botones detienen la propagación cuando ya emitieron su acción, para evitar que se ejecute también el manejador delegado anterior. Los formularios conservan sus nombres y envían sus datos al guardado existente.

Los borradores y los estados de menú o calendario pertenecen a la interfaz; no constituyen otra base de datos. La única base, la navegación, las validaciones, los permisos, los cálculos y el guardado siguen en el controlador y los servicios existentes. Su separación completa corresponde a la Etapa 4.

El QR visible usa rectángulos Vue y el mismo patrón simulado anterior. `data/simulatedQr.js` comparte ese cálculo con la descarga SVG. Se verificó que el archivo descargable sea idéntico al anterior para 104 identificadores. Se conservan los códigos, identificadores y enlaces `#qr=...`.

## Verificación

Al retomar esta última tanda había 106 pruebas aprobadas y la compilación nativa funcionaba. Se integraron las interfaces administrativas y los cobros ya preparados, y se verificó el cierre del renderizador.

| Control final | Resultado |
| --- | --- |
| `npm test` | **108 aprobadas, 0 fallos** |
| `npm run test:regression` | Los cuatro scripts aprobados; auditoría **32 PASS, 0 FINDING, 0 HARNESS_ERROR** |
| `npm run build -- --configLoader native` | Correcta: 83 módulos, sin imports rotos |
| `git diff --check` | Correcto; solamente avisos de conversión LF/CRLF de Git |
| Protección de arquitectura | Pruebas nuevas comprueban que no regrese la generación de HTML y que todas las vistas tengan template, script setup y registro |

La compilación habitual había repetido el error conocido de permisos de esbuild al resolver `vite.config.js`. Se utilizó el cargador nativo solicitado, sin cambiar la configuración para ocultar ese problema.

Las verificaciones anteriores aprobadas se conservaron y no se repitieron capturas equivalentes:

| Grupo | Evidencia de navegador |
| --- | --- |
| Acceso e inicio | 23 comprobaciones aprobadas, incluidas 14 parejas visuales |
| Personas, mascotas e identificación | 22 comprobaciones funcionales; 44 parejas visuales aprobadas |
| Gestión clínica | 25 comprobaciones aprobadas, incluidas 14 parejas visuales |
| Agenda y administración, completadas en esta tanda | 14 recorridos funcionales y 30 parejas visuales; una recaptura puntual por variación mínima de rasterizado quedó en cero diferencias |
| Cobro y comprobante tras su integración | 15 comprobaciones aprobadas, incluidas cuatro parejas visuales de las interfaces modificadas |
| Revisión final del renderizador | Cuatro roles, 34 accesos a vistas, apertura de perfiles, cancelación y reinicio de formularios, desmontaje y cierre de sesión correctos |

Las comparaciones finales indicadas obtuvieron cero píxeles diferentes con umbral cero en escritorio y móvil. Se estabilizaron las animaciones de desplazamiento y, en las capturas administrativas, se fijó la fecha del navegador de pruebas para que los segundos del último acceso no alteraran la comparación. No se cambió la fecha ni el CSS de la aplicación.

Se utilizaron Chrome headless 157 y Playwright ya disponibles, con contextos nuevos, datos ficticios y almacenamiento aislado. Se verificaron permisos, guardado único, validaciones, relaciones, sincronización entre pestañas, navegación, desmontaje, total de cobro, impresión y comprobantes PDF de prueba. No hubo excepciones JavaScript ni advertencias Vue inesperadas. No se accedió al navegador habitual.

La evidencia local está en `.migration-final/`, excluida de Git: resultados, registros de comandos, referencias anteriores, capturas y PDF. Destacan `operations-first-results.json`, `operations-retry-results.json`, `payment-evidence/results.json` y `final-smoke-results.json`; las evidencias previas están en `access-results.json`, `people-evidence/` y `after-c-clinical-evidence/`.

## Correcciones durante la migración

- Se conservaron los espacios entre botones demo y los saltos de diagnóstico que el CSS muestra con `white-space: pre-wrap`.
- El selector de recordatorios conserva la primera opción que mostraba el formulario anterior ante una categoría antigua fuera del catálogo.
- Las tarjetas de agenda reciben los valores actualizados al completar una anotación, aunque el controlador cambie el mismo objeto.
- Los entornos de pruebas ahora esperan el renderizado SSR al cambiar la agenda y componen Configuración con su región de Avisos. No se quitaron verificaciones de datos ni se cambiaron sus expectativas funcionales.
- El renderizador mantiene sus pruebas de orden de desmontaje usando `clear()` en lugar de convertir HTML vacío.

## Pendientes y límites

No hay interfaces pendientes de migración. Permanecen para la Etapa 5 el permiso del build habitual, el favicon faltante, la ubicación de ciertos mensajes de error por identificadores repetidos y la revisión de pruebas de agenda que dependen de fechas. No se alteraron permisos inusuales, como el cambio de estado de mascotas por el veterinario.

La configuración inicial tiene sus cinco pasos probados con componentes reales, pero no se pudo recorrer desde el arranque normal: la carga actual inicializa automáticamente los datos. No se cambió esa regla para forzar la prueba.

La revisión móvil utiliza tamaños de ventana de Chrome; no certifica teléfonos físicos ni otros navegadores. Se comprobó impresión mediante el navegador y PDF, no una impresora física. El QR continúa simulado.

La Etapa 4 deberá separar gradualmente las operaciones de acceso, personas, mascotas, clínica, agenda y cobros en servicios sencillos, conservando los contratos de props y eventos. Esa etapa no se inició.
