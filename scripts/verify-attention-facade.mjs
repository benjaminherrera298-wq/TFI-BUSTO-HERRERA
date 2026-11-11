// TP2: pruebas del flujo sin navegador. Ejecutar:
// node scripts/verify-attention-facade.mjs
import assert from 'node:assert/strict';
import { createAttentionFacade } from '../src/services/attentionFacade.js';

function scenario({ vaccine = false, failSave = false, formatDate = value => value } = {}) {
  let sequence = 0;
  const db = {
    pets: [{ id: 'p1', ownerId: 'o1', name: 'Luna', weight: 5 }],
    clinical: [], tickets: [], reminders: [],
    waitingRoom: [{ id: 'w1', petId: 'p1', status: 'En espera' }]
  };
  const input = {
    db, pet: db.pets[0], entry: db.waitingRoom[0], existing: null,
    user: { id: 'u1', vetId: 'v1', name: 'Veterinaria' },
    attendType: 'Consulta',
    data: vaccine
      ? { reason: 'Vacunación', attType: 'Vacuna', vaccineName: 'Antirrábica',
          vaccineType: 'Anual', vaccineDose: '1 ml', vaccineLot: 'L1', vaccineNext: '2027-10-23' }
      : { reason: 'Control', attObservations: 'Buen estado', weight: '6',
          nextDate: '2026-11-23', nextCategory: 'Control', nextNote: 'Revisar peso' },
    medicationFields: {
      names: ['Medicación', ''], doses: ['1 ml'], quantities: ['2'],
      routes: ['Oral'], notes: ['Con alimento']
    }
  };
  let commits = 0;
  const facade = createAttentionFacade({
    uid: () => `id-${++sequence}`,
    today: () => '2026-10-23', formatDate,
    careCategories: [['Control']],
    // Simula el contrato del commit actual, incluida la restauración.
    commit(callback) {
      commits++;
      const before = structuredClone(db);
      callback();
      if (failSave) {
        for (const key of Object.keys(db)) delete db[key];
        Object.assign(db, before);
        return false;
      }
      return true;
    },
    // Doble del servicio existente: verifica lo que la fachada le entrega.
    upsertCareReminder(values) {
      const index = db.reminders.findIndex(item => item.clinicalId === values.clinicalId);
      if (!values.date) {
        if (index >= 0) db.reminders.splice(index, 1);
      } else if (index >= 0) {
        Object.assign(db.reminders[index], values);
      } else {
        db.reminders.push(values);
      }
    }
  });
  return { db, input, facade, commits: () => commits };
}

for (const vaccine of [false, true]) {
  const { db, input, facade, commits } = scenario({ vaccine });
  assert.deepEqual(facade.registrarAtencion(input), { ok: true, isVaccine: vaccine });
  assert.equal(commits(), 1);
  assert.equal(db.clinical.length, 1);
  assert.equal(db.tickets.length, 1);
  assert.equal(db.reminders.length, 1);
  const record = db.clinical[0];
  const ticket = db.tickets[0];
  assert.equal(record.type, vaccine ? 'Vacuna' : 'Consulta');
  assert.equal(record.ticketId, ticket.id);
  assert.equal(ticket.clinicalId, record.id);
  assert.equal(db.waitingRoom[0].attentionId, record.id);
  assert.equal(db.waitingRoom[0].ticketId, ticket.id);
  assert.equal(db.waitingRoom[0].status, 'Pendiente de cobro');
  assert.equal(db.reminders[0].clinicalId, record.id);
  assert.equal(ticket.performed, record.performed);
  assert.equal(record.authorId, 'u1');
  assert.equal(record.weight, vaccine ? 5 : 6);
  assert.equal(record.medications.length, vaccine ? 0 : 1);
  assert.equal(ticket.medications[0].quantity, vaccine ? '1 ml' : '2');
  if (!vaccine) {
    assert.equal(record.performed, 'Observaciones: Buen estado');
    assert.equal(record.medications[0].route, 'Oral');
    assert.notEqual(record.medications[0], ticket.medications[0]);
  }

  // Editar conserva identificadores, autor, fecha, cobro y estado de sala.
  ticket.total = 15000;
  ticket.status = 'Cobrado';
  db.waitingRoom[0].status = 'Finalizado';
  input.existing = record;
  input.entry = null;
  input.data.reason = 'Motivo corregido';
  input.data.nextDate = '';
  input.data.vaccineNext = '2028-10-23';
  facade.registrarAtencion(input);
  assert.equal(db.clinical.length, 1);
  assert.equal(db.tickets.length, 1);
  assert.equal(ticket.total, 15000);
  assert.equal(ticket.status, 'Cobrado');
  assert.equal(db.waitingRoom[0].status, 'Finalizado');
  assert.equal(ticket.reason, 'Motivo corregido');
  assert.equal(db.reminders.length, vaccine ? 1 : 0);
  if (vaccine) assert.equal(db.reminders[0].date, '2028-10-23');

  // Un registro antiguo sin ticket sigue siendo editable sin crear otro.
  db.tickets = [];
  delete record.ticketId;
  facade.registrarAtencion(input);
  assert.equal(db.tickets.length, 0);
}

