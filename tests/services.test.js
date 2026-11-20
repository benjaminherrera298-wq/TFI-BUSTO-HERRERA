import test from 'node:test';
import assert from 'node:assert/strict';
import { createServices } from '../src/services/createServices.js';
import { STORAGE_KEY } from '../src/services/storageService.js';
import { validateClinicData } from '../src/services/administrationService.js';
import { verifyCode } from '../src/services/authService.js';
import { addDays, calShiftMonth, validAgendaDate } from '../src/utils/dates.js';
import { imageData } from '../src/utils/images.js';

function fixture() {
  return {
    configured: true, samplePracticeVersion: 1,
    config: { name: 'Veterinaria prueba', identifier: '20301234567', address: 'Calle 123', phone: '3815550123', email: 'clinica@example.com', days: [1, 2, 3, 4, 5], start: '08:00', end: '20:00', duration: 30, logo: '' },
    users: [
      { id: 'admin', role: 'admin' }, { id: 'super', role: 'superadmin' },
      { id: 'vet', role: 'vet', vetId: 'v1' }, { id: 'vet2', role: 'vet', vetId: 'v2' },
      { id: 'owner', role: 'owner', ownerId: 'o1' }, { id: 'owner2', role: 'owner', ownerId: 'o2' }
    ].map(user => ({ ...user, name: 'Persona de prueba', email: user.id + '@example.com', password: '123456', active: true })),
    owners: [{ id: 'o1', name: 'Ana Pérez', dni: '30111222', phone: '3815550123', email: 'owner@example.com', address: 'Calle 123', active: true }, { id: 'o2', name: 'Otra persona', dni: '30222333', active: true }],
    vets: [{ id: 'v1', name: 'Profesional Uno', license: 'MP 1', serviceIds: ['s1'], active: true }, { id: 'v2', name: 'Profesional Dos', license: 'MP 2', serviceIds: [], active: true }],
    pets: [{ id: 'p1', name: 'Luna', species: 'Gato', breed: 'Mestizo', sex: 'Hembra', birth: '2020-01-01', weight: 5, ownerId: 'o1', qr: 'qr-luna', code: '41001', active: true }, { id: 'p2', name: 'Michi', ownerId: 'o2', code: '41002', qr: 'qr-michi', active: true }],
    services: [{ id: 's1', name: 'Consulta', duration: 30, active: true }], schedules: [],
    waitingRoom: [], tickets: [], clinical: [], agendaNotes: [], reminders: [], products: [], notices: [], notifications: []
  };
}

function application(role = 'admin', options = {}) {
  const state = { db: fixture(), user: null, recovery: null };
  state.user = state.db.users.find(user => user.id === role);
  const values = new Map([[STORAGE_KEY, JSON.stringify(state.db)]]);
  const errors = [];
  let writes = 0, rejected = false, nextId = 0;
  const store = {
    getItem: key => values.get(key) ?? null,
    setItem(key, value) { if (rejected) throw Error('Sin espacio'); writes++; values.set(key, String(value)); },
    removeItem: key => values.delete(key)
  };
  const services = createServices({ state, storage: store, onError: message => errors.push(message), uid: () => 'new-' + ++nextId, ...options });
  return { ...services, state, values, errors, store, writes: () => writes, rejectWrites: value => { rejected = value; } };
}

test('permisos: se conservan los cuatro roles y las excepciones existentes', () => {
  for (const role of ['admin', 'super', 'vet', 'owner']) {
    const app = application(role);
    assert.equal(app.permissions.isAdmin(), ['admin', 'super'].includes(role));
    assert.equal(Boolean(app.permissions.canPet(app.state.db.pets[1])), role !== 'owner');
    assert.equal(app.permissions.mayEdit('pets', 'p1'), role !== 'owner');
    assert.equal(app.permissions.mayEdit('users', 'owner'), ['admin', 'super'].includes(role));
    assert.equal(app.permissions.canUsePersonalAgenda(), role !== 'owner');
  }
});

test('autenticación: correo sin distinguir mayúsculas, rol bloqueado y claves de recuerdo', () => {
  const app = application('owner');
  app.auth.signIn({ email: ' OWNER@EXAMPLE.COM ', password: '123456', remember: 'on' });
  assert.equal(app.state.user.id, 'owner');
  assert.equal(app.values.get(STORAGE_KEY + '-email'), 'owner@example.com');
  assert.equal(app.writes(), 2);
  app.auth.signIn({ email: 'owner@example.com', password: '123456' });
  assert.equal(app.values.has(STORAGE_KEY + '-email'), false);
  const locked = application('admin', { lockedRole: 'vet' });
  assert.throws(() => locked.auth.signIn({ email: 'owner@example.com', password: '123456' }), /uso exclusivo/);
  assert.equal(locked.writes(), 0);
});

