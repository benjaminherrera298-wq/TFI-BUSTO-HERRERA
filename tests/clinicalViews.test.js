import test from 'node:test';
import assert from 'node:assert/strict';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { loadVueComponent } from './helpers/loadVueComponent.js';
import { mountVueComponent } from './helpers/mountVueComponent.js';

const component = name => loadVueComponent(new URL('../src/' + name + '.vue', import.meta.url));
const ClinicalRecordCard = await component('components/clinical/ClinicalRecordCard');
const ClinicalForm = await component('components/clinical/ClinicalForm');
const AttentionForm = await component('components/clinical/AttentionForm');
const MedicationRow = await component('components/clinical/MedicationRow');
const WaitingRoomView = await component('views/clinical/WaitingRoomView');
const DailyHistoryView = await component('views/clinical/DailyHistoryView');
const html = (Component, props) => renderToString(createSSRApp(Component, props));
const formatDate = date => 'Fecha ' + date;
const formatMoney = amount => '$' + amount;
const pet = { id: 'pet1', name: 'Luna', ownerId: 'owner1', species: 'Gato', breed: 'Mestizo', birth: '2020-01-01', sex: 'Hembra', weight: 4.2 };
const record = { id: 'clinical1', title: 'Consulta <prueba>', info: 'Detalle seguro', type: 'Consulta', date: '2026-01-01', time: '09:15', reason: 'Control', diagnosis: 'Diagnóstico de prueba', weight: 4.2, temperature: 38, visible: false };
const historyItem = { record, medications: [{ name: 'Medicamento de prueba', dose: '1 ml', quantity: 2, route: 'Oral' }], authorName: 'Profesional de prueba', formatDate };

test('la tarjeta clínica conserva datos, medicamentos, nota interna y escape de texto', async () => {
  const markup = await html(ClinicalRecordCard, historyItem);
  for (const text of ['Consulta &lt;prueba&gt;', 'Detalle seguro', 'Motivo de consulta:', 'Diagnóstico:', 'Medicamento de prueba', '· Cant. 2', 'Profesional de prueba', '4.2 kg', '38 °C', 'Nota interna']) assert.ok(markup.includes(text), text);
  // El CSS existente usa pre-wrap: estos saltos también forman parte del diseño.
  assert.match(markup, /<p>\n {14}<small>Diagnóstico:<\/small>\n {14}Diagnóstico de prueba\n {12}<\/p>/);
  const vaccine = await html(ClinicalRecordCard, { ...historyItem, record: { ...record, type: 'Vacuna', vaccineName: 'Rabia', vaccineDose: '1 ml', vaccineType: 'Anual', vaccineLot: 'L123', vaccineNext: '2027-01-01', visible: true } });
  assert.match(vaccine, /Rabia · Tipo: Anual · Dosis: 1 ml · Lote: L123 · Próxima aplicación: Fecha 2027-01-01/);
  assert.doesNotMatch(vaccine, /Nota interna/);
});

test('ClinicalForm conserva el contrato de submit y las restricciones de los campos', async () => {
  const markup = await html(ClinicalForm, { pet, responsibleName: 'Persona de prueba', administrative: true, today: '2026-01-02', categories: ['Control', 'Vacuna'] });
  assert.match(markup, /data-form="clinical" data-id="pet1"/);
  assert.match(markup, /name="date"[^>]*required[^>]*max="2026-01-02"/);
  assert.match(markup, /name="weight"[^>]*min="0.01"[^>]*step="0.01"[^>]*max="100000"/);
  assert.match(markup, /name="visible"/);
  assert.match(markup, /Compartir con propietario/);
  assert.match(markup, /data-form-error(?:="")?/);
  assert.match(markup, /type="submit">Guardar/);
});

