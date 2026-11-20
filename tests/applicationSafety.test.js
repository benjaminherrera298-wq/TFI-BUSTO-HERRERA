import test from 'node:test';
import assert from 'node:assert/strict';
import { startVeterinaryApplication } from '../src/legacy/veterinaryApplication.js';
import { STORAGE_KEY } from '../src/services/storageService.js';
import { addDays, calMonthDays, calShiftMonth, today } from '../src/utils/dates.js';

function session(t, { lockedRole = null } = {}) {
  const fixture = {
    configured: true, samplePracticeVersion: 1,
    config: { name: 'Clínica de prueba', days: [1], start: '08:00', end: '18:00' },
    users: [
      { id: 'admin', role: 'admin' }, { id: 'super', role: 'superadmin' },
      { id: 'owner', role: 'owner', ownerId: 'o1' }, { id: 'vet', role: 'vet', vetId: 'v1' }
    ].map(account => ({ ...account, active: true, name: 'Persona de prueba', email: account.id + '@example.com', password: '123456' })),
    owners: [{ id: 'o1', name: 'Propietario de prueba', active: true }],
    vets: [{ id: 'v1', name: 'Profesional de prueba', active: true, serviceIds: [] }],
    pets: [{ id: 'p1', name: 'Luna', ownerId: 'o1', code: '41001', qr: 'qr-luna', active: true }],
    services: [], schedules: [], products: [], notices: [], notifications: [],
    clinical: [], waitingRoom: [], tickets: [], reminders: [], agendaNotes: []
  };
  const store = new Map([[STORAGE_KEY, JSON.stringify(fixture)]]);
  const handlers = new Map(), windowHandlers = new Map(), messages = [], views = [];
  const nodes = new Map(['app', 'content', 'modal'].map(id => [id, {
    id, open: false, showModal() { this.open = true; }, close() { this.open = false; }
  }]));
  const otherError = { textContent: 'Mensaje de otro formulario' };
  const globals = {
    localStorage: { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, String(value)), removeItem: key => store.delete(key) },
    document: { documentElement: { dataset: {} }, querySelector: () => null },
    window: { addEventListener: (name, callback) => windowHandlers.set(name, callback), removeEventListener() {}, scrollTo() {} },
    location: { hash: '', pathname: '/', search: '' }, history: { replaceState() {} },
    FormData: class {
      constructor(form) { this.values = Object.entries(form.values); }
      [Symbol.iterator]() { return this.values[Symbol.iterator](); }
      getAll(name) { return this.values.filter(([key]) => key === name).map(([, value]) => value); }
    }
  };
  const previous = Object.fromEntries(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  const stop = startVeterinaryApplication({
    lockedRole,
    root: { querySelector: selector => selector === '#form-error' ? otherError : nodes.get(selector.slice(1)), querySelectorAll: () => [] },
    on: (name, callback) => handlers.set(name, callback), notify: message => messages.push(message),
    showView: (target, name, props) => views.push({ name, props }), showPets() {}
  });
  t.after(() => {
    stop();
    for (const [key, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  function form(kind, values, error = { textContent: '' }) {
    const button = { disabled: false, isConnected: true };
    return { dataset: { form: kind }, values, error, button,
      matches: selector => selector === 'form[data-form]',
      querySelector: selector => selector === '[data-form-error]' ? error : button
    };
  }
  const submit = target => handlers.get('submit')({ target, preventDefault() {} });
  return {
    form, submit, otherError, messages, views, nodes,
    async login(role) { await submit(form('login', { email: role + '@example.com', password: '123456' })); },
    update(callback) {
      const data = JSON.parse(store.get(STORAGE_KEY));
      callback(data);
      store.set(STORAGE_KEY, JSON.stringify(data));
      windowHandlers.get('storage')({ key: STORAGE_KEY });
    }
  };
}

test('los errores y su limpieza pertenecen solamente al formulario enviado', async t => {
  const app = session(t);
  const form = app.form('login', { email: 'admin@example.com', password: 'incorrecta' });
  await app.submit(form);
  assert.match(form.error.textContent, /credenciales/);
  assert.equal(app.otherError.textContent, 'Mensaje de otro formulario');
  form.values.password = '123456';
  await app.submit(form);
  assert.equal(form.error.textContent, '');
  assert.equal(form.button.disabled, false);
  assert.equal(app.otherError.textContent, 'Mensaje de otro formulario');
  assert.ok(app.views.some(view => view.name === 'ApplicationShell'));
});

test('un formulario sin región de error utiliza la notificación', async t => {
  const app = session(t);
  await app.submit(app.form('login', { email: 'admin@example.com', password: 'incorrecta' }, null));
  assert.match(app.messages.at(-1), /credenciales/);
  assert.equal(app.otherError.textContent, 'Mensaje de otro formulario');
});

test('la sincronización cierra la sesión y el diálogo si se inhabilita un perfil vinculado', async t => {
  const app = session(t);
  for (const [role, collection] of [['owner', 'owners'], ['vet', 'vets']]) {
    await app.login(role);
    app.nodes.get('modal').open = true;
    app.update(data => { data[collection][0].active = false; });
    assert.equal(app.views.at(-1).name, 'LoginView', role);
    assert.equal(app.nodes.get('modal').open, false, 'Se retiran los datos del diálogo abierto');
    assert.match(app.messages.at(-1), /sesión ya no está habilitada/);
  }
});

test('una página de rol bloqueado invalida la sesión si otra pestaña cambia ese rol', async t => {
  const app = session(t, { lockedRole: 'vet' });
  await app.login('vet');
  app.update(data => { data.users.find(account => account.id === 'vet').role = 'admin'; });
  assert.equal(app.views.at(-1).name, 'LoginView');
});

test('las fechas de agenda mantienen el día local en cambios de mes, año y año bisiesto', t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date(2028, 1, 29, 23, 59) });
  assert.equal(today(), '2028-02-29');
  assert.equal(addDays(today(), 1), '2028-03-01');
  assert.equal(addDays('2027-12-31', 1), '2028-01-01');
  assert.equal(calShiftMonth('2027-12', 1), '2028-01');
  const days = calMonthDays('2028-02');
  assert.equal(days.length, 42);
  assert.ok(days.includes('2028-02-29'));
  assert.equal(new Date(days[0] + 'T12:00:00').getDay(), 0);
});