test('autenticación rechaza cuentas o perfiles inactivos sin guardar', () => {
  const app = application();
  app.state.db.owners[0].active = false;
  assert.throws(() => app.auth.signIn({ email: 'owner@example.com', password: '123456' }), /inactiva/);
  assert.throws(() => app.auth.signIn({ email: 'admin@example.com', password: ' 123456' }), /credenciales/);
  assert.equal(app.writes(), 0);
});

test('recuperación: contacto, verificación y cambio de contraseña comparten el guardado', () => {
  const app = application();
  assert.equal(app.auth.recover({ contact: '3815550123' }), 'contact');
  assert.equal(app.state.recovery.id, 'owner');
  assert.throws(() => app.auth.recover({ code: '000000' }), /verificación/);
  assert.equal(app.state.recovery.verified, false);
  assert.equal(app.auth.recover({ code: '123456' }), 'verified');
  assert.equal(app.auth.recover({ password: 'abcdef', confirm: 'abcdef' }), 'updated');
  assert.equal(app.state.db.users.find(user => user.id === 'owner').password, 'abcdef');
  assert.equal(app.writes(), 1);
  assert.throws(() => verifyCode('12345'), /verificación/);
});

test('restablecer contraseña valida al administrador y conserva los permisos', () => {
  const app = application();
  assert.throws(() => app.auth.resetPassword('owner', { adminPassword: 'incorrecta', password: 'abcdef', confirm: 'abcdef' }), /administrador/);
  assert.equal(app.writes(), 0);
  assert.equal(app.auth.resetPassword('owner', { adminPassword: '123456', password: 'abcdef', confirm: 'abcdef' }), true);
  const owner = application('owner');
  assert.equal(owner.auth.resetPassword('admin', {}), undefined);
  assert.equal(owner.writes(), 0);
});

test('persistencia revierte toda la base y los servicios consultan la referencia restaurada', () => {
  const app = application();
  const previous = JSON.stringify(app.state.db);
  const oldPet = app.people.find('pets', 'p1');
  app.rejectWrites(true);
  assert.equal(app.storage.commit(() => { oldPet.name = 'No debe guardarse'; }), false);
  assert.equal(JSON.stringify(app.state.db), previous);
  assert.notEqual(app.people.find('pets', 'p1'), oldPet);
  assert.equal(app.people.find('pets', 'p1').name, 'Luna');
  assert.equal(app.errors.length, 1);
});

test('la aplicación puede iniciar aunque el navegador rechace el acceso a localStorage', t => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else delete globalThis.localStorage;
  });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw Error('Acceso rechazado'); } });
  const state = { db: undefined, user: null, recovery: null }, errors = [];
  let id = 0;
  const services = createServices({ state, onError: message => errors.push(message), uid: () => 'test-' + ++id });
  assert.doesNotThrow(() => services.storage.load());
  assert.equal(state.db.configured, true);
  assert.ok(errors.length > 0);
});

test('la recarga normaliza datos anteriores sin cambiar QR ni perder vínculos clínicos', () => {
  const app = application();
  const db = app.state.db;
  db.waitingRoom.push({ id: 'w1', petId: 'p1', status: 'Esperando', enteredAt: '2026-01-01' }, { id: 'w2', petId: 'p1', status: 'En atención', enteredAt: '2026-01-02' }, { id: 'paid', petId: 'p1', status: 'Pagado', enteredAt: '2026-01-01' });
  db.clinical.push({ id: 'c1', waitingEntryId: 'w1', medications: 'Antibiótico' });
  db.tickets.push({ id: 't1', waitingEntryId: 'w1', medications: ['Medicamento'] });
  db.pets[1].code = db.pets[0].code;
  app.values.set(STORAGE_KEY, JSON.stringify(db));
  app.storage.load();
  assert.deepEqual(app.state.db.waitingRoom.map(entry => entry.id).sort(), ['paid', 'w2']);
  assert.equal(app.state.db.clinical[0].waitingEntryId, 'w2');
  assert.equal(app.state.db.tickets[0].waitingEntryId, 'w2');
  assert.deepEqual(app.state.db.clinical[0].medications, [{ name: 'Antibiótico' }]);
  assert.match(app.state.db.pets[1].code, /^\d{5}$/);
  assert.notEqual(app.state.db.pets[0].code, app.state.db.pets[1].code);
  assert.equal(app.state.db.pets[0].qr, 'qr-luna');
});

