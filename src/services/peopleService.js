import { OWNER_CARD_COLORS } from '../data/petCardColors.js';
import { findPetAvatar } from '../data/petAvatars.js';

export function createPeopleService({ state, canPet, isAdmin, commit }) {
  function activeOptions(collection) {
    return state.db[collection]
    .filter(item => item.active)
    .map(item => [item.id, item.name]);
  }

  function find(collection, id) {
    return state.db[collection].find(item => item.id === id);
  }

  function newPetCode() {
    const used = new Set(
      (state.db?.pets || []).map(pet => String(pet.code || ''))
    );

    let code = '';

    do {
      code = String(Math.floor(10000 + Math.random() * 90000));
    } while (used.has(code));

    return code;
  }

  function ensurePetCodes() {
    if (!Array.isArray(state.db.pets)) return false;

    const used = new Set();
    let changed = false;

    state.db.pets.forEach(pet => {
      let code = String(pet.code || '');

      if (!/^[0-9]{5}$/.test(code) || used.has(code)) {
        do {
          code = String(Math.floor(10000 + Math.random() * 90000));
        } while (used.has(code));

        pet.code = code;
        changed = true;
      }

      used.add(String(pet.code));
    });

    return changed;
  }

  function findPetByCode(code) {
    const clean = String(code || '').trim();

    if (!/^[0-9]{5}$/.test(clean)) return null;

    return (state.db.pets || []).find(pet => String(pet.code) === clean);
  }

  function label(collection, id) {
    return find(collection, id)?.name || 'Registro no disponible';
  }

  function pets() {
    return state.db.pets.filter(canPet);
  }

  function selectAvatar(id) {
    const [petId, avatarId] = id.split(':');
    const pet = find('pets', petId);

    if (!canPet(pet) || state.user?.role !== 'owner' || !findPetAvatar(avatarId)) return;

    if (commit(() => {
      pet.avatarId = avatarId;
      pet.imagePreference = 'avatar';
    })) {
      return pet;
    }
  }

  function usePhoto(id) {
    const pet = find('pets', id);

    if (!canPet(pet) || state.user?.role !== 'owner' || !pet.photo) return;

    if (commit(() => { pet.imagePreference = 'photo'; })) {
      return pet;
    }
  }
  function changeCardColor(id) {
    const [petId, colorId] = id.split(':');
    const pet = find('pets', petId);
    if (!canPet(pet) || state.user.role !== 'owner') return;
    commit(() => {
      if (!colorId || colorId === 'default') delete pet.cardColor;
      else if (OWNER_CARD_COLORS.some(color => color.id === colorId)) pet.cardColor = colorId;
      else delete pet.cardColor;
    });
    return pet;
  }

  function savePhoto(petId, photo) {
    if (!photo) return;
    const pet = find('pets', petId);
    if (!canPet(pet) || state.user?.role !== 'owner') return;
    if (commit(() => { pet.photo = photo; pet.imagePreference = 'photo'; })) return pet;
  }
  function identifyCode(value) {
    if (!isAdmin()) throw new Error('No tenés permiso.');
    const code = String(value || '').trim();
    if (!/^[0-9]{5}$/.test(code)) throw new Error('Ingresá un código de 5 dígitos.');
    const pet = findPetByCode(code);
    if (!pet || !pet.active) throw new Error('No se encontró una mascota activa con ese código.');
    return pet;
  }

  return { activeOptions, find, newPetCode, ensurePetCodes, findPetByCode, label, pets, selectAvatar, usePhoto, changeCardColor, savePhoto, identifyCode };
}
