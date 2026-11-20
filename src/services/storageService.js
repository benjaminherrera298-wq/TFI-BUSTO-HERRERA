import { populateSamplePractice } from '../data/samplePractice.js';
import { DEMO_ACCOUNTS } from '../data/demoAccounts.js';

export const STORAGE_KEY = 'veterinaria-prototipo-v1';

export const browserStorage = {
  getItem: key => globalThis.localStorage.getItem(key),
  setItem: (key, value) => globalThis.localStorage.setItem(key, value),
  removeItem: key => globalThis.localStorage.removeItem(key)
};

export function createStorageService({ state, seed, ensurePetCodes, dedupeWaitingRoom, careCategoryFromText, normMeds, onError, storage = browserStorage }) {
  const KEY = STORAGE_KEY;
  const toast = onError;

  function persist() {
    try {
      storage.setItem(KEY, JSON.stringify(state.db));
      return true;
    } catch (error) {
      toast(
        'No se pudo guardar. Revisá el espacio disponible o los permisos del navegador.'
      );
      return false;
    }
  }

  function commit(callback) {
    const before = JSON.stringify(state.db);
    callback();

    if (persist()) return true;

    state.db = JSON.parse(before);
    return false;
  }

  async function withDataLock(callback) {
    if (globalThis.navigator?.locks?.request) return navigator.locks.request(KEY, callback);
    return callback();
  }

  function load() {
    try {
      state.db = JSON.parse(storage.getItem(KEY)) || { configured: false };
    } catch {
      state.db = { configured: false };
    }

    if (!state.db.configured) {
      state.db = seed({
        name: 'Veterinaria Los Aromos', identifier: '20301234567',
        address: 'Av. Belgrano 1250, San Miguel de Tucumán', phone: '3815550199',
        email: 'recepcion@example.com', days: [1, 2, 3, 4, 5, 6],
        start: '08:00', end: '20:00', duration: 30, logo: ''
        }, DEMO_ACCOUNTS[0]);
    }
    if (populateSamplePractice(state.db)) persist();

    // Migración: bases guardadas antes de conectar el panel del veterinario
    // con la sala de espera puede que no tengan estas colecciones todavía.
    if (state.db.configured) {
      state.db.waitingRoom = state.db.waitingRoom || [];
      state.db.tickets = state.db.tickets || [];
      state.db.agendaNotes = Array.isArray(state.db.agendaNotes) ? state.db.agendaNotes : [];

      // Actualiza solo textos de demostración del antiguo sistema de reservas.
      (state.db.services || []).forEach(service => {
        if (service.description === 'Atención con turno previo.') {
          service.description = 'Atención en la veterinaria.';
        }
      });
      (state.db.notices || []).forEach(notice => {
        if (notice.id === 'sample-notice' && notice.title === 'Controles preventivos con turno') {
          notice.title = 'Controles preventivos';
          notice.message = 'Acercate a la veterinaria o comunicate con recepción para consultar por los controles de tu mascota.';
        }
        if (notice.message === 'Ya podés consultar la información de tus mascotas y solicitar turnos desde tu cuenta.') {
          notice.message = 'Ya podés consultar la información de tus mascotas y sus próximos cuidados desde tu cuenta.';
        }
      });

      // Migración: los tickets generados antes del monto a cobrar pueden no
      // tener `total`; se inicializa en 0 (se muestra como "A definir").
      state.db.tickets.forEach(ticketItem => {
        if (!Number.isFinite(Number(ticketItem.total))) {
          ticketItem.total = 0;
        }
      });

      // Migración: ingresos a sala creados antes del motivo de consulta.
      // Se inicializa en '' para que el veterinario lo vea vacío y el
      // administrador pueda cargarlo con "Editar motivo".
      state.db.waitingRoom.forEach(entry => {
        if (typeof entry.reason !== 'string') {
          entry.reason = '';
        }
      });

      // Migración: recordatorios anteriores a las categorías del calendario.
      // Se deduce la categoría del título y se marca su origen.
      state.db.reminders = state.db.reminders || [];
      state.db.reminders.forEach(reminder => {
        if (!reminder.category) {
          reminder.category = careCategoryFromText(reminder.title);
        }
        if (!reminder.source) {
          reminder.source = 'vet';
        }
      });

      // Migración: `medications` de atenciones y tickets siempre como
      // array. Datos viejos podían traer string y rompían Atender con
      // "medications.map is not a function".
      let migrated = false;
      state.db.clinical = state.db.clinical || [];
      state.db.clinical.forEach(record => {
        if (!Array.isArray(record.medications)) {
          if (typeof record.medications === 'string' && record.medications.trim()) {
            record.medications = [{ name: record.medications.trim() }];
          } else if (record.medications == null || record.medications === '') {
            record.medications = [];
          } else if (!Array.isArray(normMeds(record.medications))) {
            record.medications = [];
          } else {
            record.medications = normMeds(record.medications);
          }
          migrated = true;
        } else if (record.medications.some(item => typeof item === 'string')) {
          record.medications = normMeds(record.medications);
          migrated = true;
        }
      });

      state.db.tickets.forEach(ticketItem => {
        if (!Array.isArray(ticketItem.medications)) {
          if (typeof ticketItem.medications === 'string' && ticketItem.medications.trim()) {
            ticketItem.medications = [{ name: ticketItem.medications.trim() }];
          } else {
            ticketItem.medications = [];
          }
          migrated = true;
        } else if (ticketItem.medications.some(item => typeof item === 'string')) {
          ticketItem.medications = normMeds(ticketItem.medications);
          migrated = true;
        }
      });

      // Migración: mascotas creadas antes del código de 5 dígitos.
      // Se les asigna uno único sin tocar el QR existente.
      if (ensurePetCodes()) {
        migrated = true;
      }

      // Limpieza única de ingresos duplicados creados antes del control
      // de reingreso. Se guarda para no repetir el trabajo.
      if (dedupeWaitingRoom()) {
        migrated = true;
      }

      if (migrated) {
        try {
          storage.setItem(KEY, JSON.stringify(state.db));
        } catch {
          // La limpieza igual aplica en memoria para esta sesión.
        }
      }
    }
  }

  function ensureSuperadmin() {
    try {
      if (
        state.db.configured &&
        Array.isArray(state.db.users) &&
        !state.db.users.some(account => account.role === 'superadmin')
      ) {
        const superDemo = DEMO_ACCOUNTS.find(
          account => account.role === 'superadmin'
        );

        if (
          superDemo &&
          !state.db.users.some(account =>
          account.email.toLowerCase() === superDemo.email.toLowerCase()
          )
        ) {
          state.db.users.push({ ...superDemo });

          try {
            storage.setItem(KEY, JSON.stringify(state.db));
          } catch {
            // Se continúa sin persistir; el acceso sigue disponible en sesión.
          }
        }
      }
    } catch {
      // La migración es opcional y no debe impedir el inicio.
    }
  }

  function initialize(config, admin) { state.db = seed(config, admin); return persist(); }
  return { persist, commit, withDataLock, load, ensureSuperadmin, initialize };
}