test('altas: productos y avisos no ejecutan validaciones de mascotas', async () => {
  const app = application();
  assert.equal(await app.entities.saveEntity({ collection: 'products', id: '', data: { name: 'Correa', category: 'Accesorios', price: '2500', stock: '3' } }), true);
  assert.equal(app.state.db.products[0].price, 2500);
  assert.equal(await app.entities.saveEntity({ collection: 'notices', id: '', data: { title: 'Aviso', message: 'Información ficticia', date: '2026-01-01', expires: '', active: 'true' } }), true);
  assert.equal(app.writes(), 2);
});

test('editar mascotas conserva propietario, QR y código, con un solo guardado', async () => {
  const app = application();
  const data = { ...app.state.db.pets[0], name: 'Luna actualizada', weight: '6' };
  assert.equal(await app.entities.saveEntity({ collection: 'pets', id: 'p1', data }), true);
  assert.equal(app.state.db.pets[0].qr, 'qr-luna');
  assert.equal(app.state.db.pets[0].code, '41001');
  assert.equal(app.state.db.pets[0].ownerId, 'o1');
  assert.equal(app.writes(), 1);
  const owner = application('owner');
  await assert.rejects(() => owner.entities.saveEntity({ collection: 'pets', id: 'p1', data }), /permiso/);
  assert.equal(owner.writes(), 0);
});

test('personalización comprueba propiedad y restaura el estado si falla el guardado', () => {
  const app = application('owner');
  assert.equal(app.people.changeCardColor('p2:sky'), undefined);
  assert.equal(app.writes(), 0);
  app.people.changeCardColor('p1:sky');
  assert.equal(app.state.db.pets[0].cardColor, 'sky');
  app.people.changeCardColor('p1:default');
  assert.equal(app.state.db.pets[0].cardColor, undefined);
  app.rejectWrites(true);
  app.people.changeCardColor('p1:pink');
  assert.equal(app.state.db.pets[0].cardColor, undefined);
});

test('la identificación conserva los códigos de cinco dígitos y el acceso administrativo', () => {
  const app = application();
  assert.equal(app.people.identifyCode(' 41001 ').qr, 'qr-luna');
  assert.throws(() => app.people.identifyCode('4100'), /5 dígitos/);
  app.state.db.pets[0].active = false;
  assert.throws(() => app.people.identifyCode('41001'), /activa/);
  const owner = application('owner');
  assert.throws(() => owner.people.identifyCode('41001'), /permiso/);
  assert.equal(owner.writes(), 0);
});

test('agenda personal mantiene cuentas separadas y valida fechas antes de guardar', () => {
  const app = application();
  assert.equal(app.agenda.saveNote('', { title: 'Revisión', date: '2026-11-20', time: '10:00', note: 'Datos ficticios' }), '2026-11-20');
  const note = app.state.db.agendaNotes[0];
  app.agenda.toggleNote(note.id);
  assert.equal(note.done, true);
  app.state.user = app.state.db.users.find(user => user.id === 'vet');
  assert.equal(app.agenda.personalAgendaEntries().length, 0);
  assert.equal(app.agenda.deleteNote(note.id), undefined);
  assert.throws(() => app.agenda.saveNote('', { title: 'Inválido', date: '2026-02-30' }), /fecha/);
  assert.equal(app.writes(), 2);
});

test('recordatorios del propietario conservan origen y reinician completado al cambiar fecha', () => {
  const app = application('owner');
  app.agenda.saveOwnerReminder('', { petId: 'p1', category: 'Pipeta', title: '', date: '2026-11-20' });
  const reminder = app.state.db.reminders[0];
  reminder.done = true;
  app.agenda.saveOwnerReminder(reminder.id, { petId: 'p1', category: 'Pipeta', title: '', date: '2026-11-21' });
  assert.equal(reminder.done, false);
  assert.equal(reminder.source, 'owner');
  assert.throws(() => app.agenda.saveOwnerReminder('', { petId: 'p2', date: '2026-11-21' }), /tus mascotas/);
  assert.equal(app.writes(), 2);
});

test('sala de espera impide duplicar ingresos y notifica a los veterinarios activos', () => {
  const app = application();
  const result = app.clinical.addEntry('p1', 'Control');
  assert.equal(result.duplicate, false);
  assert.equal(app.state.db.waitingRoom.length, 1);
  assert.equal(app.state.db.notifications.length, 2);
  assert.equal(app.clinical.addEntry('p1', 'Control').duplicate, true);
  assert.equal(app.writes(), 1);
});

