# TFI Veterinaria: verificación de Catálogo, etapa 3A

Fecha: 19 de noviembre de 2026. Rama: `dev/benja`. Versión comprobada: `7b59957`.

Se verificó la primera vista Vue de Catálogo con las pruebas existentes y con un navegador Chrome real en modo headless, controlado mediante Playwright. No se encontraron errores funcionales introducidos por la migración. La comparación visual con la versión anterior dio cero píxeles distintos en los dos tamaños comprobados.

Se observó un HTTP 404 de `favicon.ico`, también presente antes de migrar Catálogo. Se documenta por separado: no es una excepción de JavaScript ni un problema introducido por esta vista.

## Alcance y estado inicial

Git estaba limpio al comenzar. Se conservaron la aplicación, las pruebas y las dependencias existentes. No se migró Avisos, no se agregaron funcionalidades y no se realizaron commits, merges ni pushes.

Esta verificación no modifica archivos de producción. El único archivo nuevo destinado al repositorio es este informe. Los programas y capturas utilizados para comprobar el navegador quedaron como artefactos locales ignorados por Git.

## Pruebas automáticas y compilación

En PowerShell se ejecutaron los comandos mediante `npm.cmd`.

| Comando o comprobación | Resultado |
| --- | --- |
| `npm test` | 31 pruebas correctas, 0 fallidas y 0 omitidas. |
| `npm run test:regression` | Los cuatro verificadores terminaron correctamente. |
| Auditoría incluida en regresión | 32 escenarios correctos, 0 hallazgos y 0 errores del entorno de prueba. |
| `npm run build` | Falló al cargar `vite.config.js` por el permiso de esbuild ya conocido. |
| `npm run build -- --configLoader native` | Compilación correcta: 22 módulos transformados, sin errores ni advertencias de compilación. |
| Resolución de importaciones locales | 24 rutas comprobadas, ninguna rota. |
| `git diff --check` | Sin errores de espacios. |

El error de la compilación habitual sigue siendo `Cannot read directory "../../..": Access is denied`. La alternativa nativa evita ese paso de carga de configuración y compila la aplicación. No se modificó Vite para ocultar el problema del entorno.

Las pruebas de Node combinan validaciones y datos en memoria con el template real del catálogo y pruebas de integración. En esta etapa se añadieron comprobaciones de navegador reales para cubrir foco, cursor, controles nativos, diálogos, navegación y presentación.

## Navegador utilizado y aislamiento

El acceso habitual mediante Computer Use falló al intentar conectar su canal nativo. Como alternativa se encontró **Playwright 1.57.0**, ya incluido en el entorno de Codex, y se utilizó desde Node con CommonJS. No se instaló Playwright en el proyecto ni se descargaron navegadores.

Se utilizó **Google Chrome 157.0.8103.79**, instalado en el equipo, con `headless: true`. Esto ejecuta el motor real del navegador, aunque no abra una ventana visible. Las pruebas no se limitaron a simulaciones del DOM.

Medidas de aislamiento utilizadas:

- Chrome se inició como un proceso de prueba con perfil temporal, sin conectarse a una ventana ni a un perfil existente.
- Se crearon contextos nuevos para los roles y para cada comparación visual. Antes de navegar se comprobó que sus cookies y orígenes almacenados estuvieran vacíos.
- Se cargó una base ficticia con cuatro cuentas `@catalogo.example`, perfiles de prueba y tres productos de prueba. La fotografía utilizada es un recurso estático del propio proyecto.
- La base ficticia solo se escribió en el almacenamiento del contexto aislado y únicamente cuando esa clave todavía no existía allí. No se utilizó `localStorage.clear()`.
- No se importó ningún `storageState` del usuario, ni se leyeron credenciales o datos del navegador habitual.
- Los contextos y el navegador temporal se cerraron al finalizar.

Se levantaron dos servidores locales de Vite, accesibles solamente en `127.0.0.1`:

