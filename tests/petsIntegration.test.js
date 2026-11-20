import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate as nextTurn } from 'node:timers/promises';
import { startVeterinaryApplication } from '../src/legacy/veterinaryApplication.js';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { loadVueComponent } from './helpers/loadVueComponent.js';
import { renderApplicationView, withViewRendering } from './helpers/loadViewComponents.js';

const PetsView = await loadVueComponent(new URL('../src/views/pets/PetsView.vue', import.meta.url));

const KEY = 'veterinaria-prototipo-v1';
const globalNames = ['localStorage', 'document', 'window', 'location', 'history', 'FormData'];
const originalGlobals = new Map(globalNames.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
const cleanups = [];

test.afterEach(() => {
  for (const stop of cleanups.splice(0)) stop();
  for (const [name, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
});

function fixture() {
  return {
    configured: true, samplePracticeVersion: 1,
    config: { name: 'Veterinaria prueba', phone: '3815550123', days: [1, 2, 3, 4, 5], start: '08:00', end: '20:00' },
    users: [
      { id: 'admin', role: 'admin' },
      { id: 'super', role: 'superadmin' },
      { id: 'owner', role: 'owner', ownerId: 'o1' },
      { id: 'vet', role: 'vet', vetId: 'v1' }
    ].map(account => ({ ...account, name: 'Persona de prueba', email: `${account.id}@example.com`, password: '123456', active: true })),
    owners: [{ id: 'o1', name: 'Propietario de prueba', active: true, dni: '30111222' }, { id: 'o2', name: 'Otra persona', active: true }],
    vets: [{ id: 'v1', name: 'Veterinaria de prueba', active: true, serviceIds: [] }],
    products: [
      { id: 'p1', name: 'Alimento', category: 'Nutrición', description: 'Bolsa 3 kg', price: 12500, stock: 4, active: true, internalCode: 'Referencia clínica 45' },
      { id: 'p2', name: 'Champú', category: 'Higiene', description: 'Uso externo', price: 8500, stock: 0, active: true },
      { id: 'p3', name: 'Producto retirado', category: 'Retirados', description: '', price: 5000, stock: 2, active: false }
    ],
    pets: Array.from({ length: 10 }, (_, index) => ({
      id: 'pet' + (index + 1), name: 'Paciente ' + (index + 1), ownerId: index === 9 ? 'o2' : 'o1',
      code: String(41001 + index), species: index % 2 ? 'Gato' : 'Perro', breed: 'Mestizo', sex: 'Hembra',
      birth: '2020-01-01', weight: 5, qr: 'qr-pet-' + (index + 1), active: index !== 2,
      avatarId: index === 0 ? 'perro-dalmata' : '', photo: '', observations: 'Referencia interna 45'
    })), services: [], schedules: [], waitingRoom: [], clinical: [], tickets: [],
    reminders: [], notices: [], notifications: [], agendaNotes: []
  };
}

// Captura el contrato entre el módulo real y la vista; no simula su template.
function session() {
  const store = new Map([[KEY, JSON.stringify(fixture())]]);
  const handlers = new Map();
  const windowHandlers = new Map();
  const messages = [];
  const htmlRenders = [];
  const petsRenders = [];
  const nodes = new Map(['app', 'content', 'modal', 'form-error'].map(id => [`#${id}`, {
    id, html: '', textContent: '', open: false,
    showModal() { this.open = true; }, close() { this.open = false; }
  }]));
  let view = 'legacy';
  let petsRender = Promise.resolve();
  let viewRender = Promise.resolve();

  globalThis.localStorage = {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key)
  };
  globalThis.document = { documentElement: { dataset: {} }, querySelector: () => null };
  globalThis.window = {
    addEventListener: (name, callback) => windowHandlers.set(name, callback),
    removeEventListener: (name, callback) => { if (windowHandlers.get(name) === callback) windowHandlers.delete(name); },
    scrollTo() {}
  };
  globalThis.location = { hash: '', pathname: '/', search: '' };
  globalThis.history = { replaceState() {} };
  globalThis.FormData = class {
    constructor(form) { this.rows = Object.entries(form.values); }
    [Symbol.iterator]() { return this.rows[Symbol.iterator](); }
    getAll(name) { return this.rows.filter(([key]) => key === name).map(([, value]) => value); }
    get(name) { return this.getAll(name)[0] ?? null; }
  };

  const stop = startVeterinaryApplication({
    root: { querySelector: selector => nodes.get(selector) ?? null, querySelectorAll: () => [] },
    on: (name, callback) => handlers.set(name, callback),
    setHtml(target, html) {
      assert.ok(target);
      target.html = html;
      htmlRenders.push(target.id);
      if (['app', 'content'].includes(target.id)) view = 'legacy';
    },
    showView(target, name, props) {
      assert.ok(target, 'Expected a Vue render target');
      if (['app', 'content'].includes(target.id)) view = name;
      viewRender = renderApplicationView(name, props).then(html => { target.html = html; });
    },
    showCatalog() { view = 'catalog'; },
    showNotices() { view = 'notices'; },
    showPets(target, props) {
      assert.equal(target, nodes.get('#content'));
      view = 'pets';
      petsRenders.push(props);
      petsRender = renderToString(createSSRApp(PetsView, props)).then(html => { target.html = html; });
    },
    notify: message => messages.push(message)
  });
  cleanups.push(stop);

  return {
    nodes, messages, htmlRenders, petsRenders, stop,
    props: () => withViewRendering(petsRenders.at(-1), () => viewRender),
    view: () => view,
    data: () => JSON.parse(store.get(KEY)),
    async submit(kind, values, id = '') {
      nodes.get('#form-error').textContent = '';
      const button = { disabled: false, isConnected: true };
      const form = {
        values, dataset: { form: kind, id }, elements: { photo: { files: [] } },
        matches: selector => selector === 'form[data-form]', querySelector: selector => selector === '[data-form-error]' ? nodes.get('#form-error') : button
      };
      await handlers.get('submit')({ target: form, preventDefault() {} });
      await Promise.all([petsRender, viewRender]);
      return nodes.get('#form-error').textContent;
    },
    async login(id) {
      assert.equal(await this.submit('login', { email: `${id}@example.com`, password: '123456' }), '');
    },
    async click(action, id = '') {
      const target = { dataset: { action, id }, closest: () => target };
      handlers.get('click')({ target });
      await nextTurn();
      await Promise.all([petsRender, viewRender]);
    },
    async storageChange(update) {
      const data = this.data();
      update(data);
      store.set(KEY, JSON.stringify(data));
      windowHandlers.get('storage')({ key: KEY });
      await viewRender;
    }
  };
}


test('el listado entrega las mascotas y permisos existentes para los cuatro roles', async () => {
  for (const role of ['admin', 'super', 'vet', 'owner']) {
    const app = session();
    await app.login(role);
    await app.click('nav', 'pets');
    assert.equal(app.view(), 'pets');
    assert.equal(app.props().isOwner, role === 'owner');
    assert.equal(app.props().canCreate, ['admin', 'super'].includes(role));
    assert.equal(app.props().canEdit, role !== 'vet');
    assert.equal(app.props().canScan, role !== 'vet');
    assert.equal(app.props().canShowQr, role !== 'vet');
    const ids = app.props().rows.map(row => row.pet.id);
    assert.deepEqual(ids, role === 'owner' ? ['pet1', 'pet2', 'pet4', 'pet5', 'pet6', 'pet7', 'pet8', 'pet9'] : ['pet1', 'pet2', 'pet3', 'pet4', 'pet5', 'pet6', 'pet7', 'pet8']);
    assert.equal(app.props().totalRecords, role === 'owner' ? 8 : 10);
    assert.equal(app.props().rows[0].image.isAvatar, true);
    assert.equal(app.props().rows[0].ownerName, 'Propietario de prueba');
    app.stop();
  }
});

test('la búsqueda JSON, filtro exacto y paginación actualizan solo la vista Vue', async () => {
  const app = session();
  await app.login('admin');
  await app.click('nav', 'pets');
  const htmlRenders = app.htmlRenders.length;
  await app.props().onPage(2);
  assert.deepEqual(app.props().rows.map(row => row.pet.id), ['pet9', 'pet10']);
  app.props().onSearch('30111222');
  assert.equal(app.props().pageNumber, 1);
  assert.equal(app.props().totalRecords, 9);
  app.props().onFilter('Gato');
  assert.deepEqual(app.props().rows.map(row => row.pet.id), ['pet2', 'pet4', 'pet6', 'pet8']);
  app.props().onFilter('gato');
  assert.equal(app.props().totalRecords, 0);
  assert.equal(app.props().totalPages, 1);
  app.props().onFilter('');
  app.props().onSearch('REFERENCIA INTERNA');
  assert.equal(app.props().totalRecords, 10);
  assert.equal(app.htmlRenders.length, htmlRenders);
});

test('los botones abren los formularios, perfiles y QR anteriores y renuevan el listado', async () => {
  const app = session();
  await app.login('admin');
  await app.click('nav', 'pets');
  await app.props().onCreate();
  assert.match(app.nodes.get('#modal').html, /data-form="entity" data-id="pets:"/);
  await app.props().onEdit('pet1');
  assert.match(app.nodes.get('#modal').html, /data-id="pets:pet1"/);
  await app.props().onQr('pet1');
  assert.match(app.nodes.get('#modal').html, /qr-pet-1/);
  assert.match(app.nodes.get('#modal').html, /41001/);
  await app.click('close');
  await app.props().onToggle('pet1');
  assert.match(app.nodes.get('#modal').html, /Desactivar registro/);
  await app.click('toggle-confirm', 'pets:pet1');
  assert.equal(app.data().pets[0].active, false);
  assert.equal(app.props().rows[0].pet.active, false);
  await app.props().onOpen('pet2');
  assert.equal(app.view(), 'PetProfileView');
  assert.match(app.nodes.get('#content').html, /Paciente 2/);
  await app.click('nav', 'pets');
  await app.props().onOwner('o1');
  assert.match(app.nodes.get('#content').html, /Propietario de prueba/);
  await app.click('nav', 'pets');
  await app.props().onScan();
  assert.match(app.nodes.get('#content').html, /Paciente 2/);
});

test('el propietario reutiliza imágenes y colores con guardas sobre mascotas ajenas', async () => {
  const app = session();
  await app.login('owner');
  await app.click('nav', 'pets');
  const before = app.data();
  await app.props().onCreate();
  await app.props().onEdit('pet1');
  await app.props().onToggle('pet1');
  await app.props().onPickColor({ petId: 'pet10', colorId: 'sky' });
  await app.props().onPhoto('pet10');
  assert.deepEqual(app.data(), before);
  assert.equal(app.nodes.get('#modal').open, false);
  await app.props().onPhoto('pet1');
  assert.match(app.nodes.get('#modal').html, /data-action="owner-pet-avatar-pick"/);
  await app.click('owner-pet-avatar-pick', 'pet1:perro-dalmata');
  assert.equal(app.props().rows[0].image.isAvatar, true);
  await app.props().onColor('pet1');
  assert.equal(app.props().colorPickerId, 'pet1');
  await app.props().onPickColor({ petId: 'pet1', colorId: 'sky' });
  assert.equal(app.data().pets[0].cardColor, 'sky');
  assert.equal(app.props().rows[0].background, '#B5D5DE');
  assert.equal(app.props().colorPickerId, '');
  await app.props().onPickColor({ petId: 'pet1', colorId: 'default' });
  assert.equal(app.data().pets[0].cardColor, undefined);
});

test('storage, navegación y cierre de sesión mantienen el listado sincronizado', async () => {
  const app = session();
  await app.login('owner');
  await app.click('nav', 'pets');
  await app.storageChange(data => { data.pets[0].name = 'Nombre actualizado'; data.pets[1].active = false; });
  assert.equal(app.props().rows[0].pet.name, 'Nombre actualizado');
  assert.equal(app.props().rows.some(row => row.pet.id === 'pet2'), false);
  await app.click('nav', 'products');
  assert.equal(app.view(), 'catalog');
  await app.click('nav', 'pets');
  assert.equal(app.props().query, '');
  assert.equal(app.props().rows[0].pet.name, 'Nombre actualizado');
  await app.storageChange(data => { data.users.find(row => row.id === 'owner').active = false; });
  assert.equal(app.view(), 'LoginView');
  assert.match(app.nodes.get('#app').html, /data-form="login"/);
});

test('el veterinario conserva la acción de cambiar el estado de una mascota', async () => {
  const app = session();
  await app.login('vet');
  await app.click('nav', 'pets');
  assert.equal(app.props().canCreate, false);
  assert.equal(app.props().canEdit, false);
  assert.equal(app.props().canShowQr, false);
  await app.props().onToggle('pet1');
  assert.match(app.nodes.get('#modal').html, /Desactivar registro/);
  await app.click('toggle-confirm', 'pets:pet1');
  assert.equal(app.data().pets[0].active, false);
  assert.equal(app.props().rows[0].pet.active, false);
});