test('AttentionForm conserva historia, formulario oculto, medicamentos y datos de edición', async () => {
  const props = { pet, age: 6, entryId: 'entry1', clinicalId: '', history: [historyItem], initialReason: 'Control inicial', legacyPerformed: '', medications: [{}], today: '2026-01-02', categories: ['Control', 'Vacuna'], formatDate };
  const before = structuredClone(pet);
  const markup = await html(AttentionForm, props);
  assert.match(markup, /class="attend-layout"/);
  assert.match(markup, /id="attend-form-wrap" hidden/);
  assert.match(markup, /data-form="attention" data-id="entry1\|"/);
  assert.match(markup, /name="attType" value="Consulta"/);
  assert.match(markup, /data-action="vet-history-filter"/);
  assert.match(markup, /data-history-type="Consulta"/);
  assert.match(markup, /name="med-name\[\]"/);
  assert.match(markup, /Control inicial/);
  assert.deepEqual(pet, before);
  const edit = await html(AttentionForm, { ...props, entryId: '', clinicalId: 'clinical1', record: { ...record, type: 'Vacuna', vaccineName: 'Rabia' } });
  assert.match(edit, /class="attend-single"/);
  assert.match(edit, /data-form="attention" data-id="\|clinical1"/);
  assert.match(edit, /name="attType" value="Vacuna"/);
  assert.match(edit, /Datos de la vacuna/);
  assert.match(edit, /name="vaccineName"[^>]*value="Rabia"/);
});

test('MedicationRow emite los cambios y la eliminación sin mutar el medicamento recibido', () => {
  const medication = { name: 'Anterior', quantity: 1 };
  const changes = [];
  let removals = 0, stops = 0;
  const view = mountVueComponent(MedicationRow, { medication, onChange: value => changes.push(value), onRemove: () => removals++ });
  view.find(node => node.props.name === 'med-name[]').props.onInput({ target: { value: 'Actualizado' } });
  view.find(node => node.props['data-action'] === 'vet-remove-med').props.onClick({ stopPropagation() { stops++; } });
  assert.deepEqual(changes, [{ name: 'Actualizado' }]);
  assert.deepEqual(medication, { name: 'Anterior', quantity: 1 });
  assert.equal(removals, 1);
  assert.equal(stops, 1);
  view.unmount();
  assert.equal(view.root.children.length, 0);
});

test('sala de espera conserva estados, acciones y permiso de atención del superadministrador', async () => {
  const row = { entry: { id: 'entry1', petName: 'Luna', status: 'Esperando', reason: 'Control' }, pet, ownerName: 'Ana', time: '09:00', ticket: null, medications: [] };
  const props = { clinicName: 'Veterinaria de prueba', active: [row], paid: [], totalEntries: 1, isSuperadmin: false, formatDate, formatMoney };
  const normal = await html(WaitingRoomView, props);
  assert.match(normal, /Luna/);
  assert.match(normal, /data-action="admin-edit-reason"/);
  assert.match(normal, /data-action="admin-cancel-entry"/);
  assert.doesNotMatch(normal, /data-action="vet-attend"/);
  const superadmin = await html(WaitingRoomView, { ...props, isSuperadmin: true });
  assert.match(superadmin, /data-action="vet-attend" data-id="entry1"/);
  const events = [];
  const view = mountVueComponent(WaitingRoomView, { ...props, onAction: (...args) => events.push(args) });
  const button = view.find(node => node.props['data-action'] === 'admin-edit-reason');
  let stops = 0;
  button.props.onClick({ currentTarget: button, stopPropagation() { stops++; } });
  assert.deepEqual(events, [['admin-edit-reason', 'entry1', button]]);
  assert.equal(stops, 1);
  view.unmount();
});

test('historia del día conserva acceso, datos y acciones de edición', async () => {
  const props = { clinicName: 'Veterinaria de prueba', allowed: true, isSuperadmin: false, rows: [{ record, pet, ownerName: 'Ana', ticket: { status: 'Pendiente de cobro' }, medications: historyItem.medications }] };
  const markup = await html(DailyHistoryView, props);
  assert.match(markup, /Pacientes que atendiste hoy/);
  assert.match(markup, /Luna/);
  assert.match(markup, /data-action="vet-edit-attention" data-id="clinical1"/);
  const denied = await html(DailyHistoryView, { ...props, allowed: false });
  assert.match(denied, /Esta sección es exclusiva/);
  assert.doesNotMatch(denied, /data-action="vet-edit-attention"/);
});