```sh
npm run dev -- --configLoader native --port 5187 --strictPort
node node_modules/vite/bin/vite.js .visual-catalog-3a/baseline --configLoader native --host 127.0.0.1 --port 5188 --strictPort
```

El segundo servidor utilizó una copia obtenida con `git archive` del commit `f069d08`, anterior a la migración. Esa copia se creó dentro de la carpeta ignorada `.visual-catalog-3a/baseline/`, sin cambiar de rama ni reemplazar los archivos actuales.

## Funcionalidades comprobadas en Chrome

La ejecución final del navegador terminó con **14 grupos correctos, 1 observación informativa y 0 grupos fallidos**.

| Grupo | Evidencia y resultado |
| --- | --- |
| Carga de Catálogo | Se muestran los tres productos del administrador, una fotografía cargada correctamente y los dos SVG utilizados cuando no hay fotografía. |
| Búsqueda y foco | Se escribió con el teclado carácter por carácter. Se conservaron el foco, el nodo del campo y la posición del cursor. También se insertó una letra en medio y se borró con Backspace. |
| Búsqueda y categoría | Se encontró un producto por un atributo del JSON que no aparece en su tarjeta, sin distinguir mayúsculas. El filtro conservó la categoría seleccionada. La combinación sin coincidencias mostró `No se encontraron productos.`; limpiar los controles recuperó la lista. |
| Alta del administrador | Un clic abrió un diálogo. Guardar agregó un solo producto y realizó una sola escritura de la base. La tarjeta nueva apareció sin recargar la página. |
| Edición del administrador | Se modificaron nombre, precio y stock; se conservó la cantidad de registros y hubo una sola escritura de guardado. |
| Activación y desactivación | El producto no cambió antes de confirmar. Cada confirmación produjo una sola modificación y la vista mostró el estado actualizado. |
| Navegación y desmontaje | Se realizaron tres recorridos Catálogo → Mascotas → Catálogo. La instancia Vue anterior quedó desmontada y su campo quedó desconectado del documento. El regreso mostró un único buscador y la lista correcta. |
| Cambios entre pestañas | Una segunda pestaña del mismo contexto ficticio modificó un producto. El evento `storage` actualizó Catálogo en la primera pestaña. |
| Cierre y nuevo ingreso | Cerrar sesión desmontó Catálogo y mostró el login. Volver a ingresar permitió regresar con los datos de prueba conservados. |
| Propietario | Solo vio los dos productos activos. No aparecieron botones administrativos. La categoría del producto inactivo no permitió verlo. Una acción de creación alterada en el DOM de prueba tampoco abrió el formulario ni cambió los datos. |
| Superadministrador | Pudo crear, editar y desactivar productos mediante los formularios y confirmaciones existentes. |
| Veterinario | No tuvo acceso a Catálogo en el menú. Un intento de navegación alterado en el DOM de prueba no cambió su pantalla. |
| Escritorio | La comparación visual y las comprobaciones de disposición pasaron en 1440 × 1000. |
| Tamaño móvil | Pasaron la comparación visual, búsqueda, foco, filtro, menú, ida y vuelta entre pantallas y apertura/cierre del formulario en 390 × 844. El diálogo quedó dentro del ancho disponible. |
| Diagnóstico de consola | 0 excepciones JavaScript, 0 avisos de Vue y 0 solicitudes fallidas por transporte. Se registraron dos mensajes HTTP 404 del favicon, uno en cada versión comparada. |

Para comprobar las acciones únicas se contaron, dentro del contexto ficticio, las aperturas de diálogo y las escrituras de la clave de la base. Los controles conservan las operaciones y confirmaciones del sistema; no se reemplazaron por simulaciones.

El desmontaje se comprobó sobre la instancia real montada por Vue en el contenedor y sobre la desconexión de su nodo anterior. No se dedujo únicamente de que cambiara el título de la pantalla.

## Comparación visual con la versión anterior

