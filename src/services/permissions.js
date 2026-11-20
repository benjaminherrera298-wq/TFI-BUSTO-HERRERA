import { navs } from '../data/navigation.js';

export const roleNames = {
  admin: 'Administrador',
  vet: 'Veterinario',
  owner: 'Propietario',
  superadmin: 'Superadmin'
};

export const allowed = {
  admin: Object.keys(navs).filter(key =>
    key !== 'reminders' && key !== 'owners' && key !== 'dailyHistory' &&
    key !== 'services' && key !== 'notifications' && key !== 'notices'
  ),
  superadmin: Object.keys(navs).filter(key => key !== 'notices'),
  vet: [
    'home',
    'pets',
    'agenda',
    'dailyHistory',
    'notifications'
  ],
  owner: [
    'pets',
    'agenda',
    'schedules',
    'products',
    'notices',
    'reminders',
    'ownerProfile'
  ]
};

export function createPermissions(state) {
  function isAdmin() {
    return !!state.user && (state.user.role === 'admin' || state.user.role === 'superadmin');
  }

  function canPet(pet) {
    return pet && state.user && (
      state.user.role !== 'owner' ||
      pet.ownerId === state.user.ownerId
    );
  }

  function mayEdit(collection, id = '') {
    if (!state.user) return false;

    if (isAdmin()) return true;

    if (state.user.role === 'vet') {
      return ['pets', 'owners', 'reminders'].includes(collection);
    }

    return collection === 'owners' && id === state.user.ownerId;
  }

  function canUsePersonalAgenda() {
    return !!state.user && ['admin', 'vet', 'superadmin'].includes(state.user.role);
  }

  return { isAdmin, canPet, mayEdit, canUsePersonalAgenda };
}
