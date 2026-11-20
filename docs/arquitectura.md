# Arquitectura y defensa del TFI Veterinaria

El sistema es una aplicación de navegador con Vue 3. Tiene 23 vistas, 37 componentes reutilizables y servicios JavaScript organizados por funcionalidad. La base de trabajo está en memoria y se guarda como JSON en `localStorage`. Esta guía describe el código actual; los cambios de cada etapa quedan en los [informes](../reports/).

## Cómo se inicia y actualiza la interfaz

1. `src/main.js` importa los estilos y ejecuta `createApp(App).mount('#vue-app')`.
2. `App.vue`, en `onMounted`, llama a `startVeterinaryApplication`. Le entrega callbacks para mostrar componentes, registrar eventos y mostrar notificaciones breves.
3. `legacy/veterinaryApplication.js` crea el estado compartido, conecta los servicios con `createServices`, carga los datos y decide qué pantalla mostrar.
4. `App.vue` resuelve el componente en `views/viewComponents.js`. `createScreenRenderer`, de `legacy/screenRenderer.js`, lo monta con `render(h(component, props), target)`.
5. Al cambiar datos, el coordinador vuelve a entregar las props correspondientes. Vue actualiza el componente. Si se sustituye un contenedor padre, el renderizador desmonta antes sus regiones internas; al salir de `App.vue` se limpian suscripciones, temporizadores y componentes.

Las pantallas tienen `<template>`, `<script setup>`, directivas como `v-for` y `v-if` y eventos Vue. No se construyen como cadenas HTML ni usan `v-html`. El nombre `legacy/` identifica la coordinación conservada durante la migración; las interfaces que monta ya son componentes Vue.

La navegación sigue siendo manual: `navigate` y `shell` seleccionan la pantalla y verifican las rutas permitidas. No hay Vue Router ni Pinia.

## Responsabilidades

| Parte | Responsabilidad | Ejemplo existente |
| --- | --- | --- |
| Vista | Representar una pantalla y comunicar sus acciones. | `views/pets/PetsView.vue` |
| Componente | Representar una parte de la interfaz que puede componerse o reutilizarse. | `components/pets/PetCard.vue` |
| Coordinador | Preparar props, recibir acciones y formularios y decidir la navegación posterior. | `legacy/veterinaryApplication.js` |
| Servicio | Consultar o modificar datos aplicando permisos y reglas de negocio. | `services/agendaService.js`, `ticketService.js` |
| Validación | Comprobar formatos, límites y valores antes de guardar. | `services/validation.js` |
| Utilidad | Resolver una tarea auxiliar sin decidir permisos ni operaciones del sistema. | `utils/dates.js`, `formatters.js`, `images.js` |
| Datos | Definir ejemplos, opciones de navegación y recursos de identificación. | `data/sampleDatabase.js`, `demoAccounts.js` |

`createServices.js` conecta estas funciones con sus dependencias. Los servicios reciben el mismo objeto JavaScript `state`, que contiene `db`, `user` y `recovery`; no mantienen bases independientes. `state` no es un almacén reactivo global: el coordinador prepara y actualiza las props después de las operaciones.

La reactividad local sí utiliza APIs de Vue. Por ejemplo, `ChargeTicketForm.vue` usa `ref` para los importes que se editan y `computed` para mostrar el total. Esos valores son un borrador de interfaz; el servicio vuelve a validar y calcular el cobro definitivo.

## Ejemplo real: `PetsView` y `PetCard`

`PetsView.vue` utiliza `PetCard.vue` en el listado del propietario. El padre entrega información mediante **props** y el hijo comunica la acción mediante **emits**. Una prop no es una instrucción para guardar datos: la tarjeta muestra la mascota recibida y emite su identificador.

En [PetCard.vue](../src/components/pets/PetCard.vue), estas son las declaraciones reales:

```js
defineProps({
  pet: { type: Object, required: true },
  image: { type: Object, required: true },
  background: { type: String, default: '' },
  colors: { type: Array, default: () => [] },
  pickerOpen: Boolean
});

const emit = defineEmits(['open', 'qr', 'photo', 'color', 'pickColor']);
```

El botón del perfil emite `open` con `pet.id`:

```html
<button type="button" class="primary" data-action="pet" :data-id="pet.id" @click.stop="emit('open', pet.id)">Ingresar al perfil →</button>
```

Este fragmento del template de [PetsView.vue](../src/views/pets/PetsView.vue) muestra cómo el padre entrega las props y escucha los eventos:

