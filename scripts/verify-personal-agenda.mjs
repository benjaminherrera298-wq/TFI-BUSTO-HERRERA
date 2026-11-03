import assert from 'node:assert/strict';
import { setImmediate as nextTurn } from 'node:timers/promises';
import { startVeterinaryApplication } from '../src/services/veterinaryApplication.js';

// Prueba los formularios y eventos reales. La presentación se revisa en navegador.
const KEY = 'veterinaria-prototipo-v1';
const fixture = {
  configured: true, samplePracticeVersion: 1,
  config: { name: 'Veterinaria prueba', logo: '', days: [1, 2, 3, 4, 5], start: '08:00', end: '20:00' },
  users: [
    { id: 'admin', name: 'Administración', email: 'admin@example.com', role: 'admin' },
    { id: 'vet-one', name: 'Veterinaria uno', email: 'vet@example.com', role: 'vet', vetId: 'v1' },
    { id: 'vet-two', name: 'Veterinario dos', email: 'vet2@example.com', role: 'vet', vetId: 'v2' },
    { id: 'owner', name: 'Propietario', email: 'owner@example.com', role: 'owner', ownerId: 'o1' },
    { id: 'super', name: 'Superadmin', email: 'super@example.com', role: 'superadmin' }
  ].map(account => ({ ...account, active: true, password: '123456' })),
  vets: [{ id: 'v1', name: 'Veterinaria uno', active: true }, { id: 'v2', name: 'Veterinario dos', active: true }],
  owners: [{ id: 'o1', name: 'Propietario', active: true }],
  pets: [{ id: 'p1', name: 'Luna', birth: '2020-01-01', ownerId: 'o1', active: true, code: '41001', weight: 5 }],
  services: [], schedules: [], clinical: [], tickets: [], waitingRoom: [], products: [], notices: [],
  reminders: [{ id: 'care', petId: 'p1', title: 'Próxima vacuna de Luna', date: '2026-11-10', category: 'Vacunación', source: 'vet', done: false }],
  // Compatibilidad con una base anterior: conserva los datos y retira sus pantallas.
  appointments: [{ id: 'legacy', date: '2026-11-10', time: '10:00', petId: 'p1', vetId: 'v1', ownerId: 'o1', status: 'Confirmado' }],
  notifications: [{ id: 'old-notification', message: 'Tu turno fue confirmado.', vetId: 'v1', readBy: [] }]
};
const storage = new Map([[KEY, JSON.stringify(fixture)]]);
let rejectWrites = false;
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem(key, value) {
    if (rejectWrites && key === KEY) throw new Error('Guardado rechazado');
    storage.set(key, String(value));
  },
  removeItem: key => storage.delete(key)
};
globalThis.document = { documentElement: { dataset: {} }, querySelector: () => null };
globalThis.window = { addEventListener() {}, removeEventListener() {}, scrollTo() {} };
globalThis.location = { hash: '', pathname: '/', search: '' };
globalThis.history = { replaceState() {} };
globalThis.FormData = class {
  constructor(form) { this.entries = Object.entries(form.values); }
  [Symbol.iterator]() { return this.entries[Symbol.iterator](); }
  getAll(name) { return this.entries.filter(([key]) => key === name).map(([, value]) => value); }
};

