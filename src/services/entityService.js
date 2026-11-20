import { validateEntity, assertUniqueOwner, validateOwner } from './validation.js';
import { today } from '../utils/dates.js';
import { imageData } from '../utils/images.js';

export function createEntityService({ state, mayEdit, find, newPetCode, uid, commit }) {
  async function saveEntity({ collection, id, data, serviceIds = [], vetIds = [], photoFile, hasPhotoField = false }) {

    if (!mayEdit(collection, id)) {
      throw new Error('No tenés permiso.');
    }

    const old = id ? find(collection, id) : null;
    if (id && !old) throw new Error('El registro ya no está disponible.');

    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string' && key !== 'password') {
        data[key] = data[key].trim();
      }
    });

    validateEntity(collection, data, old, today());
    if (collection === 'owners') assertUniqueOwner(state.db.owners, data, id);
    let newOwner = null;

    if (hasPhotoField) {
      const uploadedPhoto = await imageData(photoFile);
      data.photo = uploadedPhoto || old?.photo || '';
      if (collection === 'pets' && uploadedPhoto) data.imagePreference = 'photo';
    }

    if (collection === 'pets') preparePet(data, old, id);

    if (
      collection === 'owners' &&
      state.db.owners.some(owner =>
      owner.dni === data.dni && owner.id !== id
      )
    ) {
      throw new Error('Ya existe un propietario con ese DNI.');
    }

    if (collection === 'vets') prepareVeterinarian(data, id, serviceIds);

    if (collection === 'services') {
      data.duration = Number(data.duration);
    }

    if (collection === 'schedules') prepareSchedule(data, id);

    if (collection === 'products') {
      data.price = Number(data.price);
      data.stock = Number(data.stock);
    }

    if (collection === 'notices') prepareNotice(data);

    if (collection === 'users') newOwner = prepareUser(data, old, id);

    return saveRecord(collection, id, data, old, newOwner, vetIds);
  }

  function toggleActive(id) {
    const [collection, recordId] = id.split(':');

    if (!mayEdit(collection, recordId)) return;

    const row = find(collection, recordId);

    if (
      !row ||
      (
      collection === 'users' &&
      (row.principal || row.id === state.user.id)
      )
    ) {
      return;
    }

    if (commit(() => {
      row.active = !row.active;
    })) {
      return true;
    }
  }

  function createOwner(data) {
    if (!mayEdit('owners')) return;

    validateOwner(data);
    assertUniqueOwner(state.db.owners, data);

    const owner = {
      ...data,
      id: uid(),
      active: true
    };

    if (state.db.owners.some(item => item.dni === owner.dni)) {
      throw new Error('Ya existe un propietario con ese DNI.');
    }

    if (commit(() => state.db.owners.push(owner))) {
      return owner;
    }
  }
  function preparePet(data, old, id) {
    data.weight = Number(data.weight);

    if (!find('owners', data.ownerId)?.active) {
      throw new Error('Seleccioná un propietario activo.');
    }

    data.qr = old?.qr || uid();

    // El código de 5 dígitos se conserva al editar. Solo se genera uno
    // nuevo si falta, es inválido o está duplicado.
    const currentCode = String(old?.code || '');

    if (
      !/^[0-9]{5}$/.test(currentCode) ||
      state.db.pets.some(pet => pet.id !== id && String(pet.code) === currentCode)
    ) {
      data.code = newPetCode();
    } else {
      data.code = currentCode;
    }

  }

  function prepareVeterinarian(data, id, serviceIds) {
    data.serviceIds = serviceIds;

    if (state.db.vets.some(vet =>
      vet.license === data.license && vet.id !== id
    )) {
      throw new Error('La matrícula ya está registrada.');
    }

    if (
      !id &&
      state.db.users.some(account =>
      account.email.toLowerCase() === data.email.toLowerCase()
      )
    ) {
      throw new Error('Ese correo ya tiene una cuenta.');
    }

  }

  function prepareSchedule(data, id) {
    data.day = Number(data.day);
    data.duration = Number(data.duration);

    if (
      !find('vets', data.vetId)?.serviceIds.includes(data.serviceId)
    ) {
      throw new Error('Asigná primero ese servicio al veterinario desde Servicios o Veterinarios.');
    }

    if (data.start >= data.end) {
      throw new Error('El horario de fin debe ser posterior al de inicio.');
    }

    if (
      !state.db.config.days.map(Number).includes(data.day) ||
      data.start < state.db.config.start ||
      data.end > state.db.config.end
    ) {
      throw new Error('La franja debe estar dentro de los días y horarios generales de atención.');
    }

    if (state.db.schedules.some(schedule =>
      schedule.id !== id &&
      schedule.active &&
      schedule.vetId === data.vetId &&
      schedule.serviceId === data.serviceId &&
      Number(schedule.day) === data.day &&
      data.start < schedule.end &&
      data.end > schedule.start
    )) {
      throw new Error('Ya existe una franja superpuesta para este profesional y servicio.');
    }

  }

  function prepareNotice(data) {
    data.active = data.active === 'true';

    if (!data.message) {
      throw new Error('Escribí el mensaje del aviso.');
    }

    if (data.expires && data.expires < data.date) {
      throw new Error('La expiración debe ser posterior a la publicación.');
    }

  }

  function prepareUser(data, old, id) {
    let newOwner = null;

    data.role = old?.principal ? 'admin' : data.role;

    // El Administrador gestiona propietarios y veterinarios: no puede
    // crear cuentas de administración ni modificarlas (eso lo hace el
    // Superadmin).
    if (state.user.role === 'admin') {
      if (old && (old.principal || ['admin', 'superadmin'].includes(old.role))) {
        throw new Error('No tenés permiso para modificar esa cuenta.');
      }

      if (!['owner', 'vet'].includes(data.role)) {
        throw new Error('Solo podés crear cuentas de propietario o veterinario.');
      }
    }

    // Se conserva solo el vínculo del rol elegido.
    if (data.role === 'owner') data.vetId = '';
    if (data.role === 'vet') data.ownerId = '';

    if (['admin', 'superadmin'].includes(data.role)) {
      data.vetId = '';
      data.ownerId = '';
    }

    if (state.db.users.some(account =>
      account.id !== id &&
      account.email.toLowerCase() === data.email.toLowerCase()
    )) {
      throw new Error('Ese usuario ya existe.');
    }

    if (data.role === 'owner') {
      // Un vínculo explícito evita elegir arbitrariamente entre datos antiguos duplicados.
      data.ownerId = Object.hasOwn(data, 'ownerId') ? data.ownerId : (old?.ownerId || '');
      if (!data.ownerId) {
        const matches = state.db.owners.filter(owner => owner.active && String(owner.email || '').trim().toLowerCase() === data.email);
        if (matches.length > 1) throw new Error('Hay varios perfiles con ese correo. Seleccioná el propietario correspondiente.');
        if (matches.length === 1) data.ownerId = matches[0].id;
        else {
          newOwner = validateOwner({ name: data.name, email: data.email, phone: data.phone, dni: data.ownerDni, address: data.ownerAddress, id: uid(), active: true });
          assertUniqueOwner(state.db.owners, newOwner);
          data.ownerId = newOwner.id;
        }
      }
      if (state.db.users.some(account => account.id !== id && account.role === 'owner' && account.ownerId === data.ownerId)) throw new Error('Este propietario ya tiene una cuenta individual.');
    }

    if (
      (data.role === 'vet' && !find('vets', data.vetId)?.active) ||
      (data.role === 'owner' && !newOwner && !find('owners', data.ownerId)?.active)
    ) {
      throw new Error('Vinculá la cuenta al perfil correspondiente.');
    }

    if (
      data.role === 'vet' &&
      state.db.users.some(account =>
      account.id !== id &&
      account.role === 'vet' &&
      account.vetId === data.vetId
      )
    ) {
      throw new Error('Este veterinario ya tiene una cuenta individual.');
    }

    if (id === state.user.id && data.role !== state.user.role) {
      throw new Error('No podés cambiar tu propio rol durante la sesión.');
    }

    if (!data.password) {
      delete data.password;
    }

    return newOwner;

  }

  function saveRecord(collection, id, data, old, newOwner, vetIds) {
    const newId = id || uid();
    return commit(() => {
      if (newOwner) state.db.owners.push(newOwner);
      delete data.ownerDni;
      delete data.ownerAddress;
      const row = {
        active: true,
        ...old,
        ...data,
        id: newId
      };

      if (collection === 'vets') {
        delete row.email;
        delete row.password;
      }

      if (old) {
        Object.assign(old, row);
      } else {
        state.db[collection].push(row);
      }

      if (collection === 'vets' && !id) {
        state.db.users.push({
          id: uid(),
          name: data.name,
          email: data.email,
          password: data.password,
          role: 'vet',
          vetId: newId,
          active: true
        });
      }

      if (collection === 'services') {
        const assigned = vetIds;

        state.db.vets.forEach(vet => {
          vet.serviceIds = vet.serviceIds.filter(
            serviceId => serviceId !== newId
          );

          if (assigned.includes(vet.id)) {
            vet.serviceIds.push(newId);
          }
        });
      }

      if (collection === 'users' && id === state.user.id) {
        state.user = find('users', id);
      }
    });
  }
  return { saveEntity, toggleActive, createOwner };
}