```html
<PetCard v-for="row in rows" :key="row.pet.id" :pet="row.pet" :image="row.image" :background="row.background"
         :colors="cardColors" :picker-open="colorPickerId === row.pet.id"
         @open="emit('open', $event)" @qr="emit('qr', $event)" @photo="emit('photo', $event)"
         @color="emit('color', $event)" @pick-color="emit('pickColor', $event)" />
```

`PetsView` también declara `open` con `defineEmits`: recibe el identificador en `$event` y lo comunica al coordinador. El callback `onOpen` que entrega `petsView()` llama a `action('pet', id)`, que abre el perfil mediante `navigate`. Ninguno de estos dos componentes escribe en `localStorage`.

El modificador `.stop` evita que el clic del botón llegue también al manejador general de clics de `App.vue`. Así se conserva la compatibilidad con los atributos `data-action` sin ejecutar la acción dos veces.

## Recorrido real de una atención hasta el guardado

Ejemplo: un veterinario guarda una consulta desde un ingreso de la sala de espera.

1. `components/clinical/AttentionForm.vue` envía un formulario con `data-form="attention"` y los datos de la consulta.
2. `App.vue` recibe el evento `submit` y lo entrega al manejador registrado por el coordinador. Este evita el envío HTTP del navegador, desactiva temporalmente el botón y ejecuta `submitForm`.
3. `submitForm` lee `FormData` y llama a `clinical.saveAttention`. Los servicios reciben valores, no elementos del DOM.
4. `clinicalService.js` vuelve a cargar la base y verifica el rol, el ingreso y la mascota. Llama a `registrarAtencion`, creada por `createAttentionFacade` en `attentionFacade.js`.
5. La fachada comprueba la asignación al veterinario, los duplicados y los datos clínicos. Reutiliza `validation.js` y coordina las funciones de `attentionRecords.js`: `saveAttentionRecord`, `saveAttentionTicket`, `updateAttentionWaitingRoom` y `saveAttentionReminder`.
6. Las modificaciones se realizan dentro de una sola llamada a `commit` de `storageService.js`. `persist` guarda `JSON.stringify(state.db)` bajo la clave **`veterinaria-prototipo-v1`**. Si falla la escritura, `commit` restaura la base anterior en memoria y avisa del problema.
7. Si el resultado es correcto, el coordinador cierra el diálogo, navega a la historia del día y actualiza la interfaz. Los errores del formulario se muestran en su propia región `data-form-error`.

El registro manual de historia clínica utiliza `saveClinicalRecord`; no todos los registros clínicos tienen necesariamente un ticket o un ingreso de sala asociado. El flujo anterior corresponde específicamente a una atención desde la sala de espera.

Los formularios de atención y cobro utilizan `withDataLock`. Este aprovecha `navigator.locks` cuando está disponible; no equivale a una transacción de base de datos en un servidor. El evento `storage` permite recargar cambios de otras pestañas del mismo origen y revisar la vigencia de la sesión.

Además de la base, se conservan las claves `veterinaria-theme` para el tema y `veterinaria-prototipo-v1-email` para recordar el correo. Recordar el correo no guarda una sesión autenticada.

## Relaciones principales

| Registro o colección de `state.db` | Relación |
| --- | --- |
| `users` | Una cuenta de propietario referencia `owners` por `ownerId`; una de veterinario referencia `vets` por `vetId`. |
| `pets` | Cada mascota tiene `ownerId`. Un propietario puede estar vinculado a varias mascotas. `code` y `qr` son sus identificadores de identificación. |
| `waitingRoom` | Cada ingreso referencia la mascota con `petId`, conserva `ownerId`, motivo, estado y datos del profesional que lo toma. |
| `clinical` | Reúne los registros que forman la historia clínica. Se consultan por `petId`; pueden incluir `vetId`, autor, `waitingEntryId` y `ticketId`. `visible` determina si el propietario puede ver el registro. |
| `tickets` | Referencia la atención mediante `clinicalId` y, en el flujo de sala, el ingreso con `waitingEntryId`. Conserva `petId`, `ownerId`, conceptos, importes y estado. Al cobrar se guardan copias de datos para el comprobante. |
| `reminders` | Los cuidados se vinculan por `petId`; los generados por una atención también usan `clinicalId`. `source` distingue indicaciones del equipo y recordatorios del propietario. |
| `agendaNotes` | Son anotaciones personales identificadas por `userId`. No son reservas ni modifican los cuidados de una mascota. |

La historia clínica no es otra copia de la base: es la presentación de los registros de `clinical` correspondientes a una mascota. Una corrección clínica no altera los conceptos ni importes de un ticket ya pagado.

## Roles y permisos

`services/permissions.js` define `allowed` para la navegación y las funciones `isAdmin`, `canPet`, `mayEdit` y `canUsePersonalAgenda`. Los servicios también comprueban permisos antes de modificar registros; ocultar un botón no reemplaza esa validación.

