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
    owners: [{ id: 'o1', name: 'Propietario de prueba', active: true }],
    vets: [{ id: 'v1', name: 'Veterinaria de prueba', active: true, serviceIds: [] }],
    products: [
      { id: 'p1', name: 'Alimento', category: 'Nutrición', description: 'Bolsa 3 kg', price: 12500, stock: 4, active: true, internalCode: 'Referencia clínica 45' },
      { id: 'p2', name: 'Champú', category: 'Higiene', description: 'Uso externo', price: 8500, stock: 0, active: true },
      { id: 'p3', name: 'Producto retirado', category: 'Retirados', description: '', price: 5000, stock: 2, active: false }
    ],
    pets: [], services: [], schedules: [], waitingRoom: [], clinical: [], tickets: [],
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
  const catalogRenders = [];
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
    showCatalog(target, props) {
      assert.equal(target, nodes.get('#content'));
      catalogRenders.push(props);
      view = 'catalog';
    },
    showPets(target, props) {
      assert.equal(target, nodes.get('#content'));
      view = 'pets';
      petsRender = renderToString(createSSRApp(PetsView, props)).then(html => { target.html = html; });
    },
    notify: message => messages.push(message)
  });
  cleanups.push(stop);

  return {
    nodes, messages, htmlRenders, catalogRenders, stop,
    props: () => withViewRendering(catalogRenders.at(-1), () => viewRender),
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

test('el catálogo conserva el acceso y los productos visibles de cada rol', async () => {
  for (const role of ['admin', 'super', 'owner', 'vet']) {
    const app = session();
    try {
      await app.login(role);
      await app.click('nav', 'products');
      if (role === 'vet') {
        assert.equal(app.catalogRenders.length, 0);
        assert.equal(app.view(), 'HomeView');
      } else {
        assert.equal(app.view(), 'catalog');
        assert.equal(app.props().canManage, role !== 'owner');
        assert.deepEqual(app.props().products.map(product => product.id), role === 'owner' ? ['p1', 'p2'] : ['p1', 'p2', 'p3']);
        assert.deepEqual(app.props().categories, ['Nutrición', 'Higiene', 'Retirados']);
        assert.equal(app.props().clinicName, 'Veterinaria prueba');
        assert.equal(app.props().clinicPhone, '3815550123');
      }
    } finally { app.stop(); }
  }
});

test('la búsqueda y categoría conservan sus reglas sin volver al renderizador HTML', async () => {
  const app = session();
  await app.login('owner');
  await app.click('nav', 'products');
  const previousHtmlRenders = app.htmlRenders.length;

  app.props().onSearch('CLÍNICA');
  assert.equal(app.props().query, 'CLÍNICA');
  assert.deepEqual(app.props().products.map(product => product.id), ['p1']);
  app.props().onFilter('Higiene');
  assert.equal(app.props().products.length, 0);
  app.props().onSearch('');
  assert.deepEqual(app.props().products.map(product => product.id), ['p2']);
  app.props().onFilter('higiene');
  assert.equal(app.props().products.length, 0, 'La categoría sigue usando igualdad exacta.');
  app.props().onFilter('Retirados');
  assert.equal(app.props().products.length, 0, 'La categoría de un inactivo no permite verlo al propietario.');
  app.props().onFilter('');
  assert.equal(app.props().products.length, 2);
  assert.equal(app.htmlRenders.length, previousHtmlRenders);
});

test('crear, editar y activar reutilizan los formularios y renuevan los datos del catálogo', async () => {
  const app = session();
  await app.login('admin');
  await app.click('nav', 'products');

  await app.props().onCreate();
  assert.match(app.nodes.get('#modal').html, /Crear producto/);
  assert.match(app.nodes.get('#modal').html, /data-form="entity" data-id="products:"/);
  assert.equal(await app.submit('entity', { name: 'Correa', category: 'Accesorios', description: '', price: '2500', stock: '3' }, 'products:'), '');
  assert.ok(app.props().products.some(product => product.name === 'Correa'));
  assert.equal(app.nodes.get('#modal').open, false);

  await app.props().onEdit('p1');
  assert.match(app.nodes.get('#modal').html, /Editar producto/);
  assert.match(app.nodes.get('#modal').html, /data-id="products:p1"/);
  assert.equal(await app.submit('entity', { name: 'Alimento actualizado', category: 'Nutrición', description: '', price: '13000', stock: '5' }, 'products:p1'), '');
  assert.equal(app.props().products.find(product => product.id === 'p1').price, 13000);

  await app.props().onToggle('p1');
  assert.match(app.nodes.get('#modal').html, /Desactivar registro/);
  assert.equal(app.data().products.find(product => product.id === 'p1').active, true);
  await app.click('toggle-confirm', 'products:p1');
  assert.equal(app.props().products.find(product => product.id === 'p1').active, false);
  await app.props().onToggle('p1');
  assert.match(app.nodes.get('#modal').html, /Activar registro/);
  await app.click('toggle-confirm', 'products:p1');
  assert.equal(app.props().products.find(product => product.id === 'p1').active, true);
  assert.equal(app.view(), 'catalog');
});

test('el propietario no puede ejecutar las operaciones administrativas mediante callbacks', async () => {
  const app = session();
  await app.login('owner');
  await app.click('nav', 'products');
  const before = app.data();

  await app.props().onCreate();
  await app.props().onEdit('p1');
  await app.props().onToggle('p1');
  await app.click('toggle-confirm', 'products:p1');
  assert.equal(app.nodes.get('#modal').open, false);
  assert.match(await app.submit('entity', { name: 'Cambio no permitido' }, 'products:p1'), /permiso/);
  assert.deepEqual(app.data(), before);
});

test('la navegación, el cierre de sesión y storage conservan el catálogo sincronizado', async () => {
  const app = session();
  await app.login('admin');
  await app.click('nav', 'products');
  await app.storageChange(data => { data.products[0].name = 'Actualizado desde otra pestaña'; });
  assert.equal(app.props().products[0].name, 'Actualizado desde otra pestaña');
  assert.equal(app.view(), 'catalog');

  app.props().onSearch('Sin coincidencias');
  await app.click('nav', 'pets');
  assert.equal(app.view(), 'pets');
  assert.match(app.nodes.get('#content').html, /Mascotas/);
  await app.click('nav', 'products');
  assert.equal(app.props().query, '');
  assert.equal(app.view(), 'catalog');
  await app.click('logout');
  assert.equal(app.view(), 'LoginView');
  assert.match(app.nodes.get('#app').html, /data-form="login"/);

  await app.login('owner');
  await app.click('nav', 'products');
  assert.equal(app.props().canManage, false);
  assert.equal(app.props().products[0].name, 'Actualizado desde otra pestaña');
  const renders = app.catalogRenders.length;
  await app.storageChange(data => { data.users.find(account => account.id === 'owner').active = false; });
  assert.equal(app.view(), 'LoginView');
  assert.equal(app.catalogRenders.length, renders);
  assert.match(app.nodes.get('#app').html, /data-form="login"/);
  assert.match(app.messages.at(-1), /sesión ya no está habilitada/);
});
