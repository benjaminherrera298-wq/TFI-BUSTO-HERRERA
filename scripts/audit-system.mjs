import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { setImmediate as nextTurn } from 'node:timers/promises';
import { startVeterinaryApplication } from '../src/services/veterinaryApplication.js';

// Auditoría aislada: ejecuta eventos reales con almacenamiento ficticio.
// No simula las restricciones nativas del navegador ni evalúa el diseño visual.
const KEY = 'veterinaria-prototipo-v1';
const now = new Date();
const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const account = (id, role, extra = {}) => ({ id, role, name: 'Persona de Prueba', email: `${id}@example.com`, password: '123456', active: true, ...extra });
const ownerData = { name: 'Ana Pérez', dni: '36555111', phone: '+54 381 555-0123', email: 'ana@example.com', address: 'Av. San Martín 123, piso 2' };
const fixture = () => ({
  configured: true, samplePracticeVersion: 1,
  config: { name: 'Veterinaria prueba', identifier: '20301234567', address: 'San Martín 123', phone: '3815550123', email: 'clinica@example.com', days: [1, 2, 3, 4, 5, 6], start: '08:00', end: '20:00', duration: 30, logo: '' },
  users: [account('admin', 'admin'), account('super', 'superadmin'), account('vet1', 'vet', { vetId: 'v1' }), account('vet2', 'vet', { vetId: 'v2' }), account('owner1', 'owner', { ownerId: 'o1' }), account('owner2', 'owner', { ownerId: 'o2' })],
  owners: [{ id: 'o1', ...ownerData, email: 'owner1@example.com', active: true }, { id: 'o2', ...ownerData, dni: '36555222', email: 'owner2@example.com', active: true }],
  vets: [{ id: 'v1', name: 'Veterinaria Uno', license: 'MP 410', specialty: 'Clínica general', serviceIds: ['s1', 's2'], active: true }, { id: 'v2', name: 'Veterinario Dos', license: 'MP 411', specialty: 'Cirugía', serviceIds: ['s1', 's2'], active: true }],
  pets: [{ id: 'p1', ownerId: 'o1', name: 'Luna', birth: '2020-01-01', species: 'Perro', sex: 'Hembra', breed: 'Mestizo', weight: 5, code: '41001', qr: 'qr-one', active: true }, { id: 'p2', ownerId: 'o2', name: 'Michi', birth: '2021-01-01', species: 'Gato', weight: 4, code: '41002', qr: 'qr-two', active: true }],
  services: [{ id: 's1', name: 'Consulta', duration: 30, active: true }, { id: 's2', name: 'Ecografía', duration: 30, active: true }],
  schedules: [{ id: 'h1', vetId: 'v1', serviceId: 's2', day: 3, start: '09:00', end: '13:00', duration: 30, active: true }],
  waitingRoom: [{ id: 'w1', petId: 'p1', ownerId: 'o1', petName: 'Luna', reason: 'Control', enteredAt: new Date().toISOString(), status: 'Esperando' }],
  clinical: [], tickets: [], reminders: [], notices: [], notifications: [], products: [], agendaNotes: []
});

function node(id = '') {
  return { id, html: '', textContent: '', open: false, hidden: false, classList: { toggle() {} },
    showModal() { this.open = true; }, close() { this.open = false; }, setAttribute() {}, scrollIntoView() {},
    querySelectorAll() { return []; }, querySelector() { return null; } };
}

