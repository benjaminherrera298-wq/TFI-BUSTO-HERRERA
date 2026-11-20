# Sistema de Gestión Veterinaria

Trabajo Final Integrador desarrollado con Vue 3. Permite gestionar la actividad de una veterinaria mediante pantallas organizadas por rol, componentes reutilizables y servicios de negocio. Funciona en el navegador con datos locales de demostración.

## Funcionalidades

- Acceso para administrador, veterinario, propietario y superadministrador.
- Gestión de usuarios, propietarios, profesionales, mascotas y sus relaciones.
- Sala de espera, consultas, vacunas e historia clínica por mascota.
- Tickets, registro de cobros e impresión de comprobantes e historia clínica.
- Agenda personal del equipo y calendario de cuidados del propietario.
- Horarios de atención, servicios, catálogo, avisos y notificaciones.
- Identificación de mascotas por código y QR simulado; fotos, avatares y colores de tarjetas.

La agenda registra anotaciones y cuidados: no implementa reservas de turnos. Los avisos y notificaciones son internos; no se envían correos ni mensajes reales.

## Tecnologías

| Tecnología | Uso |
| --- | --- |
| Vue 3 | Vistas y componentes `.vue`, Composition API y `<script setup>`. |
| JavaScript y CSS | Operaciones, validaciones, estilos responsive e impresión. |
| Vite 7 y `@vitejs/plugin-vue` | Desarrollo y compilación. |
| Node.js | Ejecutor de pruebas incluido: `node --test`. |
| `localStorage` | Persistencia de la base de demostración en el navegador. |

Las dependencias están en [package.json](package.json). No se utilizan Vue Router ni Pinia, y no hay un backend conectado a MySQL.

## Estructura

```text
src/
  main.js                  Entrada de Vue e importación de estilos.
  App.vue                  Inicio, eventos y montaje de vistas y diálogos.
  views/                   23 vistas agrupadas por funcionalidad.
    viewComponents.js      Registro explícito de componentes que monta App.
  components/              37 componentes: mascotas, clínica, formularios,
                           agenda, navegación, identificación y elementos compartidos.
  services/                Permisos, acceso, entidades, clínica, agenda,
                           tickets, administración y persistencia.
  utils/                   Fechas, formatos e imágenes.
  data/                    Datos de ejemplo, navegación, avatares y QR simulado.
  legacy/                  Coordinación de la aplicación y renderizado Vue.
  styles/                  Estilos generales, tema e impresión.
public/                    Recursos estáticos y favicon.
tests/                     Pruebas unitarias, componentes e integración.
scripts/                   Verificaciones de regresión y auditoría.
docs/                      Explicación de la arquitectura y guía para la defensa.
reports/                   Informes históricos y resultados por etapa.
```

Las vistas presentan pantallas; los componentes representan partes de ellas. Los servicios aplican reglas y guardan los cambios. `legacy/veterinaryApplication.js` conserva la navegación y conecta la interfaz con esos servicios; `legacy/screenRenderer.js` monta, actualiza y desmonta componentes Vue.

La [arquitectura del proyecto](docs/arquitectura.md) explica el estado compartido, las relaciones, los permisos y un ejemplo real de props y eventos.

## Instalación y ejecución

Requiere Node.js 20 desde la versión 20.19, o Node.js 22.12 o superior, según los requisitos de Vite instalado.

Desde la carpeta del proyecto:

```sh
npm install
npm run dev
```

Abrí la dirección que indique Vite. Si PowerShell bloquea `npm.ps1`, usá `npm.cmd` en los mismos comandos; no hace falta cambiar la política de ejecución de Windows.

### Accesos de demostración

En una base de demostración, estas cuentas usan la contraseña `123456`. El acceso general es `/`; las direcciones específicas restringen el rol admitido en esa página.

| Rol | Correo de demostración | Dirección |
| --- | --- | --- |
| Administrador | `admin@veterinaria.com` | `/?rol=admin` |
| Veterinario | `doctor@veterinaria.com` | `/?rol=veterinario` |
| Propietario | `cliente@correo.com` | `/?rol=propietario` |
| Superadministrador | `superadmin@veterinaria.com` | `/?rol=superadmin` |

Las cuentas se definen en `src/data/demoAccounts.js`; pueden haber cambiado si se editaron en la base local. El código de verificación y recuperación es simulado: `123456`.

## Pruebas y compilación

| Comando | Qué hace |
| --- | --- |
| `npm test` | Ejecuta las pruebas de funciones, servicios, componentes y sus integraciones. |
| `npm run test:regression` | Verifica atenciones, agenda, avatares y auditoría del sistema. |
| `npm run build` | Genera la aplicación de producción en `dist/`. |
| `npm run preview` | Sirve la compilación para revisarla localmente. Requiere compilar antes. |
| `git diff --check` | Revisa errores de espacios en los cambios de Git. |

Los comandos `dev`, `build` y `preview` usan `--configLoader native`: Node carga la configuración JavaScript directamente y evita el fallo de permisos de esbuild documentado en la etapa 5. No abras el `index.html` fuente con doble clic; utilizá Vite o un servidor estático para `dist/`.

La última ejecución de la [etapa 5](reports/etapa-5-verificacion.md) registró **133 pruebas aprobadas**, cuatro scripts de regresión correctos y 27 comprobaciones en Chrome con Playwright. Las pruebas automáticas usan datos ficticios; las de navegador utilizaron contextos aislados. Playwright no es una dependencia del proyecto. La auditoría genera `reports/audit-system-latest.json`, excluido de Git. La regresión de agenda utiliza un reloj fijo de prueba.

## Alcance y documentación

Los datos se guardan en `localStorage` por navegador y origen; no se comparten entre dispositivos. El QR es simulado y no incluye escaneo real con cámara. Las cuentas y la recuperación son una demostración local, sin autenticación de servidor. No hay una API ni conexión con MySQL.

- [Arquitectura y defensa académica](docs/arquitectura.md): funcionamiento actual y límites del sistema.
- [Informe final de migración a Vue](reports/etapa-3-final-vue.md): interfaces migradas.
- [Servicios de negocio](reports/etapa-4-servicios.md): separación de operaciones.
- [Correcciones y verificación](reports/etapa-5-verificacion.md): últimas pruebas y problemas corregidos.

Los demás [informes](reports/) se conservan como antecedentes. Esta documentación describe el código existente; no incorpora funcionalidades nuevas.
