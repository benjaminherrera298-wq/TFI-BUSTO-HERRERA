// TP2: separamos las modificaciones de datos del formulario y de la fachada.
// Estas funciones trabajan sobre la base en memoria; la fachada las ejecuta
// dentro del commit existente para conservar el guardado conjunto.
export function saveAttentionRecord({ db, pet, entry, existing, user, data, details, uid, today, time }) {
  const weight = Number(data.weight) || pet.weight;
  if (data.weight) pet.weight = weight;

  const values = {
    ...details.clinical,
    reason: data.reason.trim(),
    diagnosis: data.reason.trim(),
    info: details.performed,
    performed: details.performed,
    medications: details.medications,
    weight,
    temperature: data.temperature || existing?.temperature || ''
  };

  if (existing) {
    Object.assign(existing, values);
    return existing;
  }

  const record = {
    id: uid(),
    petId: pet.id,
    ownerId: pet.ownerId,
    date: today(),
    time,
    type: 'Consulta',
    title: 'Consulta · Sala de espera',
    ...values,
    vetId: user.vetId || null,
    authorId: user.id,
    authorName: user.name,
    visible: true,
    waitingEntryId: entry.id
  };
  db.clinical.push(record);
  return record;
}

export function saveAttentionTicket({ db, pet, entry, existing, user, data, details, record, uid, today, time }) {
  db.tickets = db.tickets || [];
  const values = {
    reason: data.reason.trim(),
    performed: record.performed,
    medications: details.ticketMedications
  };

  // TP2: al editar conservamos el ticket original, su importe y su estado.
  // Si un registro antiguo no tiene ticket, no creamos uno nuevo al editarlo.
  if (existing) {
    const linkedTicket = db.tickets.find(item => item.id === existing.ticketId);
    if (linkedTicket) Object.assign(linkedTicket, values);
    return linkedTicket;
  }

  const ticket = {
    id: uid(),
    number: 'T-' + Date.now().toString(36).toUpperCase(),
    date: today(),
    time,
    petId: pet.id,
    ownerId: pet.ownerId,
    vetId: user.vetId || null,
    vetName: user.name,
    ...values,
    services: [],
    total: 0,
    clinicalId: record.id,
    waitingEntryId: entry.id,
    status: 'Pendiente de cobro'
  };
  db.tickets.push(ticket);
  record.ticketId = ticket.id;
  return ticket;
}

export function updateAttentionWaitingRoom({ entry, existing, record, ticket }) {
  // Editar una atención no vuelve a ingresar al paciente en la sala.
  if (existing) return;
  entry.status = 'Pendiente de cobro';
  entry.ticketId = ticket.id;
  entry.attentionId = record.id;
}

export function saveAttentionReminder({ record, pet, details, upsertCareReminder }) {
  if (!details.isVaccine) {
    Object.assign(record, {
      nextDate: details.reminder.date,
      nextCategory: details.reminder.date ? details.reminder.category : '',
      nextNote: details.reminder.note
    });
  }
  // Reutilizamos la función existente: también elimina el recordatorio
  // de una consulta cuando se deja vacía la próxima fecha.
  upsertCareReminder({ clinicalId: record.id, pet, ...details.reminder });
}