Se utilizó la misma base ficticia, rol administrador, navegador, idioma, zona horaria, tema oscuro y tamaño de pantalla en ambas versiones. Se esperó a que las fuentes y las imágenes estuvieran listas antes de capturar.

Se compararon los píxeles de las capturas con `pixelmatch`, ya disponible junto con Playwright, usando umbral cero e incluyendo los bordes suavizados. También se inspeccionaron las capturas generadas.

| Tamaño de ventana | Píxeles distintos | Disposición actual |
| --- | --- | --- |
| 1440 × 1000 | 0 | Tres columnas de tarjetas de 348 px. Sin desbordamiento horizontal. |
| 390 × 844 | 0 | Una columna de tarjetas de 358 px. Sin desbordamiento horizontal. |

Las capturas incluyen encabezado, navegación, tarjetas, fotografía, SVG, botones y filtros. El resultado respalda que la migración conserva la apariencia anterior en los dos tamaños y datos utilizados. No se modificó CSS para obtener ese resultado.

El tamaño móvil se comprobó en Chrome de escritorio con una ventana de 390 px de ancho. No equivale a probar un teléfono físico, su teclado virtual o gestos táctiles.

## Errores encontrados y correcciones

**Errores introducidos por la migración de Catálogo:** no se reprodujo ninguno. No fue necesario corregir componentes, servicios, navegación ni reglas de negocio.

**Observación anterior a la migración:** Chrome solicita `/favicon.ico`, que responde 404 tanto en el servidor actual como en la copia de `f069d08`. Se comprobó además la respuesta HTTP de ambos recursos directamente. Estos mensajes se conservaron en el diagnóstico; no se los presentó como una consola completamente vacía ni como excepciones de JavaScript. El favicon no se modificó porque ya faltaba antes y queda fuera de esta corrección de Catálogo.

Durante la preparación del arnés temporal de navegador se corrigieron tres expectativas del propio script: Mascotas también utiliza el identificador `list-search`; el título inicial del veterinario contiene un saludo variable; y el diálogo tiene dos controles de cierre, por lo que se seleccionó expresamente el botón `Cancelar`. Las comprobaciones definitivas verifican la instancia y el nodo anteriores, la conservación de la pantalla del veterinario y el cierre real del diálogo.

No se alteraron las pruebas versionadas para obtener resultados positivos. La clasificación del favicon se realizó únicamente después de identificar su URL y reproducir el mismo 404 en la versión anterior. Cualquier otra excepción o error de consola habría seguido provocando un fallo.

## Evidencia local

Los siguientes artefactos quedaron en `.visual-catalog-3a/`, una carpeta que Git ya ignora mediante `.visual-*/`:

- `verify.cjs`: arnés de las pruebas de navegador ejecutadas.
- `results.json`: resultados finales y diagnóstico de consola.
- `desktop-current.png`, `desktop-baseline.png`, `desktop-diff.png`.
- `mobile-current.png`, `mobile-baseline.png`, `mobile-diff.png`.
- `baseline.zip` y `baseline/`: copia local de la versión anterior.

Son artefactos de esta máquina, no nuevas dependencias ni archivos de producción. El script utiliza `CATALOG_PLAYWRIGHT_MODULE` para localizar la instalación de Playwright que ya existe en el entorno. No se agregó un comando que descargue o instale paquetes.

## Verificaciones pendientes y cierre

- El favicon ausente permanece como observación previa a la migración.
- No se probaron otros motores de navegador ni un teléfono físico. La comparación de píxeles corresponde al administrador con tema oscuro; los demás roles se comprobaron funcionalmente. Los resultados corresponden a la versión de Chrome y los tamaños indicados.
- No se amplió el alcance hacia impresión, cámara, QR u otras funcionalidades ajenas a esta pantalla.

Las comprobaciones solicitadas de Catálogo se completaron en el entorno disponible. Se conservaron el diseño, las reglas, los datos habituales del usuario y la implementación de las demás pantallas. No se comenzó la migración de Avisos.