function createSession() {
  const handlers = new Map();
  const nodes = new Map(['app', 'content', 'modal', 'form-error'].map(id => [`#${id}`, {
    id, html: '', open: false, textContent: '', showModal() { this.open = true; }, close() { this.open = false; }
  }]));
  const messages = [];
  const stop = startVeterinaryApplication({
    root: { querySelector: selector => nodes.get(selector) ?? null, querySelectorAll: () => [] },
    on: (name, callback) => handlers.set(name, callback),
    setHtml: (node, html) => { assert.ok(node); node.html = html; },
    notify: message => messages.push(message)
  });
  return {
    nodes, messages, stop,
    content: () => nodes.get('#content').html,
    async click(action, id = '') {
      const target = { dataset: { action, id }, closest: () => target };
      handlers.get('click')({ target });
      await nextTurn();
    },
    change(id, value) {
      handlers.get('change')({ target: { id, value, closest: () => null } });
    },
    async submit(kind, values, id = '') {
      nodes.get('#form-error').textContent = '';
      const submit = { disabled: false, isConnected: true };
      const form = { dataset: { form: kind, id }, values, elements: {},
        matches: selector => selector === 'form[data-form]', querySelector: () => submit };
      await handlers.get('submit')({ target: form, preventDefault() {} });
      return nodes.get('#form-error').textContent;
    },
    async login(email) {
      assert.equal(await this.submit('login', { email, password: '123456' }), '');
    }
  };
}
const saved = () => JSON.parse(storage.get(KEY));
const note = id => saved().agendaNotes.find(entry => entry.id === id);
const values = { title: 'Operación de Luna', date: '2026-11-10', time: '10:00', note: 'Preparar instrumental.\nRevisar los materiales.' };
let session = createSession();
await session.login('admin@example.com');
assert.doesNotMatch(session.nodes.get('#app').html, /data-id="(?:services|notifications|notices)"/);
assert.doesNotMatch(session.content(), /turnos?/i);
await session.click('nav', 'settings');
assert.match(session.content(), /data-form="settings"/);
assert.match(session.content(), /Días de atención/);
assert.match(session.content(), /<h2>Avisos de la veterinaria<\/h2>/);
assert.match(session.content(), /Nuevo aviso/);
const initialConfig = saved().config;
await session.click('create', 'notices');
assert.match(session.nodes.get('#modal').html, /Crear aviso/);
const currentDate = new Date();
const publicationDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
assert.equal(await session.submit('entity', {
  title: 'Cierre por feriado', message: 'El 10 de noviembre la veterinaria estará cerrada.',
  date: publicationDate, expires: '', active: 'true'
}, 'notices:'), '');
assert.match(session.content(), /<h1>Configuración<\/h1>/);
assert.match(session.content(), /Cierre por feriado/);
assert.deepEqual(saved().config, initialConfig, 'Publicar un aviso conserva los días y horarios configurados');
await session.click('nav', 'notices');
assert.match(session.content(), /<h1>Configuración<\/h1>/, 'El acceso anterior lleva a Configuración');
await session.click('nav', 'agenda');
assert.match(session.content(), /Mi agenda/);
assert.match(session.content(), /Vista mensual/);
await session.click('agenda-new');
assert.equal(session.nodes.get('#modal').open, true);
assert.match(session.nodes.get('#modal').html, /Hora \(opcional\)/);
assert.equal(await session.submit('agenda-note', values), '');
const adminId = saved().agendaNotes[0].id;
assert.equal(note(adminId).userId, 'admin');
assert.equal(note(adminId).date, '2026-11-10');
assert.match(session.content(), /Operación de Luna/);
assert.match(session.content(), /Preparar instrumental/);
assert.equal(session.nodes.get('#modal').open, false);
assert.deepEqual(saved().appointments, fixture.appointments, 'La agenda no modifica datos históricos');
assert.deepEqual(saved().reminders, fixture.reminders, 'La nota personal no genera cuidados de mascotas');

