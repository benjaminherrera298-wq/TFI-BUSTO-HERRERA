import { createAttentionFacade } from './attentionFacade.js';
import { realDate, requiredText, clinicalMeasurements } from './validation.js';
import { today } from '../utils/dates.js';
import { CARE_CATEGORIES, careCategoryFromText } from './agendaService.js';
export function normMeds(value) {
  if (Array.isArray(value)) {
    return value.map(item =>
      typeof item === 'string' ? { name: item } : (item || {})
    );
  }

  if (typeof value === 'string' && value.trim()) {
    return [{ name: value.trim() }];
  }

  return [];
}

export function createClinicalService({ state, uid, find, canPet, isAdmin, commit, load, pretty, upsertCareReminder }) {
  function waitingRoomList() {
    return (state.db.waitingRoom || [])
    .slice()
    .sort((a, b) => b.enteredAt.localeCompare(a.enteredAt));
  }

  function waitingEntry(petId) {
    return (state.db.waitingRoom || []).find(
      entry => entry.petId === petId && entry.status === 'Esperando'
    );
  }

  function activeEntry(petId) {
    return (state.db.waitingRoom || []).find(
      entry => entry.petId === petId &&
      (entry.status === 'Esperando' || entry.status === 'En atención')
    );
  }

  function waitingRoomPending() {
    return waitingRoomList().filter(
      entry => entry.status === 'Esperando' || entry.status === 'En atención'
    );
  }

  function waitingRoomActive() {
    return waitingRoomList().filter(entry => entry.status !== 'Pagado');
  }

  function dedupeWaitingRoom() {
    if (!state.db.configured || !Array.isArray(state.db.waitingRoom)) return false;

    const before = state.db.waitingRoom.length;

    const rank = entry =>
    entry.status === 'Pendiente de cobro'
    ? 3
    : entry.status === 'En atención'
    ? 2
    : entry.status === 'Esperando'
    ? 1
    : 0;

    const byPet = new Map();

    state.db.waitingRoom.forEach(entry => {
      if (!byPet.has(entry.petId)) byPet.set(entry.petId, []);

      byPet.get(entry.petId).push(entry);
    });

    const kept = [];

    byPet.forEach(entries => {
      // Solo se deduplican los ingresos EN SALA. Los pendientes de cobro
      // (visitas ya atendidas, a la espera de cobro) y los pagados se
      // conservan siempre tal cual.
      const room = entries.filter(entry =>
        entry.status === 'Esperando' || entry.status === 'En atención'
      );
      const rest = entries.filter(entry =>
        entry.status !== 'Esperando' && entry.status !== 'En atención'
      );

      kept.push(...rest);

      if (room.length <= 1) {
        kept.push(...room);
        return;
      }

      room.sort((a, b) =>
        rank(b) - rank(a) ||
        String(a.enteredAt).localeCompare(String(b.enteredAt))
      );

      const [winner, ...dupes] = room;
      kept.push(winner);

      dupes.forEach(entry => {
        (state.db.tickets || []).forEach(ticketItem => {
          if (ticketItem.waitingEntryId === entry.id) {
            ticketItem.waitingEntryId = winner.id;
          }
        });

        (state.db.clinical || []).forEach(record => {
          if (record.waitingEntryId === entry.id) {
            record.waitingEntryId = winner.id;
          }
        });

        if (!winner.ticketId && entry.ticketId) {
          winner.ticketId = entry.ticketId;
        }

        if (!winner.attentionId && entry.attentionId) {
          winner.attentionId = entry.attentionId;
        }
      });
    });

    state.db.waitingRoom = kept;

    return state.db.waitingRoom.length !== before;
  }

  function notifyVetsWaitingEntry({ pet, reason, waitingEntryId }) {
    state.db.notifications = state.db.notifications || [];

    const vets = (state.db.vets || []).filter(vet => vet.active);
    const owner = (state.db.owners || []).find(item => item.id === pet.ownerId);
    const cleanReason = String(reason || '').trim() || '—';
    const message =
    `Nueva mascota en sala de espera: ${pet.name}` +
    `${pet.species ? ' (' + pet.species : ''}` +
    `${pet.breed ? ' · ' + pet.breed : ''}` +
    `${pet.species ? ')' : ''}` +
    ` · Motivo: ${cleanReason}` +
    ` · Propietario: ${owner?.name || 'No disponible'}.`;

    vets.forEach(vet => {
      state.db.notifications.push({
        id: uid(),
        message,
        ownerId: null,
        vetId: vet.id,
        date: new Date().toISOString(),
        readBy: [],
        kind: 'waiting-room',
        waitingEntryId: waitingEntryId || null,
        petId: pet.id
      });
    });
  }

  function saveClinicalRecord(petId, data) {
    if (state.user.role === 'owner') return;

    const pet = find('pets', petId);

    if (!canPet(pet)) return;

    data.date = realDate(data.date, 'Fecha de atención', { latest: today() });
    data.title = requiredText(data.title, 'Título');
    data.info = requiredText(data.info, 'Información clínica', 10000);
    const measurements = clinicalMeasurements(data);
    data.weight = measurements.weight ?? '';
    data.nextDate = realDate(data.nextDate, 'Próximo cuidado', { optional: true });

    if (!data.info.trim()) {
      throw new Error('Ingresá la información clínica.');
    }

    const newClinicalId = uid();

    if (commit(() => {
      state.db.clinical.push({
        ...data,
        id: newClinicalId,
        petId,
        weight: Number(data.weight) || pet.weight,
        visible: data.visible === 'true',
        authorId: state.user.id,
        authorName: state.user.name,
        vetId: state.user.vetId || null
      });

      if (data.weight) {
        pet.weight = Number(data.weight);
      }

      if (data.nextDate) {
        upsertCareReminder({
          clinicalId: newClinicalId,
          pet,
          category: CARE_CATEGORIES.some(entry => entry[0] === data.nextCategory)
          ? data.nextCategory
          : careCategoryFromText(data.type + ' ' + data.title),
          date: data.nextDate,
          title: data.title + ' · ' + pet.name,
          note: ''
        });
      }

    })) {
      return petId;
    }
  }

  function saveAttention({ entryId, clinicalId, data, attendType, medicationFields }) {
    if (state.user.role !== 'vet' && state.user.role !== 'superadmin') return;
    load();

    const entry = entryId
    ? (state.db.waitingRoom || []).find(item => item.id === entryId)
    : null;

    const existing = clinicalId ? find('clinical', clinicalId) : null;

    if (clinicalId && !existing) throw new Error('La atención ya no está disponible.');
    if (entryId && clinicalId) throw new Error('Seleccioná un ingreso o una atención para editar.');

    if (!entry && !existing) {
      throw new Error('La atención no está disponible.');
    }

    const pet = find('pets', entry?.petId || existing?.petId);

    if (!pet || !canPet(pet)) {
      throw new Error('Mascota no disponible.');
    }

    // TP2: el formulario entrega los datos a Facade y solo maneja la pantalla.
    // La fachada coordina historia clínica, ticket, sala y recordatorio.
    // Se crea con las dependencias actuales; la base se entrega en cada llamada.
    const attentionFacade = createAttentionFacade({
      commit, uid, today, formatDate: pretty,
      careCategories: CARE_CATEGORIES,
      upsertCareReminder
    });
    const result = attentionFacade.registrarAtencion({
      db: state.db, user: state.user, pet, entry, existing, data, attendType,
      medicationFields
    });

    return { ...result, existing };
  }

  function cancelEntry(id) {
    if (!isAdmin()) return;

    const entry = (state.db.waitingRoom || []).find(item => item.id === id);

    if (!entry) return;

    if (commit(() => {
      state.db.waitingRoom = state.db.waitingRoom.filter(item => item.id !== id);
    })) {
      return true;
    }
  }

  function releaseEntry(id) {
    if (!isAdmin()) return;

    const entry = (state.db.waitingRoom || []).find(item => item.id === id);

    if (!entry || entry.status !== 'En atención') return;

    if (commit(() => {
      entry.status = 'Esperando';
      delete entry.vetId;
      entry.vetName = '';
    })) {
      return true;
    }
  }
  function addEntry(petId, value) {
    if (!isAdmin()) throw new Error('No tenés permiso.');
    const pet = find('pets', petId);
    if (!pet) throw new Error('Mascota no disponible.');
    const reason = String(value || '').trim();
    if (!reason) throw new Error('Ingresá el motivo de consulta informado al llegar.');
    if (activeEntry(pet.id)) return { duplicate: true, pet };
    if (commit(() => {
      state.db.waitingRoom = state.db.waitingRoom || [];
      const entryId = uid();
      state.db.waitingRoom.push({ id: entryId, petId: pet.id, ownerId: pet.ownerId, petName: pet.name, enteredAt: new Date().toISOString(), status: 'Esperando', reason });
      notifyVetsWaitingEntry({ pet, reason, waitingEntryId: entryId });
    })) return { duplicate: false, pet };
  }

  function updateEntryReason(id, value) {
    if (!isAdmin()) throw new Error('No tenés permiso.');
    const entry = (state.db.waitingRoom || []).find(item => item.id === id);
    if (!entry) throw new Error('Ingreso no disponible.');
    const reason = String(value || '').trim();
    if (!reason) throw new Error('Ingresá el motivo de consulta informado al llegar.');
    return commit(() => { entry.reason = reason; });
  }

  function clearPaidEntries() {
    if (!isAdmin()) return;
    return commit(() => { state.db.waitingRoom = (state.db.waitingRoom || []).filter(item => item.status !== 'Pagado'); });
  }

  function takeEntry(id) {
    if (state.user.role !== 'vet' && state.user.role !== 'superadmin') return;
    load();
    const entry = (state.db.waitingRoom || []).find(item => item.id === id);
    if (!entry || !['Esperando', 'En atención'].includes(entry.status)) return { unavailable: true };
    if (state.user.role === 'vet' && entry.vetId && entry.vetId !== state.user.vetId) throw new Error('Otro veterinario está atendiendo a este paciente.');
    if (commit(() => { entry.status = 'En atención'; entry.vetId = state.user.vetId || null; entry.vetName = state.user.name; })) return { entry };
  }

  function editableAttention(id) {
    if (state.user.role !== 'vet' && state.user.role !== 'superadmin') return;
    const record = find('clinical', id);
    if (!record || (state.user.role === 'vet' && record.vetId !== state.user.vetId)) throw new Error('No podés editar esta atención.');
    return record;
  }
  return { waitingRoomList, waitingEntry, activeEntry, waitingRoomPending, waitingRoomActive, dedupeWaitingRoom, notifyVetsWaitingEntry, saveClinicalRecord, saveAttention, cancelEntry, releaseEntry, addEntry, updateEntryReason, clearPaidEntries, takeEntry, editableAttention };
}
