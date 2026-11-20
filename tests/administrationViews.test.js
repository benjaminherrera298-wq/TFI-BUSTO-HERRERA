import test from 'node:test';
import assert from 'node:assert/strict';
import { createSSRApp, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { loadVueComponent } from './helpers/loadVueComponent.js';
import { mountVueComponent } from './helpers/mountVueComponent.js';

const load = path => loadVueComponent(new URL(path, import.meta.url));
const OwnersView = await load('../src/views/people/OwnersView.vue');
const VeterinariansView = await load('../src/views/people/VeterinariansView.vue');
const ServicesView = await load('../src/views/administration/ServicesView.vue');
const UsersView = await load('../src/views/administration/UsersView.vue');
const NotificationsView = await load('../src/views/administration/NotificationsView.vue');
const SettingsView = await load('../src/views/administration/SettingsView.vue');
const html = (view, props) => renderToString(createSSRApp(view, props));
const list = extra => ({ clinicName: 'Veterinaria prueba', title: 'Propietarios', subtitle: 'Registros de prueba', collection: 'owners', canCreate: true, query: '', statusFilter: '', pageNumber: 1, totalPages: 2, totalRecords: 9, ...extra });
const ownerRow = { owner: { id: 'owner-one', name: 'Ana <prueba>', dni: '30111222', phone: '3815550123', email: 'ana@example.com', active: true }, petCount: 2 };

test('el listado de propietarios conserva contacto, cantidad de mascotas y controles según permiso', async () => {
  const props = { list: list(), rows: [ownerRow], canManage: true };
  const markup = await html(OwnersView, props);
  for (const text of ['Ana &lt;prueba&gt;', '30111222', '3815550123', 'ana@example.com', '>2</td>', 'Ver perfil', 'Editar', 'Desactivar']) assert.ok(markup.includes(text), text);
  assert.match(markup, /data-id="owners:owner-one"/);
  assert.match(markup, /9 registros · Página 1 de 2/);
  assert.doesNotMatch(await html(OwnersView, { ...props, canManage: false }), /data-action="toggle"/);
});

test('el listado veterinario conserva servicios, perfil y cuenta vinculada para restablecer contraseña', async () => {
  const rows = [{ vet: { id: 'vet-one', name: 'Profesional de prueba', license: 'MP 999', specialty: 'Clínica general', active: true }, serviceNames: ['Consulta', 'Vacunación'], accountId: 'user-one' }];
  const props = { list: list({ title: 'Veterinarios', collection: 'vets' }), rows };
  const markup = await html(VeterinariansView, props);
  assert.match(markup, /Consulta, Vacunación/);
  assert.match(markup, /MP 999/);
  assert.match(markup, /data-action="reset-password" data-id="user-one"/);
  assert.match(markup, /data-action="vet" data-id="vet-one"/);
  const noAccount = await html(VeterinariansView, { ...props, rows: [{ ...rows[0], accountId: '' }] });
  assert.doesNotMatch(noAccount, /data-action="reset-password"/);
});

test('la consulta de servicios muestra descripción sin operaciones administrativas cuando no es editable', async () => {
  const props = { list: list({ title: 'Servicios', collection: 'services', canCreate: false }), rows: [{ service: { id: 'service-one', name: 'Consulta', duration: 30, description: 'Descripción ficticia', active: false }, vetNames: [] }] };
  const readonly = await html(ServicesView, props);
  assert.match(readonly, /Descripción ficticia/);
  assert.match(readonly, /Sin asignar/);
  assert.match(readonly, /30 min/);
  assert.doesNotMatch(readonly, /data-action="(?:create|edit|toggle)"/);
  const editable = await html(ServicesView, { ...props, editable: true });
  assert.ok(editable.includes('Editar / asignar'));
  assert.match(editable, /data-action="toggle" data-id="services:service-one"/);
});

test('el listado de usuarios conserva roles, último acceso y la excepción de desactivar su propia cuenta', async () => {
  const props = { list: list({ title: 'Usuarios', collection: 'users' }), rows: [{ account: { id: 'user-one', name: 'Persona de prueba', email: 'persona@example.com', phone: '3815550123', active: true }, roleName: 'Propietario', lastAccess: 'Sin acceso', isCurrent: true }] };
  const current = await html(UsersView, props);
  assert.match(current, /Propietario/);
  assert.match(current, /Sin acceso/);
  assert.match(current, /data-action="reset-password"/);
  assert.doesNotMatch(current, /data-action="toggle"/);
  const other = await html(UsersView, { ...props, rows: [{ ...props.rows[0], isCurrent: false }] });
  assert.match(other, /data-action="toggle" data-id="users:user-one"/);
});

test('la composición de listados emite búsquedas y acciones una sola vez y conserva el nodo del buscador', async () => {
  const events = [];
  const props = { list: list(), rows: [ownerRow], canManage: true, onSearch: text => events.push(['search', text]), onFilter: value => events.push(['filter', value]), onPage: page => events.push(['page', page]), onAction: (...args) => events.push(args) };
  const view = mountVueComponent(OwnersView, props);
  const search = view.find(node => node.props.id === 'list-search');
  let stopped = 0;
  const event = value => ({ target: { value }, stopPropagation() { stopped++; } });
  search.props.onInput(event('Ana'));
  view.find(node => node.props.id === 'list-filter').props.onChange(event('Activo'));
  view.find(node => node.props['data-action'] === 'create').props.onClick(event());
  view.find(node => node.props['data-action'] === 'owner').props.onClick(event());
  view.find(node => node.props['data-action'] === 'edit').props.onClick(event());
  view.find(node => node.props['data-action'] === 'toggle').props.onClick(event());
  view.find(node => node.props['data-action'] === 'page' && node.props['data-id'] === 2).props.onClick(event());
  assert.deepEqual(events, [['search', 'Ana'], ['filter', 'Activo'], ['create', 'owners'], ['owner', 'owner-one'], ['edit', 'owners:owner-one'], ['toggle', 'owners:owner-one'], ['page', 2]]);
  assert.equal(stopped, 7);
  view.update({ ...props, list: list({ query: 'Ana', statusFilter: 'Activo' }) });
  await nextTick();
  assert.equal(view.find(node => node.props.id === 'list-search'), search);
  assert.equal(search.props.value, 'Ana');
  view.unmount();
  assert.equal(view.root.children.length, 0);
});

test('los estados vacíos de los cuatro listados mantienen filtros y paginación', async () => {
  for (const view of [OwnersView, VeterinariansView, ServicesView, UsersView]) {
    const markup = await html(view, { list: list({ totalRecords: 0, totalPages: 1 }), rows: [] });
    assert.match(markup, /No hay registros para mostrar\./);
    assert.match(markup, /0 registros · Página 1 de 1/);
    assert.match(markup, /id="list-search"/);
    assert.doesNotMatch(markup, /<table/);
  }
});

test('notificaciones conserva estados leídos y sus acciones sin agregar un estado vacío nuevo', async () => {
  const rows = [{ notification: { id: 'notice-one', message: 'Mensaje <ficticio>' }, date: '19/11/2026, 10:30', read: false }, { notification: { id: 'notice-two', message: 'Otro mensaje' }, date: '19/11/2026, 11:30', read: true }];
  const markup = await html(NotificationsView, { clinicName: 'Veterinaria prueba', rows });
  assert.match(markup, /Mensaje &lt;ficticio&gt;/);
  assert.equal((markup.match(/data-action="read"/g) || []).length, 1);
  assert.match(markup, /Leída/);
  const events = [];
  const view = mountVueComponent(NotificationsView, { rows, onAction: (...args) => events.push(args) });
  for (const action of ['read-all', 'read']) view.find(node => node.props['data-action'] === action).props.onClick({ stopPropagation() {} });
  assert.deepEqual(events, [['read-all', ''], ['read', 'notice-one']]);
  view.unmount();
  assert.doesNotMatch(await html(NotificationsView, { rows: [] }), /class="empty"/);
});

test('Configuración conserva sus campos y el contenedor independiente de Avisos', async () => {
  const config = { name: 'Veterinaria prueba', identifier: '20300000001', address: 'Calle ficticia', phone: '3815550123', email: 'clinica@example.com', days: [1], start: '08:00', end: '20:00', duration: 30 };
  const markup = await html(SettingsView, { clinicName: config.name, config });
  assert.match(markup, /data-form="settings" data-id(?:="")?>/);
  assert.match(markup, /id="settings-notices" aria-label="Avisos de la veterinaria"/);
  for (const name of ['name', 'identifier', 'address', 'phone', 'email', 'logo', 'days', 'start', 'end', 'duration']) assert.ok(markup.includes(`name="${name}"`), name);
  assert.match(markup, /type="submit">Guardar/);
  assert.match(markup, /data-form-error(?:="")?/);
});
