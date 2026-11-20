import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { simulatedQrCells } from '../src/data/simulatedQr.js';
import { loadVueComponent } from './helpers/loadVueComponent.js';
import { mountVueComponent } from './helpers/mountVueComponent.js';

const load = path => loadVueComponent(new URL(path, import.meta.url));
const QrSymbol = await load('../src/components/identification/QrSymbol.vue');
const PetQrDialog = await load('../src/components/identification/PetQrDialog.vue');
const QrScanDialog = await load('../src/components/identification/QrScanDialog.vue');
const ScanResultDialog = await load('../src/components/identification/ScanResultDialog.vue');
const EntryReasonDialog = await load('../src/components/identification/EntryReasonDialog.vue');
const PublicPetDialog = await load('../src/components/identification/PublicPetDialog.vue');
const ClinicalHistoryPrint = await load('../src/components/clinical/ClinicalHistoryPrint.vue');
const html = (component, props) => renderToString(createSSRApp(component, props));
const pet = { id: 'pet-one', qr: 'qr-pet-1', code: '41001', name: 'Luna <prueba>', breed: 'Mestizo', species: 'Gato', sex: 'Hembra', weight: 5 };

test('el patrón simulado conserva las celdas de referencia anteriores a la migración', () => {
  // Huellas calculadas con qrSvg() de la versión anterior, en el mismo orden de celdas.
  const reference = [
    ['qr-pet-1', 442, 'b6f19dfa5956e8752e39c8039c72c169732d57f2bd163bcd16be2b65d372c3d7'],
    ['id-luna', 440, 'e6b05967beb28918f69137e577cf5290f9dc1808f95aa77c46a1d13f40a2a33a'],
    ['QR-12345', 434, 'e036fce0acca77d246c804122728e6e72cea553ccf68be93134fb9609c76f7de']
  ];
  for (const [identifier, count, hash] of reference) {
    const cells = simulatedQrCells(identifier);
    assert.equal(cells.length, count);
    assert.equal(createHash('sha256').update(JSON.stringify(cells)).digest('hex'), hash);
  }
});

test('el símbolo usa rectángulos SVG reales con dimensiones y colores originales', async () => {
  const cells = simulatedQrCells(pet.qr);
  const markup = await html(QrSymbol, { cells });
  assert.match(markup, /viewBox="0 0 37 37"/);
  assert.match(markup, /width="37" height="37" fill="white"/);
  assert.match(markup, /fill="#1F2E5A"/);
  assert.equal((markup.match(/<rect /g) || []).length, cells.length + 1);
  assert.doesNotMatch(markup, /<img|<canvas/);
});

test('el diálogo QR conserva identificación, textos y una sola emisión por botón', async () => {
  const props = { pet, cells: simulatedQrCells(pet.qr) };
  const markup = await html(PetQrDialog, props);
  for (const text of ['Luna &lt;prueba&gt;', 'QR simulado · No escaneable con cámara', 'qr-pet-1', '41001', 'Descargar QR simulado']) assert.ok(markup.includes(text), text);
  const events = [];
  const view = mountVueComponent(PetQrDialog, { ...props, onAction: (...args) => events.push(args) });
  let stopped = 0;
  for (const name of ['scan', 'public', 'download-qr', 'print']) view.find(node => node.props['data-action'] === name).props.onClick({ stopPropagation() { stopped++; } });
  assert.deepEqual(events, [['scan', 'pet-one'], ['public', 'pet-one'], ['download-qr', 'pet-one'], ['print', '']]);
  assert.equal(stopped, 4);
  view.unmount();
  assert.equal(view.root.children.length, 0);
});

