import {
  saveAttentionRecord,
  saveAttentionTicket,
  updateAttentionWaitingRoom,
  saveAttentionReminder
} from './attentionRecords.js';
import { clinicalMeasurements, numericValue, realDate } from './validation.js';

const CONSULTATION_FIELDS = [
  { name: 'attObservations', label: 'Observaciones' },
  { name: 'attProcedures', label: 'Procedimientos' },
  { name: 'attTreatments', label: 'Tratamientos' },
  { name: 'attIndications', label: 'Indicaciones' },
  { name: 'attRecommendations', label: 'Recomendaciones' }
];

function prepareAttention({ attentionData, medicationFields, attendType, formatDate, careCategories, pet }) {
  const measurements = clinicalMeasurements(attentionData);
  if (!attentionData.reason?.trim()) {
    throw new Error('Falta el motivo de consulta del ingreso. Pedí a Administración que lo cargue.');
  }

  const isVaccine = String(attentionData.attType || attendType || 'Consulta') === 'Vacuna';

  if (isVaccine) {
    return {
      isVaccine,
      measurements,
      ...prepareVaccine({ attentionData, formatDate, pet })
    };
  }

  return {
    isVaccine,
    measurements,
    ...prepareConsultation({ attentionData, medicationFields, careCategories, pet })
  };
}

function prepareVaccine({ attentionData, formatDate, pet }) {
  const vaccineName = String(attentionData.vaccineName || '').trim();
  const vaccineType = String(attentionData.vaccineType || '').trim();
  const vaccineDose = String(attentionData.vaccineDose || '').trim();
  const vaccineLot = String(attentionData.vaccineLot || '').trim();
  const vaccineNext = String(attentionData.vaccineNext || '').trim();

  if (!vaccineName) throw new Error('Ingresá el nombre de la vacuna.');
  if (!vaccineType) throw new Error('Ingresá el tipo de vacuna.');
  if (!vaccineDose) throw new Error('Ingresá la dosis de la vacuna.');
  if (!vaccineLot) throw new Error('Ingresá el lote de la vacuna.');
  if (!vaccineNext) throw new Error('Ingresá la próxima aplicación de la vacuna.');
  realDate(vaccineNext, 'Próxima aplicación');

  return {
    clinical: {
      type: 'Vacuna',
      title: `Vacuna · ${vaccineName}`,
      vaccineName,
      vaccineType,
      vaccineDose,
      vaccineLot,
      vaccineNext
    },
    performed: `Vacuna: ${vaccineName} · Tipo: ${vaccineType} · Dosis: ${vaccineDose} · Lote: ${vaccineLot} · Próxima aplicación: ${formatDate(vaccineNext)}`,
    medications: [],
    ticketMedications: [{ name: vaccineName, quantity: vaccineDose }],
    reminder: {
      category: 'Vacunación',
      date: vaccineNext,
      title: `Próxima vacuna ${vaccineName} · ${pet.name}`,
      note: ''
    }
  };
}

function prepareConsultation({ attentionData, medicationFields, careCategories, pet }) {
  const clinical = {};
  const descriptions = [];

  for (const { name, label } of CONSULTATION_FIELDS) {
    const value = String(attentionData[name] || '').trim();
    clinical[name] = value;
    if (value) descriptions.push(`${label}: ${value}`);
  }

  if (!Object.values(clinical).some(Boolean)) {
    throw new Error('Completá al menos un ítem de la atención (observaciones, procedimientos, tratamientos, indicaciones o recomendaciones).');
  }

  const performed = descriptions.join('\n');
  const medications = prepareMedications(medicationFields);
  realDate(attentionData.nextDate, 'Próximo cuidado', { optional: true });
  const nextCategory = careCategories.some(item => item[0] === attentionData.nextCategory)
    ? attentionData.nextCategory
    : 'Control';

  return {
    clinical,
    performed,
    medications,
    ticketMedications: medications.map(medication => ({ ...medication })),
    reminder: {
      category: nextCategory,
      date: String(attentionData.nextDate || '').trim(),
      title: `${nextCategory} · ${pet.name}`,
      note: String(attentionData.nextNote || '').trim()
    }
  };
}

function prepareMedications(medicationFields) {
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

  return medications;
}

// TP2 — Facade: el formulario usa una sola operación y no coordina los
// registros internos. Pasamos las dependencias explícitamente para poder
// probar el flujo sin pantallas ni localStorage y usar la base actual.
export function createAttentionFacade({ commit, uid, today, formatDate, careCategories, upsertCareReminder }) {
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
    const details = prepareAttention({
      attentionData: input.data,
      medicationFields: input.medicationFields,
      attendType: input.attendType,
      formatDate,
      careCategories,
      pet: input.pet
    });
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
