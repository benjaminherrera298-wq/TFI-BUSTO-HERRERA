# Etapa 5 — Correcciones y verificación final

Fecha: 20 de noviembre de 2026.

## Correcciones

- **Compilación:** el fallo inicial ocurre al empaquetar `vite.config.js`: esbuild intenta leer directorios superiores y recibe `Access is denied`. El cargador nativo compila el mismo código correctamente. Los scripts `build`, `dev` y `preview` ahora lo seleccionan directamente; también se reprodujo el fallo de `dev` antes de corregirlo. La configuración es JavaScript y no requiere esa transformación previa. No se cambiaron permisos del sistema ni dependencias. Es una opción [documentada por Vite](https://vite.dev/config/#config-loading), verificada con la versión 7.3.7 instalada.
- **Favicon:** se añadió un SVG local y su enlace en `index.html`; Chrome lo recibe con estado 200, sin el 404 anterior.
- **Errores de formularios:** se reemplazó el identificador repetido `form-error` por `data-form-error` en los 15 formularios. El controlador busca y limpia el mensaje dentro del formulario enviado. Un error del modal ya no aparece en Configuración; si no existe región de error, se utiliza la notificación.
- **Fechas de pruebas:** la regresión de agenda utiliza el reloj simulado incluido en Node, fijado en noviembre de 2026 y restaurado al terminar. Conserva todas sus comprobaciones. Las fechas reales de la aplicación no se modificaron.
- **Sincronización de permisos:** se reprodujeron dos errores adicionales: una sesión permanecía abierta al desactivar su perfil vinculado desde otra pestaña, y una página exclusiva de un rol aceptaba un cambio de rol durante la sesión. Ahora se reutiliza la validación del acceso y se cierra también el diálogo abierto. No se cambiaron los permisos asignados a cada rol.

## Archivos de esta etapa

| Archivos | Cambio |
| --- | --- |
| `package.json` | Cargador nativo en los tres comandos Vite. |
| `index.html`, `public/favicon.svg` | Icono local de la pestaña. |
| `src/legacy/veterinaryApplication.js` | Mensajes por formulario y revocación de sesiones sincronizadas. |
| `src/services/authService.js` | Validación compartida `isAccountEnabled` para acceso y sincronización. |
| Formularios de `components/agenda`, `clinical`, `forms`, `identification`, `tickets`; `SettingsView.vue`, `LoginView.vue`, `RecoveryView.vue`, `SetupView.vue` | Solamente reemplazar el atributo de la región de error; mismos textos, clases y estructura. |
| `tests/applicationSafety.test.js` | Cinco pruebas nuevas: mensajes aislados, notificación alternativa, revocación por perfil, rol bloqueado y fechas límite. |
| `tests/administrationViews`, `clinicalViews`, `peopleViews`, `sharedDialogs`, `catalogIntegration`, `noticesIntegration`, `petsIntegration` | Adaptar los selectores y formularios simulados al atributo nuevo; conservar las expectativas funcionales. Todos son archivos `.test.js`. |
| `scripts/verify-personal-agenda.mjs`, `verify-pet-avatars.mjs`, `audit-system.mjs` | Selector dentro del formulario; reloj fijo únicamente en la regresión de agenda. |
| `README.md` | Explicar los comandos corregidos, la prueba con reloj fijo y el uso de `npm.cmd` cuando PowerShell bloquea `npm.ps1`. |

Los cambios previos se conservaron. No se tocaron CSS, props, eventos, navegación, claves de almacenamiento, cobros, relaciones ni QR simulado. No se hicieron commits, merges o pushes.

## Resultados

| Verificación | Inicial | Final |
| --- | --- | --- |
| `npm test` | 128 aprobadas | 133 aprobadas, 0 fallos |
| `npm run test:regression` | Cuatro scripts correctos | Cuatro scripts correctos; auditoría 32 PASS, 0 FINDING, 0 HARNESS_ERROR |
| `npm run build` | Falla al cargar la configuración con esbuild | Correcto con el cargador nativo configurado en el script |
| `npm run build -- --configLoader native` | Correcto | Integrado en el comando habitual |
| `git diff --check` | Sin errores | Sin errores; avisos LF/CRLF de Git |

En este PowerShell se ejecutó `npm.cmd`, porque la política de Windows bloquea `npm.ps1`. No se alteró esa política.

La regresión de agenda pasó también con `TZ=Pacific/Kiritimati` y `TZ=America/Argentina/Buenos_Aires`. Las pruebas nuevas verifican febrero bisiesto y cambios de mes y año. Se comprobó además el arranque de desarrollo con el comando corregido.

En **Chrome headless con Playwright**, sobre la compilación de producción, pasaron **27 comprobaciones**: 16 de acceso, formularios, favicon, altas relacionadas, recuperación, agenda, privacidad y sincronización; y 11 del recorrido clínico, historia compartida, vacunas, validaciones, cobro y comprobante. Se verificaron rechazos sin escribir datos, guardados únicos y persistencia al recargar. Se reprodujo el error de Configuración con un modal abierto y se comprobó su corrección. La agenda se comprobó también con fecha simulada del 29 de febrero de 2028.

Se utilizaron datos ficticios y contextos nuevos, sin acceder al navegador habitual. No hubo excepciones JavaScript, advertencias Vue ni recursos faltantes. No se repitieron comparaciones visuales: los CSS permanecen intactos. Los resultados anteriores se conservaron; la evidencia nueva queda en `.migration-final/stage5/`, excluida de Git.

## Pendientes y alcance

No quedaron fallos funcionales detectados pendientes de esta etapa. El cargador alternativo `bundle` sigue sujeto a los permisos del entorno; los comandos normales utilizan `native` para evitar ese paso. Las pruebas realizadas no certifican otros navegadores ni dispositivos físicos.

No se implementaron backend ni QR real y no se inició la Etapa 6.