test('la selección de mascota conserva códigos, formulario y bloqueo de ingresos activos', async () => {
  const markup = await html(QrScanDialog, { rows: [
    { pet, ownerName: 'Ana de prueba' },
    { pet: { ...pet, id: 'pet-two', name: 'Michi' }, ownerName: 'Otra persona', busy: { status: 'Esperando' } }
  ] });
  assert.match(markup, /data-form="admin-code"/);
  assert.match(markup, /name="code"[^>]*maxlength="5"[^>]*pattern="\[0-9\]\{5\}"[^>]*required/);
  assert.match(markup, /data-action="admin-scan-pick" data-id="pet-one"/);
  assert.match(markup, /class="scan-pick" disabled/);
  assert.match(markup, /Ya ingresado · Esperando/);
  assert.equal((markup.match(/data-action="admin-scan-pick"/g) || []).length, 1);
  const empty = await html(QrScanDialog, {});
  assert.match(empty, /No hay mascotas activas para escanear\./);
});

test('el resultado identificado conserva datos y evita un formulario nuevo si ya existe ingreso', async () => {
  const owner = { name: 'Ana de prueba', dni: '30111222', phone: '3815550123', email: 'ana@example.com', address: 'Domicilio ficticio' };
  const fresh = await html(ScanResultDialog, { pet, owner, age: 6 });
  assert.match(fresh, /data-form="admin-entry" data-id="pet-one"/);
  for (const text of ['30111222', 'Datos de la mascota', 'Datos del propietario', 'Confirmar ingreso', '6 años']) assert.ok(fresh.includes(text), text);
  const existing = await html(ScanResultDialog, { pet, owner, existing: { status: 'En atención' }, entryTime: '10:30' });
  assert.doesNotMatch(existing, /<form/);
  assert.match(existing, /No se generó un nuevo registro\./);
  assert.match(existing, /estado: En atención, ingreso 10:30/);
  assert.match(existing, /data-action="nav" data-id="waitingRoom"/);
});

test('el formulario de motivo conserva el texto y el ingreso que debe actualizar', async () => {
  const markup = await html(EntryReasonDialog, { pet, entry: { id: 'entry-one', status: 'Esperando', reason: 'Control <ficticio>' }, entryTime: '09:15' });
  assert.match(markup, /data-form="admin-entry-reason" data-id="entry-one"/);
  assert.match(markup, /Control &lt;ficticio&gt;/);
  assert.match(markup, /Estado: Esperando/);
  assert.match(markup, /Guardar motivo/);
});

test('la identificación pública mantiene el identificador QR y no muestra historia clínica', async () => {
  const values = { pet: { ...pet, clinical: 'información interna' }, image: { src: '', alt: pet.name, isAvatar: false } };
  const markup = await html(PublicPetDialog, values);
  assert.match(markup, /Esta mascota pertenece a una cuenta registrada\./);
  assert.match(markup, /data-action="public-login" data-id="qr-pet-1"/);
  assert.doesNotMatch(markup, /información interna/);
  const events = [];
  const view = mountVueComponent(PublicPetDialog, { ...values, onAction: (...args) => events.push(args) });
  view.find(node => node.props['data-action'] === 'public-login').props.onClick({ stopPropagation() {} });
  assert.deepEqual(events, [['public-login', 'qr-pet-1']]);
  view.unmount();
});

test('la impresión clínica conserva sección, fecha, código y los registros recibidos', async () => {
  const props = { pet, ownerName: 'Ana de prueba', age: 6, tab: 'Vacunas', issuedDate: '19 nov 2026', records: [] };
  const empty = await html(ClinicalHistoryPrint, props);
  assert.match(empty, /Sección: Vacunas · 0 registro\(s\) · Emitido el 19 nov 2026/);
  assert.match(empty, /Sin registros en esta sección\./);
  assert.match(empty, /data-action="print"/);
  const record = { id: 'clinical', title: 'Vacuna ficticia', type: 'Vacuna', date: '2026-01-01', visible: true };
  const populated = await html(ClinicalHistoryPrint, { ...props, records: [{ record, medications: [], authorName: 'Profesional', formatDate: date => date }] });
  assert.match(populated, /Vacuna ficticia/);
  assert.match(populated, /1 registro\(s\)/);
});
