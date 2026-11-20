import { createServices } from "../services/createServices.js";
import { pretty, money, entryTime } from "../utils/formatters.js";
import { OWNER_CARD_COLORS } from "../data/petCardColors.js";
import { prepareAdministrator, verifyCode, VERIFICATION_CODE as CODE } from "../services/authService.js";
import { imageData } from "../utils/images.js";

import { CARE_CATEGORIES, careColor, careCategoryFromText, reminderCategory } from "../services/agendaService.js";
import { normMeds } from "../services/clinicalService.js";

import { validateClinicData } from "../services/administrationService.js";
import { navs } from "../data/navigation.js";
import { today, addDays, calMonthDays, calShiftMonth, calMonthLabel, validAgendaDate } from "../utils/dates.js";
import { DEMO_ACCOUNTS } from "../data/demoAccounts.js";

import { roleNames, allowed } from "../services/permissions.js";
import { STORAGE_KEY as KEY } from "../services/storageService.js";
import { simulatedQrCells } from "../data/simulatedQr.js";
import { PET_AVATARS, findPetAvatar } from "../data/petAvatars.js";
import { MAX_MONEY } from "../services/validation.js";

export function startVeterinaryApplication(ui) {
  'use strict';

  /*
  Sistema de Gestión Veterinaria.
  Prototipo local con Vue, CSS y JavaScript.
  Las cuentas, códigos y permisos son simulados.
  Conecta las vistas Vue, la navegación y los servicios con un solo estado compartido.
  */

  const $ = selector => ui.root.querySelector(selector);
  const $$ = selector => [...ui.root.querySelectorAll(selector)];

  const dayNames = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado'
  ];

  // Rol bloqueado por página (bundles por rol): cada HTML de rol define
  // ui.lockedRole al iniciar el módulo. En el acceso central
  // (index.html) no se define y el valor es null (sin bloqueo).
  const LOCKED_ROLE = ui.lockedRole ?? null;

  // MODO OSCURO GLOBAL (todas las páginas comparten este bundle).
  const THEME_KEY = 'veterinaria-theme';

  function currentTheme() {
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // El tema sigue aplicándose en sesión aunque no se pueda persistir.
    }

    const meta = document.querySelector('meta[name="theme-color"]');

    if (meta) {
      meta.content = theme === 'dark' ? '#142C37' : '#183E49';
    }

    $$('[data-action="theme"]').forEach(element => {
      element.setAttribute('aria-checked', String(theme === 'dark'));
      element.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
      );
      element.title = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
    });
  }

  function toggleTheme() {
    applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  }

  const state = { db: undefined, user: null, recovery: null };

  let route = 'home';
  let selectedPet = null;
  let petTab = 'Resumen';
  let page = 1;
  let query = '';
  let filter = '';
  let agendaDate = today();
  let agendaMode = 'month';

  // --- Calendario del propietario (Agenda) ---
  let ownerCalMonth = today().slice(0, 7);
  let ownerCalSelected = today();
  let draft = {};
  let authStep = 0;

  let toastTimer;

  // Tipo de atención del modal del veterinario (Atender): se define con
  // la barrita de filtros de historia clínica. 'Consulta' es genérico;
  // 'Vacuna' usa formulario propio y ticket automático.
  let attendType = 'Consulta';

  // --- Personalización de tarjetas de mascota (solo Propietario) ---
  // Estado auxiliar exclusivo de la vista de selección de mascotas del
  // propietario. No es utilizado por ningún otro rol.
  let ownerColorPicker = '';
  let ownerPhotoTargetId = '';

  function toast(message) { ui.notify(message); }

  function modal(title, body) {
    ui.showView($('#modal'), 'ModalFrame', { key: Symbol('modal'), title, body, onAction: runAction });
    if (!$('#modal').open) $('#modal').showModal();
  }

  function close() {
    $('#modal').close();
  }

  function fail(form, message) {
    const errorElement = form.querySelector('[data-form-error]');

    if (errorElement) {
      errorElement.textContent = message;
    } else {
      toast(message);
    }

    return false;
  }

  // DATOS DE DEMOSTRACIÓN

  // CONFIGURACIÓN INICIAL Y AUTENTICACIÓN

  function setup() {
    ui.showView($('#app'), 'SetupView', {
      clinic: state.db.config || {},
      step: authStep,
      config: draft.config || {},
      verificationEmail: authStep === 1 ? draft.config.email : authStep === 3 ? draft.admin.email : '',
      code: CODE,
      onAction: runAction
    });
  }

  function login() {
    state.recovery = null;
    let remembered = '';
    try {
      remembered = localStorage.getItem(KEY + '-email') || '';
    } catch {
      remembered = '';
    }
    ui.showView($('#app'), 'LoginView', {
      key: Symbol('login'),
      clinic: state.db.config,
      remembered,
      accounts: DEMO_ACCOUNTS
      .filter(account => LOCKED_ROLE ? account.role === LOCKED_ROLE : ['u-admin', 'u-v1', 'u-o1', 'u-super'].includes(account.id))
      .map(account => ({ ...account, roleLabel: roleNames[account.role] })),
      onAction: runAction
    });
  }

  function recoverScreen() {
    ui.showView($('#app'), 'RecoveryView', {
      key: Symbol('recovery'),
      clinic: state.db.config,
      recovery: state.recovery,
      code: CODE,
      onAction: runAction
    });
  }

  function shell() {
    if (!state.user) return login();
    if (!allowed[state.user.role].includes(route) && !['pet', 'owner', 'vet'].includes(route)) {
      route = state.user.role === 'owner' ? 'pets' : 'home';
    }
    const firstName = state.user.name.trim().split(/\s+/)[0] || roleNames[state.user.role];
    const panelLabel = state.user.role === 'superadmin'
    ? 'Superadministración · Acceso total'
    : isAdmin() ? 'Panel administrativo' : state.user.role === 'vet' ? 'Espacio profesional' : 'Portal del propietario';
    ui.showView($('#app'), 'ApplicationShell', {
      key: Symbol('application-shell'),
      user: state.user,
      clinic: state.db.config,
      firstName,
      accountLabel: firstName.slice(0, 2),
      panelLabel,
      roleLabel: roleNames[state.user.role],
      route,
      navigation: allowed[state.user.role].filter(key => navs[key]).map(key => ({
        key,
        icon: navs[key][1],
        label: state.user.role === 'owner' && key === 'pets' ? 'Mis mascotas' : canUsePersonalAgenda() && key === 'agenda' ? 'Mi agenda' : navs[key][0]
      })),
      canSeeNotifications: allowed[state.user.role].includes('notifications'),
      notificationCount: allowed[state.user.role].includes('notifications') ? unread() : 0,
      darkTheme: currentTheme() === 'dark',
      onAction: runAction
    });
    renderContent();
  }

  function navigate(nextRoute, id) {
    if (nextRoute === 'notices' && isAdmin()) nextRoute = 'settings';
    route = nextRoute;
    query = '';
    filter = '';
    page = 1;

    if (nextRoute === 'pet') {
      selectedPet = id;
      petTab = state.user && state.user.role === 'vet' ? 'Historia clínica' : 'Resumen';
    }

    if (nextRoute === 'owner' || nextRoute === 'vet') {
      selectedPet = id;
    }

    shell();
    window.scrollTo(0, 0);
  }

  // DASHBOARD

  function home() {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
    return {
      view: 'HomeView',
      props: {
        key: Symbol('home'),
        clinicName: state.db.config.name,
        greeting: greeting + ', ' + state.user.name.split(' ')[0],
        dateLabel: new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        isAdmin: isAdmin(),
        isSuperadmin: state.user.role === 'superadmin',
        isVet: state.user.role === 'vet',
        vetId: state.user.vetId || '',
        canUsePersonalAgenda: canUsePersonalAgenda(),
        waitingRows: waitingRoomPending().map(entry => ({
          entry,
          pet: find('pets', entry.petId),
          ownerName: find('owners', entry.ownerId)?.name || 'No disponible',
          time: entryTime(entry)
        })),
        ticketRows: pendingTickets().map(ticketItem => {
          const pet = find('pets', ticketItem.petId);
          const owner = find('owners', ticketItem.ownerId);
          return {
            ticket: ticketItem,
            pet,
            petName: pet?.name || ticketItem.petName || ticketItem.petId,
            ownerName: owner?.name || ticketItem.ownerName || 'No disponible',
            dateLabel: pretty(ticketItem.date),
            amountLabel: ticketItem.total > 0 ? money(ticketItem.total) : 'A definir'
          };
        }),
        agendaEntries: personalAgendaEntries().filter(entry => !entry.done && entry.date >= today()).slice(0, 4)
        .map(entry => ({ entry, dateLabel: pretty(entry.date) })),
        owners: state.db.owners,
        pets: state.db.pets.map(pet => ({ pet, owner: find('owners', pet.ownerId), ownerName: label('owners', pet.ownerId) })),
        onAction: runAction
      }
    };
  }

  // TICKETS A COBRAR (ADMINISTRADOR, inicio, debajo de Escanear).
  // Cada ticket generado por el veterinario (fecha, hora y datos de la
  // atención) aparece como "Ticket a cobrar de {mascota}". El monto solo
  // lo ve y lo define Administración al cobrar; el veterinario no lo ve.

  function matches(item) {
    return JSON.stringify(item)
    .toLocaleLowerCase('es')
    .includes(query.toLocaleLowerCase('es'));
  }

  // MASCOTAS Y PERFILES

  // Variantes claras de la gama petróleo. Los IDs conservan las elecciones
  // guardadas; cada tarjeta mantiene texto oscuro legible en ambos temas.
  // No modifica pet.color, que describe el pelaje del animal.

  function ownerCardColorValue(id) {
    return OWNER_CARD_COLORS.find(color => color.id === id)?.value || '';
  }

  function ownerPetImageModal(pet) {
    const selected = findPetAvatar(pet.avatarId);
    const usingAvatar = Boolean(selected && (pet.imagePreference === 'avatar' || !pet.photo));
    modal(`Foto o ícono de ${pet.name}`, {
      view: 'PetImagePicker',
      props: {
        pet,
        avatars: PET_AVATARS,
        usingAvatar,
        onAction: runAction
      }
    });
  }

  function petsView() {
    const isOwner = state.user.role === 'owner';
    const visiblePets = isOwner
    ? pets().filter(pet => pet.active)
    : pets().filter(pet => matches({ ...pet, owner: find('owners', pet.ownerId) }) && (!filter || pet.species === filter));
    const totalPages = Math.max(1, Math.ceil(visiblePets.length / 8));
    if (!isOwner) page = Math.min(page, totalPages);
    const pagePets = isOwner ? visiblePets : visiblePets.slice((page - 1) * 8, page * 8);
    const rows = pagePets.map(pet => {
      const avatar = findPetAvatar(pet.avatarId);
      const useAvatar = Boolean(avatar && (pet.imagePreference === 'avatar' || !pet.photo));
      return {
        pet,
        ownerName: label('owners', pet.ownerId),
        image: {
          src: (useAvatar ? avatar.src : pet.photo) || '',
          alt: String(pet.name ?? '') + (useAvatar ? ' \u00b7 ' + avatar.label : ''),
          isAvatar: useAvatar
        },
        background: pet.cardColor ? ownerCardColorValue(pet.cardColor) : ''
      };
    });

    ui.showPets($('#content'), {
      clinicName: state.db.config.name,
      isOwner,
      rows,
      query,
      species: filter,
      canCreate: isAdmin(),
      canScan: state.user.role !== 'vet',
      canEdit: state.user.role !== 'vet',
      canShowQr: state.user.role !== 'vet',
      pageNumber: page,
      totalPages,
      totalRecords: visiblePets.length,
      cardColors: OWNER_CARD_COLORS,
      colorPickerId: ownerColorPicker,
      onSearch: value => {
        query = value;
        page = 1;
        petsView();
      },
      onFilter: value => {
        filter = value;
        page = 1;
        petsView();
      },
      onPage: value => action('page', value).catch(error => toast(error.message)),
      onCreate: () => action('create', 'pets').catch(error => toast(error.message)),
      onScan: () => action('scan', '').catch(error => toast(error.message)),
      onOpen: id => action('pet', id).catch(error => toast(error.message)),
      onOwner: id => action('owner', id).catch(error => toast(error.message)),
      onEdit: id => action('edit', 'pets:' + id).catch(error => toast(error.message)),
      onToggle: id => action('toggle', 'pets:' + id).catch(error => toast(error.message)),
      onQr: id => action('qr', id).catch(error => toast(error.message)),
      onPhoto: id => action('owner-pet-photo', id).catch(error => toast(error.message)),
      onColor: id => action('owner-pet-color', id).catch(error => toast(error.message)),
      onPickColor: ({ petId, colorId }) => action('owner-pet-color-pick', petId + ':' + colorId).catch(error => toast(error.message))
    });
  }

  function clinicalRecordProps(record) {
    return {
      record,
      medications: normMeds(record.medications),
      authorName: record.authorName || label('vets', record.vetId),
      formatDate: pretty
    };
  }

  function petProfile() {
    const pet = find('pets', selectedPet);
    if (!canPet(pet)) return { view: 'PetProfileView', props: { pet: null, formatDate: pretty } };
    const owner = find('owners', pet.ownerId);
    const age = Math.max(0, Math.floor((Date.now() - new Date(pet.birth + 'T12:00:00')) / 31557600000));
    const tabs = state.user.role === 'vet'
    ? ['Historia clínica', 'Vacunas', 'Tratamientos', 'Desparasitación', 'Pipetas', 'Estudios']
    : ['Resumen', 'Historia clínica', 'Vacunas', 'Tratamientos', 'Desparasitación', 'Pipetas', 'Estudios'];
    if (!tabs.includes(petTab)) petTab = tabs[0];
    const category = { Vacunas: 'Vacuna', Tratamientos: 'Tratamiento', Desparasitación: 'Desparasitación', Pipetas: 'Pipeta', Estudios: 'Estudio' };
    const records = state.db.clinical
    .filter(record => record.petId === pet.id && (state.user.role !== 'owner' || record.visible))
    .sort((a, b) => b.date.localeCompare(a.date));
    const avatar = findPetAvatar(pet.avatarId);
    const useAvatar = Boolean(avatar && (pet.imagePreference === 'avatar' || !pet.photo));
    return {
      view: 'PetProfileView',
      props: {
        clinicName: state.db.config.name,
        pet,
        owner,
        age,
        image: {
          src: (useAvatar ? avatar.src : pet.photo) || '',
          alt: String(pet.name ?? '') + (useAvatar ? ' · ' + avatar.label : ''),
          isAvatar: useAvatar
        },
        tabs,
        tab: petTab,
        records: records.map(record => clinicalRecordProps(record)),
        sectionRecords: records.filter(record => !category[petTab] || record.type === category[petTab]).map(record => clinicalRecordProps(record)),
        reminders: state.db.reminders.filter(reminder => reminder.petId === pet.id && !reminder.done),
        notices: visibleNotices().slice(0, 2),
        isOwner: state.user.role === 'owner',
        isVet: state.user.role === 'vet',
        canManage: isAdmin(),
        formatDate: pretty,
        onAction: runAction
      }
    };
  }

  function clinicalCard(record) {
    return { view: 'ClinicalRecordCard', props: clinicalRecordProps(record) };
  }

  function ownerProfile(id) {
    const owner = find('owners', id);
    if (!owner || (state.user.role === 'owner' && owner.id !== state.user.ownerId)) {
      return { view: 'OwnerProfileView', props: { owner: null } };
    }
    return {
      view: 'OwnerProfileView',
      props: {
        clinicName: state.db.config.name,
        owner,
        isOwner: state.user.role === 'owner',
        canManage: isAdmin(),
        pets: state.db.pets.filter(pet => pet.ownerId === owner.id).map(pet => {
          const avatar = findPetAvatar(pet.avatarId);
          const useAvatar = Boolean(avatar && (pet.imagePreference === 'avatar' || !pet.photo));
          return {
            pet,
            image: {
              src: (useAvatar ? avatar.src : pet.photo) || '',
              alt: String(pet.name ?? '') + (useAvatar ? ' · ' + avatar.label : ''),
              isAvatar: useAvatar
            }
          };
        }),
        onAction: runAction
      }
    };
  }

  // LISTADOS ADMINISTRATIVOS

  function genericView(collection) {
    const editable = isAdmin() || (collection === 'owners' && state.user.role === 'vet');
    let rows = state.db[collection].filter(matches).filter(item => !filter || (item.active ? 'Activo' : 'Inactivo') === filter);
    if (collection === 'users' && state.user.role === 'admin') rows = rows.filter(item => item.role === 'owner' || item.role === 'vet');
    if (collection === 'services' && state.user.role === 'vet') rows = rows.filter(service => find('vets', state.user.vetId)?.serviceIds.includes(service.id));
    const totalPages = Math.max(1, Math.ceil(rows.length / 8));
    page = Math.min(page, totalPages);
    const slice = rows.slice((page - 1) * 8, page * 8);
    const list = {
      clinicName: state.db.config.name,
      title: navs[collection][0],
      subtitle: collection === 'users' && state.user.role === 'admin'
      ? 'Cuentas de propietarios y veterinarios.'
      : 'Consultá y administrá los registros de la veterinaria.',
      collection,
      canCreate: editable,
      query,
      statusFilter: filter,
      pageNumber: page,
      totalPages,
      totalRecords: rows.length
    };
    const props = {
      list,
      onSearch: value => { query = value; page = 1; renderContent(); },
      onFilter: value => { filter = value; page = 1; renderContent(); },
      onPage: value => runAction('page', value),
      onAction: runAction
    };
    if (collection === 'owners') {
      return {
        view: 'OwnersView',
        props: { ...props, canManage: isAdmin(), rows: slice.map(owner => ({ owner, petCount: state.db.pets.filter(pet => pet.ownerId === owner.id).length })) }
      };
    }
    if (collection === 'vets') {
      return {
        view: 'VeterinariansView',
        props: {
          ...props,
          rows: slice.map(vet => ({ vet, serviceNames: vet.serviceIds.map(id => label('services', id)), accountId: state.db.users.find(account => account.vetId === vet.id)?.id || '' }))
        }
      };
    }
    if (collection === 'services') {
      return {
        view: 'ServicesView',
        props: {
          ...props,
          editable,
          rows: slice.map(service => ({ service, vetNames: state.db.vets.filter(vet => vet.serviceIds.includes(service.id)).map(vet => vet.name) }))
        }
      };
    }
    return {
      view: 'UsersView',
      props: {
        ...props,
        rows: slice.map(account => ({ account, roleName: roleNames[account.role], lastAccess: account.lastAccess ? new Date(account.lastAccess).toLocaleString('es-AR') : 'Sin acceso', isCurrent: account.id === state.user.id }))
      }
    };
  }

  function vetProfile() {
    if (!isAdmin()) return { view: 'VetProfileView', props: { restricted: true } };
    const vet = find('vets', selectedPet);
    if (!vet) return { view: 'VetProfileView', props: { vet: null } };
    return {
      view: 'VetProfileView',
      props: {
        clinicName: state.db.config.name,
        vet,
        serviceNames: vet.serviceIds.map(id => label('services', id)),
        schedule: scheduleTable(state.db.schedules.filter(schedule => schedule.vetId === vet.id)).props,
        onAction: runAction
      }
    };
  }

  function ownerSchedulesView() {
    const published = state.db.schedules.map(publishedSchedule).filter(Boolean);
    const openDays = (state.db.config.days || []).map(Number).sort((a, b) => a - b);
    const norm = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const isSpecialService = name => /eco|cirug|operac|quirofano/.test(norm(name));
    const vets = state.db.vets.filter(vet => vet.active && published.some(schedule => schedule.vetId === vet.id && schedule.active && isSpecialService(label('services', schedule.serviceId))));
    return {
      view: 'OwnerSchedulesView',
      props: {
        clinic: state.db.config,
        openDays: openDays.length ? openDays.map(day => dayNames[day]).join(' · ') : '—',
        specialists: vets.map(vet => ({
          vet,
          schedules: published
          .filter(schedule => schedule.vetId === vet.id && schedule.active && isSpecialService(label('services', schedule.serviceId)))
          .sort((a, b) => Number(a.day) - Number(b.day) || a.start.localeCompare(b.start))
          .map(schedule => ({ schedule, serviceName: label('services', schedule.serviceId), dayName: dayNames[schedule.day] }))
        }))
      }
    };
  }

  function scheduleTable(rows) {
    return {
      view: 'ScheduleTable',
      props: {
        rows: rows.map(schedule => ({
          schedule,
          vetName: label('vets', schedule.vetId),
          serviceName: label('services', schedule.serviceId),
          dayName: dayNames[schedule.day],
          status: !schedule.active ? 'Inactivo' : !publishedSchedule(schedule) ? 'Fuera del horario general' : (schedule.start < state.db.config.start || schedule.end > state.db.config.end) ? 'Horario limitado' : 'Activo'
        }))
      }
    };
  }

  function schedulesView() {
    if (state.user?.role === 'owner') return ownerSchedulesView();
    const visible = state.db.schedules.filter(schedule => matches({ ...schedule, vet: label('vets', schedule.vetId), service: label('services', schedule.serviceId), weekday: dayNames[schedule.day] }));
    const totalPages = Math.max(1, Math.ceil(visible.length / 8));
    page = Math.min(page, totalPages);
    const rows = visible.slice((page - 1) * 8, page * 8);
    return {
      view: 'SchedulesView',
      props: {
        clinicName: state.db.config.name,
        rows: scheduleTable(rows).props.rows,
        query,
        pageNumber: page,
        totalPages,
        totalRecords: visible.length,
        onAction: runAction,
        onSearch: value => { query = value; page = 1; renderContent(); },
        onPage: value => action('page', value).catch(error => toast(error.message))
      }
    };
  }

  // CALENDARIO DE CUIDADOS (AGENDA DEL PROPIETARIO)
  // Categorías de los puntos de colores. Los recordatorios que carga el
  // veterinario desde el historial clínico y los que agrega el propietario
  // comparten la misma colección (db.reminders) y se ven en el mismo calendario.

  function ownerAgendaView() {
    const items = ownerCalItems().map(item => ({ ...item, petName: label('pets', item.petId), color: careColor(item.category), dateLabel: pretty(item.date) }));
    const byDate = {};
    items.forEach(item => { (byDate[item.date] = byDate[item.date] || []).push(item); });
    const now = today();
    return {
      view: 'OwnerAgendaView',
      props: {
        month: ownerCalMonth,
        monthLabel: calMonthLabel(ownerCalMonth),
        today: now,
        todayLabel: dayNames[new Date(now + 'T12:00:00').getDay()] + ', ' + pretty(now),
        selectedDate: ownerCalSelected,
        selectedLabel: dayNames[new Date(ownerCalSelected + 'T12:00:00').getDay()] + ' ' + pretty(ownerCalSelected),
        days: calMonthDays(ownerCalMonth).map(date => ({ date, label: pretty(date), items: byDate[date] || [] })),
        categories: CARE_CATEGORIES,
        upcoming: items.filter(item => item.date >= now && !item.done).slice(0, 5),
        selectedItems: byDate[ownerCalSelected] || [],
        onAction: runAction
      }
    };
  }

  function ownerReminderForm(reminderId = '', presetDate = '') {
    if (!state.user || state.user.role !== 'owner') return;
    const current = reminderId ? state.db.reminders.find(item => item.id === reminderId && item.source === 'owner' && canPet(find('pets', item.petId))) : null;
    if (reminderId && !current) return toast('No podés editar este recordatorio.');
    const list = pets().filter(pet => pet.active);
    if (!list.length) return toast('No tenés mascotas activas para agendar.');
    modal(current ? 'Editar recordatorio' : 'Nuevo recordatorio', {
      view: 'OwnerReminderForm',
      props: {
        key: Symbol('owner-reminder'),
        current,
        pets: list,
        categories: CARE_CATEGORIES.map(item => item[0]),
        selectedCategory: current ? reminderCategory(current) : 'Pipeta',
        date: current?.date || presetDate || today(),
        reminderId,
        onAction: runAction
      }
    });
  }

  function agendaNoteForm(id = '') {
    if (!canUsePersonalAgenda()) return;
    const entry = id ? personalAgendaEntry(id) : null;
    if (id && !entry) return;
    modal(entry ? 'Editar anotación' : 'Nueva anotación', {
      view: 'AgendaNoteForm',
      props: {
        key: Symbol('agenda-note'),
        entry,
        date: agendaDate,
        entryId: id,
        onAction: runAction
      }
    });
  }

  function agendaView() {
    if (state.user.role === 'owner') return ownerAgendaView();
    if (!canUsePersonalAgenda()) return '';
    const entries = personalAgendaEntries();
    const daySection = date => ({ date, label: dayNames[new Date(date + 'T12:00:00').getDay()] + ' · ' + pretty(date), entries: entries.filter(entry => entry.date === date) });
    const month = agendaDate.slice(0, 7);
    let period;
    let daySections;
    if (agendaMode === 'month') {
      period = calMonthLabel(month);
      daySections = [daySection(agendaDate)];
    } else if (agendaMode === 'week') {
      const day = new Date(agendaDate + 'T12:00:00').getDay();
      const monday = addDays(agendaDate, -((day + 6) % 7));
      period = pretty(monday) + ' – ' + pretty(addDays(monday, 6));
      daySections = Array.from({ length: 7 }, (_, index) => daySection(addDays(monday, index)));
    } else {
      period = pretty(agendaDate);
      daySections = [daySection(agendaDate)];
    }
    return {
      view: 'PersonalAgendaView',
      props: {
        clinicName: state.db.config.name,
        date: agendaDate,
        today: today(),
        mode: agendaMode,
        period,
        month,
        monthDays: agendaMode === 'month' ? calMonthDays(month).map(date => ({ date, label: pretty(date), entries: entries.filter(entry => entry.date === date) })) : [],
        daySections,
        onAction: runAction,
        onDate: value => {
          if (!canUsePersonalAgenda() || !validAgendaDate(value)) return;
          agendaDate = value;
          renderContent();
        },
        onMode: value => {
          if (!canUsePersonalAgenda() || !['day', 'week', 'month'].includes(value)) return;
          agendaMode = value;
          renderContent();
        }
      }
    };
  }

  function catalog() {
    const canManage = isAdmin();
    const products = state.db.products
    .filter(product => canManage || product.active)
    .filter(matches)
    .filter(product => !filter || product.category === filter);

    ui.showCatalog($('#content'), {
      clinicName: state.db.config.name,
      clinicPhone: state.db.config.phone,
      products,
      categories: [...new Set(state.db.products.map(product => product.category))],
      canManage,
      query,
      category: filter,
      formatMoney: money,
      onSearch: value => {
        query = value;
        page = 1;
        renderContent();
      },
      onFilter: value => {
        filter = value;
        page = 1;
        renderContent();
      },
      onCreate: () => action('create', 'products').catch(error => toast(error.message)),
      onEdit: id => action('edit', 'products:' + id).catch(error => toast(error.message)),
      onToggle: id => action('toggle', 'products:' + id).catch(error => toast(error.message))
    });
  }

  function noticesView(inSettings = false) {
    const canManage = isAdmin();
    const notices = (canManage ? state.db.notices : visibleNotices()).filter(matches);
    const target = inSettings ? $('#settings-notices') : $('#content');

    ui.showNotices(target, {
      clinicName: state.db.config.name,
      notices,
      canManage,
      inSettings,
      query,
      formatDate: pretty,
      onSearch: value => {
        query = value;
        page = 1;
        noticesView(inSettings);
      },
      onCreate: () => action('create', 'notices').catch(error => toast(error.message)),
      onEdit: id => action('edit', 'notices:' + id).catch(error => toast(error.message)),
      onToggle: id => action('toggle', 'notices:' + id).catch(error => toast(error.message)),
      onDelete: id => action('delete-notice', id).catch(error => toast(error.message))
    });
  }

  function remindersView() {
    return {
      view: 'RemindersView',
      props: {
        clinicName: state.db.config.name,
        canManage: state.user.role !== 'owner',
        rows: reminderList().map(reminder => ({ reminder, petName: label('pets', reminder.petId), dateLabel: pretty(reminder.date), status: reminder.done ? 'Completado' : reminder.date < today() ? 'Pendiente' : 'Próximo' })),
        onAction: runAction
      }
    };
  }

  function waitingRoomView() {
    const list = waitingRoomList();
    const rows = entries => entries.map(entry => {
      const pet = find('pets', entry.petId);
      const entryTicket = entry.ticketId ? ticket(entry.ticketId) : null;
      return {
        entry,
        pet,
        ticket: entryTicket,
        ownerName: find('owners', entry.ownerId)?.name || (entry.status === 'Pagado' ? entryTicket?.ownerName : '') || 'No disponible',
        time: entryTime(entry),
        medications: normMeds(entryTicket?.medications)
      };
    });
    return {
      view: 'WaitingRoomView',
      props: {
        clinicName: state.db.config.name,
        active: rows(waitingRoomActive()),
        paid: rows(list.filter(entry => entry.status === 'Pagado')),
        totalEntries: list.length,
        isSuperadmin: state.user.role === 'superadmin',
        formatDate: pretty,
        formatMoney: money,
        onAction: (...args) => runAction(...args)
      }
    };
  }

  function dailyHistoryView() {
    const allowed = state.user.role === 'vet' || state.user.role === 'superadmin';
    const list = allowed ? state.db.clinical
    .filter(record => (state.user.role === 'superadmin' || record.vetId === state.user.vetId) && record.date === today() && record.waitingEntryId)
    .sort((a, b) => (b.time || '').localeCompare(a.time || '')) : [];
    return {
      view: 'DailyHistoryView',
      props: {
        clinicName: state.db.config.name,
        allowed,
        isSuperadmin: state.user.role === 'superadmin',
        rows: list.map(record => {
          const pet = find('pets', record.petId);
          return {
            record,
            pet,
            ownerName: find('owners', record.ownerId || pet?.ownerId)?.name || 'No disponible',
            ticket: record.ticketId ? ticket(record.ticketId) : null,
            medications: normMeds(record.medications)
          };
        }),
        onAction: (...args) => runAction(...args)
      }
    };
  }

  function notificationsView() {
    return {
      view: 'NotificationsView',
      props: {
        clinicName: state.db.config.name,
        rows: notifications().slice().reverse().map(notification => ({ notification, date: new Date(notification.date).toLocaleString('es-AR'), read: notification.readBy.includes(state.user.id) })),
        onAction: runAction
      }
    };
  }

  function renderContent() {
    let screen;
    switch (route) {
      case 'home': screen = home(); break;
      case 'pets': petsView(); return;
      case 'pet': screen = petProfile(); break;
      case 'owner': screen = ownerProfile(selectedPet); break;
      case 'ownerProfile': screen = ownerProfile(state.user.ownerId); break;
      case 'vet': screen = vetProfile(); break;
      case 'agenda': screen = agendaView(); break;
      case 'schedules': screen = schedulesView(); break;
      case 'products': catalog(); return;
      case 'notices': noticesView(); return;
      case 'notifications': screen = notificationsView(); break;
      case 'reminders': screen = remindersView(); break;
      case 'waitingRoom': screen = waitingRoomView(); break;
      case 'dailyHistory': screen = dailyHistoryView(); break;
      case 'settings':
        screen = { view: 'SettingsView', props: { clinicName: state.db.config.name, config: state.db.config, onAction: runAction } };
        break;
      default: screen = genericView(route);
    }
    ui.showView($('#content'), screen.view, screen.props);
    if (route === 'settings') noticesView(true);
  }

  function editForm(collection, id = '', preset = {}) {
    if (!mayEdit(collection, id)) return toast('No tenés permisos para realizar esta acción.');
    const item = id ? find(collection, id) : preset;
    if (!item) return;
    const names = {
      pets: 'mascota', owners: 'propietario', vets: 'veterinario', services: 'servicio',
      schedules: 'horario', products: 'producto', notices: 'aviso', users: 'usuario', reminders: 'recordatorio'
    };
    const roleOptions = state.user.role === 'admin'
    ? [['owner', roleNames.owner], ['vet', roleNames.vet]]
    : Object.entries(roleNames).filter(([value]) => value !== 'superadmin');
    modal(`${id ? 'Editar' : 'Crear'} ${names[collection]}`, {
      view: 'EntityForm',
      props: {
        collection,
        item,
        id,
        owners: activeOptions('owners'),
        vets: activeOptions('vets'),
        services: activeOptions('services'),
        pets: pets().map(pet => [pet.id, pet.name]),
        dayNames,
        careCategories: CARE_CATEGORIES.map(entry => entry[0]),
        roleOptions,
        serviceVetIds: collection === 'services' ? state.db.vets.filter(vet => vet.serviceIds.includes(id)).map(vet => vet.id) : [],
        today: today(),
        defaultDuration: state.db.config.duration,
        maxMoney: MAX_MONEY,
        reminderCategory: item.category || careCategoryFromText(item.title),
        onAction: runAction
      }
    });
  }

  function clinicalForm(petId) {
    const pet = find('pets', petId);
    if (state.user.role === 'owner' || !canPet(pet)) return;

    modal('Registrar atención clínica', {
      view: 'ClinicalForm',
      props: {
        pet,
        responsibleName: state.user.name,
        administrative: isAdmin(),
        today: today(),
        categories: CARE_CATEGORIES.map(entry => entry[0]),
        onAction: (...args) => runAction(...args)
      }
    });
  }

  // ATENCIÓN VETERINARIA (conectada a la sala de espera de Administración)

  function attentionModal(entryId = '', clinicalId = '') {
    if (state.user.role !== 'vet' && state.user.role !== 'superadmin') return;

    const entry = entryId ? (state.db.waitingRoom || []).find(item => item.id === entryId) : null;
    const record = clinicalId ? find('clinical', clinicalId) : null;
    if (!entry && !record) return toast('La atención no está disponible.');
    const pet = find('pets', entry?.petId || record?.petId);
    if (!pet || !canPet(pet)) return;

    const age = Math.max(0, Math.floor((Date.now() - new Date(pet.birth + 'T12:00:00')) / 31557600000));
    const history = state.db.clinical
    .filter(item => item.petId === pet.id && item.id !== clinicalId)
    .sort((a, b) => b.date.localeCompare(a.date));
    const medications = normMeds(record?.medications).length ? normMeds(record.medications) : [{}];
    attendType = record?.type === 'Vacuna' ? 'Vacuna' : 'Consulta';
    const hasAttItems = !!(record?.attObservations || record?.attProcedures || record?.attTreatments || record?.attIndications || record?.attRecommendations);

    modal(record ? 'Editar atención veterinaria' : 'Atención veterinaria · ' + pet.name, {
      view: 'AttentionForm',
      props: {
        pet,
        age,
        record,
        entryId,
        clinicalId,
        history: history.map(item => clinicalCard(item).props),
        initialReason: record?.reason || entry?.reason || '',
        legacyPerformed: record && !hasAttItems ? (record.performed || '') : '',
        medications,
        today: today(),
        categories: CARE_CATEGORIES.map(entry => entry[0]),
        formatDate: pretty,
        onTypeChange: value => { attendType = value; },
        onAction: (...args) => runAction(...args)
      }
    });
  }

  // IDENTIFICACIÓN QR SIMULADA

  function qrSvg(pet) {
    const rectangles = simulatedQrCells(pet.qr).map(({ x, y }) => `
          <rect x="${x}" y="${y}" width="1" height="1"/>
        `).join('');
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 37 37">
      <rect width="37" height="37" fill="white"/>
      <g fill="#1F2E5A">${rectangles}</g>
    </svg>
  `;
  }

  // IMPRESIÓN DE HISTORIA CLÍNICA (PROPIETARIO).
  // Abre la historia visible de la mascota en un modal listo para
  // imprimir (el CSS de impresión solo muestra el diálogo abierto, por
  // eso no se imprime directo desde la ficha). Se imprime la sección
  // actual (Historia clínica = todo, o el filtro elegido).
  function printHistoryModal(petId) {
    const pet = find('pets', petId);
    if (!pet || !canPet(pet)) return;
    const owner = find('owners', pet.ownerId);
    const age = Math.max(0, Math.floor((Date.now() - new Date(pet.birth + 'T12:00:00')) / 31557600000));
    const sectionType = { Vacunas: 'Vacuna', Tratamientos: 'Tratamiento', Desparasitación: 'Desparasitación', Pipetas: 'Pipeta', Estudios: 'Estudio' }[petTab];
    const records = state.db.clinical
    .filter(record => record.petId === pet.id && (state.user.role !== 'owner' || record.visible) && (!sectionType || record.type === sectionType))
    .sort((a, b) => b.date.localeCompare(a.date));
    modal(`Historia clínica · ${pet.name}`, {
      view: 'ClinicalHistoryPrint',
      props: {
        pet,
        ownerName: owner?.name || 'No disponible',
        age,
        tab: petTab,
        records: records.map(record => clinicalRecordProps(record)),
        issuedDate: new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }),
        onAction: runAction
      }
    });
  }

  function showQR(id, print = false) {
    const pet = find('pets', id);
    if (!canPet(pet)) return;
    modal('Identificación de mascota', {
      view: 'PetQrDialog',
      props: { pet, cells: simulatedQrCells(pet.qr), onAction: runAction }
    });
    if (print) window.print();
  }

  // ESCANEO DE INGRESO (ADMINISTRADOR)
  // Simula el escaneo del QR de una mascota desde recepción/administración
  // para hacerla ingresar a la sala de espera. No requiere cámara real:
  // el administrador selecciona el QR existente de la mascota a ingresar
  // o tipea su código de 5 dígitos (ideal para PC sin escáner).

  function scanModal() {
    const options = pets().filter(pet => pet.active);
    modal('Escanear QR / Ingresar código', {
      view: 'QrScanDialog',
      props: {
        rows: options.map(pet => ({ pet, ownerName: label('owners', pet.ownerId), busy: activeEntry(pet.id) })),
        onAction: runAction
      }
    });
  }

  function scanResultModal(petId) {
    const pet = find('pets', petId);
    if (!pet) return toast('No se encontró una mascota con ese código QR.');
    const owner = find('owners', pet.ownerId);
    const existing = activeEntry(pet.id);
    if (existing) {
      modal(existing.status === 'Esperando' ? 'Esta mascota ya está esperando' : 'Esta mascota ya tiene un ingreso activo', {
        view: 'ScanResultDialog',
        props: { pet, owner, existing, entryTime: entryTime(existing), onAction: runAction }
      });
      return;
    }
    const age = Math.max(0, Math.floor((Date.now() - new Date(pet.birth + 'T12:00:00')) / 31557600000));
    modal('Mascota identificada', {
      view: 'ScanResultDialog',
      props: { pet, owner, age, onAction: runAction }
    });
  }

  // MOTIVO DE INGRESOS YA CREADOS (ADMINISTRADOR).
  // Los ingresos anteriores al campo motivo quedaron con reason=''.
  // Con esto Administración puede cargarlo/editarlo y el veterinario
  // lo ve precargado al atender (Atender → Registrar atención).
  function entryReasonModal(entryId) {
    const entry = (state.db.waitingRoom || []).find(item => item.id === entryId);
    if (!entry) return toast('Ingreso no disponible.');
    const pet = find('pets', entry.petId);
    modal(`Motivo de consulta · ${entry.petName}`, {
      view: 'EntryReasonDialog',
      props: { entry, pet, entryTime: entryTime(entry), onAction: runAction }
    });
  }

  // TICKET A COBRAR (ADMINISTRADOR).
  // Una sola tarjeta con código del ticket, mascota, código, propietario
  // (solo nombre), fecha, hora y motivo. Administración carga el precio
  // de cada medicamento y el total se genera automáticamente.
  // El veterinario nunca ve estos precios.
  // Administración NO edita nombre ni cantidad: solo visualiza lo que
  // cargó el veterinario y pone el precio de cada medicamento.

  // Suma en vivo todos los precios del modal de cobro (medicamentos +
  // monto por atención) y actualiza el total automático.

  function chargeTicketModal(ticketId) {
    const ticketItem = ticket(ticketId);
    if (!ticketItem || ticketItem.status !== 'Pendiente de cobro') return toast('Ticket no disponible para el cobro.');
    const medications = normMeds(ticketItem.medications).map(medication => ({
      name: medication.name || '', quantity: medication.quantity || '', dose: medication.dose || '',
      route: medication.route || '', notes: medication.notes || '', price: medication.price ?? ''
    }));
    modal('Cobrar ticket ' + ticketItem.number, {
      view: 'ChargeTicketForm',
      props: {
        ticket: ticketItem,
        pet: find('pets', ticketItem.petId),
        owner: find('owners', ticketItem.ownerId),
        medications,
        maxMoney: MAX_MONEY,
        formatDate: pretty,
        formatMoney: money,
        onAction: (...args) => runAction(...args)
      }
    });
  }

  // TICKET GUARDADO / PAGADO (ADMINISTRADOR).
  // Una sola tarjeta: código del ticket, mascota, código, propietario
  // (solo nombre), medicamentos con dosis y precio a la par, y total.
  function ticketDetailModal(ticketId) {
    const ticketItem = ticket(ticketId);
    if (!ticketItem) return toast('Ticket no disponible.');
    const paid = ['Pagado', 'Cobrado'].includes(ticketItem.status);
    modal((paid ? 'Comprobante de pago' : 'Detalle del ticket') + ' · ' + ticketItem.number, {
      view: 'TicketReceipt',
      props: {
        clinicName: state.db.config?.name,
        ticket: ticketItem,
        pet: find('pets', ticketItem.petId),
        owner: find('owners', ticketItem.ownerId),
        paid,
        paidAtLabel: ticketItem.paidAt ? new Date(ticketItem.paidAt).toLocaleString('es-AR') : '',
        medications: normMeds(ticketItem.medications),
        formatDate: pretty,
        formatMoney: money,
        onAction: (...args) => runAction(...args)
      }
    });
  }

  function publicProfile(id) {
    const pet = find('pets', id);
    if (!pet) return;
    const avatar = findPetAvatar(pet.avatarId);
    const useAvatar = Boolean(avatar && (pet.imagePreference === 'avatar' || !pet.photo));
    modal('Identificación pública', {
      view: 'PublicPetDialog',
      props: {
        pet,
        image: {
          src: (useAvatar ? avatar.src : pet.photo) || '',
          alt: String(pet.name ?? '') + (useAvatar ? ' · ' + avatar.label : ''),
          isAvatar: useAvatar
        },
        onAction: runAction
      }
    });
  }

  async function clinicData(form) {
    const fields = new FormData(form);
    const data = validateClinicData(Object.fromEntries(fields), fields.getAll('days'));

    data.logo =
    await imageData(form.elements.logo.files[0]) ||
    state.db.config?.logo ||
    draft.config?.logo ||
    '';

    return data;
  }

  async function saveEntity(form) {
    const [collection, id] = form.dataset.id.split(':');
    const fields = new FormData(form);
    const ok = await entities.saveEntity({ collection, id, data: Object.fromEntries(fields), serviceIds: fields.getAll('serviceIds'), vetIds: fields.getAll('vetIds'), photoFile: form.elements.photo?.files[0], hasPhotoField: Boolean(form.elements.photo) });
    if (ok) {
      close();
      shell();
      toast('Registro guardado correctamente.');
    }
  }

  // ENVÍO DE FORMULARIOS

  async function submitForm(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    switch (form.dataset.form) {
      case 'setup':
        draft.config = await clinicData(form);
        authStep = 1;
        setup();
        break;

      case 'verify':
        verifyCode(data.code);

        if (authStep === 1) {
          authStep = 2;
          setup();
        } else if (authStep === 3) {
          if (storage.initialize(draft.config, draft.admin)) {
            authStep = 4;
            setup();
          }
        }
        break;

      case 'admin':
        draft.admin = prepareAdministrator(data);

        authStep = 3;
        setup();
        break;

      case 'login': {
        auth.signIn(data);

        const qr = new URLSearchParams(
          location.hash.slice(1)
        ).get('qr');

        const pet = state.db.pets.find(item => item.qr === qr);

        if (pet && canPet(pet)) {
          navigate('pet', pet.id);
        } else {
          navigate(state.user.role === 'owner' ? 'pets' : 'home');
        }
        break;
      }

      case 'recover': {
        const result = auth.recover(data);
        if (result === 'updated') { login(); toast('Contraseña actualizada correctamente.'); }
        else if (result) recoverScreen();
        break;
      }

      case 'settings': {
        if (administration.updateConfiguration(draft.nextConfig)) { shell(); toast('Configuración actualizada.'); }
        break;
      }

      case 'entity':
        await saveEntity(form);
        break;

      case 'admin-code': {
        const pet = people.identifyCode(data.code);
        scanResultModal(pet.id);
        break;
      }

      case 'admin-entry': {
        const result = clinical.addEntry(form.dataset.id, data.reason);
        if (result?.duplicate) { close(); navigate('waitingRoom'); return toast('Esta mascota ya tiene un ingreso activo en la sala de espera.'); }
        if (result) { close(); navigate('waitingRoom'); toast(`${result.pet.name} ingresó a la sala de espera.`); }
        break;
      }

      case 'admin-entry-reason': {
        if (clinical.updateEntryReason(form.dataset.id, data.reason)) { close(); renderContent(); toast('Motivo de consulta guardado. El veterinario lo verá al atender.'); }
        break;
      }

      case 'charge': {
        const fields = Object.fromEntries(['med-name[]', 'med-quantity[]', 'med-dose[]', 'med-route[]', 'med-notes[]', 'med-price[]'].map(name => [name, formData.getAll(name)]));
        fields.serviceAmount = formData.get('serviceAmount');
        const chargedTicket = tickets.charge(form.dataset.id, fields);
        if (chargedTicket) { renderContent(); ticketDetailModal(chargedTicket.id); toast(`Cobro registrado: ${money(chargedTicket.total)}.`); }
        break;
      }

      case 'agenda-note': {
        const date = agenda.saveNote(form.dataset.id, data);
        if (date) { agendaDate = date; close(); navigate('agenda'); toast('Anotación guardada en tu agenda.'); }
        break;
      }

      case 'owner-reminder': {
        const date = agenda.saveOwnerReminder(form.dataset.id, data);
        if (date) { ownerCalSelected = date; ownerCalMonth = date.slice(0, 7); close(); renderContent(); toast('Recordatorio guardado en tu calendario.'); }
        break;
      }

      case 'clinical': {
        const petId = clinical.saveClinicalRecord(form.dataset.id, data);
        if (petId) { close(); navigate('pet', petId); petTab = 'Historia clínica'; renderContent(); toast('Atención registrada correctamente.'); }
        break;
      }

      case 'attention': {
        const [entryId, clinicalId] = form.dataset.id.split('|');
        const result = clinical.saveAttention({ entryId, clinicalId, data, attendType, medicationFields: { names: formData.getAll('med-name[]'), doses: formData.getAll('med-dose[]'), quantities: formData.getAll('med-quantity[]'), routes: formData.getAll('med-route[]'), notes: formData.getAll('med-notes[]') } });
        if (result?.ok) {
          const existing = result.existing;
          close(); navigate('dailyHistory');
          const paid = existing && ['Pagado', 'Cobrado'].includes(ticket(existing.ticketId)?.status);
          toast(paid ? 'Historia clínica actualizada. El ticket pagado conserva los datos del cobro.' : result.isVaccine
            ? (existing ? 'Vacuna actualizada. El ticket quedó para Administración.' : 'Vacuna guardada. El ticket quedó para Administración y se programó la próxima aplicación.')
            : (existing ? 'Atención actualizada correctamente.' : 'Consulta guardada. La atención terminó y el ticket quedó para Administración.'));
        }
        break;
      }

      case 'inline-owner': { const owner = entities.createOwner(data);
        if (owner) {
          editForm('pets', '', {
            ...draft.pet,
            ownerId: owner.id
          });

          toast('Propietario creado. Completá la mascota.');
        } break; }

      case 'reset-password':
        if (auth.resetPassword(form.dataset.id, data)) { close(); toast('Contraseña restablecida.'); }
        break;
    }
  }

  // ACCIONES DE BOTONES

  function runAction(name, id = '', element) {
    const run = () => action(name, id, element);
    return (name === 'vet-attend' ? withDataLock(run) : run()).catch(error => toast(error.message));
  }

  async function action(actionName, id, element) {
    switch (actionName) {
      case 'close':
        close();
        break;

      case 'resend':
        toast('Código simulado reenviado: ' + CODE);
        break;

      case 'login':
        login();
        break;

      case 'recover':
        state.recovery = null;
        recoverScreen();
        break;

      case 'show-password': {
        const input = $('input[name=password]');

        input.type = input.type === 'password'
        ? 'text'
        : 'password';

        element.textContent = input.type === 'password'
        ? 'Mostrar contraseña'
        : 'Ocultar contraseña';
        break;
      }

      case 'demo': {
        const form = $('form[data-form=login]');
        form.elements.email.value = id;
        form.elements.password.value = '123456';
        break;
      }

      case 'logout':
        state.user = null;
        selectedPet = null;
        agendaDate = today();
        agendaMode = 'month';
        close();

        history.replaceState(
          null,
          '',
          location.pathname + location.search
        );

        login();
        break;

      case 'menu':
        $('.sidebar').classList.toggle('open');
        break;

      case 'theme':
        toggleTheme();
        break;

      case 'nav':
        if (allowed[state.user.role].includes(id)) {
          navigate(id);
        }
        break;

      case 'pet':
      case 'owner':
      case 'vet':
        close();
        navigate(actionName, id);
        break;

      // --- Personalización de tarjetas de mascota (solo Propietario) ---

      case 'owner-pet-photo': {
        const pet = find('pets', id);

        if (!canPet(pet) || state.user?.role !== 'owner') return;

        ownerPetImageModal(pet);
        break;
      }

      case 'owner-pet-upload': {
        const pet = find('pets', id);

        if (!canPet(pet) || state.user?.role !== 'owner') return;

        ownerPhotoTargetId = id;
        close();
        $('#owner-pet-photo-input')?.click();
        break;
      }

      case 'owner-pet-avatar-pick': { const pet = people.selectAvatar(id);
        if (pet) {
          close();
          renderContent();
          toast(`Ícono de ${pet.name} actualizado.`);
        } break; }

      case 'owner-pet-use-photo': { const pet = people.usePhoto(id);
        if (pet) {
          close();
          renderContent();
          toast(`Foto de ${pet.name} actualizada.`);
        } break; }

      case 'owner-pet-color': {
        const pet = find('pets', id);

        if (!canPet(pet) || state.user.role !== 'owner') return;

        ownerColorPicker = ownerColorPicker === id ? '' : id;
        renderContent();
        break;
      }

      case 'owner-pet-color-pick': {
        if (people.changeCardColor(id)) { ownerColorPicker = ''; renderContent(); }
        break;
      }

      case 'tab':
        petTab = id;
        renderContent();
        break;

      case 'page':
        page = Number(id);
        renderContent();
        break;

      case 'create':
        editForm(id);
        break;

      case 'edit': {
        const [collection, recordId] = id.split(':');
        editForm(collection, recordId);
        break;
      }

      case 'pet-owner':
        editForm('pets', '', { ownerId: id });
        break;

      case 'inline-owner':
        draft.pet = Object.fromEntries(
          new FormData($('#modal form'))
        );

        delete draft.pet.photo;

        modal(
          'Registrar propietario',
          { view: 'InlineOwnerForm', props: { onAction: runAction } }
        );
        break;

      case 'toggle': {
        const [collection, recordId] = id.split(':');

        if (!mayEdit(collection, recordId)) return;

        const row = find(collection, recordId);

        if (!row) return;

        if (
          collection === 'users' &&
          (row.id === state.user.id || row.principal)
        ) {
          return toast(
            'No se puede desactivar al administrador principal ni tu propia cuenta.'
          );
        }

        modal(
          row.active ? 'Desactivar registro' : 'Activar registro',
          { view: 'ConfirmationDialog', props: { message: `¿Querés ${row.active ? 'desactivar' : 'activar'} ${row.name || row.title || 'este horario'}?`, description: "Se conservará el historial de los registros vinculados.", confirmLabel: 'Confirmar', confirmAction: 'toggle-confirm', confirmId: id, onAction: runAction } }
        );
        break;
      }

      case 'toggle-confirm': { if (entities.toggleActive(id)) {
          close();
          shell();
          toast('Estado actualizado.');
        } break; }

      case 'delete-notice':
        if (isAdmin()) {
          modal(
            'Eliminar aviso',
            { view: 'ConfirmationDialog', props: { message: "¿Querés eliminar este aviso?", confirmLabel: 'Eliminar', confirmAction: 'delete-notice-confirm', confirmId: id, confirmClass: 'danger', onAction: runAction } }
          );
        }
        break;

      case 'delete-notice-confirm': {
        if (administration.deleteNotice(id)) { close(); shell(); toast('Aviso eliminado.'); }
        break;
      }

      case 'agenda-new':
        agendaNoteForm();
        break;

      case 'agenda-new-day':
        if (canUsePersonalAgenda() && validAgendaDate(id)) {
          agendaDate = id;
          agendaNoteForm();
        }
        break;

      case 'agenda-edit':
        agendaNoteForm(id);
        break;

      case 'agenda-open': {
        const entry = personalAgendaEntry(id);
        if (!entry) return;
        agendaDate = entry.date;
        navigate('agenda');
        break;
      }

      case 'agenda-day':
        if (canUsePersonalAgenda() && validAgendaDate(id)) {
          agendaDate = id;
          renderContent();
        }
        break;

      case 'agenda-period': {
        if (!canUsePersonalAgenda() || !['-1', '0', '1'].includes(id)) return;
        let nextDate;
        if (id === '0') {
          nextDate = today();
        } else if (agendaMode === 'month') {
          nextDate = calShiftMonth(agendaDate.slice(0, 7), Number(id)) + '-01';
        } else {
          nextDate = addDays(agendaDate, Number(id) * (agendaMode === 'week' ? 7 : 1));
        }
        if (!validAgendaDate(nextDate)) return;
        agendaDate = nextDate;
        renderContent();
        break;
      }

      case 'agenda-toggle': { const entry = agenda.toggleNote(id);
        if (entry) {
          renderContent();
          toast(entry.done ? 'Recordatorio completado.' : 'Recordatorio marcado como pendiente.');
        } break; }

      case 'agenda-delete': {
        const entry = personalAgendaEntry(id);
        if (!entry) return;
        modal('Eliminar anotación', { view: 'ConfirmationDialog', props: { prefix: "¿Querés eliminar ", boldText: entry.title, suffix: " de tu agenda?", backLabel: 'Cancelar', confirmLabel: 'Eliminar', confirmAction: 'agenda-delete-confirm', confirmId: entry.id, confirmClass: 'danger', onAction: runAction } });
        break;
      }

      case 'agenda-delete-confirm': { if (agenda.deleteNote(id)) {
          close();
          renderContent();
          toast('Anotación eliminada.');
        } break; }

      case 'clinical':
        clinicalForm(id);
        break;

      case 'read': {
        if (administration.markRead(id)) shell();
        break;
      }

      case 'read-all': {
        if (administration.markAllRead()) shell();
        break;
      }

      case 'cal-prev':
      case 'cal-next':
        if (state.user.role !== 'owner') break;
        ownerCalMonth = calShiftMonth(ownerCalMonth, actionName === 'cal-next' ? 1 : -1);
        renderContent();
        break;

      case 'cal-today':
        if (state.user.role !== 'owner') break;
        ownerCalMonth = today().slice(0, 7);
        ownerCalSelected = today();
        renderContent();
        break;

      case 'cal-day':
        if (state.user.role !== 'owner' || !/^\d{4}-\d{2}-\d{2}$/.test(String(id))) break;
        ownerCalSelected = id;
        ownerCalMonth = id.slice(0, 7);
        renderContent();
        break;

      case 'cal-new':
        ownerReminderForm('', id);
        break;

      case 'cal-edit':
        ownerReminderForm(id);
        break;

      case 'cal-delete':
        if (state.user.role !== 'owner') break;
        modal(
          'Eliminar recordatorio',
          { view: 'ConfirmationDialog', props: { message: "¿Querés eliminar este recordatorio de tu calendario?", confirmLabel: 'Eliminar', confirmAction: 'cal-delete-confirm', confirmId: id, confirmClass: 'danger', onAction: runAction } }
        );
        break;

      case 'cal-delete-confirm': { if (agenda.deleteOwnerReminder(id)) {
          close();
          renderContent();
          toast('Recordatorio eliminado.');
        } break; }

      case 'reminder-done': {
        if (agenda.toggleReminder(id)) shell();
        break;
      }

      case 'qr':
        showQR(id);
        break;

      case 'print-qr':
        showQR(id, true);
        break;

      case 'print-history':
        printHistoryModal(id);
        break;

      case 'print':
        window.print();
        break;

      case 'download-qr': {
        const pet = find('pets', id);

        if (!canPet(pet)) return;

        const url = URL.createObjectURL(
          new Blob([qrSvg(pet)], { type: 'image/svg+xml' })
        );

        const link = document.createElement('a');

        link.href = url;
        link.download =
        'QR-simulado-' +
        pet.name.replace(/[^a-z0-9]/gi, '-') +
        '.svg';

        link.click();

        setTimeout(() => URL.revokeObjectURL(url), 1000);
        break;
      }

      case 'scan': {
        const pet = id
        ? find('pets', id)
        : pets().find(item => item.active);

        if (!pet) {
          return toast(
            'No hay una mascota disponible para el escaneo.'
          );
        }

        close();

        if (canPet(pet)) {
          navigate('pet', pet.id);
        } else {
          publicProfile(pet.id);
        }
        break;
      }

      case 'admin-scan':
        if (!isAdmin()) return;
        scanModal();
        break;

      case 'admin-scan-pick':
        if (!isAdmin()) return;
        scanResultModal(id);
        break;

      case 'admin-confirm-entry': {
        if (!isAdmin()) return;

        const pet = find('pets', id);

        if (!pet) return toast('Mascota no disponible.');

        if (activeEntry(pet.id)) {
          close();
          navigate('waitingRoom');
          return toast('Esta mascota ya tiene un ingreso activo en la sala de espera.');
        }

        // Compatibilidad: el ingreso ahora pide motivo (form admin-entry).
        // Si se dispara la acción directa, se lee el motivo del modal.
        const modalReason = $('#modal [name="reason"]')?.value?.trim() || '';

        if (!modalReason) {
          return toast('Ingresá el motivo de consulta informado al llegar.');
        }

        if (clinical.addEntry(id, modalReason)) { close(); navigate('waitingRoom'); toast(`${pet.name} ingresó a la sala de espera.`); }
        break;
      }

      case 'admin-cancel-entry': { if (clinical.cancelEntry(id)) {
          renderContent();
          toast('Se canceló el ingreso a la sala de espera.');
        } break; }

      case 'admin-edit-reason':
        if (!isAdmin()) return;
        entryReasonModal(id);
        break;

      case 'admin-charge': {
        if (!isAdmin()) return;

        // Abre el ticket para que Administración vea fecha, hora y datos de
        // la atención, cargue el precio de cada medicamento (total
        // automático) y confirme el cobro.
        chargeTicketModal(id);
        break;
      }

      case 'admin-ticket': {
        if (!isAdmin()) return;

        // Ver el ticket guardado (pagado o pendiente) con medicamento +
        // precio, total, propietario, QR y códigos.
        ticketDetailModal(id);
        break;
      }

      case 'admin-charge-add-row': {
        // Deshabilitado: Administración no agrega conceptos.
        // Solo cobra los medicamentos que indicó el veterinario.
        break;
      }

      case 'admin-charge-remove-row': {
        // Deshabilitado: no se pueden quitar medicamentos del veterinario.
        break;
      }

      case 'admin-release-entry': { if (clinical.releaseEntry(id)) {
          renderContent();
          toast('El ingreso volvió a la espera. Ya se puede atender de nuevo.');
        } break; }

      case 'admin-clear-paid':
        if (!isAdmin()) return;

        modal(
          'Quitar finalizados',
          { view: 'ConfirmationDialog', props: { message: "¿Querés quitar de la sala los ingresos ya cobrados? Se conserva la historia clínica y los tickets.", confirmLabel: 'Quitar', confirmAction: 'admin-clear-paid-confirm', confirmClass: 'danger', onAction: runAction } }
        );
        break;

      case 'admin-clear-paid-confirm': {
        if (clinical.clearPaidEntries()) { close(); renderContent(); toast('Se quitaron los ingresos finalizados.'); }
        break;
      }

      case 'vet-attend': {
        const result = clinical.takeEntry(id);
        if (result?.unavailable) { renderContent(); return toast('Este paciente ya no está en espera.'); }
        if (result) { renderContent(); attentionModal(result.entry.id); }
        break;
      }

      case 'vet-edit-attention': {
        const record = clinical.editableAttention(id); if (record) attentionModal('', record.id);
        break;
      }

      case 'public':
        publicProfile(id);
        break;

      case 'public-login':
        state.user = null;
        close();

        history.replaceState(
          null,
          '',
          location.pathname +
          location.search +
          '#qr=' +
          encodeURIComponent(id)
        );

        login();
        break;

      case 'reset-password':
        if (isAdmin()) {
          modal(
            'Restablecer contraseña (simulado)',
            { view: 'ResetPasswordForm', props: { accountId: id, onAction: runAction } }
          );
        }
        break;
    }
  }

  // EVENTOS GENERALES

  ui.on('click', event => {
    const element = event.target.closest('[data-action]');

    if (!element) return;

    const run = () => action(element.dataset.action, element.dataset.id, element);
    (element.dataset.action === 'vet-attend' ? withDataLock(run) : run()).catch(error => toast(error.message));
  });

  ui.on('submit', async event => {
    const form = event.target;

    if (!form.matches('form[data-form]')) return;

    event.preventDefault();

    const errorElement = form.querySelector('[data-form-error]');
    if (errorElement) errorElement.textContent = '';

    const submit = form.querySelector('[type=submit]');
    submit.disabled = true;

    try {
      if (form.dataset.form === 'settings') {
        draft.nextConfig = await clinicData(form);
      }

      if (['attention', 'charge'].includes(form.dataset.form)) await withDataLock(() => submitForm(form));
      else await submitForm(form);
    } catch (error) {
      fail(form, error.message || 'No se pudo completar la operación.');
    } finally {
      if (submit.isConnected) {
        submit.disabled = false;
      }
    }
  });

  ui.on('input', event => {
    const input = event.target;
    if (input.dataset?.digits) input.value = input.value.replace(/\D/g, '').slice(0, Number(input.dataset.digits));
    if (input.hasAttribute?.('data-person-name')) input.value = input.value.replace(/[^\p{L}\p{M} '\u2019-]/gu, '');
    if (input.hasAttribute?.('data-phone')) input.value = input.value.replace(/[^\d+ ()-]/g, '');

    if (event.target.id === 'list-search') {
      query = event.target.value;
      page = 1;

      const position = event.target.selectionStart;

      renderContent();

      $('#list-search').focus();
      $('#list-search').setSelectionRange(position, position);
    }

  });

  ui.on('change', event => {
    const element = event.target;

    if (element.id === 'owner-pet-photo-input') {
      const file = element.files[0];
      const petId = ownerPhotoTargetId;
      element.value = '';
      ownerPhotoTargetId = '';

      if (!file || !petId) return;

      const pet = find('pets', petId);

      if (!canPet(pet) || state.user.role !== 'owner') return;

      imageData(file)
      .then(photo => {
        if (!photo) return;

        const pet = people.savePhoto(petId, photo);
        if (pet) { renderContent(); toast(`Foto de ${pet.name} actualizada.`); }
      })
      .catch(error => toast(error.message));

      return;
    }

    if (element.id === 'list-filter') {
      filter = element.value;
      page = 1;
      renderContent();
    }

    if (element.id === 'agenda-date') {
      if (!canUsePersonalAgenda() || !validAgendaDate(element.value)) return;
      agendaDate = element.value;
      renderContent();
    }

    if (element.id === 'agenda-mode') {
      if (!canUsePersonalAgenda() || !['day', 'week', 'month'].includes(element.value)) return;
      agendaMode = element.value;
      renderContent();
    }

    // Formulario de usuarios: el vínculo al perfil aparece según el rol.
    if (element.name === 'role') {
      const userForm = element.closest('form[data-form="entity"]');

      if (userForm && String(userForm.dataset.id || '').startsWith('users:')) {
        userForm.querySelectorAll('[data-role-link]').forEach(wrapper => {
          wrapper.hidden = wrapper.dataset.roleLink !== element.value;
          wrapper.querySelectorAll('input, select, textarea').forEach(control => { control.disabled = wrapper.hidden; });
        });
      }
    }
  });

  const onStorage = event => {
    if (event.key === THEME_KEY) {
      applyTheme(event.newValue === 'light' ? 'light' : 'dark');
      return;
    }

    if (event.key !== KEY) return;

    load();

    if (state.user) {
      const current = find('users', state.user.id);

      if (!auth.isAccountEnabled(current) || (LOCKED_ROLE && current.role !== LOCKED_ROLE)) {
        state.user = null;
        close();
        login();
        toast('La sesión ya no está habilitada.');
      } else {
        state.user = current;
        close();
        shell();
        toast('Datos actualizados desde otra pestaña.');
      }
    }
  };
  window.addEventListener('storage', onStorage);

  const { permissions, storage, people, agenda, clinical, tickets, entities, auth, administration } = createServices({ state, onError: toast, lockedRole: LOCKED_ROLE });
  const { isAdmin, canPet, mayEdit, canUsePersonalAgenda } = permissions;
  const { withDataLock, load, ensureSuperadmin } = storage;
  const { activeOptions, find, label, pets } = people;
  const { ownerCalItems, personalAgendaEntries, personalAgendaEntry, reminderList } = agenda;
  const { waitingRoomList, activeEntry, waitingRoomPending, waitingRoomActive } = clinical;
  const { ticket, pendingTickets } = tickets;
  const { notifications, unread, publishedSchedule, visibleNotices } = administration;

  // INICIO DE LA APLICACIÓN

  let initialTheme = currentTheme();
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') initialTheme = savedTheme;
  } catch { /* Aplicar el tema del documento si el almacenamiento no está disponible. */ }
  applyTheme(initialTheme);

  load();

  // Migración: las bases creadas antes del rol superadmin no tienen ese
  // usuario; se agrega silenciosamente para no bloquear el acceso total.
  ensureSuperadmin();

  if (state.db.configured) {
    login();

    const qr = new URLSearchParams(
      location.hash.slice(1)
    ).get('qr');

    if (qr) {
      const pet = state.db.pets.find(item => item.qr === qr);

      if (pet) {
        publicProfile(pet.id);
      }
    }
  } else {
    setup();
  }
  return () => { window.removeEventListener('storage', onStorage); };
}
