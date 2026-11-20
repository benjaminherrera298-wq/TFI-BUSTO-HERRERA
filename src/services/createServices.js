import { createPermissions } from './permissions.js';
import { createStorageService, browserStorage as defaultStorage } from './storageService.js';
import { createPeopleService } from './peopleService.js';
import { createAgendaService, careCategoryFromText } from './agendaService.js';
import { createClinicalService, normMeds } from './clinicalService.js';
import { createTicketService } from './ticketService.js';
import { createEntityService } from './entityService.js';
import { createAuthService } from './authService.js';
import { createAdministrationService } from './administrationService.js';
import { createSampleDatabase } from '../data/sampleDatabase.js';
import { pretty } from '../utils/formatters.js';

function createId() {
  return globalThis.crypto?.randomUUID?.() ||
  'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
}

export function createServices({ state, onError, lockedRole = null, storage: browserStorage = defaultStorage, uid = createId }) {
  const permissions = createPermissions(state);
  const { isAdmin, canPet, mayEdit, canUsePersonalAgenda } = permissions;
  let people;
  let clinical;
  const storage = createStorageService({
    state, storage: browserStorage, onError,
    seed: (config, admin) => createSampleDatabase(config, admin, uid),
    ensurePetCodes: () => people.ensurePetCodes(),
    dedupeWaitingRoom: () => clinical.dedupeWaitingRoom(),
    careCategoryFromText, normMeds
  });
  const { commit, load } = storage;
  people = createPeopleService({ state, canPet, isAdmin, commit });
  const { find, newPetCode } = people;
  const agenda = createAgendaService({ state, find, canPet, canUsePersonalAgenda, uid, commit });
  clinical = createClinicalService({ state, uid, find, canPet, isAdmin, commit, load, pretty, upsertCareReminder: agenda.upsertCareReminder });
  const tickets = createTicketService({ state, isAdmin, find, commit, load });
  const entities = createEntityService({ state, mayEdit, find, newPetCode, uid, commit });
  const auth = createAuthService({ state, find, isAdmin, commit, lockedRole, storage: browserStorage });
  const administration = createAdministrationService({ state, isAdmin, commit });
  return { permissions, storage, people, agenda, clinical, tickets, entities, auth, administration };
}