await session.click('agenda-edit', adminId);
assert.match(session.nodes.get('#modal').html, /Editar anotación/);
assert.equal(await session.submit('agenda-note', { ...values, date: '2026-11-11', time: '', title: 'Operación reprogramada' }, adminId), '');
assert.equal(saved().agendaNotes.length, 1);
assert.equal(note(adminId).date, '2026-11-11');
assert.match(session.content(), /Todo el día/);
session.change('agenda-mode', 'day');
assert.match(session.content(), /Operación reprogramada/);
await session.click('agenda-period', '1');
assert.doesNotMatch(session.content(), /Operación reprogramada/);
await session.click('agenda-period', '-1');
session.change('agenda-mode', 'week');
assert.match(session.content(), /Operación reprogramada/);
await session.click('agenda-period', '1');
assert.doesNotMatch(session.content(), /Operación reprogramada/);
await session.click('agenda-period', '-1');
session.change('agenda-mode', 'month');
assert.match(session.content(), /Noviembre (?:de )?2026/);
await session.click('agenda-period', '1');
assert.match(session.content(), /Diciembre (?:de )?2026/);
await session.click('agenda-period', '-1');
await session.click('agenda-open', adminId);
await session.click('agenda-toggle', adminId);
assert.equal(note(adminId).done, true);
assert.match(session.content(), /Marcar pendiente/);
await session.click('agenda-toggle', adminId);
assert.equal(note(adminId).done, false);

for (const invalid of [{ title: '  ' }, { title: 'x'.repeat(161) }, { date: '2026-02-30' }, { date: 'incorrecta' }, { time: '25:90' }]) {
  const before = storage.get(KEY);
  assert.notEqual(await session.submit('agenda-note', { ...values, ...invalid }), '');
  assert.equal(storage.get(KEY), before, 'Un formulario inválido no cambia datos');
}
session.change('agenda-date', 'incorrecta');
assert.doesNotMatch(session.content(), /Invalid Date|NaN/);
const beforeFailure = storage.get(KEY);
rejectWrites = true;
await session.submit('agenda-note', { ...values, title: 'No se debe guardar' });
await session.click('agenda-toggle', adminId);
await session.click('agenda-delete-confirm', adminId);
rejectWrites = false;
assert.equal(storage.get(KEY), beforeFailure);
await session.click('agenda-open', adminId);
assert.match(session.content(), /Operación reprogramada/);
assert.doesNotMatch(session.content(), /No se debe guardar/);
assert.equal(note(adminId).done, false);

session.stop();
session = createSession();
await session.login('admin@example.com');
await session.click('agenda-open', adminId);
assert.match(session.content(), /Operación reprogramada/, 'La anotación persiste al reiniciar');
await session.click('logout');
await session.login('vet@example.com');
assert.doesNotMatch(session.content(), /turnos?|Operación reprogramada/i);
await session.click('nav', 'notifications');
assert.doesNotMatch(session.content(), /Tu turno/);
await session.click('nav', 'agenda');
assert.doesNotMatch(session.content(), /Operación reprogramada/);
const beforeForeign = storage.get(KEY);
await session.click('agenda-edit', adminId);
await session.click('agenda-toggle', adminId);
await session.click('agenda-delete-confirm', adminId);
assert.notEqual(await session.submit('agenda-note', values, adminId), '');
assert.equal(storage.get(KEY), beforeForeign, 'El veterinario no puede editar notas del administrador');
const future = new Date();
future.setDate(future.getDate() + 7);
const futureDate = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
assert.equal(await session.submit('agenda-note', { ...values, date: futureDate, title: 'Revisar instrumental' }), '');
const vetId = saved().agendaNotes.find(entry => entry.userId === 'vet-one').id;
await session.click('nav', 'home');
assert.match(session.content(), /Revisar instrumental/, 'El inicio muestra próximos recordatorios propios');
await session.click('agenda-toggle', vetId);
assert.doesNotMatch(session.content(), /Revisar instrumental/, 'Un recordatorio completado sale de los pendientes');
await session.click('clinical', 'p1');
assert.match(session.nodes.get('#modal').html, /data-form="clinical" data-id="p1"/);
assert.equal(await session.submit('clinical', {
  type: 'Consulta', date: '2026-11-03', title: 'Control de Luna', info: 'Buen estado general.',
  weight: '5', visible: 'true', nextDate: ''
}, 'p1'), '');
assert.equal(saved().clinical.length, 1, 'El registro clínico sigue funcionando sin reservas');
assert.deepEqual(saved().appointments, fixture.appointments);
await session.click('logout');
await session.login('vet2@example.com');
await session.click('nav', 'agenda');
assert.doesNotMatch(session.content(), /Revisar instrumental|Operación reprogramada/);