for (const vaccine of [false, true]) {
  const { db, input, facade } = scenario({ vaccine, failSave: true });
  const before = structuredClone(db);
  assert.equal(facade.registrarAtencion(input).ok, false);
  assert.deepEqual(db, before);
}

for (const field of ['vaccineName', 'vaccineType', 'vaccineDose', 'vaccineLot', 'vaccineNext']) {
  const { db, input, facade, commits } = scenario({ vaccine: true });
  input.data[field] = ' ';
  const before = structuredClone(db);
  assert.throws(() => facade.registrarAtencion(input), /Ingresá/);
  assert.equal(commits(), 0);
  assert.deepEqual(db, before);
}

for (const missingReason of [false, true]) {
  const { db, input, facade, commits } = scenario();
  if (missingReason) input.data.reason = ' ';
  else input.data.attObservations = ' ';
  const before = structuredClone(db);
  assert.throws(() => facade.registrarAtencion(input), missingReason ? /motivo/ : /al menos un ítem/);
  assert.equal(commits(), 0);
  assert.deepEqual(db, before);
}

// TP3: verificamos el resultado completo antes y después del refactor.
{
  const { db, input, facade } = scenario();
  Object.assign(input.data, {
    attObservations: '  Buen estado  ',
    attProcedures: '  Limpieza  ',
    attTreatments: '  Tratamiento indicado  ',
    attIndications: '  Reposo  ',
    attRecommendations: '  Volver al control  ',
    nextCategory: 'Categoría inexistente',
    nextNote: '  Revisar peso  '
  });

  facade.registrarAtencion(input);

  const expectedSummary = [
    'Observaciones: Buen estado',
    'Procedimientos: Limpieza',
    'Tratamientos: Tratamiento indicado',
    'Indicaciones: Reposo',
    'Recomendaciones: Volver al control'
  ].join('\n');

  assert.equal(db.clinical[0].performed, expectedSummary);
  assert.equal(db.tickets[0].performed, expectedSummary);
  assert.equal(db.reminders[0].category, 'Control');
  assert.equal(db.reminders[0].title, 'Control · Luna');
  assert.equal(db.reminders[0].note, 'Revisar peso');
}

{
  const { db, input, facade } = scenario();
  input.data.attObservations = ' ';
  input.data.attTreatments = '  Tratamiento indicado  ';
  input.data.nextDate = '';
  input.medicationFields = {
    names: [' ', '  Medicación  '],
    doses: ['', '  1 ml  '],
    quantities: ['ignorada', '  2  '],
    routes: ['', '  Oral  '],
    notes: ['', '  Con alimento  ']
  };

  facade.registrarAtencion(input);

  const expectedMedication = {
    name: 'Medicación',
    dose: '1 ml',
    quantity: '2',
    route: 'Oral',
    notes: 'Con alimento'
  };

  assert.equal(db.clinical[0].performed, 'Tratamientos: Tratamiento indicado');
  assert.equal(db.reminders.length, 0);
  assert.deepEqual(db.clinical[0].medications, [expectedMedication]);
  assert.deepEqual(db.tickets[0].medications, [expectedMedication]);
  db.clinical[0].medications[0].notes = 'Cambio posterior';
  assert.equal(db.tickets[0].medications[0].notes, 'Con alimento');
}

{
  const { db, input, facade } = scenario({
    vaccine: true,
    formatDate: value => `Fecha ${value}`
  });
  delete input.data.attType;
  input.attendType = 'Vacuna';
  Object.assign(input.data, {
    vaccineName: '  Antirrábica  ',
    vaccineType: '  Anual  ',
    vaccineDose: '  1 ml  ',
    vaccineLot: '  L1  ',
    vaccineNext: '  2027-10-23  ',
    attObservations: ' '
  });

  facade.registrarAtencion(input);

  assert.equal(
    db.clinical[0].performed,
    'Vacuna: Antirrábica · Tipo: Anual · Dosis: 1 ml · Lote: L1 · Próxima aplicación: Fecha 2027-10-23'
  );
  assert.deepEqual(db.clinical[0].medications, []);
  assert.deepEqual(db.tickets[0].medications, [
    { name: 'Antirrábica', quantity: '1 ml' }
  ]);
  assert.equal(db.reminders[0].title, 'Próxima vacuna Antirrábica · Luna');
}

console.log('OK: consultas, vacunas, edición, vínculos, recordatorios, etiquetas, medicamentos y fallo de guardado.');