function harness(initial = fixture(), { theme = 'dark', savedTheme, lockedRole = null } = {}) {
  const store = new Map([[KEY, JSON.stringify(initial)]]);
  if (savedTheme) store.set('veterinaria-theme', savedTheme);
  let rejectWrites = false;
  globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem(key, value) { if (rejectWrites && key === KEY) throw new Error('Test storage error'); store.set(key, String(value)); }, removeItem: key => store.delete(key) };
  globalThis.document = { documentElement: { dataset: { theme } }, querySelector: () => null };
  globalThis.window = { addEventListener() {}, removeEventListener() {}, scrollTo() {}, print() {} };
  globalThis.location = { hash: '', pathname: '/', search: '' };
  globalThis.history = { replaceState() {} };
  globalThis.FormData = class {
    constructor(form) { this.rows = Object.entries(form.values).flatMap(([key, value]) => (Array.isArray(value) ? value : [value]).map(item => [key, item])); }
    [Symbol.iterator]() { return this.rows[Symbol.iterator](); }
    getAll(key) { return this.rows.filter(([name]) => key === name).map(([, value]) => value); }
    get(key) { return this.getAll(key)[0] ?? null; }
  };
  const nodes = new Map(['app', 'content', 'modal', 'form-error', 'global-results'].map(id => [`#${id}`, node(id)]));
  const handlers = new Map();
  const messages = [];
  const stop = startVeterinaryApplication({ lockedRole,
    root: { querySelector: selector => nodes.get(selector) ?? null, querySelectorAll: () => [] },
    on: (name, callback) => handlers.set(name, callback),
    setHtml(target, html) { assert.ok(target, 'Expected a render target'); target.html = html; },
    notify: message => messages.push(message)
  });
  return {
    store, nodes, messages, stop,
    data: () => JSON.parse(store.get(KEY)),
    html: () => nodes.get('#content').html,
    modal: () => nodes.get('#modal').html,
    rejectWrites(value) { rejectWrites = value; },
    async submit(kind, values, id = '') {
      nodes.get('#form-error').textContent = '';
      const submit = { disabled: false, isConnected: true };
      const form = { values, dataset: { form: kind, id }, elements: { logo: { files: [] }, photo: { files: [] } }, matches: selector => selector === 'form[data-form]', querySelector: () => submit };
      await handlers.get('submit')({ target: form, preventDefault() {} });
      return nodes.get('#form-error').textContent;
    },
    async login(id = 'admin') { const error = await this.submit('login', { email: `${id}@example.com`, password: '123456' }); assert.equal(error, ''); },
    async click(action, id = '') { const target = { ...node(), dataset: { action, id } }; target.closest = () => target; handlers.get('click')({ target }); await nextTurn(); },
    change(id, value) { handlers.get('change')({ target: { id, value, closest: () => null } }); }
    ,input(target) { handlers.get('input')({ target }); }
  };
}

const results = [];
async function check(id, description, coverage, test) {
  try {
    const { ok, evidence } = await test();
    results.push({ id, description, coverage, status: ok ? 'PASS' : 'FINDING', evidence });
  } catch (error) {
    results.push({ id, description, coverage, status: 'HARNESS_ERROR', evidence: error.stack });
  }
}
async function logged(role = 'admin', data = fixture()) { const h = harness(data); await h.login(role); return h; }
const isCreated = (h, collection, before) => h.data()[collection].length > before;
const attention = { reason: 'Control', attObservations: 'Buen estado', weight: '5', nextDate: '', temperature: '' };
const petValues = { ownerId: 'o1', name: 'Luna', species: 'Perro', sex: 'Hembra', birth: '2020-01-01', weight: '5' };