test('atención reutiliza la fachada y guarda clínica, ticket, ingreso y cuidado juntos', () => {
  const app = application();
  app.clinical.addEntry('p1', 'Control');
  app.state.user = app.state.db.users.find(user => user.id === 'vet');
  const entryId = app.state.db.waitingRoom[0].id;
  assert.equal(app.clinical.takeEntry(entryId).entry.status, 'En atención');
  const before = app.writes();
  const result = app.clinical.saveAttention({ entryId, clinicalId: '', attendType: 'Consulta', data: { reason: 'Control', weight: '5', attObservations: 'Paciente estable', nextDate: '2099-01-01', nextCategory: 'Control' }, medicationFields: { names: ['Medicamento'], quantities: ['2'], doses: ['1 ml'], routes: ['Oral'], notes: [''] } });
  assert.equal(result.ok, true);
  assert.equal(app.writes() - before, 1);
  const { clinical, tickets, waitingRoom, reminders } = app.state.db;
  assert.equal(clinical.length, 1);
  assert.equal(tickets[0].clinicalId, clinical[0].id);
  assert.equal(waitingRoom[0].status, 'Pendiente de cobro');
  assert.equal(reminders[0].clinicalId, clinical[0].id);
  assert.throws(() => app.clinical.saveAttention({ entryId, clinicalId: '', data: {}, medicationFields: {} }), /atendido|disponible/);
});

test('cobro recalcula el total y conserva snapshots y relaciones con el ingreso', () => {
  const app = application();
  app.state.db.tickets.push({ id: 't1', petId: 'p1', ownerId: 'o1', waitingEntryId: 'w1', medications: [], total: 0, status: 'Pendiente de cobro' });
  app.state.db.waitingRoom.push({ id: 'w1', petId: 'p1', status: 'Pendiente de cobro', enteredAt: '2026-01-01', reason: 'Control' });
  app.values.set(STORAGE_KEY, JSON.stringify(app.state.db));
  const fields = { 'med-name[]': ['Medicamento'], 'med-quantity[]': ['2'], 'med-dose[]': ['1 ml'], 'med-route[]': ['Oral'], 'med-notes[]': [''], 'med-price[]': ['1200'], serviceAmount: '3000' };
  const charged = app.tickets.charge('t1', fields);
  assert.equal(charged.total, 4200);
  assert.equal(charged.petQr, 'qr-luna');
  assert.equal(charged.ownerDni, '30111222');
  assert.equal(app.state.db.waitingRoom[0].status, 'Pagado');
  assert.equal(app.writes(), 1);
  assert.throws(() => app.tickets.charge('t1', fields), /no disponible/);
});

test('notificaciones conservan su alcance por rol al marcar todas como leídas', () => {
  const app = application('owner');
  app.state.db.notifications.push({ id: 'mine', ownerId: 'o1', message: 'Control preventivo', readBy: [] }, { id: 'foreign', ownerId: 'o2', message: 'Aviso ajeno', readBy: [] }, { id: 'old', ownerId: 'o1', message: 'Tu turno fue confirmado', readBy: [] });
  assert.equal(app.administration.unread(), 1);
  app.administration.markAllRead();
  assert.deepEqual(app.state.db.notifications[0].readBy, ['owner']);
  assert.deepEqual(app.state.db.notifications[1].readBy, []);
  assert.equal(app.writes(), 1);
});

test('configuración y utilidades conservan validaciones de fechas, horas e imágenes', async () => {
  const app = application();
  const input = { ...app.state.db.config };
  assert.deepEqual(validateClinicData(input, ['1', '2']).days, [1, 2]);
  assert.throws(() => validateClinicData({ ...input, end: '07:00' }, ['1']), /cierre/);
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(calShiftMonth('2026-12', 1), '2027-01');
  assert.equal(validAgendaDate('2026-02-30'), false);
  await assert.rejects(() => imageData({ size: 2_000_000 }), /1 MB/);
  await assert.rejects(() => imageData({ size: 10, type: 'text/plain' }), /PNG/);
});

test('dos aplicaciones y una recarga comparten solo el estado que reciben', () => {
  const first = application('owner'), second = application('vet');
  first.people.changeCardColor('p1:sky');
  assert.equal(second.state.db.pets[0].cardColor, undefined);
  const incoming = JSON.parse(first.values.get(STORAGE_KEY));
  incoming.pets[0].name = 'Actualización externa';
  first.values.set(STORAGE_KEY, JSON.stringify(incoming));
  first.storage.load();
  assert.equal(first.people.find('pets', 'p1').name, 'Actualización externa');
  assert.equal(second.people.find('pets', 'p1').name, 'Luna');
});
