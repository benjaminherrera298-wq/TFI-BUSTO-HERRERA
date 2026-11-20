import test from 'node:test';
import assert from 'node:assert/strict';
import { createSSRApp, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { loadVueComponent } from './helpers/loadVueComponent.js';
import { mountVueComponent } from './helpers/mountVueComponent.js';

const PetsView = await loadVueComponent(new URL('../src/views/pets/PetsView.vue', import.meta.url));
const row = { pet: { id: 'p1', name: 'Luna', code: '41001', species: 'Gato', breed: 'Mestizo', sex: 'Hembra', ownerId: 'o1', active: true }, ownerName: 'Ana', image: { src: '', alt: 'Luna', isAvatar: false }, background: '' };
const props = (extra = {}) => ({ clinicName: 'Veterinaria prueba', rows: [row], canCreate: true, canScan: true, canEdit: true, canShowQr: true, totalRecords: 1, ...extra });
const html = values => renderToString(createSSRApp(PetsView, props(values)));

test('PetsView conserva la tabla, filtros, acciones y paginación del personal', async () => {
  const markup = await html();
  for (const text of ['Mascotas', 'Código', 'Especie / raza', 'Propietario', 'Luna', 'Mestizo', 'Hembra', 'Ana', 'Activo', '1 registros · Página 1 de 1']) assert.ok(markup.includes(text), text);
  for (const action of ['scan', 'create', 'pet', 'owner', 'edit', 'qr', 'toggle', 'page']) assert.ok(markup.includes(`data-action="${action}"`), action);
  assert.match(markup, /id="list-filter"/);
  for (const option of ['Todos', 'Perro', 'Gato', 'Otro']) assert.ok(markup.includes(`>${option}</option>`));
  const vet = await html({ canCreate: false, canScan: false, canEdit: false, canShowQr: false });
  assert.doesNotMatch(vet, /data-action="(?:scan|create|edit|qr)"/);
  assert.match(vet, /data-action="toggle"/, 'El veterinario conserva la acción existente.');
  const empty = await html({ rows: [], totalRecords: 0 });
  assert.match(empty, /No hay registros para mostrar\./);
  assert.match(empty, /0 registros · Página 1 de 1/);
  assert.doesNotMatch(empty, /<table/);
});

test('PetsView compone las tarjetas del propietario y conserva el input delegado de archivos', async () => {
  const markup = await html({ isOwner: true });
  assert.match(markup, /¿Con qué mascota querés ingresar\?/);
  assert.match(markup, /card owner-pet-card/);
  assert.match(markup, /id="owner-pet-photo-input"/);
  assert.doesNotMatch(markup, /<table|id="list-search"|pagination|data-action="create"/);
  const empty = await html({ isOwner: true, rows: [] });
  assert.match(empty, /No tenés mascotas activas vinculadas\. Consultá a la veterinaria\./);
  const events = [];
  const view = mountVueComponent(PetsView, props({ isOwner: true, onOpen: id => events.push(id) }));
  view.find(node => node.props['data-action'] === 'pet').props.onClick({ stopPropagation() {} });
  assert.deepEqual(events, ['p1']);
  assert.equal(view.find(node => node.props.id === 'owner-pet-photo-input').props.onChange, undefined);
  view.unmount();
});

test('PetsView actualiza datos sin reemplazar el buscador y emite acciones una sola vez', async () => {
  const events = [];
  const listeners = Object.fromEntries(['search', 'filter', 'page', 'create', 'scan', 'open', 'owner', 'edit', 'toggle', 'qr'].map(name =>
    ['on' + name[0].toUpperCase() + name.slice(1), value => events.push([name, value])]));
  const values = props({ ...listeners, totalPages: 2, totalRecords: 9 });
  const view = mountVueComponent(PetsView, values);
  const search = view.find(node => node.props.id === 'list-search');
  let stopped = 0;
  const event = value => ({ target: { value }, stopPropagation() { stopped++; } });
  search.props.onInput(event('Luna'));
  view.find(node => node.props.id === 'list-filter').props.onChange(event('Gato'));
  for (const action of ['create', 'scan', 'pet', 'owner', 'edit', 'toggle', 'qr', 'page']) {
    view.find(node => node.props['data-action'] === action).props.onClick(event());
  }
  assert.deepEqual(events, [['search', 'Luna'], ['filter', 'Gato'], ['create', undefined], ['scan', undefined], ['open', 'p1'], ['owner', 'o1'], ['edit', 'p1'], ['toggle', 'p1'], ['qr', 'p1'], ['page', 1]]);
  assert.equal(stopped, 10);
  view.update({ ...values, query: 'Luna', species: 'Gato', rows: [] });
  await nextTick();
  assert.equal(view.find(node => node.props.id === 'list-search'), search);
  assert.equal(search.props.value, 'Luna');
  assert.equal(view.find(node => node.props.id === 'list-filter').props.value, 'Gato');
  view.unmount();
  assert.equal(view.root.children.length, 0);
});