for (const role of ['admin', 'vet1', 'owner1', 'super']) {
  await check(`NAV-${role}`, `Navegación de ${role}`, 'eventos con almacenamiento aislado', async () => {
    const h = await logged(role);
    const routes = [...h.nodes.get('#app').html.matchAll(/class="nav-item[\s\S]*?data-id="([^"]+)"/g)].map(match => match[1]);
    for (const route of routes) { await h.click('nav', route); assert.ok(h.html().trim(), route); }
    h.stop();
    return { ok: true, evidence: routes };
  });
}

await check('VAL-01', 'Nombres personales con números', 'entrada admitida por los atributos HTML; guardado reproducido', async () => {
  const saved = [];
  for (const [collection, values, role] of [
    ['owners', { ...ownerData, dni: '36555333', name: '12345' }, 'admin'],
    ['vets', { name: 'Ana123', license: 'MP 999', specialty: 'Clínica', email: 'nueva@example.com', password: '123456', serviceIds: ['s1'] }, 'admin'],
    ['users', { name: '9999', email: 'nuevo-admin@example.com', password: '123456', phone: '3815551234', role: 'admin' }, 'super']
  ]) {
    const h = await logged(role); const before = h.data()[collection].length;
    await h.submit('entity', values, `${collection}:`);
    if (isCreated(h, collection, before)) saved.push({ collection, name: h.data()[collection].at(-1).name });
    h.stop();
  }
  return { ok: saved.length === 0, evidence: saved };
});

await check('VAL-02', 'Teléfonos con letras', 'entrada HTML tel; guardado reproducido', async () => {
  const h = await logged();
  await h.submit('entity', { ...ownerData, dni: '36555333', phone: 'telefonoABC' }, 'owners:');
  await h.submit('settings', { ...fixture().config, phone: 'soloLetras', days: [1, 2, 3] });
  const evidence = { ownerPhone: h.data().owners.at(-1).phone, clinicPhone: h.data().config.phone };
  h.stop();
  return { ok: !/[A-Za-z]/.test(evidence.ownerPhone + evidence.clinicPhone), evidence };
});

await check('VAL-03', 'Campos obligatorios que contienen solo espacios', 'HTML required acepta espacios; guardado reproducido', async () => {
  const h = await logged();
  const before = h.data();
  await h.submit('entity', { ...ownerData, dni: '36555333', name: '   ', address: '   ' }, 'owners:');
  await h.submit('entity', { name: '   ', category: '   ', price: '10', stock: '1' }, 'products:');
  await h.submit('entity', { title: '   ', message: 'Aviso válido', date, expires: '', active: 'true' }, 'notices:');
  const evidence = { owner: h.data().owners.at(-1), product: h.data().products.at(-1), notice: h.data().notices.at(-1) };
  const after = h.data(); h.stop();
  return { ok: after.owners.length === before.owners.length && after.products.length === before.products.length && after.notices.length === before.notices.length, evidence };
});

await check('VAL-04', 'DNI inválido al invocar el guardado sin validación HTML', 'solo lógica de guardado; el pattern HTML sí rechaza letras', async () => {
  const h = await logged(); const before = h.data().owners.length;
  await h.submit('entity', { ...ownerData, dni: 'ABC-123' }, 'owners:');
  const evidence = h.data().owners.at(-1).dni;
  h.stop(); return { ok: !isCreated(h, 'owners', before), evidence };
});

await check('VAL-05', 'Validación HTML de DNI y restricción durante la escritura', 'inspección del formulario realmente generado', async () => {
  const h = await logged('owner1'); await h.click('edit', 'owners:o1');
  const input = h.modal().match(/<input\b(?=[^>]*\bname="dni")[^>]*>/s)?.[0];
  assert.match(input, /pattern="\[0-9\]\{7,9\}"/);
  h.stop(); return { ok: /inputmode="numeric"/.test(input) && /maxlength=/.test(input), evidence: input };
});

await check('VAL-06', 'Validación numérica de mascotas, catálogo y servicios fuera del HTML', 'solo lógica de guardado; min/step/type del HTML evitan estos valores en uso normal', async () => {
  const h = await logged('super');
  const before = h.data();
  await h.submit('entity', { ...petValues, weight: '-5' }, 'pets:');
  await h.submit('entity', { name: 'Producto', category: 'Ejemplo', price: '-10', stock: '2.5' }, 'products:');
  await h.submit('entity', { name: 'Servicio', duration: 'abc', vetIds: [] }, 'services:');
  const after = h.data();
  const evidence = { pets: after.pets.length, products: after.products.length, services: after.services.length };
  h.stop(); return { ok: after.pets.length === before.pets.length && after.products.length === before.products.length && after.services.length === before.services.length, evidence };
});

await check('VAL-07', 'Datos clínicos negativos sin rango y cantidades con letras', 'temperatura y cantidad admitidas por HTML; guardado reproducido', async () => {
  const h = await logged('vet1');
  await h.submit('attention', { ...attention, temperature: '-999', 'med-name[]': ['Medicación de prueba'], 'med-quantity[]': ['abc'], 'med-dose[]': ['1 ml'] }, 'w1|');
  const record = h.data().clinical.at(-1);
  h.stop(); return { ok: !record || (Number(record.temperature) > 0 && !/[a-z]/i.test(record.medications[0].quantity)), evidence: record && { temperature: record.temperature, medications: record.medications } };
});

await check('VAL-08', 'Fechas imposibles en calendario de cuidados', 'solo lógica de guardado; un input date normal no produce 30 de febrero', async () => {
  const h = await logged('owner1');
  await h.submit('owner-reminder', { petId: 'p1', category: 'Control', title: 'Fecha imposible', date: '2026-02-30', note: '' });
  const evidence = { saved: h.data().reminders.at(-1), renderError: h.nodes.get('#form-error').textContent };
  h.stop(); return { ok: !evidence.saved, evidence };
});

await check('VAL-09', 'Fechas y pesos inválidos al guardar atenciones', 'solo lógica de guardado; se omiten restricciones HTML', async () => {
  const h = await logged('vet1');
  await h.submit('clinical', { type: 'Consulta', title: 'Control', date: '2099-01-01', info: 'Información', weight: '-4', visible: 'true', nextDate: '' }, 'p1');
  const record = h.data().clinical.at(-1);
  h.stop(); return { ok: !record, evidence: record && { date: record.date, weight: record.weight } };
});

await check('VAL-10', 'Correos y contraseñas inválidos en guardado de cuentas', 'solo lógica de guardado; type email y minlength actúan en HTML', async () => {
  const h = await logged('super'); const before = h.data().users.length;
  await h.submit('entity', { name: 'Persona', email: 'sin-correo', password: 'x', phone: '123', role: 'admin' }, 'users:');
  const row = h.data().users.at(-1);
  const evidence = { email: row.email, passwordLength: row.password.length };
  h.stop(); return { ok: !isCreated(h, 'users', before), evidence };
});

await check('DATA-01', 'DNI duplicado y dirección alfanumérica válida', 'control positivo', async () => {
  const h = await logged(); const before = h.data().owners.length;
  const duplicateError = await h.submit('entity', { ...ownerData, dni: '36555111' }, 'owners:');
  const duplicateBlocked = h.data().owners.length === before && !!duplicateError;
  await h.submit('entity', { ...ownerData, dni: '36555333' }, 'owners:');
  const address = h.data().owners.at(-1).address;
  h.stop(); return { ok: duplicateBlocked && address === ownerData.address, evidence: { duplicateError, address } };
});

await check('DATA-02', 'Correo de contacto duplicado al vincular cuentas de propietario', 'formulario normal y vinculación por correo', async () => {
  const h = await logged();
  await h.submit('entity', { ...ownerData, dni: '36555333', email: 'compartido@example.com' }, 'owners:');
  await h.submit('entity', { ...ownerData, name: 'Otra Persona', dni: '36555444', email: 'compartido@example.com' }, 'owners:');
  await h.submit('entity', { name: 'Otra Persona', email: 'compartido@example.com', phone: '3815550199', password: '123456', role: 'owner' }, 'users:');
  const candidates = h.data().owners.filter(owner => owner.email === 'compartido@example.com');
  const row = h.data().users.find(user => user.email === 'compartido@example.com');
  h.stop(); return { ok: candidates.length < 2, evidence: { candidates: candidates.map(owner => ({ id: owner.id, name: owner.name })), linkedOwnerId: row?.ownerId } };
});

await check('FLOW-01', 'Crear propietario desde Usuarios requiere sección ausente en el menú del administrador', 'navegación y formulario normal', async () => {
  const h = await logged();
  const menuHasOwners = /data-id="owners"/.test(h.nodes.get('#app').html);
  await h.click('create', 'users');
  assert.match(h.modal(), /name="ownerDni"/);
  const error = await h.submit('entity', { name: 'Persona Nueva', email: 'persona-nueva@example.com', phone: '3815550111', password: '123456', role: 'owner', ownerDni: '36555999', ownerAddress: 'Av. Belgrano 123' }, 'users:');
  const saved = h.data();
  const owner = saved.owners.find(item => item.dni === '36555999');
  const linked = saved.users.find(item => item.ownerId === owner?.id);
  h.stop(); return { ok: !error && !!owner && !!linked, evidence: { menuHasOwners, error, owner, linkedOwnerId: linked?.ownerId } };
});

await check('FLOW-02', 'Quitar vínculo de una cuenta veterinaria existente', 'opción Sin vincular disponible en el formulario', async () => {
  const h = await logged();
  await h.submit('entity', { name: 'Veterinaria Uno', email: 'vet1@example.com', password: '', phone: '3815550111', role: 'vet', vetId: '' }, 'users:vet1');
  const row = h.data().users.find(user => user.id === 'vet1');
  await h.click('logout');
  const error = await h.submit('login', { email: 'vet1@example.com', password: '123456' });
  h.stop(); return { ok: row.vetId === 'v1', evidence: { vetId: row.vetId, loginError: error } };
});

await check('FLOW-03', 'Cambiar días generales conserva horarios especiales en días cerrados', 'configuración y vista del propietario', async () => {
  const h = await logged();
  await h.submit('settings', { ...fixture().config, days: [1, 2, 4, 5] });
  await h.click('logout'); await h.login('owner1'); await h.click('nav', 'schedules');
  const evidence = { days: h.data().config.days, scheduleStillActive: h.data().schedules[0].active, closedWednesdayStillShown: h.html().includes('Miércoles') };
  h.stop(); return { ok: !evidence.closedWednesdayStillShown, evidence };
});

await check('FLOW-04', 'Publicación de avisos desde configuración', 'control positivo con rol de propietario', async () => {
  const h = await logged();
  await h.click('nav', 'settings');
  assert.match(h.html(), /Avisos de la veterinaria/);
  await h.submit('entity', { title: 'Aviso de prueba', message: 'El 10 de noviembre estará cerrado.', date, expires: '', active: 'true' }, 'notices:');
  await h.click('logout'); await h.login('owner1'); await h.click('nav', 'notices');
  const visible = h.html().includes('El 10 de noviembre estará cerrado.');
  h.stop(); return { ok: visible, evidence: { visible } };
});

await check('FLOW-05', 'Preferencia de tema después de reiniciar la aplicación', 'inicio real con tema guardado', async () => {
  const h = harness(fixture(), { savedTheme: 'light', theme: 'dark' });
  const evidence = { savedBefore: 'light', savedAfter: h.store.get('veterinaria-theme'), applied: document.documentElement.dataset.theme };
  h.stop(); return { ok: evidence.savedAfter === 'light' && evidence.applied === 'light', evidence };
});

await check('ATT-01', 'Otro veterinario puede tomar una atención en curso', 'botón Continuar atención y eventos normales', async () => {
  const initial = fixture(); Object.assign(initial.waitingRoom[0], { status: 'En atención', vetId: 'v1', vetName: 'Veterinaria Uno' });
  const h = await logged('vet2', initial);
  const hasContinue = h.html().includes('Continuar atención');
  await h.click('vet-attend', 'w1');
  const evidence = { hasContinue, assignedVet: h.data().waitingRoom[0].vetId };
  h.stop(); return { ok: evidence.assignedVet === 'v1', evidence };
});

await check('ATT-02', 'Guardar dos veces la misma atención genera duplicados', 'eventos de guardado consecutivos sobre el mismo ingreso', async () => {
  const h = await logged('vet1');
  await h.submit('attention', attention, 'w1|');
  await h.submit('attention', attention, 'w1|');
  const evidence = { clinical: h.data().clinical.length, tickets: h.data().tickets.length, waitingStatus: h.data().waitingRoom[0].status };
  h.stop(); return { ok: evidence.clinical === 1 && evidence.tickets === 1, evidence };
});

await check('ATT-03', 'Editar atención cobrada elimina precios de la medicación', 'edición permitida por interfaz y guardado real', async () => {
  const initial = fixture();
  initial.clinical.push({ id: 'c1', petId: 'p1', ownerId: 'o1', date, type: 'Consulta', title: 'Consulta', info: 'Control', reason: 'Control', vetId: 'v1', ticketId: 't1', medications: [{ name: 'Medicación', quantity: '1' }], visible: true });
  initial.tickets.push({ id: 't1', clinicalId: 'c1', petId: 'p1', ownerId: 'o1', date, status: 'Pagado', total: 15000, serviceAmount: 10000, medications: [{ name: 'Medicación', quantity: '1', price: 5000 }] });
  const h = await logged('vet1', initial);
  await h.click('vet-edit-attention', 'c1');
  await h.submit('attention', { ...attention, 'med-name[]': ['Medicación'], 'med-quantity[]': ['1'] }, '|c1');
  const evidence = h.data().tickets[0];
  h.stop(); return { ok: evidence.medications[0].price === 5000, evidence };
});

await check('ATT-04', 'Editar atenciones de otro veterinario mediante envío alterado', 'solo lógica de guardado; el botón de edición sí valida al autor', async () => {
  const initial = fixture(); initial.clinical.push({ id: 'c1', petId: 'p1', date, type: 'Consulta', title: 'Consulta', info: 'Original', vetId: 'v1', visible: true });
  const h = await logged('vet2', initial);
  await h.submit('attention', { ...attention, attObservations: 'Cambiado por otro veterinario' }, '|c1');
  const evidence = { vetId: h.data().clinical[0].vetId, info: h.data().clinical[0].info };
  h.stop(); return { ok: evidence.info === 'Original', evidence };
});

await check('ATT-05', 'Ingreso activo duplicado en sala de espera', 'control positivo', async () => {
  const h = await logged();
  await h.submit('admin-entry', { reason: 'Control' }, 'p1');
  const count = h.data().waitingRoom.length;
  h.stop(); return { ok: count === 1, evidence: { count } };
});

await check('MONEY-01', 'Suma de precios puede desbordar y guardarse como null', 'límite numérico sin máximo comercial', async () => {
  const initial = fixture(); initial.tickets.push({ id: 't1', petId: 'p1', ownerId: 'o1', date, status: 'Pendiente de cobro', medications: [], total: 0 });
  const h = await logged('admin', initial);
  await h.submit('charge', { 'med-name[]': ['A', 'B'], 'med-quantity[]': ['1', '1'], 'med-price[]': ['1e308', '1e308'], serviceAmount: '0' }, 't1');
  const evidence = { total: h.data().tickets[0].total, status: h.data().tickets[0].status };
  h.stop(); return { ok: evidence.status !== 'Pagado' || Number.isFinite(evidence.total) && evidence.total !== null, evidence };
});

await check('MONEY-02', 'Cobro rechaza importes negativos y exige total positivo', 'control positivo', async () => {
  const initial = fixture(); initial.tickets.push({ id: 't1', petId: 'p1', ownerId: 'o1', date, status: 'Pendiente de cobro', medications: [], total: 0 });
  const h = await logged('admin', initial);
  const negative = await h.submit('charge', { serviceAmount: '-1' }, 't1');
  const zero = await h.submit('charge', { serviceAmount: '0' }, 't1');
  const status = h.data().tickets[0].status;
  h.stop(); return { ok: !!negative && !!zero && status === 'Pendiente de cobro', evidence: { negative, zero, status } };
});

await check('PERM-01', 'Propietario no puede consultar ni editar mascotas ajenas', 'control positivo', async () => {
  const h = await logged('owner1'); const before = JSON.stringify(h.data().pets);
  await h.click('pet', 'p2');
  const denied = h.html().includes('No tenés permiso');
  await h.submit('entity', { ...petValues, name: 'Cambio' }, 'pets:p2');
  const same = JSON.stringify(h.data().pets) === before;
  h.stop(); return { ok: denied && same, evidence: { denied, same } };
});

await check('PERM-02', 'Validación de agenda personal y separación entre cuentas', 'control positivo', async () => {
  const h = await logged();
  const invalid = await h.submit('agenda-note', { title: 'Nota', date: '2026-02-30', time: '', note: '' });
  await h.submit('agenda-note', { title: 'Privada', date, time: '10:30', note: '' });
  const id = h.data().agendaNotes[0].id;
  await h.click('logout'); await h.login('vet1');
  await h.click('agenda-delete-confirm', id);
  const count = h.data().agendaNotes.length;
  h.stop(); return { ok: !!invalid && count === 1, evidence: { invalid, count } };
});

await check('STORE-01', 'Fallo de persistencia revierte anotaciones', 'control positivo', async () => {
  const h = await logged(); const before = JSON.stringify(h.data().agendaNotes);
  h.rejectWrites(true);
  await h.submit('agenda-note', { title: 'No guardar', date, time: '', note: '' });
  h.rejectWrites(false);
  await h.click('nav', 'agenda');
  const unchanged = before === JSON.stringify(h.data().agendaNotes) && !h.html().includes('No guardar');
  h.stop(); return { ok: unchanged, evidence: { unchanged } };
});

await check('PRINT-01', 'CSS de impresión oculta el ancestro del diálogo en Vue', 'confirmado por estructura y selectores; pendiente impresión en navegador', async () => {
  const css = await readFile(new URL('../src/styles/styles.css', import.meta.url), 'utf8');
  const app = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8');
  const hidesRoot = /@media print\{body>\*\{display:none!important\}/.test(css);
  const onlyDirectDialog = /body>dialog\[open\]/.test(css);
  const nestedDialog = /<div ref="container"[\s\S]+<dialog id="modal"/.test(app);
  return { ok: !(hidesRoot && onlyDirectDialog && nestedDialog), evidence: { hidesRoot, onlyDirectDialog, nestedDialog } };
});

const summary = Object.fromEntries(['PASS', 'FINDING', 'HARNESS_ERROR'].map(status => [status, results.filter(result => result.status === status).length]));
const output = new URL('../reports/testing-2026-11-06-results.json', import.meta.url);
await mkdir(new URL('../reports/', import.meta.url), { recursive: true });
await writeFile(output, JSON.stringify({ generatedAt: new Date().toISOString(), scope: 'Pruebas aisladas de eventos, revisión de atributos HTML y código. Sin navegador real.', summary, results }, null, 2) + '\n');
for (const result of results) console.log(`${result.status}: ${result.id} — ${result.description}`);
console.log(JSON.stringify(summary));
if (summary.HARNESS_ERROR) process.exitCode = 2;
else if (summary.FINDING) process.exitCode = 1;