await session.click('logout');
await session.login('owner@example.com');
assert.match(session.nodes.get('#app').html, /data-id="notices"/);
await session.click('nav', 'notices');
assert.match(session.content(), /El 10 de noviembre la veterinaria estará cerrada/);
assert.doesNotMatch(session.content(), /Nuevo aviso|delete-notice|data-action="edit"/);
await session.click('pet', 'p1');
assert.doesNotMatch(session.content(), /Turnos|Solicitar turno/);
await session.click('nav', 'agenda');
assert.match(session.content(), /class="cal-grid"/);
assert.doesNotMatch(session.content(), /cal-mini|Agenda de cuidados/);
assert.match(session.content(), /Nuevo recordatorio/);
assert.doesNotMatch(session.content(), /personal-agenda|Operación reprogramada|Revisar instrumental/);
await session.click('cal-day', '2026-11-10');
assert.match(session.content(), /Próxima vacuna de Luna/);
const beforeOwner = storage.get(KEY);
await session.click('agenda-new');
await session.click('agenda-toggle', adminId);
await session.click('agenda-delete-confirm', vetId);
await session.submit('agenda-note', values);
assert.equal(storage.get(KEY), beforeOwner, 'El propietario no accede a agendas internas');
for (const action of ['book', 'reschedule', 'confirm-appointment', 'cancel-confirm', 'attend']) {
  await session.click(action, 'legacy');
}
await session.submit('booking', values);
assert.equal(storage.get(KEY), beforeOwner, 'Los antiguos eventos de reservas quedan sin efecto');
await session.click('cal-new', '2026-11-12');
assert.equal(await session.submit('owner-reminder', { petId: 'p1', category: 'Pipeta', date: '2026-11-12', title: 'Pipeta de Luna', note: 'Recordatorio propio' }), '');
assert.match(session.content(), /Pipeta de Luna/);
assert.equal(saved().reminders.length, 2);
assert.equal(saved().agendaNotes.length, 2);
await session.click('logout');
const beforeLogout = storage.get(KEY);
await session.click('agenda-toggle', adminId);
await session.submit('agenda-note', values);
assert.equal(storage.get(KEY), beforeLogout);

await session.login('admin@example.com');
await session.click('agenda-open', adminId);
await session.click('agenda-delete', adminId);
assert.equal(note(adminId).title, 'Operación reprogramada', 'La confirmación precede a la eliminación');
await session.click('agenda-delete-confirm', adminId);
assert.equal(note(adminId), undefined);
assert.ok(note(vetId), 'Eliminar una nota conserva las de otras cuentas');
await session.click('logout');
await session.login('super@example.com');
assert.doesNotMatch(session.nodes.get('#app').html, /data-id="notices"/);
await session.click('nav', 'settings');
assert.match(session.content(), /Avisos de la veterinaria/);
assert.match(session.content(), /Cierre por feriado/);
session.stop();

// Una instalación nueva tampoco genera reservas ni mensajes que las ofrezcan.
storage.delete(KEY);
session = createSession();
await session.login('admin@veterinaria.com');
assert.equal(saved().appointments, undefined);
assert.deepEqual(saved().agendaNotes, []);
assert.doesNotMatch(JSON.stringify(saved().notices), /turnos?|reservá/i);
assert.equal(await session.submit('agenda-note', values), '');
assert.equal(saved().agendaNotes.length, 1);
session.stop();
console.log('OK: agenda personal, altas/ediciones/bajas, vistas, persistencia, permisos entre cuentas, validaciones, rollback, agenda de cuidados y ausencia de reservas nuevas.');
