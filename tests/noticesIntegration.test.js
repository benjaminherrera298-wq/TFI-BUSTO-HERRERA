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
const names = ['localStorage', 'document', 'window', 'location', 'history', 'FormData'];
const originalGlobals = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
const cleanups = [];
test.afterEach(() => {
  for (const stop of cleanups.splice(0)) stop();
  for (const [name, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
});

const day = offset => {
  const value = new Date();
  value.setDate(value.getDate() + offset);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
};
function fixture() {
  return {
    configured: true, samplePracticeVersion: 1,
    config: { name: 'Veterinaria prueba', identifier: '20301234567', address: 'Av. San Martín 123', phone: '3815550123', email: 'clinica@example.com', days: [1, 2, 3, 4, 5], start: '08:00', end: '20:00', duration: 30, logo: '' },
    users: [
      { id: 'admin', role: 'admin' }, { id: 'super', role: 'superadmin' },
      { id: 'owner', role: 'owner', ownerId: 'o1' }, { id: 'vet', role: 'vet', vetId: 'v1' }
    ].map(account => ({ ...account, name: 'Persona de prueba', email: `${account.id}@example.com`, password: '123456', active: true })),
    owners: [{ id: 'o1', name: 'Propietario de prueba', active: true }],
    vets: [{ id: 'v1', name: 'Veterinaria de prueba', serviceIds: [], active: true }],
    pets: [{ id: 'p1', name: 'Luna', ownerId: 'o1', species: 'Gato', birth: '2020-01-01', weight: 5, qr: 'qr-luna', code: '41001', active: true }],
    notices: [
      { id: 'published', title: 'Control preventivo', message: 'Información vigente', date: day(-1), expires: '', active: true, internalCode: 'Referencia clínica 45' },
      { id: 'today', title: 'Publicado hoy', message: 'Desde hoy', date: day(0), expires: '', active: true },
      { id: 'future', title: 'Publicación futura', message: 'Mañana', date: day(1), expires: '', active: true },
      { id: 'expired', title: 'Aviso vencido', message: 'Ayer terminó', date: day(-3), expires: day(-1), active: true },
      { id: 'ends-today', title: 'Último día', message: 'Vigente hasta hoy', date: day(-3), expires: day(0), active: true },
      { id: 'draft', title: 'Borrador interno', message: 'Sin publicar', date: day(-1), expires: '', active: false }
    ],
    products: [], services: [], schedules: [], clinical: [], tickets: [], waitingRoom: [], reminders: [], notifications: [], agendaNotes: []
  };
}

// Usa la entrada y operaciones reales; captura el contrato de la vista.
function session() {
  const store = new Map([[KEY, JSON.stringify(fixture())]]);
  const handlers = new Map();
  const windowHandlers = new Map();
  const noticesRenders = [];
  const htmlRenders = [];
  const messages = [];
  const nodes = new Map(['app', 'content', 'settings-notices', 'modal', 'form-error'].map(id => [`#${id}`, {
    id, html: '', textContent: '', open: false, showModal() { this.open = true; }, close() { this.open = false; }
  }]));
  let view = 'legacy';
  let settingsForm;
  let petsRender = Promise.resolve();
  let viewRender = Promise.resolve();
  globalThis.localStorage = {
    getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, String(value)), removeItem: key => store.delete(key)
  };
  globalThis.document = { documentElement: { dataset: {} }, querySelector: () => null };
  globalThis.window = {
    addEventListener: (name, callback) => windowHandlers.set(name, callback),
    removeEventListener: (name, callback) => { if (windowHandlers.get(name) === callback) windowHandlers.delete(name); }, scrollTo() {}
  };
  globalThis.location = { hash: '', pathname: '/', search: '' };
  globalThis.history = { replaceState() {} };
  globalThis.FormData = class {
    constructor(form) { this.rows = Object.entries(form.values).flatMap(([key, value]) => (Array.isArray(value) ? value : [value]).map(item => [key, item])); }
    [Symbol.iterator]() { return this.rows[Symbol.iterator](); }
    getAll(key) { return this.rows.filter(([name]) => name === key).map(([, value]) => value); }
    get(key) { return this.getAll(key)[0] ?? null; }
  };
  const stop = startVeterinaryApplication({
    root: { querySelector: selector => nodes.get(selector) ?? null, querySelectorAll: () => [] },
    on: (name, callback) => handlers.set(name, callback),
    setHtml(target, html) {
      assert.ok(target);
      target.html = html;
      htmlRenders.push(target.id);
      if (['app', 'content'].includes(target.id)) view = 'legacy';
      if (target.id === 'content') settingsForm = html.includes('data-form="settings"') ? { values: {} } : undefined;
    },
    showNotices(target, props) {
      assert.equal(target.id, props.inSettings ? 'settings-notices' : 'content');
      noticesRenders.push(props);
      view = props.inSettings ? 'settings' : 'notices';
    },
    showView(target, name, props) {
      assert.ok(target, 'Expected a Vue render target');
      if (['app', 'content'].includes(target.id)) view = name;
      if (target.id === 'content') settingsForm = name === 'SettingsView' ? { values: {} } : undefined;
      viewRender = renderApplicationView(name, props).then(html => { target.html = html; });
    },
    showCatalog() { view = 'catalog'; },
    showPets(target, props) {
      assert.equal(target, nodes.get('#content'));
      view = 'pets';
      settingsForm = undefined;
      petsRender = renderToString(createSSRApp(PetsView, props)).then(html => { target.html = html; });
    },
    notify: message => messages.push(message)
  });
  cleanups.push(stop);
  return {
    nodes, messages, noticesRenders, htmlRenders, stop,
    props: () => withViewRendering(noticesRenders.at(-1), () => viewRender), view: () => view, settingsForm: () => settingsForm,
    data: () => JSON.parse(store.get(KEY)),
    async submit(kind, values, id = '') {
      nodes.get('#form-error').textContent = '';
      const button = { disabled: false, isConnected: true };
      const form = { values, dataset: { form: kind, id }, elements: { logo: { files: [] }, photo: { files: [] } }, matches: selector => selector === 'form[data-form]', querySelector: selector => selector === '[data-form-error]' ? nodes.get('#form-error') : button };
      await handlers.get('submit')({ target: form, preventDefault() {} });
      await Promise.all([petsRender, viewRender]);
      return nodes.get('#form-error').textContent;
    },
    async login(id) { assert.equal(await this.submit('login', { email: `${id}@example.com`, password: '123456' }), ''); },
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

test('los roles conservan el acceso y las fechas de publicación y expiración son inclusivas', async () => {
  for (const role of ['admin', 'super', 'owner', 'vet']) {
    const app = session();
    await app.login(role);
    await app.click('nav', ['admin', 'super'].includes(role) ? 'settings' : 'notices');
    if (role === 'vet') {
      assert.equal(app.noticesRenders.length, 0);
    } else {
      assert.equal(app.props().canManage, role !== 'owner');
      assert.equal(app.props().inSettings, role !== 'owner');
      assert.deepEqual(app.props().notices.map(notice => notice.id), role === 'owner'
        ? ['published', 'today', 'ends-today']
        : ['published', 'today', 'future', 'expired', 'ends-today', 'draft']);
    }
    app.stop();
  }
});

test('buscar avisos no recrea el formulario de Configuración ni pierde campos sin guardar', async () => {
  const app = session();
  await app.login('admin');
  await app.click('nav', 'settings');
  const form = app.settingsForm();
  form.values.name = 'Nombre editado sin guardar';
  const renders = app.htmlRenders.length;
  const before = app.data();
  app.props().onSearch('CLÍNICA');
  assert.equal(app.props().query, 'CLÍNICA');
  assert.deepEqual(app.props().notices.map(notice => notice.id), ['published']);
  assert.equal(app.settingsForm(), form);
  assert.equal(form.values.name, 'Nombre editado sin guardar');
  assert.equal(app.htmlRenders.length, renders);
  app.props().onSearch('No coincide');
  assert.equal(app.props().notices.length, 0);
  app.props().onSearch('');
  assert.equal(app.props().notices.length, 6);
  assert.deepEqual(app.data(), before);
});

test('crear, editar, publicar y eliminar conservan operaciones y confirmaciones existentes', async () => {
  const app = session();
  await app.login('admin');
  await app.click('nav', 'settings');
  const before = app.data();
  await app.props().onCreate();
  assert.match(app.nodes.get('#modal').html, /Crear aviso/);
  assert.equal(await app.submit('entity', { title: 'Cierre especial', message: 'Aviso nuevo', date: day(0), expires: '', active: 'true' }, 'notices:'), '');
  const created = app.data().notices.find(notice => notice.title === 'Cierre especial');
  assert.ok(created);
  assert.deepEqual(app.data().config, before.config);
  await app.props().onEdit(created.id);
  assert.match(app.nodes.get('#modal').html, /Editar aviso/);
  assert.equal(await app.submit('entity', { title: 'Cierre corregido', message: 'Mensaje actualizado', date: day(0), expires: '', active: 'true' }, `notices:${created.id}`), '');
  assert.equal(app.props().notices.find(notice => notice.id === created.id).title, 'Cierre corregido');
  await app.props().onToggle('draft');
  assert.equal(app.data().notices.find(notice => notice.id === 'draft').active, false);
  await app.click('toggle-confirm', 'notices:draft');
  assert.equal(app.data().notices.find(notice => notice.id === 'draft').active, true);
  await app.props().onToggle(created.id);
  assert.equal(app.data().notices.find(notice => notice.id === created.id).active, true);
  await app.click('toggle-confirm', `notices:${created.id}`);
  assert.equal(app.data().notices.find(notice => notice.id === created.id).active, false);
  await app.props().onDelete(created.id);
  assert.match(app.nodes.get('#modal').html, /Eliminar aviso/);
  assert.ok(app.data().notices.some(notice => notice.id === created.id));
  await app.click('close');
  assert.ok(app.data().notices.some(notice => notice.id === created.id));
  await app.props().onDelete(created.id);
  await app.click('delete-notice-confirm', created.id);
  assert.equal(app.data().notices.some(notice => notice.id === created.id), false);
  const after = app.data();
  for (const key of ['config', 'pets', 'owners', 'clinical', 'tickets', 'reminders', 'users']) assert.deepEqual(after[key], before[key]);
});

test('el propietario no puede administrar avisos mediante callbacks ni envíos alterados', async () => {
  const app = session();
  await app.login('owner');
  await app.click('nav', 'notices');
  const before = app.data();
  await app.props().onCreate();
  await app.props().onEdit('published');
  await app.props().onToggle('published');
  await app.props().onDelete('published');
  await app.click('toggle-confirm', 'notices:published');
  await app.click('delete-notice-confirm', 'published');
  assert.equal(app.nodes.get('#modal').open, false);
  assert.match(await app.submit('entity', { title: 'No permitido' }, 'notices:published'), /permiso/);
  assert.deepEqual(app.data(), before);
});

test('guardar Configuración renueva los datos de la vista y la ficha de mascota conserva sus avisos', async () => {
  const app = session();
  await app.login('admin');
  await app.click('nav', 'settings');
  const before = app.data();
  assert.equal(await app.submit('settings', { ...before.config, name: 'Veterinaria actualizada' }), '');
  assert.equal(app.props().clinicName, 'Veterinaria actualizada');
  assert.deepEqual(app.data().notices, before.notices);
  await app.click('logout');
  await app.login('owner');
  await app.click('pet', 'p1');
  const markup = app.nodes.get('#content').html;
  assert.match(markup, /Control preventivo|Información vigente/);
  assert.doesNotMatch(markup, /Publicación futura|Aviso vencido|Borrador interno/);
  assert.deepEqual(app.data().notices, before.notices);
});

test('storage, navegación y cierre de sesión conservan los avisos sincronizados', async () => {
  const app = session();
  await app.login('owner');
  await app.click('nav', 'notices');
  await app.storageChange(data => { data.notices[0].title = 'Actualizado desde otra pestaña'; });
  assert.equal(app.props().notices[0].title, 'Actualizado desde otra pestaña');
  app.props().onSearch('Sin coincidencias');
  await app.click('nav', 'products');
  assert.equal(app.view(), 'catalog');
  await app.click('nav', 'notices');
  assert.equal(app.props().query, '');
  assert.equal(app.view(), 'notices');
  await app.click('nav', 'pets');
  assert.equal(app.view(), 'pets');
  await app.click('nav', 'notices');
  const renders = app.noticesRenders.length;
  await app.storageChange(data => { data.users.find(account => account.id === 'owner').active = false; });
  assert.equal(app.noticesRenders.length, renders);
  assert.equal(app.view(), 'LoginView');
  assert.match(app.nodes.get('#app').html, /data-form="login"/);
  assert.match(app.messages.at(-1), /sesión ya no está habilitada/);
});