| Rol interno | Alcance principal |
| --- | --- |
| `admin` | Gestión operativa, mascotas, profesionales, sala, cobros, catálogo, horarios y configuración. En Usuarios administra cuentas de propietario y veterinario; los avisos se gestionan desde Configuración. |
| `superadmin` | Acceso administrativo ampliado, incluidos propietarios, servicios, historia del día y atención desde la sala. También conserva las restricciones de integridad de las cuentas. |
| `vet` | Pacientes, historia clínica, atenciones permitidas, notificaciones y agenda personal. No cobra ni administra catálogo o configuración. |
| `owner` | Sus mascotas, registros clínicos compartidos, su perfil, cuidados, horarios publicados, catálogo y avisos permitidos. No accede a notas personales del equipo ni cobra o registra atenciones. |

Hay reglas heredadas que conviene conocer al defender el proyecto: `mayEdit` permite al veterinario operar sobre mascotas, propietarios y recordatorios, aunque cada vista ofrece botones específicos; se conserva el cambio de estado de mascotas. No se puede tomar una atención asignada a otro veterinario ni editar su atención con ese rol. El superadministrador mantiene el acceso ampliado previsto en ese flujo.

`authService.js` verifica credenciales, cuenta activa y perfil vinculado activo. `App.vue` interpreta `?rol=...` para restringir el acceso de una página. Si otra pestaña desactiva la cuenta o su perfil, o cambia el rol de una página restringida, el coordinador cierra la sesión y el diálogo abierto.

## Limitaciones actuales

- **Almacenamiento local:** los datos pertenecen al navegador y al origen que sirve la aplicación. Cambiar el dominio o puerto, usar otro perfil o dispositivo no comparte la base. No existe almacenamiento centralizado ni sincronización de equipo mediante servidor.
- **Acceso de demostración:** las contraseñas se comparan y almacenan localmente, y el código `123456` de recuperación es simulado. No hay verificación real por correo ni autenticación segura de servidor. El sistema está preparado para datos ficticios de un TFI.
- **QR simulado:** `data/simulatedQr.js` genera el patrón y `QrSymbol.vue` lo representa. Se conservan los códigos de cinco dígitos y enlaces `#qr=...`; no hay QR estándar generado por una biblioteca ni escaneo con cámara. Un enlace identifica un registro de la base disponible en ese navegador; no transporta sus datos a otro dispositivo.
- **Sin backend ni MySQL:** los servicios actuales son funciones ejecutadas en el navegador. No hay API, consultas SQL ni conexión a MySQL implementadas.

## Preguntas para la defensa

**¿Dónde se utiliza realmente Vue?** En las vistas y componentes `.vue`: los templates representan datos, las directivas generan listas y condiciones y los eventos comunican acciones. `App.vue` y el renderizador montan componentes Vue reales.

**¿Cuál es la diferencia entre vista y componente?** Ambos son componentes Vue técnicamente. Llamamos vista a una pantalla completa, como `PetsView`, y componente a una parte, como `PetCard`, que puede formar parte de esa pantalla.

**¿Cómo se comunican el padre y el hijo?** El padre entrega props. El hijo emite un evento con un dato concreto, por ejemplo `open` con `pet.id`. El padre escucha ese evento y comunica la acción al coordinador.

**¿Por qué todavía existe `legacy/`?** Conserva la navegación y la conexión con formularios durante la migración progresiva. Las pantallas ya están en Vue y las operaciones están en servicios. El nombre no implica que siga generando pantallas HTML como texto.

**¿Cómo evitan duplicar el estado o las validaciones?** Los servicios comparten `state.db`. Los componentes mantienen solo borradores o estados de interfaz. Las validaciones compartidas están en `validation.js` y las atenciones reutilizan la fachada y sus operaciones de registros.

**¿Qué pasa si falla el guardado?** `persist` informa el error y `commit` restaura la base anterior. En una atención, clínica, ticket, sala y recordatorio se coordinan en un solo guardado. Eso no garantiza las transacciones ni la concurrencia de un backend.

**¿Por qué no utilizaron Vue Router y Pinia?** El proyecto conserva una navegación explícita y un estado común para completar una migración gradual. No utiliza esas bibliotecas; su incorporación sería una decisión posterior, no un requisito para usar componentes Vue.

**¿Cómo comprobaron el funcionamiento y qué falta para un sistema real?** La etapa 5 registró 133 pruebas aprobadas, regresiones y recorridos en Chrome aislado. Cubren el prototipo local; para un sistema conectado faltarían backend, persistencia centralizada, autenticación de servidor y QR real. No afirmamos que MySQL ya esté integrado.
