import { realDate } from './validation.js';
import { localDate, today, validAgendaDate } from '../utils/dates.js';
export const CARE_CATEGORIES = [
  ['Vacunación', '#99c6cb'],
  ['Desparasitación', '#76bca9'],
  ['Pipeta', '#7ab2c6'],
  ['Operación', '#b5cfd1'],
  ['Control', '#88aabd'],
  ['Otro', '#9cafb8']
];

export function careColor(category) {
  return (CARE_CATEGORIES.find(item => item[0] === category) || CARE_CATEGORIES[5])[1];
}

export function careCategoryFromText(text) {
  const t = String(text || '').toLowerCase();

  if (/vacun/.test(t)) return 'Vacunación';
  if (/desparasit/.test(t)) return 'Desparasitación';
  if (/pipeta|antipulga/.test(t)) return 'Pipeta';
  if (/operaci|cirug|castraci|esteriliz/.test(t)) return 'Operación';
  if (/control|chequeo|revisi/.test(t)) return 'Control';

  return 'Otro';
}

export function reminderCategory(reminder) {
  return CARE_CATEGORIES.some(item => item[0] === reminder.category)
  ? reminder.category
  : careCategoryFromText(reminder.title);
}

export function createAgendaService({ state, find, canPet, canUsePersonalAgenda, uid, commit }) {
  function upsertCareReminder({ clinicalId, pet, category, date, title, note }) {
    state.db.reminders = state.db.reminders || [];

    const index = state.db.reminders.findIndex(reminder =>
      reminder.clinicalId === clinicalId && reminder.source === 'vet'
    );

    if (!date) {
      if (index >= 0) state.db.reminders.splice(index, 1);
      return;
    }

    const values = {
      petId: pet.id,
      title,
      date,
      category,
      note: note || '',
      source: 'vet',
      clinicalId,
      createdBy: state.user?.name || ''
    };

    if (index >= 0) {
      const current = state.db.reminders[index];
      const moved = current.date !== date;
      Object.assign(current, values, { done: moved ? false : !!current.done });
    } else {
      state.db.reminders.push({ id: uid(), done: false, ...values });
    }
  }

  function ownerCalItems() {
    // Agenda del propietario: solo cuidados (recordatorios del
    // veterinario + propios).
    const items = reminderList().map(reminder => ({
      kind: reminder.source === 'owner' ? 'owner' : 'vet',
      id: reminder.id,
      date: reminder.date,
      time: '',
      title: reminder.title,
      category: reminderCategory(reminder),
      petId: reminder.petId,
      done: !!reminder.done,
      note: reminder.note || '',
      by: reminder.createdBy || ''
    }));

    return items.sort((a, b) =>
      a.date.localeCompare(b.date) ||
      (a.time || '').localeCompare(b.time || '')
    );
  }

  function personalAgendaEntries() {
    if (!canUsePersonalAgenda()) return [];
    return state.db.agendaNotes.filter(entry => entry.userId === state.user.id).slice().sort((a, b) =>
      a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '') || a.title.localeCompare(b.title)
    );
  }

  function personalAgendaEntry(id) {
    return personalAgendaEntries().find(entry => entry.id === id);
  }

  function reminderList() {
    return state.db.reminders
    .filter(reminder => canPet(find('pets', reminder.petId)))
    .sort((a, b) => a.date.localeCompare(b.date));
  }

  function saveNote(id, data) {
    if (!canUsePersonalAgenda()) return;

    const existing = id ? personalAgendaEntry(id) : null;
    if (id && !existing) throw new Error('No podés editar esta anotación.');
    const title = String(data.title || '').trim();
    const date = String(data.date || '');
    const time = String(data.time || '');
    const note = String(data.note || '').trim();
    if (!title || title.length > 160) throw new Error('Ingresá un título de hasta 160 caracteres.');
    if (!validAgendaDate(date)) throw new Error('Elegí una fecha válida.');
    if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Ingresá una hora válida.');
    if (commit(() => {
      if (existing) {
        Object.assign(existing, { title, date, time, note, updatedAt: new Date().toISOString() });
      } else {
        state.db.agendaNotes.push({ id: uid(), userId: state.user.id, title, date, time, note, done: false, createdAt: new Date().toISOString() });
      }
    })) {
      return date;
    }
  }

  function saveOwnerReminder(reminderId, data) {
    if (state.user.role !== 'owner') return;

    const pet = find('pets', data.petId);

    if (!pet || !canPet(pet) || !pet.active) {
      throw new Error('Elegí una de tus mascotas.');
    }

    data.date = realDate(data.date);

    const category = CARE_CATEGORIES.some(entry => entry[0] === data.category)
    ? data.category
    : 'Otro';

    const existing = reminderId
    ? state.db.reminders.find(item =>
      item.id === reminderId &&
      item.source === 'owner' &&
      canPet(find('pets', item.petId))
    )
    : null;

    if (reminderId && !existing) {
      throw new Error('No podés editar este recordatorio.');
    }

    const title = String(data.title || '').trim() || `${category} · ${pet.name}`;
    const note = String(data.note || '').trim();

    if (commit(() => {
      if (existing) {
        const moved = existing.date !== data.date;
        Object.assign(existing, {
          petId: pet.id,
          title,
          category,
          date: data.date,
          note,
          done: moved ? false : existing.done
        });
      } else {
        state.db.reminders.push({
          id: uid(),
          petId: pet.id,
          title,
          category,
          date: data.date,
          note,
          source: 'owner',
          done: false
        });
      }
    })) {
      return data.date;
    }
  }

  function toggleNote(id) {
    const entry = personalAgendaEntry(id);
    if (!entry) return;
    if (commit(() => { entry.done = !entry.done; })) {
      return entry;
    }
  }

  function deleteNote(id) {
    const entry = personalAgendaEntry(id);
    if (!entry) return;
    if (commit(() => { state.db.agendaNotes = state.db.agendaNotes.filter(item => item !== entry); })) {
      return true;
    }
  }

  function deleteOwnerReminder(id) {
    if (state.user.role !== 'owner') return;

    const target = state.db.reminders.find(item =>
      item.id === id &&
      item.source === 'owner' &&
      canPet(find('pets', item.petId))
    );

    if (target && commit(() => {
      state.db.reminders = state.db.reminders.filter(item => item.id !== id);
    })) {
      return true;
    }
  }
  function toggleReminder(id) {
    if (state.user.role === 'owner') return false;
    return commit(() => {
      const reminder = reminderList().find(item => item.id === id);
      if (reminder) reminder.done = !reminder.done;
    });
  }
  return { upsertCareReminder, ownerCalItems, personalAgendaEntries, personalAgendaEntry, reminderList, saveNote, saveOwnerReminder, toggleNote, deleteNote, deleteOwnerReminder, toggleReminder };
}
