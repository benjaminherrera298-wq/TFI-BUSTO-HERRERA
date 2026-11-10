import {
  saveAttentionRecord,
  saveAttentionTicket,
  updateAttentionWaitingRoom,
  saveAttentionReminder
} from './attentionRecords.js';
import { clinicalMeasurements, numericValue, realDate } from './validation.js';

// TP2: las validaciones y la preparación de datos no necesitan el DOM.
// Conservamos los campos, mensajes y reglas del registro anterior.
function prepareAttention({ data, medicationFields, attendType, pretty, careCategories, pet }) {
  const measurements = clinicalMeasurements(data);
  if (!data.reason?.trim()) {
    throw new Error('Falta el motivo de consulta del ingreso. Pedí a Administración que lo cargue.');
  }

  const isVaccine = String(data.attType || attendType || 'Consulta') === 'Vacuna';
  if (isVaccine) {
    const vaccineName = String(data.vaccineName || '').trim();
    const vaccineType = String(data.vaccineType || '').trim();
    const vaccineDose = String(data.vaccineDose || '').trim();
    const vaccineLot = String(data.vaccineLot || '').trim();
    const vaccineNext = String(data.vaccineNext || '').trim();
    if (!vaccineName) throw new Error('Ingresá el nombre de la vacuna.');
    if (!vaccineType) throw new Error('Ingresá el tipo de vacuna.');
    if (!vaccineDose) throw new Error('Ingresá la dosis de la vacuna.');
    if (!vaccineLot) throw new Error('Ingresá el lote de la vacuna.');
    if (!vaccineNext) throw new Error('Ingresá la próxima aplicación de la vacuna.');
    realDate(vaccineNext, 'Próxima aplicación');

    return {
      isVaccine, measurements,
      clinical: {
        type: 'Vacuna', title: `Vacuna · ${vaccineName}`,
        vaccineName, vaccineType, vaccineDose, vaccineLot, vaccineNext
      },
      performed: `Vacuna: ${vaccineName} · Tipo: ${vaccineType} · Dosis: ${vaccineDose} · Lote: ${vaccineLot} · Próxima aplicación: ${pretty(vaccineNext)}`,
      medications: [],
      ticketMedications: [{ name: vaccineName, quantity: vaccineDose }],
      reminder: {
        category: 'Vacunación', date: vaccineNext,
        title: `Próxima vacuna ${vaccineName} · ${pet.name}`, note: ''
      }
    };
  }

  const clinical = {
    attObservations: String(data.attObservations || '').trim(),
    attProcedures: String(data.attProcedures || '').trim(),
    attTreatments: String(data.attTreatments || '').trim(),
    attIndications: String(data.attIndications || '').trim(),
    attRecommendations: String(data.attRecommendations || '').trim()
  };
  if (!Object.values(clinical).some(Boolean)) {
    throw new Error('Completá al menos un ítem de la atención (observaciones, procedimientos, tratamientos, indicaciones o recomendaciones).');
  }
  const labels = ['Observaciones', 'Procedimientos', 'Tratamientos', 'Indicaciones', 'Recomendaciones'];
  const performed = Object.values(clinical)
    .map((value, index) => value ? `${labels[index]}: ${value}` : '')
    .filter(Boolean).join('\n');
  const medications = medicationFields.names.map((name, index) => ({
    name: (name || '').trim(),
    dose: (medicationFields.doses[index] || '').trim(),
    quantity: (medicationFields.quantities[index] || '').trim(),
    route: (medicationFields.routes[index] || '').trim(),
    notes: (medicationFields.notes[index] || '').trim()
  })).filter(medication => medication.name);
  for (const medication of medications) {
    medication.quantity = String(numericValue(medication.quantity, `Cantidad de ${medication.name}`, { min: 1, max: 1_000_000, integer: true }));
  }
  realDate(data.nextDate, 'Próximo cuidado', { optional: true });
  const nextCategory = careCategories.some(item => item[0] === data.nextCategory)
    ? data.nextCategory : 'Control';

  return {
    isVaccine, measurements, clinical, performed, medications,
    ticketMedications: medications.map(medication => ({ ...medication })),
    reminder: {
      category: nextCategory,
      date: String(data.nextDate || '').trim(),
      title: `${nextCategory} · ${pet.name}`,
      note: String(data.nextNote || '').trim()
    }
  };
}

// TP2 — Facade: el formulario usa una sola operación y no coordina los
// registros internos. Pasamos las dependencias explícitamente para poder
// probar el flujo sin pantallas ni localStorage y usar la base actual.
export function createAttentionFacade({ commit, uid, today, pretty, careCategories, upsertCareReminder }) {
  function registrarAtencion(input) {
    const { db, pet, entry, existing, user } = input;
    if (!['vet', 'superadmin'].includes(user.role)) throw new Error('No tenés permiso para registrar atenciones.');
    if (existing) {
      if (!db.clinical.includes(existing) || existing.petId !== pet.id || (user.role === 'vet' && existing.vetId !== user.vetId)) {
        throw new Error('No podés editar esta atención.');
      }
    } else {
      if (!entry || !db.waitingRoom.includes(entry) || entry.petId !== pet.id || !['Esperando', 'En atención'].includes(entry.status) || db.clinical.some(record => record.waitingEntryId === entry.id) || db.tickets.some(ticket => ticket.waitingEntryId === entry.id)) {
        throw new Error('Este ingreso ya fue atendido o no está disponible.');
      }
      if (user.role === 'vet' && entry.vetId && entry.vetId !== user.vetId) throw new Error('Otro veterinario está atendiendo a este paciente.');
    }
    const details = prepareAttention({ ...input, pretty, careCategories });
    const context = {
      ...input, details, uid, today, upsertCareReminder,
      time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    };

    // La fachada solo coordina. Las modificaciones están en attentionRecords.
    // Un único commit conserva el guardado y la restauración si falla,
    // igual que antes; no se persiste cada registro por separado.
    const ok = commit(() => {
      context.db.tickets = context.db.tickets || [];
      const record = saveAttentionRecord(context);
      const ticket = saveAttentionTicket({ ...context, record });
      updateAttentionWaitingRoom({ ...context, record, ticket });
      saveAttentionReminder({ ...context, record });
    });
    return { ok, isVaccine: details.isVaccine };
  }

  return { registrarAtencion };
}
