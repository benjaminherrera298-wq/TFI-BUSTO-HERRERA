import { createAttentionFacade } from './attentionFacade.js';
import { populateSamplePractice } from './samplePractice.js';
import { PET_AVATARS, findPetAvatar } from './petAvatars.js';

export function startVeterinaryApplication(ui) {
'use strict';

/*
  Sistema de Gestión Veterinaria.
  Prototipo local con HTML, CSS y JavaScript.
  Las cuentas, códigos y permisos son simulados.
  Módulo compartido de negocio y generadores de pantallas para Vue 3.
*/

const DEMO_ACCOUNTS = [
  {
    id: 'u-admin',
    name: 'Administrador demo',
    email: 'admin@veterinaria.com',
    password: '123456',
    role: 'admin',
    active: true
  },
  {
    id: 'u-v1',
    name: 'Lucía Martínez',
    email: 'doctor@veterinaria.com',
    password: '123456',
    role: 'vet',
    vetId: 'v1',
    active: true
  },
  {
    id: 'u-v2',
    name: 'Diego García',
    email: 'garcia@veterinaria.com',
    password: '123456',
    role: 'vet',
    vetId: 'v2',
    active: true
  },
  {
    id: 'u-v3',
    name: 'Ana López',
    email: 'lopez@veterinaria.com',
    password: '123456',
    role: 'vet',
    vetId: 'v3',
    active: true
  },
  {
    id: 'u-v4',
    name: 'Pablo Rodríguez',
    email: 'rodriguez@veterinaria.com',
    password: '123456',
    role: 'vet',
    vetId: 'v4',
    active: true
  },
  {
    id: 'u-o1',
    name: 'Benjamín Herrera',
    email: 'cliente@correo.com',
    password: '123456',
    role: 'owner',
    ownerId: 'o1',
    active: true
  },
  {
    id: 'u-super',
    name: 'Superadmin',
    email: 'superadmin@veterinaria.com',
    password: '123456',
    role: 'superadmin',
    active: true
  }
];

const KEY = 'veterinaria-prototipo-v1';
const CODE = '123456';

const $ = selector => ui.root.querySelector(selector);
const $$ = selector => [...ui.root.querySelectorAll(selector)];

const esc = value => String(value ?? '').replace(
  /[&<>"']/g,
  character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character])
);

const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);

const dayNames = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
];

const localDate = date =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const today = () => localDate(new Date());

const addDays = (dateString, amount) => {
  const date = new Date(dateString + 'T12:00:00');
  date.setDate(date.getDate() + amount);
  return localDate(date);
};

const pretty = date => date
  ? new Date(date + 'T12:00:00').toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  : '—';

const minutes = time =>
  Number(time.split(':')[0]) * 60 + Number(time.split(':')[1]);

const clock = value =>
  `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;

const money = value =>
  Number(value || 0).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  });

const roleNames = {
  admin: 'Administrador',
  vet: 'Veterinario',
  owner: 'Propietario',
  superadmin: 'Superadmin'
};

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
    meta.content = theme === 'dark' ? '#0B1226' : '#1F2E5A';
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

function themeButtonContent() {
  return `<span class="theme-track" aria-hidden="true">
    <span class="theme-thumb"></span>
    <svg class="icon theme-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>
    <svg class="icon theme-moon" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
  </span>`;
}

function themeButton(extraClass = '') {
  const theme = currentTheme();

  return `
    <button
      type="button"
      class="theme-toggle ${extraClass}"
      data-action="theme"
      role="switch"
      aria-checked="${theme === 'dark'}"
      aria-label="${theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}"
      title="${theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}"
    >${themeButtonContent()}</button>
  `;
}

function isAdmin() {
  return !!user && (user.role === 'admin' || user.role === 'superadmin');
}

const navs = {
  home: ['Inicio', 'home'],
  pets: ['Mascotas', 'pet'],
  owners: ['Propietarios', 'users'],
  vets: ['Veterinarios', 'medical'],
  agenda: ['Agenda', 'calendar'],
  schedules: ['Horarios', 'clock'],
  services: ['Servicios', 'medical'],
  products: ['Catálogo', 'bag'],
  notices: ['Avisos', 'megaphone'],
  notifications: ['Notificaciones', 'bell'],
  reminders: ['Recordatorios', 'clock'],
  waitingRoom: ['Sala de espera', 'waiting'],
  dailyHistory: ['Historia clínica del día', 'medical'],
  users: ['Usuarios', 'users'],
  settings: ['Configuración', 'settings']
};

const allowed = {
  admin: Object.keys(navs).filter(key =>
    key !== 'reminders' && key !== 'owners' && key !== 'dailyHistory'
  ),
  superadmin: Object.keys(navs),
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

let db;
let user = null;
let route = 'home';
let selectedPet = null;
let petTab = 'Resumen';
let page = 1;
let query = '';
let filter = '';
let agendaDate = today();
let agendaMode = 'day';
let agendaVet = '';

// --- Calendario del propietario (Agenda) ---
let ownerCalMonth = today().slice(0, 7);
let ownerCalSelected = today();
let draft = {};
let authStep = 0;
let recovery = null;
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

const paths = {
  home: 'M3 10 12 3l9 7v11h-6v-7H9v7H3z',
  pet: 'M8 13c-2 1-5 6-1 7 2 1 3-1 5-1s3 2 5 1c4-1 1-6-1-7-2-2-6-2-8 0M5 7v2M10 4v3M15 4v3M20 7v2',
  users: 'M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8M18 3a4 4 0 0 1 0 8M22 21v-3a4 4 0 0 0-3-4',
  medical: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
  calendar: 'M4 5h16v16H4zM7 3v4M17 3v4M4 10h16M8 14h2M14 14h2M8 18h2',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M12 6v6l4 2',
  bag: 'M4 7h16l1 14H3zM8 7V5a4 4 0 0 1 8 0v2',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  megaphone: 'M3 9h5l12-5v16L8 15H3zM7 15l2 6h3l-2-5',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
  logout: 'M9 3H3v18h6M8 12h13M17 8l4 4-4 4',
  plus: 'M12 4v16M4 12h16',
  search: 'M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14M15 15l6 6',
  qr: 'M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6z',
  waiting: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M8 12h8M8 16h5M8 8h3',
  menu: 'M3 6h18M3 12h18M3 18h18',
  theme: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z'
};

// COMPONENTES Y UTILIDADES

function icon(name) {
  return `
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="${paths[name] || paths.medical}"/>
    </svg>
  `;
}

function button(text, actionName, id = '', className = '') {
  return `
    <button
      type="button"
      class="${className}"
      data-action="${actionName}"
      data-id="${esc(id)}"
    >${text}</button>
  `;
}

function field(name, text, value = '', type = 'text', extra = '') {
  return `
    <label class="field">
      ${text}
      <input
        name="${name}"
        type="${type}"
        value="${esc(value)}"
        ${extra}
      >
    </label>
  `;
}

function select(name, text, items, value = '', extra = '') {
  return `
    <label class="field">
      ${text}
      <select name="${name}" ${extra}>
        ${items.map(item => {
          const option = Array.isArray(item) ? item : [item, item];

          return `
            <option
              value="${esc(option[0])}"
              ${String(option[0]) === String(value) ? 'selected' : ''}
            >${esc(option[1])}</option>
          `;
        }).join('')}
      </select>
    </label>
  `;
}

function area(name, text, value = '') {
  return `
    <label class="field full">
      ${text}
      <textarea name="${name}">${esc(value)}</textarea>
    </label>
  `;
}

function checks(name, text, items, values = []) {
  return `
    <div class="field full">
      ${text}
      <div class="checklist">
        ${items.map(([value, labelText]) => `
          <label>
            <input
              type="checkbox"
              name="${name}"
              value="${esc(value)}"
              ${values.map(String).includes(String(value)) ? 'checked' : ''}
            >
            ${esc(labelText)}
          </label>
        `).join('')}
      </div>
    </div>
  `;
}

function activeOptions(collection) {
  return db[collection]
    .filter(item => item.active)
    .map(item => [item.id, item.name]);
}

function find(collection, id) {
  return db[collection].find(item => item.id === id);
}

// CÓDIGO DE IDENTIFICACIÓN DE 5 DÍGITOS (alternativa al QR).
// Cada mascota tiene `qr` (identificador largo) y `code` (5 dígitos
// para dictar en mostrador o tipear desde una PC sin cámara).
// Ambos identifican a la misma mascota y comparten el flujo de ingreso.
function newPetCode() {
  const used = new Set(
    (db?.pets || []).map(pet => String(pet.code || ''))
  );

  let code = '';

  do {
    code = String(Math.floor(10000 + Math.random() * 90000));
  } while (used.has(code));

  return code;
}

function ensurePetCodes() {
  if (!Array.isArray(db.pets)) return false;

  const used = new Set();
  let changed = false;

  db.pets.forEach(pet => {
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

  return (db.pets || []).find(pet => String(pet.code) === clean);
}

function label(collection, id) {
  return find(collection, id)?.name || 'Registro no disponible';
}

// Lista de medicamentos siempre como array de objetos.
// Datos viejos en localStorage pueden traer `medications` como string
// u otro tipo y eso rompía con "medications.map is not a function" al
// abrir Atender / historia / tickets. Si es string no vacío se conserva
// como [{name}]; si no es array se devuelve [].
function normMeds(value) {
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

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
    return true;
  } catch (error) {
    toast(
      'No se pudo guardar. Revisá el espacio disponible o los permisos del navegador.'
    );
    return false;
  }
}

function commit(callback) {
  const before = JSON.stringify(db);
  callback();

  if (persist()) return true;

  db = JSON.parse(before);
  return false;
}

function load() {
  try {
    db = JSON.parse(localStorage.getItem(KEY)) || { configured: false };
  } catch {
    db = { configured: false };
  }

  if (!db.configured) {
    db = seed({
      name: 'Veterinaria Los Aromos', identifier: 'Responsable de ejemplo',
      address: 'Av. Belgrano 1250, San Miguel de Tucumán', phone: '3815550199',
      email: 'recepcion@example.com', days: [1, 2, 3, 4, 5, 6],
      start: '08:00', end: '20:00', duration: 30, logo: ''
    }, DEMO_ACCOUNTS[0]);
  }
  if (populateSamplePractice(db)) persist();

  // Migración: bases guardadas antes de conectar el panel del veterinario
  // con la sala de espera puede que no tengan estas colecciones todavía.
  if (db.configured) {
    db.waitingRoom = db.waitingRoom || [];
    db.tickets = db.tickets || [];

    // Migración: los tickets generados antes del monto a cobrar pueden no
    // tener `total`; se inicializa en 0 (se muestra como "A definir").
    db.tickets.forEach(ticketItem => {
      if (!Number.isFinite(Number(ticketItem.total))) {
        ticketItem.total = 0;
      }
    });

    // Migración: ingresos a sala creados antes del motivo de consulta.
    // Se inicializa en '' para que el veterinario lo vea vacío y el
    // administrador pueda cargarlo con "Editar motivo".
    db.waitingRoom.forEach(entry => {
      if (typeof entry.reason !== 'string') {
        entry.reason = '';
      }
    });

    // Migración: recordatorios anteriores a las categorías del calendario.
    // Se deduce la categoría del título y se marca su origen.
    db.reminders = db.reminders || [];
    db.reminders.forEach(reminder => {
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
    db.clinical = db.clinical || [];
    db.clinical.forEach(record => {
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

    db.tickets.forEach(ticketItem => {
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
        localStorage.setItem(KEY, JSON.stringify(db));
      } catch {
        // La limpieza igual aplica en memoria para esta sesión.
      }
    }
  }
}

function toast(message) { ui.notify(message); }

function modal(title, html) {
  ui.setHtml($('#modal'), `
    <div class="modal-head">
      <h2 id="modal-title">${title}</h2>
      ${button('✕', 'close', '', 'ghost')}
    </div>
    ${html}
  `);

  if (!$('#modal').open) {
    $('#modal').showModal();
  }
}

function close() {
  $('#modal').close();
}

function fail(message) {
  const errorElement = $('#form-error');

  if (errorElement) {
    errorElement.textContent = message;
  } else {
    toast(message);
  }

  return false;
}

function formWrap(kind, content, id = '') {
  return `
    <form data-form="${kind}" data-id="${esc(id)}">
      <div class="form-grid">${content}</div>
      <div id="form-error" class="error" role="alert"></div>
      <div class="form-actions">
        ${button('Cancelar', 'close')}
        <button class="primary" type="submit">Guardar</button>
      </div>
    </form>
  `;
}

// DATOS DE DEMOSTRACIÓN

function seed(config, admin) {
  const dbSeedCodes = new Set();
  const vets = [
    'Lucía Martínez',
    'Diego García',
    'Ana López',
    'Pablo Rodríguez'
  ].map((name, index) => ({
    id: 'v' + (index + 1),
    name,
    license: 'MP ' + (410 + index),
    specialty: [
      'Diagnóstico por imágenes',
      'Clínica general',
      'Medicina felina',
      'Cirugía'
    ][index],
    serviceIds: index === 0
      ? ['s1', 's2', 's3', 's4', 's5']
      : ['s1', 's3', 's4', 's5'],
    active: true
  }));

  const owners = [
    {
      id: 'o1',
      name: 'Benjamín Herrera',
      dni: '30111222',
      phone: '3815550101',
      email: 'cliente@correo.com',
      address: 'Los Aromos 240',
      active: true
    },
    {
      id: 'o2',
      name: 'Valentina Ruiz',
      dni: '32222333',
      phone: '3815550102',
      email: 'valentina@correo.com',
      address: 'San Martín 812',
      active: true
    },
    {
      id: 'o3',
      name: 'Juan Pérez',
      dni: '29333444',
      phone: '3815550103',
      email: 'juan@correo.com',
      address: 'Belgrano 154',
      active: true
    }
  ];

  const pets = [
    'Lola',
    'Toby',
    'Michi',
    'Max',
    'Luna',
    'Bruno'
  ].map((name, index) => {
    let code = '';

    do {
      code = String(Math.floor(10000 + Math.random() * 90000));
    } while (
      dbSeedCodes.has(code)
    );

    dbSeedCodes.add(code);

    return {
      id: 'p' + (index + 1),
      name,
      species: index === 2 || index === 4 ? 'Gato' : 'Perro',
      breed: [
        'Caniche',
        'Mestizo',
        'Europeo',
        'Labrador',
        'Siamés',
        'Golden'
      ][index],
      sex: index % 2 ? 'Macho' : 'Hembra',
      birth: '2022-04-10',
      weight: [3.9, 12, 4.2, 24, 3.6, 28][index],
      color: 'Marrón y blanco',
      ownerId: index < 3 ? 'o1' : index < 5 ? 'o2' : 'o3',
      observations: 'Paciente de demostración',
      photo: '',
      qr: uid(),
      code,
      active: true
    };
  });

  const services = [
    'Consulta clínica',
    'Ecografía',
    'Vacunación',
    'Control',
    'Desparasitación'
  ].map((name, index) => ({
    id: 's' + (index + 1),
    name,
    duration: 30,
    description: 'Atención con turno previo.',
    active: true
  }));

  const schedules = [
    {
      id: uid(),
      vetId: 'v1',
      serviceId: 's2',
      day: 3,
      start: '09:00',
      end: '13:00',
      duration: 30,
      active: true
    }
  ];

  vets.forEach(vet => {
    [1, 2, 3, 4, 5, 6].forEach(day => {
      ['s1', 's3', 's4', 's5'].forEach(serviceId => {
        schedules.push({
          id: uid(),
          vetId: vet.id,
          serviceId,
          day,
          start: '09:00',
          end: '17:00',
          duration: 30,
          active: true
        });
      });
    });
  });

  let wednesday = today();

  while (
    new Date(wednesday + 'T12:00:00').getDay() !== 3
  ) {
    wednesday = addDays(wednesday, 1);
  }

  const appointments = [
    {
      id: uid(),
      petId: 'p1',
      ownerId: 'o1',
      serviceId: 's2',
      vetId: 'v1',
      date: wednesday,
      time: '09:30',
      duration: 30,
      status: 'Confirmado',
      reason: 'Control por imágenes',
      observations: ''
    },
    {
      id: uid(),
      petId: 'p2',
      ownerId: 'o1',
      serviceId: 's2',
      vetId: 'v1',
      date: wednesday,
      time: '11:00',
      duration: 30,
      status: 'Confirmado',
      reason: 'Estudio abdominal',
      observations: ''
    }
  ];

  if (config.days.map(Number).includes(new Date().getDay())) {
    ['09:00', '10:30', '12:00'].forEach((time, index) => {
      appointments.push({
        id: uid(),
        petId: 'p' + (index + 4),
        ownerId: index === 2 ? 'o3' : 'o2',
        serviceId: 's1',
        vetId: 'v2',
        date: today(),
        time,
        duration: 30,
        status: index === 0 ? 'Atendido' : 'Confirmado',
        reason: 'Consulta general',
        observations: ''
      });
    });
  }

  return {
    configured: true,
    config,

    users: [
      {
        ...admin,
        id: uid(),
        role: 'admin',
        active: true,
        principal: true
      },
      ...DEMO_ACCOUNTS
        .filter(account =>
          account.email.toLowerCase() !== admin.email.toLowerCase()
        )
        .map(account => ({ ...account }))
    ],

    vets,
    owners,
    pets,
    services,
    schedules,
    appointments,

    clinical: pets.map(pet => ({
      id: uid(),
      petId: pet.id,
      date: addDays(today(), -12),
      type: 'Consulta',
      title: 'Control general',
      info: 'Control clínico de rutina. Paciente activo, sin novedades.',
      diagnosis: 'Control preventivo',
      weight: pet.weight,
      vetId: 'v1',
      authorId: 'u-v1',
      authorName: 'Lucía Martínez',
      visible: true
    })),

    products: [
      {
        id: uid(),
        name: 'Alimento adulto balanceado',
        category: 'Nutrición',
        description: 'Bolsa de 3 kg. Consultá la variedad indicada para tu mascota.',
        price: 18500,
        stock: 14,
        active: true,
        photo: ''
      },
      {
        id: uid(),
        name: 'Pipeta para perros',
        category: 'Cuidado',
        description: 'Presentación según peso. Consultá al profesional.',
        price: 7200,
        stock: 8,
        active: true,
        photo: ''
      },
      {
        id: uid(),
        name: 'Transportadora mediana',
        category: 'Accesorios',
        description: 'Base rígida y ventilación lateral.',
        price: 45000,
        stock: 3,
        active: true,
        photo: ''
      }
    ],

    notices: [
      {
        id: uid(),
        title: 'Bienvenidos a nuestro espacio de cuidado',
        message: 'Ya podés consultar la información de tus mascotas y solicitar turnos desde tu cuenta.',
        date: today(),
        expires: '',
        active: true
      }
    ],

    notifications: [
      {
        id: uid(),
        message: 'Tu turno de ecografía fue confirmado.',
        ownerId: 'o1',
        vetId: 'v1',
        date: new Date().toISOString(),
        readBy: []
      }
    ],

    reminders: [
      {
        id: uid(),
        petId: 'p1',
        title: 'Control anual de Lola',
        date: addDays(today(), 7),
        done: false
      },
      {
        id: uid(),
        petId: 'p3',
        title: 'Próxima desparasitación de Michi',
        date: addDays(today(), 12),
        done: false
      }
    ],

    // Sala de espera del administrador: mascotas ingresadas mediante el
    // escaneo de su QR, a la espera de ser atendidas. Estados posibles:
    // 'Esperando' → 'En atención' → 'Pendiente de cobro' → 'Pagado'.
    waitingRoom: [],

    // Tickets generados por el veterinario al finalizar una atención.
    // Administración los recibe para realizar el cobro correspondiente.
    tickets: []
  };
}

// CONFIGURACIÓN INICIAL Y AUTENTICACIÓN

function branding() {
  return `
    <div class="brand">
      ${
        db.config?.logo
          ? `<img class="logo" src="${esc(db.config.logo)}" alt="Logo">`
          : '<span class="mark">+</span>'
      }
      <span>${esc(db.config?.name || 'Gestión veterinaria')}</span>
    </div>
  `;
}

function clinicFields(config = {}) {
  return (
    field(
      'name',
      'Nombre de la veterinaria',
      config.name || '',
      'text',
      'required'
    ) +
    field(
      'identifier',
      'DNI / CUIT del responsable',
      config.identifier || '',
      'text',
      'required'
    ) +
    field(
      'address',
      'Dirección',
      config.address || '',
      'text',
      'required'
    ) +
    field(
      'phone',
      'Teléfono',
      config.phone || '',
      'tel',
      'required'
    ) +
    field(
      'email',
      'Correo electrónico',
      config.email || '',
      'email',
      'required'
    ) +
    field(
      'logo',
      'Logo (PNG, JPG o WebP; hasta 1 MB)',
      '',
      'file',
      'accept="image/png,image/jpeg,image/webp"'
    ) +
    checks(
      'days',
      'Días de atención',
      dayNames.map((day, index) => [index, day]),
      config.days || [1, 2, 3, 4, 5, 6]
    ) +
    field(
      'start',
      'Apertura',
      config.start || '08:00',
      'time',
      'required'
    ) +
    field(
      'end',
      'Cierre',
      config.end || '20:00',
      'time',
      'required'
    ) +
    field(
      'duration',
      'Duración predeterminada (minutos)',
      config.duration || 30,
      'number',
      'min="5" max="240" required'
    )
  );
}

function authShell(html) {
  ui.setHtml($('#app'), `
    <main class="auth">
      <aside class="auth-art">
        ${branding()}

        <section>
          <div class="orbit"><span>+</span></div>
          <div class="eyebrow">Un espacio para cuidar</div>
          <h1>Más cerca de cada paciente.</h1>
          <p>
            La atención, los equipos y la información de tu veterinaria,
            conectados en un solo lugar.
          </p>
        </section>

        <footer>
          Sistema de Gestión Veterinaria · Prototipo académico
        </footer>
      </aside>

      <section class="auth-main">
        <div class="auth-box">${html}</div>
      </section>
    </main>
  `);
}

function setup() {
  const titles = [
    'Configuración inicial',
    'Verificá tu veterinaria',
    'Crear administrador principal',
    'Verificá tu cuenta',
    'Todo listo para comenzar'
  ];

  let html = `
    <div class="steps">
      ${[0, 1, 2, 3].map(index => `
        <span class="${authStep >= index ? 'done' : ''}"></span>
      `).join('')}
    </div>

    <div class="eyebrow">
      Puesta en marcha · Paso ${Math.min(authStep + 1, 4)} de 4
    </div>

    <h1>${titles[authStep]}</h1>
  `;

  if (authStep === 0) {
    html += `
      <p>Configurá los datos de tu veterinaria para comenzar.</p>
      ${formWrap('setup', clinicFields(draft.config))}
    `;
  }

  if (authStep === 1 || authStep === 3) {
    html += `
      <p>
        Ingresá el código para
        ${esc(authStep === 1 ? draft.config.email : draft.admin.email)}.
      </p>

      <div class="hint">
        Verificación simulada. No se envían mensajes.
        Código de prueba: <b>${CODE}</b>.
      </div>

      ${formWrap(
        'verify',
        field(
          'code',
          'Código de verificación',
          '',
          'text',
          'required pattern="[0-9]{6}" inputmode="numeric" autocomplete="one-time-code"'
        )
      )}

      ${button('Reenviar código', 'resend')}
    `;
  }

  if (authStep === 2) {
    html += `
      <p>Esta cuenta tendrá acceso completo a la gestión.</p>

      ${formWrap(
        'admin',
        field('first', 'Nombre', '', 'text', 'required') +
        field('last', 'Apellido', '', 'text', 'required') +
        field('email', 'Usuario / correo', '', 'text', 'required') +
        field(
          'password',
          'Contraseña de prueba',
          '',
          'password',
          'minlength="6" required'
        ) +
        field(
          'confirm',
          'Confirmar contraseña',
          '',
          'password',
          'minlength="6" required'
        )
      )}
    `;
  }

  if (authStep === 4) {
    html += `
      <p>Configuración completada correctamente.</p>
      ${button('Ir al inicio de sesión', 'login', '', 'primary')}
    `;
  }

  authShell(html);
  $$('[data-action="close"]').forEach(element => element.remove());
}

function login() {
  recovery = null;

  let remembered = '';

  try {
    remembered = localStorage.getItem(KEY + '-email') || '';
  } catch {
    remembered = '';
  }

  authShell(`
    <div class="eyebrow">
      Bienvenido a ${esc(db.config.name)}
    </div>

    <h1>Iniciá sesión</h1>
    <p>Ingresá a tu espacio de gestión y cuidado.</p>

    <form data-form="login">
      ${field(
        'email',
        'Usuario / correo',
        remembered,
        'text',
        'required autocomplete="username"'
      )}

      <br>

      ${field(
        'password',
        'Contraseña',
        '',
        'password',
        'required autocomplete="current-password"'
      )}

      <div class="row between">
        <label>
          <input
            name="remember"
            type="checkbox"
            ${remembered ? 'checked' : ''}
          >
          Recordarme
        </label>

        ${button(
          'Mostrar contraseña',
          'show-password',
          '',
          'ghost small'
        )}
      </div>

      <div id="form-error" class="error" role="alert"></div>

      <button class="primary full" type="submit">
        Iniciar sesión →
      </button>
    </form>

    <p class="center">
      ${button('¿Olvidaste tu contraseña?', 'recover', '', 'ghost')}
    </p>

    <div class="demo">
      <small>CUENTAS DE DEMOSTRACIÓN · contraseña 123456</small>

      <div>
        ${DEMO_ACCOUNTS
          .filter(account =>
            LOCKED_ROLE
              ? account.role === LOCKED_ROLE
              : ['u-admin', 'u-v1', 'u-o1', 'u-super'].includes(account.id)
          )
          .map(account =>
            button(roleNames[account.role], 'demo', account.email)
          )
          .join('')}
      </div>

      <small>
        Los accesos son simulados y los datos se guardan en este navegador.
        Utilizá información ficticia.
      </small>
    </div>
  `);
}

function recoverScreen() {
  authShell(`
    <h1>Recuperar contraseña</h1>

    <p>
      ${
        recovery?.verified
          ? 'Elegí una nueva contraseña de prueba.'
          : recovery
            ? 'Ingresá el código de recuperación.'
            : 'Ingresá el correo, usuario o teléfono de tu cuenta.'
      }
    </p>

    ${
      recovery && !recovery.verified
        ? `
          <div class="hint">
            Código simulado: ${CODE}. No se realiza ningún envío.
          </div>
        `
        : ''
    }

    ${formWrap(
      'recover',
      !recovery
        ? field(
            'contact',
            'Correo, usuario o teléfono',
            '',
            'text',
            'required'
          )
        : !recovery.verified
          ? field('code', 'Código', '', 'text', 'required')
          : field(
              'password',
              'Nueva contraseña',
              '',
              'password',
              'minlength="6" required'
            ) +
            field(
              'confirm',
              'Confirmar contraseña',
              '',
              'password',
              'minlength="6" required'
            )
    )}

    ${button('Volver al inicio de sesión', 'login')}

    ${
      recovery && !recovery.verified
        ? button('Reenviar código', 'resend')
        : ''
    }
  `);

  $$('[data-action="close"]').forEach(element => element.remove());
}

// PERMISOS Y NAVEGACIÓN

function canPet(pet) {
  return pet && user && (
    user.role !== 'owner' ||
    pet.ownerId === user.ownerId
  );
}

function pets() {
  return db.pets.filter(canPet);
}

// SALA DE ESPERA (ADMINISTRADOR)

function waitingRoomList() {
  return (db.waitingRoom || [])
    .slice()
    .sort((a, b) => b.enteredAt.localeCompare(a.enteredAt));
}

function waitingEntry(petId) {
  return (db.waitingRoom || []).find(
    entry => entry.petId === petId && entry.status === 'Esperando'
  );
}

// Ingreso que bloquea un nuevo escaneo: la mascota está físicamente en
// la sala (Esperando o En atención). Es EXACTAMENTE el mismo estado que
// muestra la sala de espera del Veterinario (waitingRoomPending()).
// Cuando el veterinario termina la atención, el ingreso pasa a
// 'Pendiente de cobro': sale de la sala y deja de bloquear el escáner,
// pero el registro se conserva para que Administración pueda cobrarlo
// (waitingRoomView lo sigue mostrando vía waitingRoomActive()).
// 'Pagado' tampoco bloquea: la visita terminó y la mascota queda
// disponible para un futuro ingreso.
function activeEntry(petId) {
  return (db.waitingRoom || []).find(
    entry => entry.petId === petId &&
      (entry.status === 'Esperando' || entry.status === 'En atención')
  );
}

// FUENTE ÚNICA DE VERDAD (Administrador y Veterinario leen lo mismo).
// Toda la sala vive en db.waitingRoom. Estos dos filtros son los únicos
// que deben usar ambos paneles para no desincronizarse:
// - waitingRoomPending(): pacientes en sala (Esperando + En atención).
//   Es lo que ven Administrador y Veterinario en su inicio, y lo que
//   Escanear QR usa (vía activeEntry) para decidir si la mascota ya está
//   ingresada.
// - waitingRoomActive(): todo lo no finalizado (suma Pendiente de cobro).
//   Es lo que ve Administración en la vista completa para cobrar.
function waitingRoomPending() {
  return waitingRoomList().filter(
    entry => entry.status === 'Esperando' || entry.status === 'En atención'
  );
}

function waitingRoomActive() {
  return waitingRoomList().filter(entry => entry.status !== 'Pagado');
}

function entryTime(entry) {
  return new Date(entry.enteredAt).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Limpieza de ingresos duplicados: por mascota se conserva UN solo
// ingreso EN SALA (Esperando o En atención; se queda el más avanzado y,
// a igual estado, el más antiguo). Los tickets y atenciones de los
// duplicados eliminados se reapuntan al conservado para no perder
// cobros ni historial.
// Los 'Pendiente de cobro' y 'Pagado' NO se tocan: cada uno pertenece a
// una visita ya atendida (su ticket sigue su propio flujo de cobro) y
// nunca deben fusionarse con un nuevo ingreso en sala ni entre sí.
function dedupeWaitingRoom() {
  if (!db.configured || !Array.isArray(db.waitingRoom)) return false;

  const before = db.waitingRoom.length;

  const rank = entry =>
    entry.status === 'Pendiente de cobro'
      ? 3
      : entry.status === 'En atención'
        ? 2
        : entry.status === 'Esperando'
          ? 1
          : 0;

  const byPet = new Map();

  db.waitingRoom.forEach(entry => {
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
      (db.tickets || []).forEach(ticketItem => {
        if (ticketItem.waitingEntryId === entry.id) {
          ticketItem.waitingEntryId = winner.id;
        }
      });

      (db.clinical || []).forEach(record => {
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

  db.waitingRoom = kept;

  return db.waitingRoom.length !== before;
}

// SALA DE ESPERA Y ATENCIÓN (VETERINARIO)
// El veterinario utiliza la MISMA sala de espera que Administración
// (db.waitingRoom). No se crea una segunda estructura independiente.

function ticket(id) {
  return (db.tickets || []).find(item => item.id === id);
}

// Tickets pendientes de cobro (los genera el veterinario al terminar la
// atención). Solo Administración los ve y los cobra: el monto lo define
// el administrador al momento del cobro, el veterinario nunca lo ve.
function pendingTickets() {
  return (db.tickets || [])
    .filter(item => item.status === 'Pendiente de cobro')
    .slice()
    .sort((a, b) =>
      String(b.date + ' ' + (b.time || '')).localeCompare(
        String(a.date + ' ' + (a.time || ''))
      )
    );
}

function todayAppointmentsForVet() {
  return appts()
    .filter(appointment =>
      appointment.date === today() &&
      appointment.status !== 'Cancelado'
    )
    .sort((a, b) => minutes(a.time) - minutes(b.time));
}

function appts() {
  return db.appointments.filter(appointment =>
    isAdmin() ||
    (user.role === 'vet' && appointment.vetId === user.vetId) ||
    (user.role === 'owner' && appointment.ownerId === user.ownerId)
  );
}

function notifications() {
  return db.notifications.filter(notification =>
    isAdmin() ||
    (user.role === 'vet' && notification.vetId === user.vetId) ||
    (user.role === 'owner' && notification.ownerId === user.ownerId)
  );
}

function unread() {
  return notifications()
    .filter(notification => !notification.readBy.includes(user.id))
    .length;
}

function shell() {
  if (!user) return login();

  if (
    !allowed[user.role].includes(route) &&
    !['pet', 'owner', 'vet'].includes(route)
  ) {
    route = user.role === 'owner' ? 'pets' : 'home';
  }

  ui.setHtml($('#app'), `
    <aside class="sidebar">
      ${branding()}

      <div class="eyebrow">Tu espacio de trabajo</div>

      <nav>
        ${allowed[user.role]
          .filter(key => navs[key])
          .map(key => `
            <button
              class="nav-item ${route === key ? 'active' : ''}"
              data-action="nav"
              data-id="${key}"
            >
              ${icon(navs[key][1])}
              ${
                user.role === 'owner' && key === 'pets'
                  ? 'Mis mascotas'
                  : user.role === 'vet' && key === 'agenda'
                    ? 'Mi agenda'
                    : navs[key][0]
              }
            </button>
          `)
          .join('')}
      </nav>

      <footer>
        <div class="hint">
          ${roleNames[user.role]}
          <br>
          <small>Sesión de demostración</small>
        </div>

        ${button(
          icon('logout') + ' Cerrar sesión',
          'logout',
          '',
          'ghost'
        )}

        <div class="footer-note">
          Gestión veterinaria<br>
          Organización que acompaña.
        </div>
      </footer>
    </aside>

    <div class="workspace">
      <header class="topbar">
        <div class="row">
          ${button(icon('menu'), 'menu', '', 'ghost menu-toggle')}
          ${branding()}

          <span class="role-label muted">
            ${
              user.role === 'superadmin'
                ? 'Superadministración · Acceso total'
                : isAdmin()
                  ? 'Panel administrativo'
                  : user.role === 'vet'
                    ? 'Espacio profesional'
                    : 'Portal del propietario'
            }
          </span>
        </div>

        <div class="row">
          ${themeButton('ghost')}

          ${
            allowed[user.role].includes('notifications')
              ? button(
                icon('bell') + ` <span class="badge">${unread()}</span>`,
                'nav',
                'notifications',
                'ghost'
              )
              : ''
          }

          <span class="user-name">${esc(user.name)}</span>

          ${button(
            esc(
              user.name
                .split(' ')
                .map(part => part[0])
                .slice(0, 2)
                .join('')
            ),
            'account',
            '',
            'avatar'
          )}
        </div>
      </header>

      <main id="content" class="content"></main>
    </div>
  `);

  renderContent();
}

function navigate(nextRoute, id) {
  route = nextRoute;
  query = '';
  filter = '';
  page = 1;

  if (nextRoute === 'pet') {
    selectedPet = id;
    petTab = user && user.role === 'vet' ? 'Historia clínica' : 'Resumen';
  }

  if (nextRoute === 'owner' || nextRoute === 'vet') {
    selectedPet = id;
  }

  shell();
  window.scrollTo(0, 0);
}

function heading(title, subtitle = '', actions = '') {
  return `
    <div class="heading">
      <div>
        <div class="eyebrow">${esc(db.config.name)}</div>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>
      <div class="row">${actions}</div>
    </div>
  `;
}

function badge(status) {
  const className = ['Pendiente', 'Inactivo', 'Pendiente de cobro'].includes(status)
    ? 'pending'
    : status === 'Cancelado'
      ? 'cancel'
      : ['Atendido', 'En atención', 'Pagado'].includes(status)
        ? 'blue'
        : status === 'Esperando'
          ? 'waiting'
          : '';

  return `<span class="badge ${className}">${esc(status)}</span>`;
}

function table(headers, rows) {
  if (!rows.length) {
    return '<div class="empty">No hay registros para mostrar.</div>';
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${row.map(cell => `<td>${cell}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function appointmentTable(list) {
  return table(
    [
      'Hora / fecha',
      'Mascota',
      'Propietario',
      'Servicio',
      'Profesional',
      'Estado',
      ''
    ],
    list.map(appointment => [
      `${esc(appointment.time)}<br><small>${pretty(appointment.date)}</small>`,
      button(
        esc(label('pets', appointment.petId)),
        'pet',
        appointment.petId,
        'ghost small'
      ),
      esc(label('owners', appointment.ownerId)),
      esc(label('services', appointment.serviceId)),
      esc(label('vets', appointment.vetId)),
      badge(appointment.status),
      button('Ver detalle', 'appointment', appointment.id, 'small')
    ])
  );
}

// DASHBOARD

function home() {
  const hour = new Date().getHours();

  const greeting = hour < 12
    ? 'Buenos días'
    : hour < 20
      ? 'Buenas tardes'
      : 'Buenas noches';

  return heading(
    `${greeting}, ${esc(user.name.split(' ')[0])}`,
    new Date().toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  ) + `
    <div class="toolbar">
      <input
        id="global-search"
        aria-label="Buscar mascota, propietario, DNI, teléfono o código"
        placeholder="Buscar mascota, propietario, DNI, teléfono o código..."
      >

      ${
        isAdmin()
          ? button(
            icon('qr') + ' Escanear / Código',
            'admin-scan',
            '',
            'scan-btn'
          )
          : ''
      }
    </div>

    <div id="global-results" class="search-results"></div>
  ` +
    (isAdmin() ? homeWaitingRoom() + homeTicketsToCharge() : '') +
    (user.role === 'vet' ? homeVetWaitingRoom() : '') +
    ((user.role === 'vet' || user.role === 'superadmin') ? homeVetAgenda() : '');
}

function homeWaitingRoom() {
  // Lee EXACTAMENTE la misma sala que el Veterinario
  // (waitingRoomPending(): Esperando + En atención). Antes solo filtraba
  // 'Esperando', por eso un paciente tomado por el veterinario
  // ('En atención') seguía visible para el veterinario pero desaparecía
  // del inicio del Administrador.
  const list = waitingRoomPending();

  return `
    <section class="card">
      <div class="row between">
        <h2>Mascotas en espera</h2>
        ${button('Ver sala de espera', 'nav', 'waitingRoom', 'small')}
      </div>

      ${
        list.length
          ? `
            <div class="grid">
              ${list.map(entry => {
                const pet = find('pets', entry.petId);
                const owner = find('owners', entry.ownerId);

                return `
                  <article class="card waiting-card">
                    <div class="row between">
                      <h2>${esc(entry.petName)}</h2>
                      ${badge(entry.status)}
                    </div>

                    ${
                      pet
                        ? `<p>${esc(pet.species)} · ${esc(pet.breed)}</p>`
                        : ''
                    }

                    <p class="muted">
                      Propietario: ${esc(owner?.name || 'No disponible')}<br>
                      Ingreso: ${entryTime(entry)}
                      ${entry.vetName ? '<br>Veterinario: ' + esc(entry.vetName) : ''}
                    </p>

                    <p><small>Motivo informado:</small> ${esc(entry.reason || '—')}</p>

                    <div class="row">
                      ${
                        pet
                          ? button('Ver mascota', 'pet', pet.id, 'small')
                          : ''
                      }

                      ${
                        entry.status === 'Esperando'
                          ? button(
                            entry.reason ? 'Editar motivo' : 'Cargar motivo',
                            'admin-edit-reason',
                            entry.id,
                            'small'
                          ) + ' ' +
                          button(
                            'Cancelar ingreso',
                            'admin-cancel-entry',
                            entry.id,
                            'small danger'
                          )
                          : button(
                            'Volver a espera',
                            'admin-release-entry',
                            entry.id,
                            'small'
                          )
                      }

                      ${
                        user.role === 'superadmin' && ['Esperando', 'En atención'].includes(entry.status)
                          ? button(
                            entry.status === 'En atención' ? 'Continuar atención' : 'Atender',
                            'vet-attend',
                            entry.id,
                            'small primary'
                          )
                          : ''
                      }
                    </div>
                  </article>
                `;
              }).join('')}
            </div>
          `
          : '<div class="empty">No hay mascotas en la sala de espera. Usá "Escanear" para registrar un ingreso.</div>'
      }
    </section>
  `;
}

// TICKETS A COBRAR (ADMINISTRADOR, inicio, debajo de Escanear).
// Cada ticket generado por el veterinario (fecha, hora y datos de la
// atención) aparece como "Ticket a cobrar de {mascota}". El monto solo
// lo ve y lo define Administración al cobrar; el veterinario no lo ve.
function homeTicketsToCharge() {
  const list = pendingTickets();

  return `
    <section class="card">
      <div class="row between">
        <h2>Tickets a cobrar</h2>
        ${button('Ver sala de espera', 'nav', 'waitingRoom', 'small')}
      </div>

      ${
        list.length
          ? `
            <div class="grid">
              ${list.map(ticketItem => {
                const pet = find('pets', ticketItem.petId);
                const owner = find('owners', ticketItem.ownerId);

                return `
                  <article class="card waiting-card">
                    <div class="row between">
                      <h2>Ticket a cobrar de ${esc(pet?.name || ticketItem.petId)}</h2>
                      ${badge(ticketItem.status)}
                    </div>

                    <p class="muted">
                      Ticket ${esc(ticketItem.number)} ·
                      ${pretty(ticketItem.date)}${ticketItem.time ? ' · ' + esc(ticketItem.time) : ''}<br>
                      Propietario: ${esc(owner?.name || 'No disponible')}<br>
                      Veterinario: ${esc(ticketItem.vetName || 'No disponible')}
                    </p>

                    <p><small>Motivo:</small> ${esc(ticketItem.reason || '—')}</p>

                    <p>
                      <small>Monto a pagar:</small>
                      <b>${ticketItem.total > 0 ? money(ticketItem.total) : 'A definir'}</b>
                    </p>

                    <div class="row">
                      ${
                        pet
                          ? button('Ver mascota', 'pet', pet.id, 'small')
                          : ''
                      }

                      ${button('Ver ticket y cobrar', 'admin-charge', ticketItem.id, 'small primary')}
                    </div>
                  </article>
                `;
              }).join('')}
            </div>
          `
          : '<div class="empty">No hay tickets pendientes de cobro.</div>'
      }
    </section>
  `;
}

function homeVetWaitingRoom() {
  // Misma fuente que Administración: waitingRoomPending() sobre la única
  // db.waitingRoom compartida. Ambos paneles leen el mismo estado.
  const list = waitingRoomPending();

  return `
    <section class="card">
      <h2>Pacientes en espera</h2>

      ${
        list.length
          ? `
            <div class="grid">
              ${list.map(entry => {
                const pet = find('pets', entry.petId);
                const owner = find('owners', entry.ownerId);

                return `
                  <article class="card waiting-card">
                    <div class="row between">
                      <h2>${esc(entry.petName)}</h2>
                      ${badge(entry.status)}
                    </div>

                    ${
                      pet
                        ? `<p>${esc(pet.species)} · ${esc(pet.breed)}</p>`
                        : ''
                    }

                    <p class="muted">
                      Propietario: ${esc(owner?.name || 'No disponible')}<br>
                      Ingreso: ${entryTime(entry)}
                      ${entry.vetName ? '<br>Veterinario: ' + esc(entry.vetName) : ''}
                    </p>

                    <p><small>Motivo informado:</small> ${esc(entry.reason || '—')}</p>

                    <div class="row">
                      ${button(
                        entry.status === 'En atención' ? 'Continuar atención' : 'Atender',
                        'vet-attend',
                        entry.id,
                        'primary small'
                      )}
                    </div>
                  </article>
                `;
              }).join('')}
            </div>
          `
          : '<div class="empty">No hay pacientes en la sala de espera en este momento.</div>'
      }
    </section>
  `;
}

function homeVetAgenda() {
  const list = todayAppointmentsForVet();

  return `
    <section class="card">
      <h2>Mis próximos turnos</h2>

      ${
        list.length
          ? list.map(appointment => `
              <article class="timeline">
                <div class="row between">
                  <b>${esc(appointment.time)} · ${esc(label('pets', appointment.petId))}</b>
                  ${badge(appointment.status)}
                </div>

                <p class="muted">
                  ${esc(label('owners', appointment.ownerId))} ·
                  ${esc(label('services', appointment.serviceId))}
                </p>
              </article>
            `).join('')
          : '<p class="muted">No tenés turnos agendados para hoy.</p>'
      }
    </section>
  `;
}

function toolbar(options = []) {
  return `
    <div class="toolbar">
      <input
        id="list-search"
        aria-label="Buscar registros"
        placeholder="Buscar por nombre o datos..."
        value="${esc(query)}"
      >

      ${
        options.length
          ? `
            <select id="list-filter" aria-label="Filtrar">
              ${[
                ['', 'Todos'],
                ...options.map(option => [option, option])
              ].map(([value, text]) => `
                <option
                  value="${esc(value)}"
                  ${value === filter ? 'selected' : ''}
                >${esc(text)}</option>
              `).join('')}
            </select>
          `
          : ''
      }
    </div>
  `;
}

function pageRows(rows) {
  const max = Math.max(1, Math.ceil(rows.length / 8));
  page = Math.min(page, max);

  return [
    rows.slice((page - 1) * 8, page * 8),
    `
      <div class="pagination">
        <small>
          ${rows.length} registros · Página ${page} de ${max}
        </small>

        <div class="row">
          ${button('←', 'page', Math.max(1, page - 1), 'small')}
          ${button('→', 'page', Math.min(max, page + 1), 'small')}
        </div>
      </div>
    `
  ];
}

function matches(item) {
  return JSON.stringify(item)
    .toLocaleLowerCase('es')
    .includes(query.toLocaleLowerCase('es'));
}

// MASCOTAS Y PERFILES

// Paleta pastel para las tarjetas del propietario, en la misma gama
// fría de la página (Midnight Denim / Lavender Bloom: #1F2E5A,
// #445A8C, #6B7FA6, #A2ADC7, #D7DCEA, #EDEFF7).
// Sirven para identificar a simple vista (p. ej. rosa = hembra,
// celeste = macho). Son todos fondos CLAROS para que el texto oscuro
// (#1F2E5A, forzado por CSS con .has-color) siempre se lea, en modo
// claro y en modo oscuro.
// Exclusivo de esta vista: no reemplaza ni interfiere con pet.color
// (color físico del pelaje, usado por otras pantallas/roles).
const OWNER_CARD_COLORS = [
  { id: 'pink', name: 'Rosa pastel (hembra)', value: '#F4A7C0' },
  { id: 'sky', name: 'Celeste pastel (macho)', value: '#9ED2F0' },
  { id: 'blue', name: 'Azul pastel', value: '#A3BDF3' },
  { id: 'lilac', name: 'Lila pastel', value: '#C4ADEF' },
  { id: 'red', name: 'Rojo coral pastel', value: '#F2A89B' },
  { id: 'green', name: 'Verde menta pastel', value: '#9BDCB8' },
  { id: 'sand', name: 'Vainilla pastel', value: '#F3D894' },
  { id: 'gray', name: 'Gris perla', value: '#C6CDD9' }
];

function ownerCardColorValue(id) {
  return OWNER_CARD_COLORS.find(color => color.id === id)?.value || '';
}

function petPhoto(pet, large = false) {
  const avatar = findPetAvatar(pet.avatarId);
  const useAvatar = avatar && (pet.imagePreference === 'avatar' || !pet.photo);
  const source = useAvatar ? avatar.src : pet.photo;

  return source
    ? `
      <img
        class="${large ? 'profile-photo' : 'logo'}${useAvatar ? ' pet-illustration' : ''}"
        src="${esc(source)}"
        alt="${esc(pet.name)}${useAvatar ? ' · ' + esc(avatar.label) : ''}"
      >
    `
    : `
      <span class="${large ? 'profile-photo pet-avatar' : 'pet-avatar'}">
        ${icon('pet')}
      </span>
    `;
}

function ownerPetImageModal(pet) {
  const selected = findPetAvatar(pet.avatarId);
  const usingAvatar = selected && (pet.imagePreference === 'avatar' || !pet.photo);

  modal(`Foto o ícono de ${esc(pet.name)}`, `
    <div class="owner-avatar-picker">
      <p class="muted">Elegí el ícono que más se parezca a ${esc(pet.name)} o subí una foto.</p>
      <div class="owner-avatar-photo-actions">
        ${button(icon('plus') + ' Subir foto', 'owner-pet-upload', pet.id, 'primary')}
        ${pet.photo ? button('Usar mi foto', 'owner-pet-use-photo', pet.id) : ''}
      </div>
      <p class="owner-avatar-hint muted">PNG, JPG o WebP de hasta 1 MB. Tu foto se conserva si elegís un ícono.</p>
      ${['Perros', 'Gatos', 'Otros animales'].map(group => `
        <section class="owner-avatar-group" aria-label="${group}">
          <h3>${group}</h3>
          <div class="owner-avatar-grid">
            ${PET_AVATARS.filter(avatar => avatar.group === group).map(avatar => `
              <button type="button"
                class="owner-avatar-option"
                data-action="owner-pet-avatar-pick"
                data-id="${esc(pet.id)}:${avatar.id}"
                aria-label="Elegir ${esc(avatar.label)} para ${esc(pet.name)}"
                aria-pressed="${Boolean(usingAvatar && pet.avatarId === avatar.id)}">
                <img src="${esc(avatar.src)}" alt="" width="88" height="88">
                <span>${esc(avatar.label)}</span>
              </button>
            `).join('')}
          </div>
        </section>
      `).join('')}
    </div>
  `);
}

function petsView() {
  if (user.role === 'owner') {
    return heading(
      '¿Con qué mascota querés ingresar?',
      'Seleccioná un perfil para consultar sus cuidados y próximos turnos.'
    ) + `
      <input
        type="file"
        id="owner-pet-photo-input"
        accept="image/png,image/jpeg,image/webp"
        style="display:none"
      >

      <div class="grid owner-pets-grid">
        ${
          pets()
            .filter(pet => pet.active)
            .map(pet => `
              <article
                class="card owner-pet-card${pet.cardColor ? ' has-color' : ''}"
                style="${
                  pet.cardColor
                    ? `background:${esc(ownerCardColorValue(pet.cardColor))}`
                    : ''
                }"
              >
                <div class="owner-pet-photo-wrap">
                  ${petPhoto(pet, true)}

                  <button
                    type="button"
                    class="owner-pet-photo-edit"
                    data-action="owner-pet-photo"
                    data-id="${esc(pet.id)}"
                    title="Elegir foto o ícono"
                    aria-label="Elegir foto o ícono de ${esc(pet.name)}"
                  >${icon('plus')}</button>

                  <button
                    type="button"
                    class="owner-pet-color-btn"
                    data-action="owner-pet-color"
                    data-id="${esc(pet.id)}"
                    title="Color de la tarjeta"
                    aria-label="Elegir color de tarjeta de ${esc(pet.name)}"
                  >${icon('settings')}</button>

                  ${
                    ownerColorPicker === pet.id
                      ? `
                        <div class="owner-pet-color-picker">
                          ${OWNER_CARD_COLORS.map(color => `
                            <button
                              type="button"
                              class="owner-pet-color-swatch${
                                pet.cardColor === color.id ? ' active' : ''
                              }"
                              style="background:${color.value}"
                              data-action="owner-pet-color-pick"
                              data-id="${esc(pet.id)}:${color.id}"
                              title="${esc(color.name)}"
                              aria-label="${esc(color.name)}"
                            ></button>
                          `).join('')}
                          <button
                            type="button"
                            class="owner-pet-color-reset"
                            data-action="owner-pet-color-pick"
                            data-id="${esc(pet.id)}:default"
                            title="Volver al color original de la tarjeta"
                          >Original</button>
                        </div>
                      `
                      : ''
                  }
                </div>

                <h2 class="owner-pet-name">${esc(pet.name)}</h2>
                <div class="owner-pet-id">
                  <span
                    class="owner-pet-code"
                    title="Código de identificación de ${esc(pet.name)}"
                  >${esc(pet.code || '—')}</span>
                  <span class="owner-pet-id-sep" aria-hidden="true">/</span>
                  <button
                    type="button"
                    class="owner-pet-qr-btn"
                    data-action="qr"
                    data-id="${esc(pet.id)}"
                    title="Ver QR de ${esc(pet.name)}"
                    aria-label="Ver QR de ${esc(pet.name)}"
                  >${icon('qr')} QR</button>
                </div>

                ${button('Ingresar al perfil →', 'pet', pet.id, 'primary')}
              </article>
            `)
            .join('') ||
          `
            <p class="empty">
              No tenés mascotas activas vinculadas.
              Consultá a la veterinaria.
            </p>
          `
        }
      </div>
    `;
  }

  const rows = pets().filter(pet =>
    matches({
      ...pet,
      owner: find('owners', pet.ownerId)
    }) &&
    (!filter || pet.species === filter)
  );

  const [slice, pager] = pageRows(rows);

  return heading(
    'Mascotas',
    'Todos los pacientes, con su información conectada.',
    (user.role !== 'vet' ? button(icon('qr') + ' Simular escaneo', 'scan') : '') +
    (isAdmin() ? button('+ Nueva mascota', 'create', 'pets', 'primary') : '')
  ) + `
    <section class="card">
      ${toolbar(['Perro', 'Gato', 'Otro'])}

      ${table(
        [
          'Mascota',
          'Código',
          'Especie / raza',
          'Sexo',
          'Propietario',
          'Estado',
          'Acciones'
        ],
        slice.map(pet => [
          `
            <div class="row">
              ${petPhoto(pet)}
              <b>${esc(pet.name)}</b>
            </div>
          `,
          `<b style="letter-spacing:0.2rem;">${esc(pet.code || '—')}</b>`,
          `${esc(pet.species)}<br><small>${esc(pet.breed)}</small>`,
          esc(pet.sex),
          button(
            esc(label('owners', pet.ownerId)),
            'owner',
            pet.ownerId,
            'ghost small'
          ),
          badge(pet.active ? 'Activo' : 'Inactivo'),
          button('Ver', 'pet', pet.id, 'small') +
          (user.role !== 'vet' ? ' ' + button('Editar', 'edit', 'pets:' + pet.id, 'small') : '') +
          (user.role !== 'vet' ? ' ' + button('QR', 'qr', pet.id, 'small') : '') + ' ' +
          button(
            pet.active ? 'Desactivar' : 'Activar',
            'toggle',
            'pets:' + pet.id,
            'small'
          )
        ])
      )}

      ${pager}
    </section>
  `;
}

function petProfile() {
  const pet = find('pets', selectedPet);

  if (!canPet(pet)) {
    return `
      <div class="empty">
        No tenés permiso para consultar esta mascota.
      </div>
    `;
  }

  const owner = find('owners', pet.ownerId);

  const age = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(pet.birth + 'T12:00:00')) / 31557600000
    )
  );

  const tabs = user.role === 'vet'
    ? [
      'Historia clínica',
      'Vacunas',
      'Tratamientos',
      'Desparasitación',
      'Pipetas',
      'Estudios'
    ]
    : [
      'Resumen',
      'Historia clínica',
      'Vacunas',
      'Tratamientos',
      'Desparasitación',
      'Pipetas',
      'Estudios',
      'Turnos'
    ];

  if (user.role === 'vet' && (petTab === 'Resumen' || petTab === 'Turnos')) {
    petTab = 'Historia clínica';
  }

  const category = {
    Vacunas: 'Vacuna',
    Tratamientos: 'Tratamiento',
    Desparasitación: 'Desparasitación',
    Pipetas: 'Pipeta',
    Estudios: 'Estudio'
  };

  const records = db.clinical
    .filter(record =>
      record.petId === pet.id &&
      (user.role !== 'owner' || record.visible)
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  let content = '';

  if (petTab === 'Resumen') {
    content = `
      <div class="columns">
        <section class="card">
          <h2>Datos del paciente</h2>

          <div class="form-grid">
            <p>
              <small>Propietario</small><br>
              <b>${esc(owner?.name)}</b>
            </p>

            <p>
              <small>Nacimiento</small><br>
              ${pretty(pet.birth)}
            </p>

            <p>
              <small>Color</small><br>
              ${esc(pet.color)}
            </p>

            <p>
              <small>Estado</small><br>
              ${badge(pet.active ? 'Activo' : 'Inactivo')}
            </p>
          </div>

          <p>${esc(pet.observations)}</p>

          ${button(
            'Ver perfil del propietario →',
            'owner',
            pet.ownerId
          )}

          ${
            isAdmin() && owner
              ? `
                <div class="owner-box">
                  <h3>Datos del propietario</h3>
                  <div class="form-grid">
                    <p><small>Nombre y apellido</small><br>${esc(owner.name)}</p>
                    <p><small>DNI</small><br>${esc(owner.dni)}</p>
                    <p><small>Teléfono</small><br>${esc(owner.phone)}</p>
                    <p><small>Email</small><br>${esc(owner.email)}</p>
                    <p><small>Dirección</small><br>${esc(owner.address)}</p>
                  </div>
                  ${button('Ver perfil del propietario', 'owner', pet.ownerId, 'small')}
                </div>
              `
              : ''
          }

          <h2>Última atención</h2>

          ${
            records.length
              ? clinicalCard(records[0])
              : '<p class="muted">Sin atenciones registradas.</p>'
          }
        </section>

        <aside>
          <article class="card reminder">
            <h2>Próximos cuidados</h2>

            ${
              db.reminders
                .filter(reminder =>
                  reminder.petId === pet.id && !reminder.done
                )
                .map(reminder => `
                  <p>
                    ${esc(reminder.title)}<br>
                    <small>${pretty(reminder.date)}</small>
                  </p>
                `)
                .join('') ||
              '<p class="muted">Sin recordatorios.</p>'
            }
          </article>

          <article class="card notice">
            <h2>Avisos de la veterinaria</h2>

            ${visibleNotices()
              .slice(0, 2)
              .map(notice => `
                <p>
                  <b>${esc(notice.title)}</b><br>
                  <small>${esc(notice.message)}</small>
                </p>
              `)
              .join('')}
          </article>
        </aside>
      </div>
    `;
  } else if (petTab === 'Turnos') {
    content = `
      <section class="card">
        ${appointmentTable(
          appts().filter(appointment => appointment.petId === pet.id)
        )}
      </section>
    `;
  } else {
    content = `
      <section class="card">
        <div class="row between">
          <h2>${petTab}</h2>

          <div class="row">
            ${
              user.role === 'owner'
                ? button(
                    'Imprimir historia clínica',
                    'print-history',
                    pet.id
                  )
                : ''
            }
            ${
              user.role !== 'owner'
                ? button(
                    '+ Registrar atención',
                    'clinical',
                    pet.id,
                    'primary'
                  )
                : ''
            }
          </div>
        </div>

        ${
          records
            .filter(record =>
              !category[petTab] ||
              record.type === category[petTab]
            )
            .map(clinicalCard)
            .join('') ||
          '<div class="empty">Sin registros en esta sección.</div>'
        }
      </section>
    `;
  }

  return heading(
    esc(pet.name),
    `${esc(pet.species)} · ${esc(pet.breed)} · ${esc(pet.sex)} · ${age} años · ${esc(pet.weight)} kg`,
    button('Cambiar mascota', 'nav', 'pets') +
    (isAdmin() ? button('Solicitar turno', 'book', pet.id, 'primary') : '')
  ) + `
    <section class="card">
      <div class="row between">
        <div class="row">
          ${petPhoto(pet, true)}

          <div>
            <h2>${esc(pet.name)}</h2>
            <p class="muted">
              ${esc(owner?.name)} · Paciente ${esc(pet.id.slice(0, 8))} ·
              Código <b style="letter-spacing:0.2rem;">${esc(pet.code || '—')}</b>
            </p>
          </div>
        </div>

        ${
          user.role === 'vet'
            ? ''
            : `
        <div class="row">
          ${
            user.role !== 'owner'
              ? button('Editar mascota', 'edit', 'pets:' + pet.id)
              : ''
          }

          ${button('Ver QR', 'qr', pet.id)}
          ${button('Imprimir QR', 'print-qr', pet.id)}
        </div>
        `
        }
      </div>
    </section>

    <nav class="tabs" aria-label="Información clínica">
      ${tabs.map(tab =>
        button(tab, 'tab', tab, tab === petTab ? 'active' : '')
      ).join('')}
    </nav>

    ${content}
  `;
}

function clinicalCard(record) {
  return `
    <article class="timeline">
      <div class="row between">
        <b>${esc(record.title)}</b>
        ${badge(record.type)}
      </div>

      <p>${esc(record.info)}</p>

      ${
        record.reason
          ? `<p><small>Motivo de consulta:</small> ${esc(record.reason)}</p>`
          : ''
      }

      ${
        record.type === 'Vacuna' && (record.vaccineName || record.vaccineType || record.vaccineDose || record.vaccineLot || record.vaccineNext)
          ? `<p><small>Vacuna:</small> ${esc(record.vaccineName || '—')}${record.vaccineType ? ' · Tipo: ' + esc(record.vaccineType) : ''}${record.vaccineDose ? ' · Dosis: ' + esc(record.vaccineDose) : ''}${record.vaccineLot ? ' · Lote: ' + esc(record.vaccineLot) : ''}${record.vaccineNext ? ' · Próxima aplicación: ' + esc(pretty(record.vaccineNext)) : ''}</p>`
          : ''
      }

      ${
        record.diagnosis
          ? `
            <p>
              <small>Diagnóstico:</small>
              ${esc(record.diagnosis)}
            </p>
          `
          : ''
      }

      ${
        normMeds(record.medications).length
          ? `
            <p><small>Medicamentos:</small></p>
            <ul>
              ${normMeds(record.medications).map(medication => `
                <li>
                  ${esc(medication.name)}
                  ${medication.dose ? ' · ' + esc(medication.dose) : ''}
                  ${medication.quantity ? ' · Cant. ' + esc(medication.quantity) : ''}
                  ${medication.route ? ' · ' + esc(medication.route) : ''}
                </li>
              `).join('')}
            </ul>
          `
          : ''
      }

      <small>
        ${pretty(record.date)}${record.time ? ' · ' + esc(record.time) : ''} ·
        ${esc(record.authorName || label('vets', record.vetId))}
        ${record.weight ? ' · ' + esc(record.weight) + ' kg' : ''}
        ${record.temperature ? ' · ' + esc(record.temperature) + ' °C' : ''}
        ${!record.visible ? ' · Nota interna' : ''}
      </small>
    </article>
  `;
}

function ownerProfile(id) {
  const owner = find('owners', id);

  if (
    !owner ||
    (user.role === 'owner' && owner.id !== user.ownerId)
  ) {
    return '<div class="empty">Perfil no disponible.</div>';
  }

  return heading(
    esc(owner.name),
    'Perfil del propietario',
    user.role === 'owner'
      ? button('Editar mis datos', 'edit', 'owners:' + owner.id)
      : button('Editar propietario', 'edit', 'owners:' + owner.id) +
        (isAdmin() ? button('+ Agregar mascota', 'pet-owner', owner.id, 'primary') : '')
  ) + `
    <section class="card">
      <div class="form-grid">
        <p><small>DNI</small><br>${esc(owner.dni)}</p>
        <p><small>Teléfono</small><br>${esc(owner.phone)}</p>
        <p><small>Correo</small><br>${esc(owner.email)}</p>
        <p><small>Dirección</small><br>${esc(owner.address)}</p>
      </div>
    </section>

    <h2>Mascotas vinculadas</h2>

    <div class="grid">
      ${
        db.pets
          .filter(pet => pet.ownerId === owner.id)
          .map(pet => `
            <article class="card">
              ${petPhoto(pet)}
              <h2>${esc(pet.name)}</h2>
              <p>${esc(pet.species)} · ${esc(pet.breed)}</p>
              ${button('Ver perfil', 'pet', pet.id, 'primary')}
            </article>
          `)
          .join('') ||
        '<p class="muted">Todavía no hay mascotas vinculadas.</p>'
      }
    </div>
  `;
}

// LISTADOS ADMINISTRATIVOS

function genericView(collection) {
  const editable =
    isAdmin() ||
    (collection === 'owners' && user.role === 'vet');

  let rows = db[collection]
    .filter(matches)
    .filter(item =>
      !filter ||
      (item.active ? 'Activo' : 'Inactivo') === filter
    );

  // En la página del Administrador el apartado Usuarios muestra
  // propietarios y veterinarios (las cuentas de administración solo
  // las gestiona el Superadmin). Superadmin sigue viendo todos.
  if (collection === 'users' && user.role === 'admin') {
    rows = rows.filter(item => item.role === 'owner' || item.role === 'vet');
  }

  if (collection === 'services' && user.role === 'vet') {
    rows = rows.filter(service =>
      find('vets', user.vetId)?.serviceIds.includes(service.id)
    );
  }

  const [slice, pager] = pageRows(rows);

  let headers;
  let values;

  if (collection === 'owners') {
    headers = [
      'Nombre',
      'DNI',
      'Contacto',
      'Mascotas',
      'Estado',
      'Acciones'
    ];

    values = slice.map(owner => [
      esc(owner.name),
      esc(owner.dni),
      `${esc(owner.phone)}<br><small>${esc(owner.email)}</small>`,
      db.pets.filter(pet => pet.ownerId === owner.id).length,
      badge(owner.active ? 'Activo' : 'Inactivo'),
      button('Ver perfil', 'owner', owner.id, 'small') + ' ' +
      button('Editar', 'edit', 'owners:' + owner.id, 'small') +
      (
        isAdmin()
          ? ' ' + button(
              owner.active ? 'Desactivar' : 'Activar',
              'toggle',
              'owners:' + owner.id,
              'small'
            )
          : ''
      )
    ]);
  }

  if (collection === 'vets') {
    headers = [
      'Profesional',
      'Matrícula / especialidad',
      'Servicios',
      'Estado',
      'Acciones'
    ];

    values = slice.map(vet => [
      esc(vet.name),
      `${esc(vet.license)}<br><small>${esc(vet.specialty)}</small>`,
      `
        <div class="wrap">
          ${vet.serviceIds
            .map(serviceId => esc(label('services', serviceId)))
            .join(', ')}
        </div>
      `,
      badge(vet.active ? 'Activo' : 'Inactivo'),
      button('Perfil', 'vet', vet.id, 'small') + ' ' +
      button('Editar', 'edit', 'vets:' + vet.id, 'small') + ' ' +
      button(
        vet.active ? 'Desactivar' : 'Activar',
        'toggle',
        'vets:' + vet.id,
        'small'
      ) +
      (
        db.users.find(account => account.vetId === vet.id)
          ? ' ' + button(
              'Cambiar contraseña',
              'reset-password',
              db.users.find(account => account.vetId === vet.id).id,
              'small'
            )
          : ''
      )
    ]);
  }

  if (collection === 'services') {
    headers = [
      'Servicio',
      'Duración',
      'Profesionales',
      'Estado',
      'Acciones'
    ];

    values = slice.map(service => [
      esc(service.name),
      esc(service.duration) + ' min',
      `
        <div class="wrap">
          ${
            db.vets
              .filter(vet => vet.serviceIds.includes(service.id))
              .map(vet => esc(vet.name))
              .join(', ') ||
            'Sin asignar'
          }
        </div>
      `,
      badge(service.active ? 'Activo' : 'Inactivo'),
      editable
        ? button(
            'Editar / asignar',
            'edit',
            'services:' + service.id,
            'small'
          ) + ' ' +
          button(
            service.active ? 'Desactivar' : 'Activar',
            'toggle',
            'services:' + service.id,
            'small'
          )
        : esc(service.description)
    ]);
  }

  if (collection === 'users') {
    headers = [
      'Nombre',
      'Usuario / correo',
      'Rol',
      'Último acceso',
      'Estado',
      'Acciones'
    ];

    values = slice.map(account => [
      esc(account.name),
      `${esc(account.email)}${account.phone ? `<br><small>${esc(account.phone)}</small>` : ''}`,
      roleNames[account.role],
      account.lastAccess
        ? new Date(account.lastAccess).toLocaleString('es-AR')
        : 'Sin acceso',
      badge(account.active ? 'Activo' : 'Inactivo'),
      button('Editar', 'edit', 'users:' + account.id, 'small') + ' ' +
      button('Restablecer', 'reset-password', account.id, 'small') +
      (
        account.id !== user.id
          ? ' ' + button(
              account.active ? 'Desactivar' : 'Activar',
              'toggle',
              'users:' + account.id,
              'small'
            )
          : ''
      )
    ]);
  }

  return heading(
    navs[collection][0],
    collection === 'users' && user.role === 'admin'
      ? 'Cuentas de propietarios y veterinarios.'
      : 'Consultá y administrá los registros de la veterinaria.',
    editable
      ? button('+ Agregar', 'create', collection, 'primary')
      : ''
  ) + `
    <section class="card">
      ${toolbar(['Activo', 'Inactivo'])}
      ${table(headers, values)}
      ${pager}
    </section>
  `;
}

function vetProfile() {
  if (!isAdmin()) {
    return '<p>Acceso restringido.</p>';
  }

  const vet = find('vets', selectedPet);

  if (!vet) {
    return '<p>Profesional no disponible.</p>';
  }

  return heading(
    esc(vet.name),
    `${esc(vet.license)} · ${esc(vet.specialty)}`,
    button('Editar / asignar servicios', 'edit', 'vets:' + vet.id) +
    button('Ver agenda', 'vet-agenda', vet.id, 'primary')
  ) + `
    <section class="card">
      <h2>Servicios y disponibilidad</h2>

      <p>
        ${vet.serviceIds
          .map(serviceId => esc(label('services', serviceId)))
          .join(' · ')}
      </p>

      ${button('Configurar horarios', 'nav', 'schedules')}

      ${scheduleTable(
        db.schedules.filter(schedule => schedule.vetId === vet.id)
      )}
    </section>
  `;
}

// HORARIOS Y AGENDA

// Vista de solo lectura (Propietario): horario general de la veterinaria
// + horarios de atención de cada especialista. Sin alta, edición ni
// activación: solo consulta para saber cuándo acercarse o pedir turno.
function ownerSchedulesView() {
  const openDays = (db.config.days || []).map(Number).sort((a, b) => a - b);
  // Atenciones especiales: días de ecos (Ecografía) o de operaciones
  // (Cirugía / Operación / Quirófano). Se detecta por nombre para que
  // funcione con datos actuales y futuros del admin (insensible a
  // mayúsculas y tildes).
  const norm = value => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const isSpecialService = name => /eco|cirug|operac|quirofano/.test(norm(name));
  // Solo veterinarios que tengan franjas especiales cargadas
  // (ecos u operaciones). Si no tienen, no aparecen en esta sección.
  const vets = db.vets.filter(vet =>
    vet.active &&
    db.schedules.some(schedule =>
      schedule.vetId === vet.id &&
      schedule.active &&
      isSpecialService(label('services', schedule.serviceId))
    )
  );

  return heading(
    'Horarios de atención',
    'Horarios de la veterinaria y de cada especialista. Solo lectura.'
  ) + `
    <section class="card">
      <h2>${esc(db.config.name)}</h2>
      <p class="muted">
        ${esc(db.config.address || '')}
        ${db.config.phone ? ' · Tel: ' + esc(db.config.phone) : ''}
      </p>
      <p>
        <b>Días de atención:</b>
        ${openDays.length ? openDays.map(day => esc(dayNames[day])).join(' · ') : '—'}
        <br>
        <b>Horario:</b> ${esc(db.config.start || '—')} – ${esc(db.config.end || '—')}
      </p>
    </section>

    ${vets.map(vet => {
      // Solo franjas especiales (ecos / operaciones) de este veterinario.
      const rows = db.schedules
        .filter(schedule =>
          schedule.vetId === vet.id &&
          schedule.active &&
          isSpecialService(label('services', schedule.serviceId))
        )
        .sort((a, b) => Number(a.day) - Number(b.day) || a.start.localeCompare(b.start));

      return `
        <section class="card">
          <div class="row between">
            <div>
              <h2>${esc(vet.name)}</h2>
              <p class="muted">${esc(vet.specialty || '')}${vet.license ? ' · ' + esc(vet.license) : ''}</p>
            </div>
            ${badge('Especialista')}
          </div>
          ${rows.length ? table(
            ['Servicio', 'Día', 'Franja', 'Duración'],
            rows.map(schedule => [
              esc(label('services', schedule.serviceId)),
              esc(dayNames[schedule.day]),
              `${esc(schedule.start)} – ${esc(schedule.end)}`,
              esc(schedule.duration) + ' min'
            ])
          ) : '<div class="empty">Este especialista no tiene días de atención especial publicados por el momento.</div>'}
        </section>
      `;
    }).join('') || '<div class="empty">No hay atenciones especiales (ecos u operaciones) publicadas por el momento.</div>'}
  `;
}

function scheduleTable(rows) {
  return table(
    [
      'Profesional',
      'Servicio',
      'Día',
      'Franja',
      'Duración',
      'Estado',
      ''
    ],
    rows.map(schedule => [
      esc(label('vets', schedule.vetId)),
      esc(label('services', schedule.serviceId)),
      dayNames[schedule.day],
      `${schedule.start} – ${schedule.end}`,
      schedule.duration + ' min',
      badge(schedule.active ? 'Activo' : 'Inactivo'),
      button(
        'Editar',
        'edit',
        'schedules:' + schedule.id,
        'small'
      ) + ' ' +
      button(
        schedule.active ? 'Desactivar' : 'Activar',
        'toggle',
        'schedules:' + schedule.id,
        'small'
      )
    ])
  );
}

function schedulesView() {
  // Vista de solo lectura para el propietario: horario general de la
  // veterinaria + horarios de cada especialista. Sin crear/editar.
  if (user?.role === 'owner') return ownerSchedulesView();

  const [rows, pager] = pageRows(
    db.schedules.filter(schedule =>
      matches({
        ...schedule,
        vet: label('vets', schedule.vetId),
        service: label('services', schedule.serviceId),
        weekday: dayNames[schedule.day]
      })
    )
  );

  return heading(
    'Horarios de atención',
    'Disponibilidad habitual por profesional, servicio y día.',
    button('+ Nueva franja', 'create', 'schedules', 'primary')
  ) + `
    <div class="hint">
      La agenda calcula los turnos usando estas franjas,
      los días de apertura y las reservas existentes.
      Ecografía demo: miércoles de 09:00 a 13:00 con Lucía Martínez.
    </div>

    <section class="card">
      ${toolbar()}
      ${scheduleTable(rows)}
      ${pager}
    </section>
  `;
}

/*
  Disponibilidad mediante intervalos [inicio, fin).
  Una reserva bloquea al profesional en todos sus servicios.
  También se evitan superposiciones de turnos de la misma mascota.
*/
function slots(serviceId, vetId, date, petId = '', exclude = '') {
  const service = find('services', serviceId);
  const vet = find('vets', vetId);

  if (
    !service?.active ||
    !vet?.active ||
    !vet.serviceIds.includes(serviceId) ||
    date < today()
  ) {
    return [];
  }

  const day = new Date(date + 'T12:00:00').getDay();

  if (!db.config.days.map(Number).includes(day)) {
    return [];
  }

  const result = [];

  db.schedules
    .filter(schedule =>
      schedule.active &&
      schedule.vetId === vetId &&
      schedule.serviceId === serviceId &&
      Number(schedule.day) === day
    )
    .forEach(schedule => {
      const duration =
        Number(schedule.duration) ||
        Number(service.duration) ||
        Number(db.config.duration);

      const start = Math.max(
        minutes(schedule.start),
        minutes(db.config.start)
      );

      const end = Math.min(
        minutes(schedule.end),
        minutes(db.config.end)
      );

      for (
        let time = start;
        time + duration <= end;
        time += duration
      ) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        if (date === today() && time <= currentMinutes) {
          continue;
        }

        const busy = db.appointments.some(appointment =>
          appointment.id !== exclude &&
          appointment.date === date &&
          appointment.status !== 'Cancelado' &&
          (
            appointment.vetId === vetId ||
            (petId && appointment.petId === petId)
          ) &&
          time < minutes(appointment.time) + Number(appointment.duration) &&
          time + duration > minutes(appointment.time)
        );

        if (
          !busy &&
          !result.some(slot => slot.time === clock(time))
        ) {
          result.push({
            time: clock(time),
            duration
          });
        }
      }
    });

  return result.sort((a, b) => a.time.localeCompare(b.time));
}


// CALENDARIO DE CUIDADOS (AGENDA DEL PROPIETARIO)
// Categorías de los puntos de colores. Los recordatorios que carga el
// veterinario desde el historial clínico y los que agrega el propietario
// comparten la misma colección (db.reminders) y se ven en el mismo calendario.

const CARE_CATEGORIES = [
  ['Vacunación', '#a78bfa'],
  ['Desparasitación', '#34d399'],
  ['Pipeta', '#f472b6'],
  ['Operación', '#fb923c'],
  ['Control', '#facc15'],
  ['Otro', '#94a3b8']
];

const CAL_TURNO_COLOR = '#60a5fa';

function careColor(category) {
  if (category === 'Turno') return CAL_TURNO_COLOR;
  return (CARE_CATEGORIES.find(item => item[0] === category) || CARE_CATEGORIES[5])[1];
}

function careCategoryFromText(text) {
  const t = String(text || '').toLowerCase();

  if (/vacun/.test(t)) return 'Vacunación';
  if (/desparasit/.test(t)) return 'Desparasitación';
  if (/pipeta|antipulga/.test(t)) return 'Pipeta';
  if (/operaci|cirug|castraci|esteriliz/.test(t)) return 'Operación';
  if (/control|chequeo|revisi/.test(t)) return 'Control';

  return 'Otro';
}

function reminderCategory(reminder) {
  return CARE_CATEGORIES.some(item => item[0] === reminder.category)
    ? reminder.category
    : careCategoryFromText(reminder.title);
}

// Crea, actualiza o elimina el recordatorio ligado a un registro clínico.
// Es lo que conecta "Próximo cuidado" del veterinario con el calendario
// del propietario. Debe llamarse dentro de commit().
function upsertCareReminder({ clinicalId, pet, category, date, title, note }) {
  db.reminders = db.reminders || [];

  const index = db.reminders.findIndex(reminder =>
    reminder.clinicalId === clinicalId && reminder.source === 'vet'
  );

  if (!date) {
    if (index >= 0) db.reminders.splice(index, 1);
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
    createdBy: user?.name || ''
  };

  if (index >= 0) {
    const current = db.reminders[index];
    const moved = current.date !== date;
    Object.assign(current, values, { done: moved ? false : !!current.done });
  } else {
    db.reminders.push({ id: uid(), done: false, ...values });
  }
}

function calMonthDays(ym) {
  const first = new Date(ym + '-01T12:00:00');
  const start = addDays(ym + '-01', -first.getDay());
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function calShiftMonth(ym, delta) {
  const [year, month] = ym.split('-').map(Number);
  return localDate(new Date(year, month - 1 + delta, 1, 12)).slice(0, 7);
}

function calMonthLabel(ym) {
  const text = new Date(ym + '-01T12:00:00')
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function ownerCalItems() {
  // Agenda del propietario: solo cuidados (recordatorios del
  // veterinario + propios). Los turnos (punto azul) no van acá.
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

function ownerAgendaView() {
  const items = ownerCalItems();
  const byDate = {};

  items.forEach(item => {
    (byDate[item.date] = byDate[item.date] || []).push(item);
  });

  const now = today();
  const days = calMonthDays(ownerCalMonth);
  const weekdays = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

  const mini = days.map(date => {
    const dots = (byDate[date] || [])
      .slice(0, 3)
      .map(item => `<i style="--c:${careColor(item.category)}"></i>`)
      .join('');

    return `
      <button
        type="button"
        class="cal-mini-day ${date.slice(0, 7) !== ownerCalMonth ? 'out' : ''} ${date === now ? 'today' : ''} ${date === ownerCalSelected ? 'selected' : ''}"
        data-action="cal-day"
        data-id="${date}"
        aria-label="${esc(pretty(date))}"
      >${Number(date.slice(8))}<span class="cal-mini-dots">${dots}</span></button>
    `;
  }).join('');

  const cells = days.map(date => {
    const list = byDate[date] || [];

    const chips = list.slice(0, 3).map(item => `
      <span class="cal-chip" style="--c:${careColor(item.category)}" title="${esc(item.title)} · ${esc(label('pets', item.petId))}">
        <i></i><b>${esc(item.category)}</b>
      </span>
    `).join('');

    return `
      <button
        type="button"
        class="cal-cell ${date.slice(0, 7) !== ownerCalMonth ? 'out' : ''} ${date === now ? 'today' : ''} ${date === ownerCalSelected ? 'selected' : ''}"
        data-action="cal-day"
        data-id="${date}"
        aria-label="${esc(pretty(date))}${list.length ? ' · ' + list.length + ' evento(s)' : ''}"
      >
        <span class="cal-num">${Number(date.slice(8))}</span>
        <span class="cal-chips">${chips}${list.length > 3 ? `<em>+${list.length - 3}</em>` : ''}</span>
      </button>
    `;
  }).join('');

  const upcoming = items
    .filter(item => item.date >= now && !item.done)
    .slice(0, 5)
    .map(item => `
      <button type="button" class="cal-up" data-action="cal-day" data-id="${item.date}" style="--c:${careColor(item.category)}">
        <i></i>
        <span>
          <b>${esc(item.title)}</b>
          <small>${esc(label('pets', item.petId))} · ${item.date === now ? 'Hoy' : esc(pretty(item.date))}${item.time ? ' · ' + esc(item.time) : ''}</small>
        </span>
      </button>
    `).join('') || '<p class="cal-empty">No hay cuidados próximos.</p>';

  const legend = CARE_CATEGORIES
    .map(([name, color]) => `<span class="cal-leg" style="--c:${color}"><i></i>${esc(name)}</span>`)
    .join('');

  const selectedItems = byDate[ownerCalSelected] || [];

  const detail = selectedItems.map(item => {
    const origin = item.kind === 'owner'
      ? '<span class="cal-tag">Agregado por vos</span>'
      : item.kind === 'vet'
        ? `<span class="cal-tag vet">Indicado por ${esc(item.by || 'tu veterinaria')}</span>`
        : '<span class="cal-tag turno">Turno</span>';

    return `
      <article class="cal-item" style="--c:${careColor(item.category)}">
        <i></i>
        <div class="cal-item-body">
          <h3>${esc(item.title)}</h3>
          <p>
            ${esc(label('pets', item.petId))} · ${esc(item.category)}${item.time ? ' · ' + esc(item.time) : ''}
            ${item.done ? ' · Completado' : ''}
          </p>
          ${item.note && item.kind !== 'turno' ? `<p class="cal-note">${esc(item.note)}</p>` : ''}
          ${origin}
        </div>
        ${item.kind === 'owner' ? `
          <div class="cal-item-actions">
            ${button('Editar', 'cal-edit', item.id, 'small')}
            ${button('Eliminar', 'cal-delete', item.id, 'small danger')}
          </div>
        ` : ''}
      </article>
    `;
  }).join('') || '<p class="cal-empty">No hay nada para este día.</p>';

  return `
    <div class="cal-shell">
      <aside class="cal-side">
        <div class="cal-brand">
          <span class="cal-logo">${icon('calendar')}</span>
          <strong>Agenda de cuidados</strong>
        </div>

        <div class="cal-mini-head">
          <span>${esc(calMonthLabel(ownerCalMonth))}</span>
          <span>
            <button type="button" class="cal-nav" data-action="cal-prev" aria-label="Mes anterior">‹</button>
            <button type="button" class="cal-nav" data-action="cal-next" aria-label="Mes siguiente">›</button>
          </span>
        </div>

        <div class="cal-mini">
          ${['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(day => `<span class="cal-mini-wd">${day}</span>`).join('')}
          ${mini}
        </div>

        <h4 class="cal-h4">Próximos</h4>
        <div class="cal-ups">${upcoming}</div>

        <button type="button" class="cal-new" data-action="cal-new" data-id="${ownerCalSelected}">+ Nuevo recordatorio</button>
      </aside>

      <main class="cal-main">
        <header class="cal-top">
          <div>
            <h2>${esc(calMonthLabel(ownerCalMonth))}</h2>
            <p>${esc(dayNames[new Date(now + 'T12:00:00').getDay()])}, ${esc(pretty(now))}</p>
          </div>
          <div class="cal-controls">
            <button type="button" class="cal-nav wide" data-action="cal-today">Hoy</button>
            <button type="button" class="cal-nav" data-action="cal-prev" aria-label="Mes anterior">‹</button>
            <button type="button" class="cal-nav" data-action="cal-next" aria-label="Mes siguiente">›</button>
          </div>
        </header>

        <div class="cal-legend">${legend}</div>

        <div class="cal-grid-wrap">
          <div class="cal-grid">
            ${weekdays.map(day => `<span class="cal-wd">${day}</span>`).join('')}
            ${cells}
          </div>
        </div>

        <section class="cal-detail">
          <div class="cal-detail-head">
            <h3>${esc(dayNames[new Date(ownerCalSelected + 'T12:00:00').getDay()])} ${esc(pretty(ownerCalSelected))}</h3>
            <button type="button" class="cal-new small" data-action="cal-new" data-id="${ownerCalSelected}">+ Agregar</button>
          </div>
          ${detail}
        </section>
      </main>
    </div>
  `;
}

function ownerReminderForm(reminderId = '', presetDate = '') {
  if (!user || user.role !== 'owner') return;

  const current = reminderId
    ? db.reminders.find(item =>
        item.id === reminderId &&
        item.source === 'owner' &&
        canPet(find('pets', item.petId))
      )
    : null;

  if (reminderId && !current) {
    return toast('No podés editar este recordatorio.');
  }

  const list = pets().filter(pet => pet.active);

  if (!list.length) {
    return toast('No tenés mascotas activas para agendar.');
  }

  modal(
    current ? 'Editar recordatorio' : 'Nuevo recordatorio',
    `
      <div class="hint">
        Anotá cuándo te toca una pipeta, desparasitación, vacuna u otro
        cuidado. Los que indique tu veterinario aparecen solos en el calendario.
      </div>

      <br>

      ${formWrap(
        'owner-reminder',
        select(
          'petId',
          'Mascota',
          list.map(pet => [pet.id, pet.name]),
          current?.petId || list[0].id,
          'required'
        ) +
        select(
          'category',
          'Tipo de cuidado',
          CARE_CATEGORIES.map(item => item[0]),
          current ? reminderCategory(current) : 'Pipeta'
        ) +
        field(
          'date',
          'Fecha',
          current?.date || presetDate || today(),
          'date',
          'required'
        ) +
        field(
          'title',
          'Detalle (opcional)',
          current?.title || '',
          'text',
          'maxlength="80" placeholder="Ej: segunda dosis"'
        ) +
        `<label class="field full">Nota (opcional)<textarea name="note" maxlength="240">${esc(current?.note || '')}</textarea></label>`,
        reminderId
      )}
    `
  );
}

function agendaView() {
  if (user.role === 'owner') return ownerAgendaView();

  const list = appts().filter(appointment =>
    !agendaVet || appointment.vetId === agendaVet
  );

  let body;

  if (agendaMode === 'day') {
    body = appointmentTable(
      list
        .filter(appointment => appointment.date === agendaDate)
        .sort((a, b) => a.time.localeCompare(b.time))
    );
  } else {
    const day = new Date(agendaDate + 'T12:00:00').getDay();
    const monday = addDays(agendaDate, -((day + 6) % 7));

    body = `
      <div class="week">
        ${Array.from({ length: 7 }, (_, index) => {
          const date = addDays(monday, index);

          return `
            <section class="day">
              <h3>
                ${dayNames[new Date(date + 'T12:00:00').getDay()]}
                <br>
                ${pretty(date)}
              </h3>

              ${
                list
                  .filter(appointment => appointment.date === date)
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map(appointment =>
                    button(
                      `
                        ${esc(appointment.time)} ·
                        ${esc(label('pets', appointment.petId))}
                        <br>
                        <small>
                          ${esc(label('services', appointment.serviceId))}
                          <br>
                          ${esc(label('vets', appointment.vetId))}
                        </small>
                        <br>
                        ${badge(appointment.status)}
                      `,
                      'appointment',
                      appointment.id
                    )
                  )
                  .join('') ||
                '<small>Sin turnos</small>'
              }
            </section>
          `;
        }).join('')}
      </div>
    `;
  }

  return heading(
    user.role === 'vet' ? 'Mi agenda' : 'Agenda',
    'Organizá la atención y consultá las reservas.',
    isAdmin() ? button('+ Nuevo turno', 'book', '', 'primary') : ''
  ) + `
    <section class="card">
      <div class="toolbar">
        <input
          type="date"
          id="agenda-date"
          aria-label="Fecha de agenda"
          value="${agendaDate}"
        >

        <select id="agenda-mode" aria-label="Vista de agenda">
          <option value="day" ${agendaMode === 'day' ? 'selected' : ''}>
            Vista diaria
          </option>
          <option value="week" ${agendaMode === 'week' ? 'selected' : ''}>
            Vista semanal
          </option>
        </select>

        ${
          isAdmin()
            ? `
              <select id="agenda-vet" aria-label="Veterinario">
                <option value="">Todos los profesionales</option>

                ${db.vets.map(vet => `
                  <option
                    value="${vet.id}"
                    ${agendaVet === vet.id ? 'selected' : ''}
                  >${esc(vet.name)}</option>
                `).join('')}
              </select>
            `
            : ''
        }
      </div>

      ${body}
    </section>

    ${
      isAdmin()
        ? `
    <section class="card">
      <h2>Buscar un horario disponible</h2>
      <p class="muted">
        Elegí una mascota, servicio y profesional para consultar
        las fechas y horas libres.
      </p>
      ${button('Consultar disponibilidad', 'book')}
    </section>
        `
        : ''
    }
  `;
}

function book(petId = '', appointmentId = '') {
  const appointment = appointmentId
    ? find('appointments', appointmentId)
    : null;

  if (appointment && !appts().includes(appointment)) {
    return;
  }

  const list = pets().filter(pet =>
    pet.active && find('owners', pet.ownerId)?.active
  );

  if (!list.length) {
    return toast('Registrá primero una mascota con propietario activo.');
  }

  modal(
    appointment ? 'Reprogramar turno' : 'Solicitar un turno',
    `
      <div class="hint">
        Se muestran fechas y horarios libres dentro de los próximos
        90 días. Las reservas ocupadas se excluyen automáticamente.
      </div>

      <br>

      ${formWrap(
        'booking',
        select(
          'petId',
          'Mascota',
          list.map(pet => [pet.id, pet.name]),
          appointment?.petId || petId || list[0].id,
          'required'
        ) +
        select(
          'serviceId',
          'Servicio',
          activeOptions('services'),
          appointment?.serviceId || '',
          'required'
        ) +
        select('vetId', 'Profesional', [], '', 'required') +
        select('date', 'Fechas disponibles', [], '', 'required') +
        select('time', 'Horarios disponibles', [], '', 'required') +
        field(
          'reason',
          'Motivo',
          appointment?.reason || '',
          'text',
          'required'
        ) +
        area(
          'observations',
          'Observaciones',
          appointment?.observations || ''
        ),
        appointmentId
      )}
    `
  );

  updateBooking('service', appointment?.vetId);
}

function setOptions(name, items) {
  const element = $(`#modal [name="${name}"]`);

  ui.setHtml(element, items.length
    ? items.map(([value, text]) => `
        <option value="${esc(value)}">${esc(text)}</option>
      `).join('')
    : '<option value="">Sin disponibilidad</option>');
}

function updateBooking(stage, preferred = '') {
  const form = $('#modal form');
  const service = form.elements.serviceId.value;
  const pet = form.elements.petId.value;

  if (stage === 'service') {
    let vets = db.vets.filter(vet =>
      vet.active && vet.serviceIds.includes(service)
    );

    if (user.role === 'vet') {
      vets = vets.filter(vet => vet.id === user.vetId);
    }

    setOptions('vetId', vets.map(vet => [vet.id, vet.name]));

    if (
      preferred &&
      vets.some(vet => vet.id === preferred)
    ) {
      form.elements.vetId.value = preferred;
    }
  }

  const vet = form.elements.vetId.value;

  if (stage !== 'date') {
    const dates = [];

    for (let index = 0; index < 90; index++) {
      const date = addDays(today(), index);

      if (slots(service, vet, date, pet, form.dataset.id).length) {
        dates.push([
          date,
          `${dayNames[new Date(date + 'T12:00:00').getDay()]} ${pretty(date)}`
        ]);
      }
    }

    setOptions('date', dates);
  }

  setOptions(
    'time',
    slots(
      service,
      vet,
      form.elements.date.value,
      pet,
      form.dataset.id
    ).map(slot => [
      slot.time,
      `${slot.time} · ${slot.duration} min`
    ])
  );

  form.querySelector('button[type=submit]').disabled =
    !form.elements.time.value;
}

function appointmentDetails(id) {
  const appointment = appts().find(item => item.id === id);

  if (!appointment) {
    return toast('Turno no disponible.');
  }

  modal(
    'Detalle del turno',
    `
      <div class="row between">
        <h2>${esc(label('pets', appointment.petId))}</h2>
        ${badge(appointment.status)}
      </div>

      <p>
        ${pretty(appointment.date)} ·
        <b>${esc(appointment.time)}</b> ·
        ${appointment.duration} minutos
      </p>

      <p>
        ${esc(label('services', appointment.serviceId))}<br>
        ${esc(label('vets', appointment.vetId))}<br>
        Propietario: ${esc(label('owners', appointment.ownerId))}
      </p>

      <p>
        Motivo: ${esc(appointment.reason)}<br>
        ${esc(appointment.observations)}
      </p>

      <div class="row">
        ${button('Abrir mascota', 'pet', appointment.petId)}

        ${
          !['Cancelado', 'Atendido'].includes(appointment.status)
            ? button('Reprogramar', 'reschedule', appointment.id) +
              button(
                'Cancelar turno',
                'cancel-appointment',
                appointment.id,
                'danger'
              )
            : ''
        }

        ${
          user.role !== 'owner' && appointment.status === 'Pendiente'
            ? button(
                'Confirmar',
                'confirm-appointment',
                appointment.id,
                'primary'
              )
            : ''
        }

        ${
          user.role !== 'owner' && appointment.status === 'Confirmado'
            ? button(
                'Registrar atención',
                'attend',
                appointment.id,
                'primary'
              )
            : ''
        }
      </div>
    `
  );
}

// CATÁLOGO, AVISOS, RECORDATORIOS Y NOTIFICACIONES

function visibleNotices() {
  return db.notices.filter(notice =>
    notice.active &&
    notice.date <= today() &&
    (!notice.expires || notice.expires >= today())
  );
}

function catalog() {
  const rows = db.products
    .filter(product => isAdmin() || product.active)
    .filter(matches)
    .filter(product => !filter || product.category === filter);

  return heading(
    'Catálogo',
    `Productos disponibles en ${esc(db.config.name)}. Consultas: ${esc(db.config.phone)}.`,
    isAdmin()
      ? button('+ Nuevo producto', 'create', 'products', 'primary')
      : ''
  ) +
  toolbar([...new Set(db.products.map(product => product.category))]) +
  `
    <div class="grid">
      ${
        rows.map(product => `
          <article class="card">
            ${
              product.photo
                ? `
                  <img
                    class="product-img"
                    src="${esc(product.photo)}"
                    alt="${esc(product.name)}"
                  >
                `
                : `<div class="product-img">${icon('bag')}</div>`
            }

            <small>${esc(product.category)}</small>
            <h2>${esc(product.name)}</h2>
            <p class="muted">${esc(product.description)}</p>

            <div class="row between">
              <b>${money(product.price)}</b>
              ${badge(product.stock > 0 ? 'Disponible' : 'Sin stock')}
            </div>

            <p>
              <small>
                ${product.stock} unidades ·
                ${product.active ? 'Publicado' : 'Inactivo'}
              </small>
            </p>

            ${
              isAdmin()
                ? button(
                    'Editar',
                    'edit',
                    'products:' + product.id,
                    'small'
                  ) + ' ' +
                  button(
                    product.active ? 'Desactivar' : 'Activar',
                    'toggle',
                    'products:' + product.id,
                    'small'
                  )
                : ''
            }
          </article>
        `).join('') ||
        '<p class="empty">No se encontraron productos.</p>'
      }
    </div>
  `;
}

function noticesView() {
  const rows = (
    isAdmin() ? db.notices : visibleNotices()
  ).filter(matches);

  return heading(
    'Avisos',
    'Información publicada por la veterinaria.',
    isAdmin()
      ? button('+ Nuevo aviso', 'create', 'notices', 'primary')
      : ''
  ) +
  toolbar() +
  rows.map(notice => `
    <article class="card notice">
      <div class="row between">
        <h2>${esc(notice.title)}</h2>
        ${badge(notice.active ? 'Publicado' : 'Borrador')}
      </div>

      <p>${esc(notice.message)}</p>

      <small>
        ${esc(db.config.name)} · ${pretty(notice.date)}
        ${notice.expires ? ' · Hasta ' + pretty(notice.expires) : ''}
      </small>

      ${
        isAdmin()
          ? `
            <div class="form-actions">
              ${button('Editar', 'edit', 'notices:' + notice.id)}

              ${button(
                notice.active ? 'Desactivar' : 'Publicar',
                'toggle',
                'notices:' + notice.id
              )}

              ${button(
                'Eliminar',
                'delete-notice',
                notice.id,
                'danger'
              )}
            </div>
          `
          : ''
      }
    </article>
  `).join('');
}

function reminderList() {
  return db.reminders
    .filter(reminder => canPet(find('pets', reminder.petId)))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function remindersView() {
  return heading(
    'Recordatorios',
    'Próximas vacunas, controles y cuidados.',
    user.role !== 'owner'
      ? button('+ Nuevo recordatorio', 'create', 'reminders', 'primary')
      : ''
  ) +
  reminderList().map(reminder => `
    <article class="card reminder">
      <div class="row between">
        <div>
          <h2>${esc(reminder.title)}</h2>

          <p>
            ${esc(label('pets', reminder.petId))} ·
            ${pretty(reminder.date)}
          </p>

          ${badge(
            reminder.done
              ? 'Completado'
              : reminder.date < today()
                ? 'Pendiente'
                : 'Próximo'
          )}
        </div>

        <div class="row">
          ${button('Ver mascota', 'pet', reminder.petId)}

          ${
            user.role !== 'owner'
              ? button('Editar', 'edit', 'reminders:' + reminder.id) +
                button(
                  reminder.done ? 'Reabrir' : 'Completar',
                  'reminder-done',
                  reminder.id
                )
              : ''
          }
        </div>
      </div>
    </article>
  `).join('') || '<p>Sin recordatorios.</p>';
}

function waitingRoomView() {
  const list = waitingRoomList();
  const active = waitingRoomActive();
  const paid = list.filter(entry => entry.status === 'Pagado');

  return heading(
    'Sala de espera',
    'Mascotas ingresadas mediante escaneo de QR o código de 5 dígitos, a la espera de ser atendidas.',
    button(icon('qr') + ' Escanear / Código', 'admin-scan', '', 'scan-btn') +
    (paid.length
      ? button('Quitar finalizados', 'admin-clear-paid', '', 'small danger')
      : '')
  ) + (
    list.length
      ? `
        <div class="grid">
          ${active.map(entry => {
            const pet = find('pets', entry.petId);
            const owner = find('owners', entry.ownerId);
            const entryTicket = entry.ticketId ? ticket(entry.ticketId) : null;

            return `
              <article class="card waiting-card">
                <div class="row between">
                  <h2>${esc(entry.petName)}</h2>
                  ${badge(entry.status)}
                </div>

                ${
                  pet
                    ? `<p>${esc(pet.species)} · ${esc(pet.breed)}</p>`
                    : ''
                }

                <p class="muted">
                  Propietario: ${esc(owner?.name || 'No disponible')}<br>
                  Ingreso: ${entryTime(entry)}
                  ${entry.vetName ? '<br>Veterinario: ' + esc(entry.vetName) : ''}
                </p>

                <p><small>Motivo informado:</small> ${esc(entry.reason || '—')}</p>

                ${
                  entryTicket
                    ? `
                      <div class="owner-box">
                        <h3>Ticket ${esc(entryTicket.number)} · ${pretty(entryTicket.date)}${entryTicket.time ? ' · ' + esc(entryTicket.time) : ''}</h3>
                        <p><small>Veterinario:</small> ${esc(entryTicket.vetName || 'No disponible')}</p>
                        <p><small>Motivo:</small> ${esc(entryTicket.reason)}</p>
                        <p><small>Atención realizada:</small> ${esc(entryTicket.performed)}</p>
                        ${
                          normMeds(entryTicket.medications).length
                            ? `<p><small>Medicamentos:</small> ${normMeds(entryTicket.medications).map(medication => esc(medication.name)).join(', ')}</p>`
                            : ''
                        }
                        <p><small>Monto a pagar:</small> <b>${entryTicket.total > 0 ? money(entryTicket.total) : 'A definir'}</b></p>
                      </div>
                    `
                    : ''
                }

                <div class="row">
                  ${
                    pet
                      ? button('Ver mascota', 'pet', pet.id, 'small')
                      : ''
                  }

                  ${
                    entry.status === 'Esperando'
                      ? button(
                        entry.reason ? 'Editar motivo' : 'Cargar motivo',
                        'admin-edit-reason',
                        entry.id,
                        'small'
                      ) + ' ' +
                      button(
                        'Cancelar ingreso',
                        'admin-cancel-entry',
                        entry.id,
                        'small danger'
                      )
                      : ''
                  }

                  ${
                    entry.status === 'En atención'
                      ? button(
                        'Volver a espera',
                        'admin-release-entry',
                        entry.id,
                        'small'
                      )
                      : ''
                  }

                  ${
                    entry.status === 'Pendiente de cobro' && entryTicket
                      ? button('Cobrar', 'admin-charge', entryTicket.id, 'small primary')
                      : ''
                  }

                  ${
                    user.role === 'superadmin' && ['Esperando', 'En atención'].includes(entry.status)
                      ? button(
                        entry.status === 'En atención' ? 'Continuar atención' : 'Atender',
                        'vet-attend',
                        entry.id,
                        'small primary'
                      )
                      : ''
                  }
                </div>
              </article>
            `;
          }).join('')}
        </div>

        ${
          paid.length
            ? `
              <details class="card">
                <summary>
                  <b>Finalizados · ${paid.length}</b>
                  <span class="muted">Tickets ya cobrados</span>
                </summary>
                <br>
                <div class="grid">
                  ${paid.map(entry => {
                    const paidTicket = entry.ticketId ? ticket(entry.ticketId) : null;

                    return `
                    <article class="card waiting-card">
                      <div class="row between">
                        <h2>${esc(entry.petName)}</h2>
                        ${badge(entry.status)}
                      </div>
                      <p class="muted">
                        Propietario: ${esc(find('owners', entry.ownerId)?.name || paidTicket?.ownerName || 'No disponible')}<br>
                        Ingreso: ${entryTime(entry)}${paidTicket ? '<br>Código de ticket: <b>' + esc(paidTicket.number) + '</b>' : ''}
                      </p>
                      ${
                        paidTicket
                          ? `
                            <p>
                              <small>Medicamentos:</small>
                              ${
                                normMeds(paidTicket.medications).length
                                  ? normMeds(paidTicket.medications).map(medication => esc(medication.name) + (Number.isFinite(Number(medication.price)) ? ' · ' + money(Number(medication.price)) : '')).join(', ')
                                  : '—'
                              }
                            </p>
                            <p><small>Total:</small> <b>${paidTicket.total > 0 ? money(paidTicket.total) : 'A definir'}</b></p>
                            <div class="row">
                              ${button('Ver ticket', 'admin-ticket', paidTicket.id, 'small')}
                            </div>
                          `
                          : ''
                      }
                    </article>
                    `;
                  }).join('')}
                </div>
              </details>
            `
            : ''
        }
      `
      : '<div class="empty">No hay mascotas en la sala de espera. Usá "Escanear" para registrar un ingreso.</div>'
  );
}

function dailyHistoryView() {
  if (user.role !== 'vet' && user.role !== 'superadmin') {
    return heading(
      'Historia clínica del día',
      'Esta sección es exclusiva del panel del veterinario.'
    );
  }

  // Se muestran solamente las atenciones de hoy, pero la estructura
  // (db.clinical) conserva también las de días anteriores: no se
  // elimina nada, la historia completa sigue perteneciendo a la mascota.
  // Superadmin ve las de todos los profesionales; el veterinario solo
  // las propias.
  const list = db.clinical
    .filter(record =>
      (user.role === 'superadmin' || record.vetId === user.vetId) &&
      record.date === today() &&
      record.waitingEntryId
    )
    .sort((a, b) => (b.time || '').localeCompare(a.time || ''));

  return heading(
    'Historia clínica del día',
    user.role === 'superadmin'
      ? 'Todas las atenciones de hoy, de todos los profesionales. Podés editar cualquiera si hace falta corregirla.'
      : 'Pacientes que atendiste hoy. Podés editar la información si hace falta corregirla.'
  ) + (
    list.length
      ? list.map(record => {
          const pet = find('pets', record.petId);
          const owner = find('owners', record.ownerId || pet?.ownerId);
          const recordTicket = record.ticketId ? ticket(record.ticketId) : null;

          return `
            <article class="card">
              <div class="row between">
                <h2>${esc(pet?.name || 'Mascota')}</h2>
                ${recordTicket ? badge(recordTicket.status) : ''}
              </div>

              <p class="muted">
                Propietario: ${esc(owner?.name || 'No disponible')} ·
                Hora: ${esc(record.time || '—')}
              </p>

              <p><small>Motivo de consulta:</small> ${esc(record.reason || '—')}</p>
              <p><small>Atención realizada:</small> ${esc(record.performed || '—')}</p>

              ${
                normMeds(record.medications).length
                  ? `<p><small>Medicamentos:</small> ${normMeds(record.medications).map(medication => esc(medication.name)).join(', ')}</p>`
                  : ''
              }

              <div class="row">
                ${
                  pet
                    ? button('Ver mascota', 'pet', pet.id, 'small')
                    : ''
                }
                ${button('Editar', 'vet-edit-attention', record.id, 'small')}
              </div>
            </article>
          `;
        }).join('')
      : '<div class="empty">Todavía no atendiste pacientes hoy.</div>'
  );
}

function notificationsView() {
  return heading(
    'Notificaciones',
    'Eventos y actualizaciones de tu actividad.',
    button('Marcar todas como leídas', 'read-all')
  ) +
  notifications()
    .slice()
    .reverse()
    .map(notification => `
      <article class="card notification">
        <div class="row between">
          <div>
            <p>${esc(notification.message)}</p>
            <small>
              ${new Date(notification.date).toLocaleString('es-AR')}
            </small>
          </div>

          ${
            notification.readBy.includes(user.id)
              ? badge('Leída')
              : button(
                  'Marcar como leída',
                  'read',
                  notification.id,
                  'small'
                )
          }
        </div>
      </article>
    `)
    .join('');
}

function renderContent() {
  let html;

  switch (route) {
    case 'home':
      html = home();
      break;

    case 'pets':
      html = petsView();
      break;

    case 'pet':
      html = petProfile();
      break;

    case 'owner':
      html = ownerProfile(selectedPet);
      break;

    case 'ownerProfile':
      html = ownerProfile(user.ownerId);
      break;

    case 'vet':
      html = vetProfile();
      break;

    case 'agenda':
      html = agendaView();
      break;

    case 'schedules':
      html = schedulesView();
      break;

    case 'products':
      html = catalog();
      break;

    case 'notices':
      html = noticesView();
      break;

    case 'notifications':
      html = notificationsView();
      break;

    case 'reminders':
      html = remindersView();
      break;

    case 'waitingRoom':
      html = waitingRoomView();
      break;

    case 'dailyHistory':
      html = dailyHistoryView();
      break;

    case 'settings':
      html = heading(
        'Configuración',
        'Los datos de tu veterinaria se reutilizan en todo el sistema.'
      ) + `
        <section class="card">
          ${formWrap('settings', clinicFields(db.config))}
        </section>
      `;
      break;

    default:
      html = genericView(route);
  }

  ui.setHtml($('#content'), html);
}

// FORMULARIOS DE ALTA Y EDICIÓN

function mayEdit(collection, id = '') {
  if (!user) return false;

  if (isAdmin()) return true;

  if (user.role === 'vet') {
    return ['pets', 'owners', 'reminders'].includes(collection);
  }

  return collection === 'owners' && id === user.ownerId;
}

function editForm(collection, id = '', preset = {}) {
  if (!mayEdit(collection, id)) {
    return toast('No tenés permisos para realizar esta acción.');
  }

  const item = id ? find(collection, id) : preset;

  if (!item) return;

  let content = '';

  if (collection === 'pets') {
    content =
      field('name', 'Nombre', item.name, 'text', 'required') +
      select(
        'species',
        'Especie',
        ['Perro', 'Gato', 'Otro'],
        item.species
      ) +
      field('breed', 'Raza', item.breed) +
      select('sex', 'Sexo', ['Hembra', 'Macho'], item.sex) +
      field(
        'birth',
        'Fecha de nacimiento',
        item.birth,
        'date',
        `required max="${today()}"`
      ) +
      field(
        'weight',
        'Peso (kg)',
        item.weight,
        'number',
        'required min="0.01" step="0.01"'
      ) +
      field('color', 'Color', item.color) +
      field(
        'photo',
        'Foto (hasta 1 MB)',
        '',
        'file',
        'accept="image/png,image/jpeg,image/webp"'
      ) +
      select(
        'ownerId',
        'Propietario',
        activeOptions('owners'),
        item.ownerId,
        'required'
      ) +
      `
        <div class="field">
          ¿Es un nuevo propietario?
          ${button('+ Registrar propietario', 'inline-owner')}
        </div>
      ` +
      area('observations', 'Observaciones', item.observations);
  }

  if (collection === 'owners') {
    content =
      field('name', 'Nombre y apellido', item.name, 'text', 'required') +
      field(
        'dni',
        'DNI',
        item.dni,
        'text',
        'required pattern="[0-9]{7,9}"'
      ) +
      field('phone', 'Teléfono', item.phone, 'tel', 'required') +
      field('email', 'Correo', item.email, 'email', 'required') +
      field('address', 'Dirección', item.address, 'text', 'required');
  }

  if (collection === 'vets') {
    content =
      field('name', 'Nombre y apellido', item.name, 'text', 'required') +
      field('license', 'Matrícula', item.license, 'text', 'required') +
      field(
        'specialty',
        'Especialidad',
        item.specialty,
        'text',
        'required'
      ) +
      checks(
        'serviceIds',
        'Servicios asignados',
        activeOptions('services'),
        item.serviceIds || []
      ) +
      (
        !id
          ? field(
              'email',
              'Correo de la cuenta individual',
              '',
              'email',
              'required'
            ) +
            field(
              'password',
              'Contraseña inicial de prueba',
              '',
              'password',
              'required minlength="6"'
            )
          : ''
      );
  }

  if (collection === 'services') {
    content =
      field(
        'name',
        'Nombre del servicio',
        item.name,
        'text',
        'required'
      ) +
      field(
        'duration',
        'Duración predeterminada (minutos)',
        item.duration || db.config.duration,
        'number',
        'required min="5" max="240"'
      ) +
      area('description', 'Descripción', item.description) +
      checks(
        'vetIds',
        'Profesionales habilitados',
        activeOptions('vets'),
        db.vets
          .filter(vet => vet.serviceIds.includes(id))
          .map(vet => vet.id)
      );
  }

  if (collection === 'schedules') {
    content =
      select(
        'vetId',
        'Veterinario',
        activeOptions('vets'),
        item.vetId,
        'required'
      ) +
      select(
        'serviceId',
        'Servicio',
        activeOptions('services'),
        item.serviceId,
        'required'
      ) +
      select(
        'day',
        'Día',
        dayNames.map((name, index) => [index, name]),
        item.day ?? 1
      ) +
      field(
        'start',
        'Hora de inicio',
        item.start || '09:00',
        'time',
        'required'
      ) +
      field(
        'end',
        'Hora de finalización',
        item.end || '13:00',
        'time',
        'required'
      ) +
      field(
        'duration',
        'Duración del turno',
        item.duration || db.config.duration,
        'number',
        'required min="5" max="240"'
      );
  }

  if (collection === 'products') {
    content =
      field('name', 'Nombre', item.name, 'text', 'required') +
      field('category', 'Categoría', item.category, 'text', 'required') +
      area('description', 'Descripción', item.description) +
      field(
        'price',
        'Precio ($)',
        item.price,
        'number',
        'required min="0" step="0.01"'
      ) +
      field(
        'stock',
        'Stock',
        item.stock,
        'number',
        'required min="0" step="1"'
      ) +
      field(
        'photo',
        'Imagen (hasta 1 MB)',
        '',
        'file',
        'accept="image/png,image/jpeg,image/webp"'
      );
  }

  if (collection === 'notices') {
    content =
      field('title', 'Título', item.title, 'text', 'required') +
      field(
        'date',
        'Fecha de publicación',
        item.date || today(),
        'date',
        'required'
      ) +
      area('message', 'Mensaje', item.message) +
      field('expires', 'Expiración (opcional)', item.expires, 'date') +
      select(
        'active',
        'Estado',
        [
          [true, 'Publicado'],
          [false, 'Borrador']
        ],
        item.active ?? true
      );
  }

  if (collection === 'users') {
    // Formulario simple: nombre, correo, contraseña, teléfono y rol.
    // El Administrador gestiona propietarios y veterinarios (las
    // cuentas de administración las crea el Superadmin, que ve los
    // roles Administrador, Veterinario y Propietario: solo hay una
    // cuenta de Superadmin y ese rol no se ofrece).
    // Con rol Veterinario aparece el vínculo al perfil profesional.
    // Con rol Propietario no se pide nada más: la cuenta se vincula
    // sola por correo con el perfil creado en Propietarios.
    const roleOptions = user.role === 'admin'
      ? [['owner', roleNames.owner], ['vet', roleNames.vet]]
      : Object.entries(roleNames).filter(([value]) => value !== 'superadmin');

    const currentRole = item.role || 'owner';

    content =
      field('name', 'Nombre', item.name, 'text', 'required') +
      field('email', 'Correo (usuario)', item.email, 'email', 'required') +
      field(
        'password',
        id
          ? 'Nueva contraseña (vacío conserva la actual)'
          : 'Contraseña',
        '',
        'password',
        `minlength="6" ${id ? '' : 'required'}`
      ) +
      field(
        'phone',
        'Número de teléfono',
        item.phone || '',
        'tel',
        id ? '' : 'required'
      ) +
      select(
        'role',
        'Rol',
        roleOptions,
        currentRole,
        item.principal ? 'disabled' : ''
      ) +
      `<div data-role-link="vet" ${currentRole === 'vet' ? '' : 'hidden'}>` +
      select(
        'vetId',
        'Perfil veterinario (para ese rol)',
        [
          ['', 'Sin vincular'],
          ...activeOptions('vets')
        ],
        item.vetId
      ) +
      '</div>';
  }

  if (collection === 'reminders') {
    content =
      select(
        'petId',
        'Mascota',
        pets().map(pet => [pet.id, pet.name]),
        item.petId,
        'required'
      ) +
      field(
        'title',
        'Cuidado / recordatorio',
        item.title,
        'text',
        'required'
      ) +
      select(
        'category',
        'Tipo de cuidado (color en el calendario)',
        CARE_CATEGORIES.map(entry => entry[0]),
        item.category || careCategoryFromText(item.title)
      ) +
      field(
        'date',
        'Próxima fecha',
        item.date || today(),
        'date',
        'required'
      );
  }

  const names = {
    pets: 'mascota',
    owners: 'propietario',
    vets: 'veterinario',
    services: 'servicio',
    schedules: 'horario',
    products: 'producto',
    notices: 'aviso',
    users: 'usuario',
    reminders: 'recordatorio'
  };

  modal(
    `${id ? 'Editar' : 'Crear'} ${names[collection]}`,
    formWrap('entity', content, collection + ':' + id)
  );
}

function clinicalForm(petId, appointmentId = '') {
  if (
    user.role === 'owner' ||
    !canPet(find('pets', petId))
  ) {
    return;
  }

  modal(
    'Registrar atención clínica',
    `
      <div class="hint">
        Responsable: <b>${esc(user.name)}</b>.
        Se registra automáticamente con tu cuenta
        ${isAdmin() ? ' administrativa' : ''}.
      </div>

      <br>

      ${formWrap(
        'clinical',
        select(
          'type',
          'Tipo de registro',
          [
            'Consulta',
            'Vacuna',
            'Tratamiento',
            'Desparasitación',
            'Pipeta',
            'Operación',
            'Estudio'
          ]
        ) +
        field(
          'date',
          'Fecha',
          today(),
          'date',
          `required max="${today()}"`
        ) +
        field(
          'title',
          'Título / procedimiento',
          '',
          'text',
          'required'
        ) +
        field(
          'weight',
          'Peso (kg)',
          find('pets', petId).weight,
          'number',
          'min="0.01" step="0.01"'
        ) +
        field('diagnosis', 'Diagnóstico / resultado') +
        area('info', 'Información clínica y observaciones') +
        field(
          'nextDate',
          'Próximo cuidado (se carga en el calendario del propietario)',
          '',
          'date',
          `min="${today()}"`
        ) +
        select(
          'nextCategory',
          'Tipo del próximo cuidado',
          [['', 'Automático según el tipo de registro']].concat(
            CARE_CATEGORIES.map(entry => [entry[0], entry[0]])
          ),
          ''
        ) +
        select(
          'visible',
          'Visibilidad',
          [
            [true, 'Compartir con propietario'],
            [false, 'Nota interna']
          ],
          true
        ),
        petId + '|' + appointmentId
      )}
    `
  );
}

// ATENCIÓN VETERINARIA (conectada a la sala de espera de Administración)

function medicationRow(medication = {}) {
  return `
    <div class="owner-box full med-row">
      <div class="form-grid">
        ${field('med-name[]', 'Nombre', medication.name || '')}
        ${field('med-dose[]', 'Dosis', medication.dose || '')}
        ${field('med-quantity[]', 'Cantidad', medication.quantity || '')}
        ${field('med-route[]', 'Vía de administración', medication.route || '')}
        ${area('med-notes[]', 'Observaciones', medication.notes || '')}
      </div>

      ${button('Quitar medicamento', 'vet-remove-med', '', 'small danger')}
    </div>
  `;
}

function ticketMedRow(medication = {}) {
  return `
    <div class="tmed-row med-row">
      ${field('tmed-name[]', 'Medicamento colocado', medication.name || '')}
      ${field('tmed-quantity[]', 'Cantidad', medication.quantity || '', 'number', 'min="1" step="1" inputmode="numeric" oninput="this.value=this.value.replace(/[^0-9]/g,\'\')"')}
      ${button('Quitar', 'vet-remove-med', '', 'small danger')}
    </div>
  `;
}

function attentionModal(entryId = '', clinicalId = '') {
  if (user.role !== 'vet' && user.role !== 'superadmin') return;

  const entry = entryId
    ? (db.waitingRoom || []).find(item => item.id === entryId)
    : null;

  const record = clinicalId ? find('clinical', clinicalId) : null;

  if (!entry && !record) {
    return toast('La atención no está disponible.');
  }

  const pet = find('pets', entry?.petId || record?.petId);

  if (!pet || !canPet(pet)) return;

  const age = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(pet.birth + 'T12:00:00')) / 31557600000
    )
  );

  // Vista de atención (veterinario):
  // - Al abrir se ve la historia clínica COMO ESTABA (con panel lateral
  //   de edad/sexo/peso/nacimiento).
  // - Botón "Registrar atención": oculta historial + panel lateral y
  //   muestra SOLO el formulario de carga a ancho completo.
  // - Sin datos del propietario.
  // - Ticket automático (igual que Vacuna): lo que se carga en
  //   "Registrar atención" (motivo, atención realizada y medicación)
  //   es lo mismo que ve Administración en el ticket. No se rellena
  //   dos veces: al guardar se genera/actualiza el ticket solo.
  // - Búsqueda rápida: los mismos filtros de la historia clínica de la
  //   mascota (Historia clínica, Vacunas, Tratamientos, Desparasitación,
  //   Pipetas, Estudios) a la par del título "Historia clínica".
  const history = db.clinical
    .filter(item => item.petId === pet.id && item.id !== clinicalId)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Mismos filtros que las pestañas de la ficha de la mascota
  // (ver petView): Historia clínica = todos, el resto filtra por tipo.
  const attendQuickFilters = [
    ['Historia clínica', ''],
    ['Vacunas', 'Vacuna'],
    ['Tratamientos', 'Tratamiento'],
    ['Desparasitación', 'Desparasitación'],
    ['Pipetas', 'Pipeta'],
    ['Estudios', 'Estudio']
  ];

  const medications = normMeds(record?.medications).length
    ? normMeds(record.medications)
    : [{}];

  // Tipo de atención del modal: si se edita un registro existente se
  // respeta su tipo; si es nuevo, arranca en Consulta (la barrita puede
  // cambiarlo a Vacuna y el formulario se adapta solo).
  attendType = record?.type === 'Vacuna' ? 'Vacuna' : 'Consulta';

  const isVaccineMode = attendType === 'Vacuna';

  // Motivo informado por Administración al ingresar la mascota.
  // Al atender, ya aparece cargado en el formulario para que el
  // veterinario lo vea, lo confirme o lo complete.
  const entryReason = entry?.reason || '';
  const initialReason = record?.reason || entryReason || '';

  // Ticket automático (igual que Vacuna): copia los mismos datos de
  // Registrar atención. No se edita a mano en un segundo formulario.

  // Registros anteriores a los ítems desglosados: traían un solo texto
  // en `performed`. Al editar, se ofrece ese texto en Observaciones
  // para no perder información y poder redistribuirlo.
  const hasAttItems = !!(
    record?.attObservations ||
    record?.attProcedures ||
    record?.attTreatments ||
    record?.attIndications ||
    record?.attRecommendations
  );
  const legacyPerformed = record && !hasAttItems ? (record.performed || '') : '';

  modal(
    record ? 'Editar atención veterinaria' : `Atención veterinaria · ${pet.name}`,
    `
      <div class="${record ? 'attend-single' : 'attend-layout'}" id="attend-layout">
        <aside class="attend-pet" id="attend-pet-info" ${record ? 'hidden' : ''}>
          <h3>${esc(pet.name)}</h3>
          <p class="muted">${esc(pet.species)} · ${esc(pet.breed)}</p>
          <ul>
            <li><small>Edad</small><br>${age} años</li>
            <li><small>Sexo</small><br>${esc(pet.sex)}</li>
            <li><small>Peso</small><br>${esc(pet.weight)} kg</li>
            <li><small>Nacimiento</small><br>${pretty(pet.birth)}</li>
          </ul>
          ${pet.observations ? `<p><small>Observaciones</small><br>${esc(pet.observations)}</p>` : ''}
        </aside>

        <div class="attend-main">
          <div id="attend-history-wrap" ${record ? 'hidden' : ''}>
            <div class="row between attend-history-head">
              <h3 style="margin:0;">Historia clínica</h3>
              <small class="muted" id="attend-history-count">${history.length} registro(s)</small>
            </div>
            <div class="attend-quick" role="group" aria-label="Búsqueda rápida en historia clínica">
              ${attendQuickFilters.map(([labelText, typeValue]) => `
                <button
                  type="button"
                  class="small ${(isVaccineMode ? 'Vacuna' : '') === typeValue ? 'active' : ''}"
                  data-action="vet-history-filter"
                  data-id="${esc(typeValue)}"
                >${esc(labelText)}</button>
              `).join('')}
            </div>
            <div class="attend-history" id="attend-history-list">
              ${
                history.length
                  ? history.map(item => `
                    <div data-history-type="${esc(item.type || '')}">
                      ${clinicalCard(item)}
                    </div>
                  `).join('')
                  : '<p class="muted">Sin atenciones anteriores registradas.</p>'
              }
            </div>
            ${history.length ? '<div id="attend-history-empty" class="empty" hidden>Sin registros en esta sección.</div>' : ''}
          </div>

          <div class="attend-toggle-row">
            ${button(
              record ? '← Volver al historial' : (isVaccineMode ? 'Registrar vacuna' : 'Registrar atención'),
              'vet-toggle-attention',
              '',
              'primary'
            )}
          </div>

          <div id="attend-form-wrap" ${record ? '' : 'hidden'}>
            <form data-form="attention" data-id="${esc(entryId)}|${esc(clinicalId)}">
              <input type="hidden" name="attType" value="${esc(attendType)}">
              <div id="attend-consult-wrap">
                <h3 id="attend-form-title">${isVaccineMode ? 'Datos de la vacuna' : 'Datos de la consulta'}</h3>
                <div class="owner-box">
                  <h3>Motivo de consulta</h3>
                  <p>${esc(initialReason || '—')}</p>
                  <input type="hidden" name="reason" value="${esc(initialReason)}">
                </div>
                <div class="form-grid">
                  ${field(
                    'weight',
                    'Peso (kg)',
                    record?.weight || pet.weight,
                    'number',
                    'min="0.01" step="0.01"'
                  )}
                  ${field(
                    'temperature',
                    'Temperatura (°C)',
                    record?.temperature || '',
                    'number',
                    'step="0.1"'
                  )}
                </div>

                <div id="attend-consult-fields" ${isVaccineMode ? 'hidden' : ''}>
                <div class="form-grid">
                  ${area('attObservations', 'Observaciones', record?.attObservations || legacyPerformed || '')}
                  ${area('attProcedures', 'Procedimientos', record?.attProcedures || '')}
                  ${area('attTreatments', 'Tratamientos', record?.attTreatments || '')}
                  ${area('attIndications', 'Indicaciones', record?.attIndications || '')}
                  ${area('attRecommendations', 'Recomendaciones', record?.attRecommendations || '')}
                </div>

                <h3>Medicación de la consulta</h3>
                <p class="muted">
                  Información completa: nombre, dosis, cantidad,
                  vía de administración y observaciones.
                </p>
                <div id="med-rows">
                  ${medications.map(medicationRow).join('')}
                </div>

                ${button('+ Agregar medicamento', 'vet-add-med', '', 'small')}

                <h3>Próximo cuidado</h3>
                <p class="muted">
                  Opcional. Si cargás una fecha, le aparece al propietario en su calendario
                  con el color del tipo elegido.
                </p>
                <div class="form-grid">
                  ${select(
                    'nextCategory',
                    'Tipo',
                    CARE_CATEGORIES.map(entry => [entry[0], entry[0]]),
                    record?.nextCategory || 'Control'
                  )}
                  ${field('nextDate', 'Fecha', record?.nextDate || '', 'date', `min="${record?.nextDate && record.nextDate < today() ? record.nextDate : today()}"`)}
                  ${field('nextNote', 'Nota para el propietario', record?.nextNote || '')}
                </div>

                <p class="muted" style="margin:0.4rem 0 0;">
                  Al guardar se genera el ticket para Administración con estos mismos datos. No hay que volver a rellenarlo.
                </p>
                </div>

                <div id="attend-vaccine-fields" ${isVaccineMode ? '' : 'hidden'}>
                  <div class="form-grid">
                    ${field('vaccineName', 'Nombre de la vacuna', record?.vaccineName || '')}
                    ${field('vaccineType', 'Tipo de vacuna', record?.vaccineType || '')}
                    ${field('vaccineDose', 'Dosis', record?.vaccineDose || '')}
                    ${field('vaccineLot', 'Lote', record?.vaccineLot || '')}
                    ${field('vaccineNext', 'Próxima aplicación', record?.vaccineNext || '', 'date', `min="${today()}"`)}
                  </div>
                  <p class="muted" style="margin:0.4rem 0 0;">
                    Al guardar se genera el ticket para Administración con estos datos. No hay que volver a rellenarlo.
                  </p>
                </div>

                <div id="form-error" class="error" role="alert"></div>

                <div class="form-actions" id="attend-consult-actions" ${isVaccineMode ? 'hidden' : ''}>
                  ${button('Cancelar', 'close')}
                  <button class="primary" type="submit">Guardar consulta</button>
                </div>

                <div class="form-actions" id="attend-vaccine-actions" ${isVaccineMode ? '' : 'hidden'}>
                  ${button('Cancelar', 'close')}
                  <button class="primary" type="submit">Guardar vacuna</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    `
  );
}

// IDENTIFICACIÓN QR SIMULADA

function qrSvg(pet) {
  let state = 2166136261;

  for (const character of pet.qr) {
    state = Math.imul(
      state ^ character.charCodeAt(0),
      16777619
    );
  }

  const bit = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state & 1;
  };

  let rectangles = '';

  for (let y = 0; y < 29; y++) {
    for (let x = 0; x < 29; x++) {
      const origins = [
        [0, 0],
        [22, 0],
        [0, 22]
      ];

      const finder = origins.find(([a, b]) =>
        x >= a &&
        x < a + 7 &&
        y >= b &&
        y < b + 7
      );

      let on;

      if (finder) {
        const dx = x - finder[0];
        const dy = y - finder[1];

        on =
          dx === 0 ||
          dx === 6 ||
          dy === 0 ||
          dy === 6 ||
          (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
      } else {
        on = bit();
      }

      if (on) {
        rectangles += `
          <rect x="${x + 4}" y="${y + 4}" width="1" height="1"/>
        `;
      }
    }
  }

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

  const age = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(pet.birth + 'T12:00:00')) / 31557600000
    )
  );

  const sectionType = {
    Vacunas: 'Vacuna',
    Tratamientos: 'Tratamiento',
    Desparasitación: 'Desparasitación',
    Pipetas: 'Pipeta',
    Estudios: 'Estudio'
  }[petTab];

  const records = db.clinical
    .filter(record =>
      record.petId === pet.id &&
      (user.role !== 'owner' || record.visible) &&
      (!sectionType || record.type === sectionType)
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  modal(
    `Historia clínica · ${pet.name}`,
    `
      <div class="center">
        <h2>${esc(pet.name)}</h2>
        <p class="muted">
          ${esc(pet.species)} · ${esc(pet.breed)} · ${esc(pet.sex)} ·
          ${age} años · ${esc(pet.weight)} kg
        </p>
        <p class="muted">
          Propietario: ${esc(owner?.name || 'No disponible')} ·
          Código <b style="letter-spacing:0.2rem;">${esc(pet.code || '—')}</b>
        </p>
        <p class="muted">
          <small>
            Sección: ${esc(petTab)} · ${records.length} registro(s) ·
            Emitido el ${new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </small>
        </p>
      </div>

      <div>
        ${
          records.length
            ? records.map(clinicalCard).join('')
            : '<p class="muted">Sin registros en esta sección.</p>'
        }
      </div>

      <div class="row">
        ${button('Imprimir', 'print', '', 'primary')}
      </div>
    `
  );
}

function showQR(id, print = false) {
  const pet = find('pets', id);

  if (!canPet(pet)) return;

  modal(
    'Identificación de mascota',
    `
      <div class="center">
        <h2>${esc(pet.name)}</h2>
        <div class="qr">${qrSvg(pet)}</div>

        <p>
          <b>QR simulado · No escaneable con cámara</b><br>
          <small>Identificador único: ${esc(pet.qr)}</small>
        </p>

        <div class="owner-box">
          <h3>Código de identificación · 5 dígitos</h3>
          <p style="font-size:2rem;letter-spacing:0.4rem;margin:0.2rem 0;">
            <b>${esc(pet.code || '—')}</b>
          </p>
          <p class="muted" style="margin:0;">
            Dictá este código en recepción si no se puede escanear el QR.
            Administración lo ingresa con “Escanear / Código”.
          </p>
        </div>

        <p class="muted">
          La imagen representa únicamente el identificador.
          No contiene la historia clínica.
        </p>

        <div class="row">
          ${button('Simular escaneo', 'scan', pet.id, 'primary')}
          ${button('Vista pública', 'public', pet.id)}
          ${button('Descargar QR simulado', 'download-qr', pet.id)}
          ${button('Imprimir', 'print')}
        </div>
      </div>
    `
  );

  if (print) window.print();
}

// ESCANEO DE INGRESO (ADMINISTRADOR)
// Simula el escaneo del QR de una mascota desde recepción/administración
// para hacerla ingresar a la sala de espera. No requiere cámara real:
// el administrador selecciona el QR existente de la mascota a ingresar
// o tipea su código de 5 dígitos (ideal para PC sin escáner).

function scanModal() {
  const options = pets().filter(pet => pet.active);

  modal(
    'Escanear QR / Ingresar código',
    `
      <form data-form="admin-code">
        <div class="form-grid">
          <label class="field">
            Código de 5 dígitos de la mascota
            <input
              name="code"
              type="text"
              inputmode="numeric"
              autocomplete="off"
              placeholder="Ej. 48210"
              maxlength="5"
              pattern="[0-9]{5}"
              required
            >
          </label>
        </div>
        <div id="form-error" class="error" role="alert"></div>
        <div class="form-actions" style="justify-content:flex-start;">
          <button class="primary" type="submit">Identificar por código</button>
        </div>
        <p class="muted" style="margin:0.4rem 0 0;">
          Si estás en la compu y no podés escanear, pedí el código de
          5 dígitos de la mascota y escribilo acá.
        </p>
      </form>

      <hr>

      <p class="muted">
        O seleccioná el código QR de la mascota para simular el escaneo
        (cámara no disponible en esta maqueta).
      </p>

      <div class="scan-list">
        ${
          options.map(pet => {
            const busy = activeEntry(pet.id);

            if (busy) {
              return `
                <button type="button" class="scan-pick" disabled>
                  <b>${esc(pet.name)}</b> · Código ${esc(pet.code || '—')}<br>
                  <small>
                    ${esc(pet.species)} · ${esc(pet.breed)} ·
                    ${esc(label('owners', pet.ownerId))} ·
                    QR ${esc(String(pet.qr || pet.id).slice(0, 8))}
                  </small><br>
                  <span class="badge waiting">Ya ingresado · ${esc(busy.status)}</span>
                </button>
              `;
            }

            return `
              ${button(
                `<b>${esc(pet.name)}</b> · Código ${esc(pet.code || '—')}<br>
                <small>
                  ${esc(pet.species)} · ${esc(pet.breed)} ·
                  ${esc(label('owners', pet.ownerId))} ·
                  QR ${esc(String(pet.qr || pet.id).slice(0, 8))}
                </small>`,
                'admin-scan-pick',
                pet.id,
                'scan-pick'
              )}
            `;
          }).join('') ||
          '<p class="muted">No hay mascotas activas para escanear.</p>'
        }
      </div>
    `
  );
}

function scanResultModal(petId) {
  const pet = find('pets', petId);

  if (!pet) {
    return toast('No se encontró una mascota con ese código QR.');
  }

  const owner = find('owners', pet.ownerId);
  const existing = activeEntry(pet.id);

  if (existing) {
    modal(
      existing.status === 'Esperando'
        ? 'Esta mascota ya está esperando'
        : 'Esta mascota ya tiene un ingreso activo',
      `
        <p>
          <b>${esc(pet.name)}</b> ya tiene un ingreso activo en la sala de espera
          (estado: ${esc(existing.status)}, ingreso ${entryTime(existing)}). No se generó un nuevo registro.
        </p>

        <div class="form-actions">
          ${button('Volver a escanear', 'admin-scan', '', 'ghost')}
          ${button('Ver sala de espera', 'nav', 'waitingRoom', 'primary')}
        </div>
      `
    );
    return;
  }

  const age = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(pet.birth + 'T12:00:00')) / 31557600000
    )
  );

  modal(
    'Mascota identificada',
    `
      <div class="owner-box">
        <h3>Datos de la mascota</h3>
        <div class="form-grid">
          <p><small>Nombre</small><br>${esc(pet.name)}</p>
          <p><small>Especie</small><br>${esc(pet.species)}</p>
          <p><small>Raza</small><br>${esc(pet.breed)}</p>
          <p><small>Edad</small><br>${age} años</p>
          <p><small>Peso</small><br>${esc(pet.weight)} kg</p>
          <p><small>Sexo</small><br>${esc(pet.sex)}</p>
        </div>
      </div>

      <div class="owner-box">
        <h3>Datos del propietario</h3>
        <div class="form-grid">
          <p><small>Nombre y apellido</small><br>${esc(owner?.name)}</p>
          <p><small>DNI</small><br>${esc(owner?.dni)}</p>
          <p><small>Teléfono</small><br>${esc(owner?.phone)}</p>
          <p><small>Email</small><br>${esc(owner?.email)}</p>
          <p><small>Dirección</small><br>${esc(owner?.address)}</p>
        </div>
      </div>

      <form data-form="admin-entry" data-id="${esc(pet.id)}">
        ${area('reason', 'Motivo de consulta (lo verá el veterinario al atender)', '')}
        <div id="form-error" class="error" role="alert"></div>
        <div class="form-actions">
          ${button('Volver a escanear', 'admin-scan', '', 'ghost')}
          <button class="primary" type="submit">Confirmar ingreso</button>
        </div>
      </form>
    `
  );
}

// MOTIVO DE INGRESOS YA CREADOS (ADMINISTRADOR).
// Los ingresos anteriores al campo motivo quedaron con reason=''.
// Con esto Administración puede cargarlo/editarlo y el veterinario
// lo ve precargado al atender (Atender → Registrar atención).
function entryReasonModal(entryId) {
  const entry = (db.waitingRoom || []).find(item => item.id === entryId);

  if (!entry) return toast('Ingreso no disponible.');

  const pet = find('pets', entry.petId);

  modal(
    `Motivo de consulta · ${entry.petName}`,
    `
      <p class="muted">
        ${esc(pet?.species || '')} ${esc(pet?.breed || '')} ·
        Ingreso: ${entryTime(entry)} · Estado: ${esc(entry.status)}
      </p>
      <form data-form="admin-entry-reason" data-id="${esc(entry.id)}">
        ${area('reason', 'Motivo de consulta (lo verá el veterinario al atender)', entry.reason || '')}
        <div id="form-error" class="error" role="alert"></div>
        <div class="form-actions">
          ${button('Cancelar', 'close')}
          <button class="primary" type="submit">Guardar motivo</button>
        </div>
      </form>
    `
  );
}

// TICKET A COBRAR (ADMINISTRADOR).
// Una sola tarjeta con código del ticket, mascota, código, propietario
// (solo nombre), fecha, hora y motivo. Administración carga el precio
// de cada medicamento y el total se genera automáticamente.
// El veterinario nunca ve estos precios.
// Administración NO edita nombre ni cantidad: solo visualiza lo que
// cargó el veterinario y pone el precio de cada medicamento.
function chargeMedRow(medication = {}) {
  const detail = [
    medication.quantity ? `Cant. ${esc(medication.quantity)}` : '',
    medication.dose ? `Dosis: ${esc(medication.dose)}` : '',
    medication.route ? `Vía: ${esc(medication.route)}` : '',
    medication.notes ? `Obs.: ${esc(medication.notes)}` : ''
  ].filter(Boolean).join(' · ');
  return `
    <div class="charge-row" data-charge-row>
      <div class="charge-info">
        <b>${esc(medication.name || 'Concepto')}</b>
        ${detail ? `<br><small>${detail}</small>` : ''}
      </div>
      <input type="hidden" name="med-name[]" value="${esc(medication.name || '')}">
      <input type="hidden" name="med-quantity[]" value="${esc(medication.quantity || '')}">
      <input type="hidden" name="med-dose[]" value="${esc(medication.dose || '')}">
      <input type="hidden" name="med-route[]" value="${esc(medication.route || '')}">
      <input type="hidden" name="med-notes[]" value="${esc(medication.notes || '')}">
      ${field(
        'med-price[]',
        'Precio ($)',
        medication.price ?? '',
        'number',
        'min="0" step="1" data-charge-price required'
      )}
    </div>
  `;
}

// Suma en vivo todos los precios del modal de cobro (medicamentos +
// monto por atención) y actualiza el total automático.
function updateChargeTotal() {
  const modalEl = $('#modal');
  if (!modalEl) return;

  let total = 0;

  modalEl.querySelectorAll('[data-charge-price]').forEach(input => {
    const value = Number(input.value);
    if (Number.isFinite(value) && value > 0) total += value;
  });

  const totalEl = $('#charge-total');
  if (totalEl) totalEl.textContent = money(Math.round(total));
}

function chargeTicketModal(ticketId) {
  const ticketItem = ticket(ticketId);

  if (!ticketItem || ticketItem.status !== 'Pendiente de cobro') {
    return toast('Ticket no disponible para el cobro.');
  }

  const pet = find('pets', ticketItem.petId);
  const owner = find('owners', ticketItem.ownerId);

  const meds = normMeds(ticketItem.medications).map(medication => ({
    name: medication.name || '',
    quantity: medication.quantity || '',
    dose: medication.dose || '',
    route: medication.route || '',
    notes: medication.notes || '',
    price: medication.price ?? ''
  }));

  modal(
    `Ticket a cobrar de ${pet?.name || ticketItem.petName || 'mascota'}`,
    `
      <div class="owner-box">
        <h3>Código de ticket ${esc(ticketItem.number)} · ${badge(ticketItem.status)}</h3>
        <div class="form-grid">
          <p><small>Mascota</small><br>${esc(pet?.name || ticketItem.petName || 'No disponible')}</p>
          <p><small>Código mascota (5 dígitos)</small><br><b style="letter-spacing:0.2rem;">${esc(pet?.code || ticketItem.petCode || '—')}</b></p>
          <p><small>Propietario</small><br>${esc(owner?.name || ticketItem.ownerName || 'No disponible')}</p>
          <p><small>Fecha</small><br>${pretty(ticketItem.date)}</p>
          <p><small>Hora</small><br>${esc(ticketItem.time || '—')}</p>
          <p><small>Veterinario</small><br>${esc(ticketItem.vetName || 'No disponible')}</p>
        </div>
        <p><small>Motivo:</small> ${esc(ticketItem.reason || '—')}</p>
        <p><small>Atención realizada:</small> ${esc(ticketItem.performed || '—')}</p>
      </div>

      <form data-form="charge" data-id="${esc(ticketItem.id)}">
        <div class="ticket-box">
          <h3>Precios por medicamento</h3>
          <p class="muted">Cargá el precio de cada medicamento. El total se genera automáticamente.</p>
          <div id="charge-med-rows">
            ${
              meds.length
                ? meds.map(chargeMedRow).join('')
                : '<p class="muted">Sin medicamentos indicados por el veterinario.</p>'
            }
          </div>
          <div class="form-grid" style="margin-top:10px;">
            ${field(
              'serviceAmount',
              'Monto por atención / servicios ($)',
              ticketItem.serviceAmount ?? '',
              'number',
              'min="0" step="1" data-charge-price'
            )}
          </div>
          <p class="charge-total">Total automático: <b id="charge-total">$0</b></p>
        </div>
        <div id="form-error" class="error" role="alert"></div>
        <div class="form-actions">
          ${button('Cancelar', 'close')}
          <button class="primary" type="submit">Confirmar cobro</button>
        </div>
      </form>
    `
  );

  updateChargeTotal();
}

// TICKET GUARDADO / PAGADO (ADMINISTRADOR).
// Una sola tarjeta: código del ticket, mascota, código, propietario
// (solo nombre), medicamentos con dosis y precio a la par, y total.
function ticketDetailModal(ticketId) {
  const ticketItem = ticket(ticketId);

  if (!ticketItem) {
    return toast('Ticket no disponible.');
  }

  const pet = find('pets', ticketItem.petId);
  const owner = find('owners', ticketItem.ownerId);

  modal(
    `Ticket ${esc(ticketItem.number)} · ${esc(pet?.name || ticketItem.petName || 'mascota')}`,
    `
      <div class="owner-box">
        <h3>Código de ticket ${esc(ticketItem.number)} · ${badge(ticketItem.status)}</h3>
        <div class="form-grid">
          <p><small>Mascota</small><br>${esc(pet?.name || ticketItem.petName || 'No disponible')}</p>
          <p><small>Código mascota (5 dígitos)</small><br><b style="letter-spacing:0.2rem;">${esc(pet?.code || ticketItem.petCode || '—')}</b></p>
          <p><small>Propietario</small><br>${esc(owner?.name || ticketItem.ownerName || 'No disponible')}</p>
          <p><small>Fecha</small><br>${pretty(ticketItem.date)}</p>
          <p><small>Hora</small><br>${esc(ticketItem.time || '—')}</p>
          <p><small>Veterinario</small><br>${esc(ticketItem.vetName || 'No disponible')}</p>
        </div>
        <p><small>Motivo:</small> ${esc(ticketItem.reason || '—')}</p>
        <p><small>Atención realizada:</small> ${esc(ticketItem.performed || '—')}</p>
        <h3>Medicamentos y precios</h3>
        ${
          normMeds(ticketItem.medications).length
            ? `
              <div class="table-wrap">
                <table class="ticket-lines">
                  <thead>
                    <tr><th>Medicamento</th><th>Dosis / Cant. / Vía</th><th>Precio</th></tr>
                  </thead>
                  <tbody>
                    ${normMeds(ticketItem.medications).map(medication => {
                      const doseCant = [
                        medication.dose ? `Dosis: ${medication.dose}` : '',
                        medication.quantity ? `Cant.: ${medication.quantity}` : '',
                        medication.route ? `Vía: ${medication.route}` : '',
                        medication.notes ? `Obs.: ${medication.notes}` : ''
                      ].filter(Boolean).join(' · ') || '—';
                      return `
                      <tr>
                        <td>${esc(medication.name || '—')}</td>
                        <td>${esc(doseCant)}</td>
                        <td>${Number.isFinite(Number(medication.price)) ? money(Number(medication.price)) : '—'}</td>
                      </tr>
                    `;}).join('')}
                  </tbody>
                </table>
              </div>
            `
            : '<p class="muted">Sin medicamentos.</p>'
        }
        ${
          Number(ticketItem.serviceAmount) > 0
            ? `<p><small>Atención / servicios:</small> ${money(Number(ticketItem.serviceAmount))}</p>`
            : ''
        }
        <p class="charge-total">Total: <b>${ticketItem.total > 0 ? money(ticketItem.total) : 'A definir'}</b></p>
        ${
          ticketItem.paidAt
            ? `<p class="muted"><small>Cobrado el ${new Date(ticketItem.paidAt).toLocaleString('es-AR')}</small></p>`
            : ''
        }
      </div>

      <div class="form-actions">
        ${button('Cerrar', 'close')}
        ${button('Imprimir', 'print', '', 'primary')}
      </div>
    `
  );
}

function publicProfile(id) {
  const pet = find('pets', id);

  if (!pet) return;

  modal(
    'Identificación pública',
    `
      <div class="center">
        ${petPhoto(pet, true)}
        <h2>${esc(pet.name)}</h2>
        <p>${esc(pet.breed)}</p>
        <p>Esta mascota pertenece a una cuenta registrada.</p>
        ${button('Iniciar sesión', 'public-login', pet.qr, 'primary')}
      </div>
    `
  );
}

// PERSISTENCIA DE FORMULARIOS

function pushNotification(appointment, message) {
  db.notifications.push({
    id: uid(),
    message,
    ownerId: appointment.ownerId,
    vetId: appointment.vetId,
    date: new Date().toISOString(),
    readBy: []
  });
}

// NOTIFICACIÓN AL VETERINARIO POR INGRESO A SALA DE ESPERA.
// Cada vez que Administración carga una mascota en sala (vía escaneo,
// código o ingreso manual), se genera una notificación para TODOS los
// veterinarios activos. No se asigna ownerId para que el propietario no
// reciba este aviso interno; el filtro notifications() la muestra solo a
// vets (por vetId) y a admin/superadmin.
// Debe llamarse dentro de commit(), junto al push en db.waitingRoom.
function notifyVetsWaitingEntry({ pet, reason, waitingEntryId }) {
  db.notifications = db.notifications || [];

  const vets = (db.vets || []).filter(vet => vet.active);
  const owner = (db.owners || []).find(item => item.id === pet.ownerId);
  const cleanReason = String(reason || '').trim() || '—';
  const message =
    `Nueva mascota en sala de espera: ${pet.name}` +
    `${pet.species ? ' (' + pet.species : ''}` +
    `${pet.breed ? ' · ' + pet.breed : ''}` +
    `${pet.species ? ')' : ''}` +
    ` · Motivo: ${cleanReason}` +
    ` · Propietario: ${owner?.name || 'No disponible'}.`;

  vets.forEach(vet => {
    db.notifications.push({
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

async function imageData(file) {
  if (!file || !file.size) return '';

  if (file.size > 1024 * 1024) {
    throw new Error('La imagen debe pesar menos de 1 MB.');
  }

  if (![
    'image/png',
    'image/jpeg',
    'image/webp'
  ].includes(file.type)) {
    throw new Error('Usá una imagen PNG, JPG o WebP.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () =>
      reject(new Error('No se pudo leer la imagen.'));

    reader.readAsDataURL(file);
  });
}

async function clinicData(form) {
  const data = Object.fromEntries(new FormData(form));

  data.days = new FormData(form)
    .getAll('days')
    .map(Number);

  if (!data.days.length) {
    throw new Error('Seleccioná al menos un día de atención.');
  }

  if (data.start >= data.end) {
    throw new Error('El cierre debe ser posterior a la apertura.');
  }

  data.duration = Number(data.duration);

  data.logo =
    await imageData(form.elements.logo.files[0]) ||
    db.config?.logo ||
    draft.config?.logo ||
    '';

  return data;
}

async function saveEntity(form) {
  const [collection, id] = form.dataset.id.split(':');

  if (!mayEdit(collection, id)) {
    return fail('No tenés permiso.');
  }

  const old = id ? find(collection, id) : null;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  Object.keys(data).forEach(key => {
    if (typeof data[key] === 'string') {
      data[key] = data[key].trim();
    }
  });

  if (form.elements.photo) {
    const uploadedPhoto = await imageData(form.elements.photo.files[0]);
    data.photo = uploadedPhoto || old?.photo || '';
    if (collection === 'pets' && uploadedPhoto) data.imagePreference = 'photo';
  }

  if (collection === 'pets') {
    data.weight = Number(data.weight);

    if (!find('owners', data.ownerId)?.active) {
      return fail('Seleccioná un propietario activo.');
    }

    data.qr = old?.qr || uid();

    // El código de 5 dígitos se conserva al editar. Solo se genera uno
    // nuevo si falta, es inválido o está duplicado.
    const currentCode = String(old?.code || '');

    if (
      !/^[0-9]{5}$/.test(currentCode) ||
      db.pets.some(pet => pet.id !== id && String(pet.code) === currentCode)
    ) {
      data.code = newPetCode();
    } else {
      data.code = currentCode;
    }
  }

  if (
    collection === 'owners' &&
    db.owners.some(owner =>
      owner.dni === data.dni && owner.id !== id
    )
  ) {
    return fail('Ya existe un propietario con ese DNI.');
  }

  if (collection === 'vets') {
    data.serviceIds = formData.getAll('serviceIds');

    if (db.vets.some(vet =>
      vet.license === data.license && vet.id !== id
    )) {
      return fail('La matrícula ya está registrada.');
    }

    if (
      !id &&
      db.users.some(account =>
        account.email.toLowerCase() === data.email.toLowerCase()
      )
    ) {
      return fail('Ese correo ya tiene una cuenta.');
    }
  }

  if (collection === 'services') {
    data.duration = Number(data.duration);
  }

  if (collection === 'schedules') {
    data.day = Number(data.day);
    data.duration = Number(data.duration);

    if (
      !find('vets', data.vetId)?.serviceIds.includes(data.serviceId)
    ) {
      return fail(
        'Asigná primero ese servicio al veterinario desde Servicios o Veterinarios.'
      );
    }

    if (
      data.start >= data.end ||
      minutes(data.end) - minutes(data.start) < data.duration
    ) {
      return fail('La franja debe permitir al menos un turno completo.');
    }

    if (
      !db.config.days.map(Number).includes(data.day) ||
      data.start < db.config.start ||
      data.end > db.config.end
    ) {
      return fail(
        'La franja debe estar dentro de los días y horarios generales de atención.'
      );
    }

    if (db.schedules.some(schedule =>
      schedule.id !== id &&
      schedule.active &&
      schedule.vetId === data.vetId &&
      schedule.serviceId === data.serviceId &&
      Number(schedule.day) === data.day &&
      data.start < schedule.end &&
      data.end > schedule.start
    )) {
      return fail(
        'Ya existe una franja superpuesta para este profesional y servicio.'
      );
    }
  }

  if (collection === 'products') {
    data.price = Number(data.price);
    data.stock = Number(data.stock);
  }

  if (collection === 'notices') {
    data.active = data.active === 'true';

    if (!data.message) {
      return fail('Escribí el mensaje del aviso.');
    }

    if (data.expires && data.expires < data.date) {
      return fail(
        'La expiración debe ser posterior a la publicación.'
      );
    }
  }

  if (collection === 'users') {
    data.role = old?.principal ? 'admin' : data.role;

    // El Administrador gestiona propietarios y veterinarios: no puede
    // crear cuentas de administración ni modificarlas (eso lo hace el
    // Superadmin).
    if (user.role === 'admin') {
      if (old && (old.principal || ['admin', 'superadmin'].includes(old.role))) {
        return fail('No tenés permiso para modificar esa cuenta.');
      }

      if (!['owner', 'vet'].includes(data.role)) {
        return fail('Solo podés crear cuentas de propietario o veterinario.');
      }
    }

    // Se conserva solo el vínculo del rol elegido.
    if (data.role === 'owner') data.vetId = '';
    if (data.role === 'vet') data.ownerId = '';

    if (['admin', 'superadmin'].includes(data.role)) {
      data.vetId = '';
      data.ownerId = '';
    }

    if (db.users.some(account =>
      account.id !== id &&
      account.email.toLowerCase() === data.email.toLowerCase()
    )) {
      return fail('Ese usuario ya existe.');
    }

    // La cuenta de propietario se vincula sola por correo con el perfil
    // creado en Propietarios (el formulario ya no pide ese vínculo).
    if (data.role === 'owner' && !(data.ownerId || old?.ownerId)) {
      const ownerMatch = db.owners.find(owner =>
        owner.active &&
        String(owner.email || '').toLowerCase() ===
          String(data.email || '').toLowerCase()
      );

      if (!ownerMatch) {
        return fail('No hay un propietario con ese correo. Crealo primero en Propietarios.');
      }

      data.ownerId = ownerMatch.id;
    }

    if (
      (data.role === 'vet' && !(data.vetId || old?.vetId)) ||
      (data.role === 'owner' && !(data.ownerId || old?.ownerId))
    ) {
      return fail('Vinculá la cuenta al perfil correspondiente.');
    }

    if (
      data.role === 'vet' &&
      db.users.some(account =>
        account.id !== id &&
        account.role === 'vet' &&
        account.vetId === data.vetId
      )
    ) {
      return fail('Este veterinario ya tiene una cuenta individual.');
    }

    if (id === user.id && data.role !== user.role) {
      return fail('No podés cambiar tu propio rol durante la sesión.');
    }

    if (!data.password) {
      delete data.password;
    }
  }

  const newId = id || uid();

  const ok = commit(() => {
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
      db[collection].push(row);
    }

    if (collection === 'vets' && !id) {
      db.users.push({
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
      const assigned = formData.getAll('vetIds');

      db.vets.forEach(vet => {
        vet.serviceIds = vet.serviceIds.filter(
          serviceId => serviceId !== newId
        );

        if (assigned.includes(vet.id)) {
          vet.serviceIds.push(newId);
        }
      });
    }

    if (collection === 'users' && id === user.id) {
      user = find('users', id);
    }
  });

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
      if (data.code !== CODE) {
        return fail('El código de verificación es incorrecto.');
      }

      if (authStep === 1) {
        authStep = 2;
        setup();
      } else if (authStep === 3) {
        db = seed(draft.config, draft.admin);

        if (persist()) {
          authStep = 4;
          setup();
        }
      }
      break;

    case 'admin':
      if (data.password !== data.confirm) {
        return fail('Las contraseñas no coinciden.');
      }

      draft.admin = {
        name: data.first.trim() + ' ' + data.last.trim(),
        email: data.email.trim(),
        password: data.password
      };

      authStep = 3;
      setup();
      break;

    case 'login': {
      const account = db.users.find(item =>
        item.active &&
        item.email.toLowerCase() === data.email.trim().toLowerCase() &&
        item.password === data.password
      );

      if (
        !account ||
        (
          account.role === 'vet' &&
          !find('vets', account.vetId)?.active
        ) ||
        (
          account.role === 'owner' &&
          !find('owners', account.ownerId)?.active
        )
      ) {
        return fail(
          'Las credenciales son incorrectas o la cuenta está inactiva.'
        );
      }

      if (LOCKED_ROLE && account.role !== LOCKED_ROLE) {
        return fail(
          'Esta página es de uso exclusivo del rol ' +
          (roleNames[LOCKED_ROLE] || LOCKED_ROLE) + '.'
        );
      }

      user = account;

      commit(() => {
        account.lastAccess = new Date().toISOString();
      });

      try {
        if (data.remember) {
          localStorage.setItem(KEY + '-email', account.email);
        } else {
          localStorage.removeItem(KEY + '-email');
        }
      } catch {
        // El inicio de sesión puede continuar sin recordar el usuario.
      }

      const qr = new URLSearchParams(
        location.hash.slice(1)
      ).get('qr');

      const pet = db.pets.find(item => item.qr === qr);

      if (pet && canPet(pet)) {
        navigate('pet', pet.id);
      } else {
        navigate(user.role === 'owner' ? 'pets' : 'home');
      }
      break;
    }

    case 'recover':
      if (!recovery) {
        const account = db.users.find(item =>
          item.email.toLowerCase() === data.contact.trim().toLowerCase() ||
          (
            item.ownerId &&
            find('owners', item.ownerId)?.phone === data.contact.trim()
          )
        );

        if (!account) {
          return fail('No se encontró una cuenta para ese contacto.');
        }

        recovery = {
          id: account.id,
          verified: false
        };

        recoverScreen();
      } else if (!recovery.verified) {
        if (data.code !== CODE) {
          return fail('El código de verificación es incorrecto.');
        }

        recovery.verified = true;
        recoverScreen();
      } else {
        if (data.password !== data.confirm) {
          return fail('Las contraseñas no coinciden.');
        }

        if (commit(() => {
          find('users', recovery.id).password = data.password;
        })) {
          login();
          toast('Contraseña actualizada correctamente.');
        }
      }
      break;

    case 'settings':
      if (!isAdmin()) return;

      if (commit(() => {
        db.config = draft.nextConfig;
      })) {
        shell();
        toast('Configuración actualizada.');
      }
      break;

    case 'entity':
      await saveEntity(form);
      break;

    case 'admin-code': {
      if (!isAdmin()) return fail('No tenés permiso.');

      const clean = String(data.code || '').trim();

      if (!/^[0-9]{5}$/.test(clean)) {
        return fail('Ingresá un código de 5 dígitos.');
      }

      const pet = findPetByCode(clean);

      if (!pet || !pet.active) {
        return fail('No se encontró una mascota activa con ese código.');
      }

      scanResultModal(pet.id);
      break;
    }

    case 'admin-entry': {
      if (!isAdmin()) return fail('No tenés permiso.');

      const pet = find('pets', form.dataset.id);

      if (!pet) return fail('Mascota no disponible.');

      const reason = String(data.reason || '').trim();

      if (!reason) {
        return fail('Ingresá el motivo de consulta informado al llegar.');
      }

      if (activeEntry(pet.id)) {
        close();
        navigate('waitingRoom');
        return toast('Esta mascota ya tiene un ingreso activo en la sala de espera.');
      }

      if (commit(() => {
        db.waitingRoom = db.waitingRoom || [];

        const entryId = uid();

        db.waitingRoom.push({
          id: entryId,
          petId: pet.id,
          ownerId: pet.ownerId,
          petName: pet.name,
          enteredAt: new Date().toISOString(),
          status: 'Esperando',
          reason
        });

        notifyVetsWaitingEntry({ pet, reason, waitingEntryId: entryId });
      })) {
        close();
        navigate('waitingRoom');
        toast(`${pet.name} ingresó a la sala de espera.`);
      }
      break;
    }

    case 'admin-entry-reason': {
      if (!isAdmin()) return fail('No tenés permiso.');

      const reasonEntry = (db.waitingRoom || []).find(item => item.id === form.dataset.id);

      if (!reasonEntry) return fail('Ingreso no disponible.');

      const reasonValue = String(data.reason || '').trim();

      if (!reasonValue) {
        return fail('Ingresá el motivo de consulta informado al llegar.');
      }

      if (commit(() => {
        reasonEntry.reason = reasonValue;
      })) {
        close();
        renderContent();
        toast('Motivo de consulta guardado. El veterinario lo verá al atender.');
      }
      break;
    }

    case 'charge': {
      if (!isAdmin()) return fail('No tenés permiso.');

      const chargedTicket = ticket(form.dataset.id);

      if (!chargedTicket || chargedTicket.status !== 'Pendiente de cobro') {
        return fail('Ticket no disponible para el cobro.');
      }

      // Precios cargados por Administración: un precio por cada
      // medicamento + monto por atención. El total se calcula acá
      // (no se confía en el total mostrado) y se guarda medicamento
      // con su precio a la par, más snapshot de propietario, QR y
      // códigos para que el ticket guardado quede completo.
      const chargeNames = formData.getAll('med-name[]');
      const chargeQuantities = formData.getAll('med-quantity[]');
      const chargeDoses = formData.getAll('med-dose[]');
      const chargeRoutes = formData.getAll('med-route[]');
      const chargeNotes = formData.getAll('med-notes[]');
      const chargePrices = formData.getAll('med-price[]');

      const chargeMeds = chargeNames
        .map((name, index) => ({
          name: String(name || '').trim(),
          quantity: String(chargeQuantities[index] ?? '').trim(),
          dose: String(chargeDoses[index] ?? '').trim(),
          route: String(chargeRoutes[index] ?? '').trim(),
          notes: String(chargeNotes[index] ?? '').trim(),
          price: chargePrices[index] === '' || chargePrices[index] == null
            ? NaN
            : Math.round(Number(chargePrices[index]))
        }))
        .filter(medication => medication.name || Number.isFinite(medication.price));

      const badPrice = chargeMeds.find(
        medication => !Number.isFinite(medication.price) || medication.price < 0
      );

      if (badPrice) {
        return fail(`Ingresá un precio válido para "${badPrice.name || 'el concepto'}".`);
      }

      chargeMeds.forEach((medication, index) => {
        if (!medication.name) medication.name = `Concepto ${index + 1}`;
        if (!medication.quantity) medication.quantity = '';
        if (!medication.dose) medication.dose = '';
        if (!medication.route) medication.route = '';
        if (!medication.notes) medication.notes = '';
      });

      const serviceAmount = formData.get('serviceAmount') === '' || formData.get('serviceAmount') == null
        ? 0
        : Math.round(Number(formData.get('serviceAmount')));

      if (!Number.isFinite(serviceAmount) || serviceAmount < 0) {
        return fail('Ingresá un monto válido en atención / servicios.');
      }

      const chargeTotal = serviceAmount +
        chargeMeds.reduce((sum, medication) => sum + medication.price, 0);

      if (chargeTotal <= 0) {
        return fail('El total debe ser mayor a 0. Cargá al menos un precio.');
      }

      const chargePet = find('pets', chargedTicket.petId);
      const chargeOwner = find('owners', chargedTicket.ownerId);

      if (commit(() => {
        chargedTicket.medications = chargeMeds;
        chargedTicket.serviceAmount = serviceAmount;
        chargedTicket.total = chargeTotal;
        chargedTicket.status = 'Pagado';
        chargedTicket.paidAt = new Date().toISOString();

        // Snapshot para que el ticket guardado lleve datos del
        // propietario, QR + código de la mascota y código del ticket.
        chargedTicket.petName = chargePet?.name || chargedTicket.petName || '';
        chargedTicket.petCode = chargePet?.code || chargedTicket.petCode || '';
        chargedTicket.petQr = chargePet?.qr || chargedTicket.petQr || '';
        chargedTicket.ownerName = chargeOwner?.name || '';
        chargedTicket.ownerDni = chargeOwner?.dni || '';
        chargedTicket.ownerPhone = chargeOwner?.phone || '';
        chargedTicket.ownerEmail = chargeOwner?.email || '';
        chargedTicket.ownerAddress = chargeOwner?.address || '';

        const entry = (db.waitingRoom || []).find(
          item => item.id === chargedTicket.waitingEntryId
        );

        if (entry) {
          entry.status = 'Pagado';
        }
      })) {
        renderContent();
        ticketDetailModal(chargedTicket.id);
        toast(`Cobro registrado: ${money(chargedTicket.total)}.`);
      }
      break;
    }

    case 'booking': {
      const appointment = form.dataset.id
        ? appts().find(item => item.id === form.dataset.id)
        : null;

      if (form.dataset.id && !appointment) {
        return fail('Turno no disponible.');
      }

      if (
        appointment &&
        ['Atendido', 'Cancelado'].includes(appointment.status)
      ) {
        return fail('Este turno no admite reprogramación.');
      }

      const pet = find('pets', data.petId);

      if (
        !canPet(pet) ||
        !pet.active ||
        !find('owners', pet.ownerId)?.active
      ) {
        return fail('Mascota no disponible.');
      }

      if (user.role === 'vet' && data.vetId !== user.vetId) {
        return fail('Elegí tu agenda profesional.');
      }

      const slot = slots(
        data.serviceId,
        data.vetId,
        data.date,
        data.petId,
        appointment?.id
      ).find(item => item.time === data.time);

      if (!slot) {
        return fail(
          'El horario seleccionado ya está ocupado o no está disponible.'
        );
      }

      const row = {
        ...data,
        id: appointment?.id || uid(),
        ownerId: pet.ownerId,
        duration: slot.duration,
        status: user.role === 'owner' ? 'Pendiente' : 'Confirmado'
      };

      if (commit(() => {
        if (appointment) {
          Object.assign(appointment, row);
        } else {
          db.appointments.push(row);
        }

        pushNotification(
          row,
          `${appointment ? 'Turno reprogramado' : 'Nuevo turno'} de ${pet.name}: ${pretty(row.date)} a las ${row.time}. Estado: ${row.status}.`
        );
      })) {
        close();
        navigate('agenda');
        agendaDate = row.date;
        renderContent();

        toast(
          row.status === 'Pendiente'
            ? 'Solicitud de turno registrada.'
            : 'Turno confirmado.'
        );
      }
      break;
    }

    case 'owner-reminder': {
      if (user.role !== 'owner') return;

      const reminderId = form.dataset.id;
      const pet = find('pets', data.petId);

      if (!pet || !canPet(pet) || !pet.active) {
        return fail('Elegí una de tus mascotas.');
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.date || ''))) {
        return fail('Elegí una fecha.');
      }

      const category = CARE_CATEGORIES.some(entry => entry[0] === data.category)
        ? data.category
        : 'Otro';

      const existing = reminderId
        ? db.reminders.find(item =>
            item.id === reminderId &&
            item.source === 'owner' &&
            canPet(find('pets', item.petId))
          )
        : null;

      if (reminderId && !existing) {
        return fail('No podés editar este recordatorio.');
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
          db.reminders.push({
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
        ownerCalSelected = data.date;
        ownerCalMonth = data.date.slice(0, 7);
        close();
        renderContent();
        toast('Recordatorio guardado en tu calendario.');
      }
      break;
    }

    case 'clinical': {
      if (user.role === 'owner') return;

      const [petId, appointmentId] = form.dataset.id.split('|');
      const pet = find('pets', petId);

      if (!canPet(pet)) return;

      const appointment = appointmentId
        ? appts().find(item => item.id === appointmentId)
        : null;

      if (
        appointmentId &&
        (!appointment || appointment.status !== 'Confirmado')
      ) {
        return fail('El turno ya no está confirmado.');
      }

      if (!data.info.trim()) {
        return fail('Ingresá la información clínica.');
      }

      const newClinicalId = uid();

      if (commit(() => {
        db.clinical.push({
          ...data,
          id: newClinicalId,
          petId,
          weight: Number(data.weight) || pet.weight,
          visible: data.visible === 'true',
          authorId: user.id,
          authorName: user.name,
          vetId: user.vetId || null
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

        if (appointment) {
          appointment.status = 'Atendido';

          pushNotification(
            appointment,
            `La atención de ${pet.name} fue registrada.`
          );
        }
      })) {
        close();
        navigate('pet', petId);
        petTab = 'Historia clínica';
        renderContent();
        toast('Atención registrada correctamente.');
      }
      break;
    }

    case 'attention': {
      if (user.role !== 'vet' && user.role !== 'superadmin') return;

      const [entryId, clinicalId] = form.dataset.id.split('|');

      const entry = entryId
        ? (db.waitingRoom || []).find(item => item.id === entryId)
        : null;

      const existing = clinicalId ? find('clinical', clinicalId) : null;

      if (!entry && !existing) {
        return fail('La atención no está disponible.');
      }

      const pet = find('pets', entry?.petId || existing?.petId);

      if (!pet || !canPet(pet)) {
        return fail('Mascota no disponible.');
      }

      // TP2: el formulario entrega los datos a Facade y solo maneja la pantalla.
      // La fachada coordina historia clínica, ticket, sala y recordatorio.
      // Se crea con las dependencias actuales; la base se entrega en cada llamada.
      const attentionFacade = createAttentionFacade({
        commit, uid, today, pretty,
        careCategories: CARE_CATEGORIES,
        upsertCareReminder
      });
      const result = attentionFacade.registrarAtencion({
        db, user, pet, entry, existing, data, attendType,
        medicationFields: {
          names: formData.getAll('med-name[]'),
          doses: formData.getAll('med-dose[]'),
          quantities: formData.getAll('med-quantity[]'),
          routes: formData.getAll('med-route[]'),
          notes: formData.getAll('med-notes[]')
        }
      });

      if (result.ok) {
        close();
        navigate('dailyHistory');
        toast(result.isVaccine
          ? (existing
              ? 'Vacuna actualizada. El ticket quedó para Administración.'
              : 'Vacuna guardada. El ticket quedó para Administración y se programó la próxima aplicación.')
          : (existing
              ? 'Atención actualizada correctamente.'
              : 'Consulta guardada. El turno terminó y el ticket quedó para Administración.'));
      }
      break;
    }

    case 'inline-owner': {
      if (!mayEdit('owners')) return;

      const owner = {
        ...data,
        id: uid(),
        active: true
      };

      if (db.owners.some(item => item.dni === owner.dni)) {
        return fail('Ya existe un propietario con ese DNI.');
      }

      if (commit(() => db.owners.push(owner))) {
        editForm('pets', '', {
          ...draft.pet,
          ownerId: owner.id
        });

        toast('Propietario creado. Completá la mascota.');
      }
      break;
    }

    case 'reset-password':
      if (!isAdmin()) return;

      if (data.adminPassword !== user.password) {
        return fail('Tu contraseña de administrador es incorrecta.');
      }

      if (data.password !== data.confirm) {
        return fail('Las contraseñas no coinciden.');
      }

      if (commit(() => {
        find('users', form.dataset.id).password = data.password;
      })) {
        close();
        toast('Contraseña restablecida.');
      }
      break;
  }
}

// ACCIONES DE BOTONES

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
      recovery = null;
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
      user = null;
      selectedPet = null;
      agendaVet = '';
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

    case 'account': {
      if ($('.account-menu')) {
        return $('.account-menu').remove();
      }

      const menu = document.createElement('div');
      menu.className = 'account-menu';

      ui.setHtml(menu, `
        <b>${esc(user.name)}</b>
        <p><small>${roleNames[user.role]}</small></p>

        ${
          user.role === 'owner'
            ? button('Mi perfil', 'nav', 'ownerProfile')
            : ''
        }

        ${button('Cerrar sesión', 'logout')}
      `);

      $('.topbar').append(menu);
      break;
    }

    case 'nav':
      if (allowed[user.role].includes(id)) {
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

      if (!canPet(pet) || user?.role !== 'owner') return;

      ownerPetImageModal(pet);
      break;
    }

    case 'owner-pet-upload': {
      const pet = find('pets', id);

      if (!canPet(pet) || user?.role !== 'owner') return;

      ownerPhotoTargetId = id;
      close();
      $('#owner-pet-photo-input')?.click();
      break;
    }

    case 'owner-pet-avatar-pick': {
      const [petId, avatarId] = id.split(':');
      const pet = find('pets', petId);

      if (!canPet(pet) || user?.role !== 'owner' || !findPetAvatar(avatarId)) return;

      if (commit(() => {
        pet.avatarId = avatarId;
        pet.imagePreference = 'avatar';
      })) {
        close();
        renderContent();
        toast(`Ícono de ${pet.name} actualizado.`);
      }
      break;
    }

    case 'owner-pet-use-photo': {
      const pet = find('pets', id);

      if (!canPet(pet) || user?.role !== 'owner' || !pet.photo) return;

      if (commit(() => { pet.imagePreference = 'photo'; })) {
        close();
        renderContent();
        toast(`Foto de ${pet.name} actualizada.`);
      }
      break;
    }

    case 'owner-pet-color': {
      const pet = find('pets', id);

      if (!canPet(pet) || user.role !== 'owner') return;

      ownerColorPicker = ownerColorPicker === id ? '' : id;
      renderContent();
      break;
    }

    case 'owner-pet-color-pick': {
      const [petId, colorId] = id.split(':');
      const pet = find('pets', petId);

      if (!canPet(pet) || user.role !== 'owner') return;

      ownerColorPicker = '';

      commit(() => {
        // "default" (botón Original) quita el color y vuelve al fondo
        // original de la tarjeta. Un id desconocido también limpia.
        if (!colorId || colorId === 'default') {
          delete pet.cardColor;
        } else if (OWNER_CARD_COLORS.some(color => color.id === colorId)) {
          pet.cardColor = colorId;
        } else {
          delete pet.cardColor;
        }
      });

      renderContent();
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
        formWrap(
          'inline-owner',
          field('name', 'Nombre y apellido', '', 'text', 'required') +
          field(
            'dni',
            'DNI',
            '',
            'text',
            'required pattern="[0-9]{7,9}"'
          ) +
          field('phone', 'Teléfono', '', 'tel', 'required') +
          field('email', 'Correo', '', 'email', 'required') +
          field('address', 'Dirección', '', 'text', 'required')
        )
      );
      break;

    case 'toggle': {
      const [collection, recordId] = id.split(':');

      if (!mayEdit(collection, recordId)) return;

      const row = find(collection, recordId);

      if (!row) return;

      if (
        collection === 'users' &&
        (row.id === user.id || row.principal)
      ) {
        return toast(
          'No se puede desactivar al administrador principal ni tu propia cuenta.'
        );
      }

      modal(
        row.active ? 'Desactivar registro' : 'Activar registro',
        `
          <p>
            ¿Querés ${row.active ? 'desactivar' : 'activar'}
            ${esc(row.name || row.title || 'este horario')}?
          </p>

          <p class="muted">
            Se conservará el historial de los registros vinculados.
          </p>

          <div class="form-actions">
            ${button('Volver', 'close')}
            ${button('Confirmar', 'toggle-confirm', id, 'primary')}
          </div>
        `
      );
      break;
    }

    case 'toggle-confirm': {
      const [collection, recordId] = id.split(':');

      if (!mayEdit(collection, recordId)) return;

      const row = find(collection, recordId);

      if (
        !row ||
        (
          collection === 'users' &&
          (row.principal || row.id === user.id)
        )
      ) {
        return;
      }

      if (commit(() => {
        row.active = !row.active;
      })) {
        close();
        shell();
        toast('Estado actualizado.');
      }
      break;
    }

    case 'delete-notice':
      if (isAdmin()) {
        modal(
          'Eliminar aviso',
          `
            <p>¿Querés eliminar este aviso?</p>

            <div class="form-actions">
              ${button('Volver', 'close')}
              ${button(
                'Eliminar',
                'delete-notice-confirm',
                id,
                'danger'
              )}
            </div>
          `
        );
      }
      break;

    case 'delete-notice-confirm':
      if (
        isAdmin() &&
        commit(() => {
          db.notices = db.notices.filter(notice => notice.id !== id);
        })
      ) {
        close();
        shell();
        toast('Aviso eliminado.');
      }
      break;

    case 'book':
      book(id);
      break;

    case 'appointment':
      appointmentDetails(id);
      break;

    case 'reschedule':
      book('', id);
      break;

    case 'vet-agenda':
      if (isAdmin()) {
        agendaVet = id;
        navigate('agenda');
      }
      break;

    case 'cancel-appointment':
      modal(
        'Cancelar turno',
        `
          <p>
            ¿Querés cancelar este turno?
            El horario quedará disponible.
          </p>

          <div class="form-actions">
            ${button('Volver', 'close')}
            ${button('Cancelar turno', 'cancel-confirm', id, 'danger')}
          </div>
        `
      );
      break;

    case 'cancel-confirm':
    case 'confirm-appointment': {
      const appointment = appts().find(item => item.id === id);

      if (
        !appointment ||
        ['Atendido', 'Cancelado'].includes(appointment.status) ||
        (
          actionName === 'confirm-appointment' &&
          user.role === 'owner'
        )
      ) {
        return;
      }

      const status = actionName === 'cancel-confirm'
        ? 'Cancelado'
        : 'Confirmado';

      if (commit(() => {
        appointment.status = status;

        pushNotification(
          appointment,
          `Tu turno de ${label('pets', appointment.petId)} del ${pretty(appointment.date)} a las ${appointment.time} fue ${status.toLowerCase()}.`
        );
      })) {
        close();
        shell();
        toast('Turno ' + status.toLowerCase() + '.');
      }
      break;
    }

    case 'attend': {
      const appointment = appts().find(item => item.id === id);

      if (appointment && user.role !== 'owner') {
        clinicalForm(appointment.petId, id);
      }
      break;
    }

    case 'clinical':
      clinicalForm(id);
      break;

    case 'read':
      if (commit(() => {
        const notification = notifications().find(item => item.id === id);

        if (
          notification &&
          !notification.readBy.includes(user.id)
        ) {
          notification.readBy.push(user.id);
        }
      })) {
        shell();
      }
      break;

    case 'read-all':
      if (commit(() => {
        notifications().forEach(notification => {
          if (!notification.readBy.includes(user.id)) {
            notification.readBy.push(user.id);
          }
        });
      })) {
        shell();
      }
      break;

    case 'cal-prev':
    case 'cal-next':
      if (user.role !== 'owner') break;
      ownerCalMonth = calShiftMonth(ownerCalMonth, actionName === 'cal-next' ? 1 : -1);
      renderContent();
      break;

    case 'cal-today':
      if (user.role !== 'owner') break;
      ownerCalMonth = today().slice(0, 7);
      ownerCalSelected = today();
      renderContent();
      break;

    case 'cal-day':
      if (user.role !== 'owner' || !/^\d{4}-\d{2}-\d{2}$/.test(String(id))) break;
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
      if (user.role !== 'owner') break;
      modal(
        'Eliminar recordatorio',
        `
          <p>¿Querés eliminar este recordatorio de tu calendario?</p>
          <div class="form-actions">
            ${button('Volver', 'close')}
            ${button('Eliminar', 'cal-delete-confirm', id, 'danger')}
          </div>
        `
      );
      break;

    case 'cal-delete-confirm': {
      if (user.role !== 'owner') break;

      const target = db.reminders.find(item =>
        item.id === id &&
        item.source === 'owner' &&
        canPet(find('pets', item.petId))
      );

      if (target && commit(() => {
        db.reminders = db.reminders.filter(item => item.id !== id);
      })) {
        close();
        renderContent();
        toast('Recordatorio eliminado.');
      }
      break;
    }

    case 'reminder-done':
      if (
        user.role !== 'owner' &&
        commit(() => {
          const reminder = reminderList().find(item => item.id === id);

          if (reminder) {
            reminder.done = !reminder.done;
          }
        })
      ) {
        shell();
      }
      break;

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

      if (commit(() => {
        db.waitingRoom = db.waitingRoom || [];

        const entryId = uid();

        db.waitingRoom.push({
          id: entryId,
          petId: pet.id,
          ownerId: pet.ownerId,
          petName: pet.name,
          enteredAt: new Date().toISOString(),
          status: 'Esperando',
          reason: modalReason
        });

        notifyVetsWaitingEntry({ pet, reason: modalReason, waitingEntryId: entryId });
      })) {
        close();
        navigate('waitingRoom');
        toast(`${pet.name} ingresó a la sala de espera.`);
      }
      break;
    }

    case 'admin-cancel-entry': {
      if (!isAdmin()) return;

      const entry = (db.waitingRoom || []).find(item => item.id === id);

      if (!entry) return;

      if (commit(() => {
        db.waitingRoom = db.waitingRoom.filter(item => item.id !== id);
      })) {
        renderContent();
        toast('Se canceló el ingreso a la sala de espera.');
      }
      break;
    }

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

    case 'admin-release-entry': {
      if (!isAdmin()) return;

      const entry = (db.waitingRoom || []).find(item => item.id === id);

      if (!entry || entry.status !== 'En atención') return;

      if (commit(() => {
        entry.status = 'Esperando';
        delete entry.vetId;
        entry.vetName = '';
      })) {
        renderContent();
        toast('El ingreso volvió a la espera. Ya se puede atender de nuevo.');
      }
      break;
    }

    case 'admin-clear-paid':
      if (!isAdmin()) return;

      modal(
        'Quitar finalizados',
        `
          <p>
            ¿Querés quitar de la sala los ingresos ya cobrados?
            Se conserva la historia clínica y los tickets.
          </p>

          <div class="form-actions">
            ${button('Volver', 'close')}
            ${button('Quitar', 'admin-clear-paid-confirm', '', 'danger')}
          </div>
        `
      );
      break;

    case 'admin-clear-paid-confirm':
      if (!isAdmin()) return;

      if (commit(() => {
        db.waitingRoom = (db.waitingRoom || []).filter(
          item => item.status !== 'Pagado'
        );
      })) {
        close();
        renderContent();
        toast('Se quitaron los ingresos finalizados.');
      }
      break;

    case 'vet-attend': {
      if (user.role !== 'vet' && user.role !== 'superadmin') return;

      const entry = (db.waitingRoom || []).find(item => item.id === id);

      // Se puede atender un ingreso "Esperando" o continuar uno que
      // quedó "En atención" (por ejemplo, se cerró el formulario sin guardar).
      if (!entry || !['Esperando', 'En atención'].includes(entry.status)) {
        renderContent();
        return toast('Este paciente ya no está en espera.');
      }

      if (commit(() => {
        entry.status = 'En atención';
        entry.vetId = user.vetId || null;
        entry.vetName = user.name;
      })) {
        renderContent();
        attentionModal(entry.id);
      }
      break;
    }

    case 'vet-edit-attention': {
      if (user.role !== 'vet' && user.role !== 'superadmin') return;

      const record = find('clinical', id);

      if (!record || (user.role === 'vet' && record.vetId !== user.vetId)) {
        return toast('No podés editar esta atención.');
      }

      attentionModal('', record.id);
      break;
    }

    case 'vet-history-filter': {
      // Búsqueda rápida del modal Atender: mismos filtros que la ficha
      // de la mascota (Historia clínica = todos). Filtra en el cliente
      // sin cerrar el modal ni perder lo cargado en el formulario.
      // Además define el tipo de registro: si se elige Vacuna, el botón
      // pasa a "Registrar vacuna" y el formulario pide nombre, dosis,
      // lote, tipo y próxima aplicación (con ticket automático).
      const list = $('#attend-history-list');
      if (!list) break;

      const typeFilter = String(id || '');

      $$('.attend-quick [data-action="vet-history-filter"]').forEach(btn => {
        btn.classList.toggle('active', String(btn.dataset.id || '') === typeFilter);
      });

      let visible = 0;

      list.querySelectorAll('[data-history-type]').forEach(wrapper => {
        const show = !typeFilter || String(wrapper.dataset.historyType || '') === typeFilter;
        wrapper.hidden = !show;
        if (show) visible++;
      });

      const empty = $('#attend-history-empty');
      if (empty) empty.hidden = visible > 0;

      const count = $('#attend-history-count');
      if (count) count.textContent = `${visible} registro(s)`;

      attendType = typeFilter || 'Consulta';

      const vaccineMode = attendType === 'Vacuna';
      const formHidden = $('#attend-form-wrap')?.hidden ?? true;
      const toggleBtn = document.querySelector('[data-action="vet-toggle-attention"]');

      if (toggleBtn && formHidden) {
        toggleBtn.textContent = vaccineMode ? 'Registrar vacuna' : 'Registrar atención';
      }

      const consultFields = $('#attend-consult-fields');
      const consultActions = $('#attend-consult-actions');
      const vaccineFields = $('#attend-vaccine-fields');
      const vaccineActions = $('#attend-vaccine-actions');
      const formTitle = $('#attend-form-title');
      const attTypeInput = $('#modal [name="attType"]');
      const ticketWrap = $('#attend-ticket-wrap');
      const consultWrap = $('#attend-consult-wrap');

      if (consultFields) consultFields.hidden = vaccineMode;
      if (consultActions) consultActions.hidden = vaccineMode;
      if (vaccineFields) vaccineFields.hidden = !vaccineMode;
      if (vaccineActions) vaccineActions.hidden = !vaccineMode;
      if (formTitle) formTitle.textContent = vaccineMode ? 'Datos de la vacuna' : 'Datos de la consulta';
      if (attTypeInput) attTypeInput.value = attendType;

      if (vaccineMode && ticketWrap && consultWrap) {
        ticketWrap.hidden = true;
        consultWrap.hidden = false;
      }
      break;
    }

    case 'vet-toggle-attention': {
      const historyWrap = $('#attend-history-wrap');
      const formWrap = $('#attend-form-wrap');
      const petInfo = $('#attend-pet-info');
      const layout = $('#attend-layout');

      if (!historyWrap || !formWrap) break;

      const showingForm = formWrap.hidden;

      historyWrap.hidden = showingForm ? true : false;
      formWrap.hidden = showingForm ? false : true;
      if (petInfo) petInfo.hidden = showingForm ? true : false;
      if (layout) {
        layout.classList.toggle('attend-layout', !showingForm);
        layout.classList.toggle('attend-single', showingForm);
      }

      element.textContent = showingForm
        ? '← Volver al historial'
        : (attendType === 'Vacuna' ? 'Registrar vacuna' : 'Registrar atención');

      (showingForm ? formWrap : historyWrap).scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      break;
    }

    case 'vet-ticket-open': {
      const form = element.closest('form');
      const consultWrap = $('#attend-consult-wrap');
      const ticketWrap = $('#attend-ticket-wrap');

      if (!form || !consultWrap || !ticketWrap) break;

      // El ticket toma los datos del registro anterior: si aún no tiene
      // motivo, se propone el de la consulta; si no tiene medicamentos,
      // se copian los de la medicación ya cargada. Todo queda relleno
      // pero se puede modificar antes de guardar el ticket.
      const reasonInput = form.elements.reason;
      const ticketReasonInput = form.elements.ticketReason;

      if (
        ticketReasonInput &&
        !ticketReasonInput.value.trim() &&
        reasonInput?.value.trim()
      ) {
        ticketReasonInput.value = reasonInput.value.trim();
      }

      const ticketRows = [...form.querySelectorAll('#tmed-rows .tmed-row')];
      const ticketHasMeds = ticketRows.some(row =>
        row.querySelector('[name="tmed-name[]"]')?.value.trim()
      );

      if (!ticketHasMeds) {
        const consultMeds = [...form.querySelectorAll('#med-rows .med-row')]
          .map(row => ({
            name: row.querySelector('[name="med-name[]"]')?.value.trim() || '',
            quantity: row.querySelector('[name="med-quantity[]"]')?.value.trim() || ''
          }))
          .filter(medication => medication.name);

        const tmedContainer = form.querySelector('#tmed-rows');

        if (consultMeds.length && tmedContainer) {
          ui.setHtml(tmedContainer, consultMeds.map(medication =>
            ticketMedRow(medication)
          ).join(''));
        }
      }

      consultWrap.hidden = true;
      ticketWrap.hidden = false;

      ticketWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
      break;
    }

    case 'vet-ticket-save': {
      const form = element.closest('form');
      const consultWrap = $('#attend-consult-wrap');
      const ticketWrap = $('#attend-ticket-wrap');
      const errorElement = $('#ticket-error');
      const statusElement = $('#attend-ticket-status');

      if (!form || !consultWrap || !ticketWrap) break;

      const ticketReasonValue = form.elements.ticketReason?.value.trim() || '';

      if (!ticketReasonValue) {
        if (errorElement) {
          errorElement.textContent = 'Ingresá el motivo de consulta del ticket.';
        } else {
          toast('Ingresá el motivo de consulta del ticket.');
        }
        break;
      }

      const ticketNames = [...form.querySelectorAll('[name="tmed-name[]"]')];
      const ticketQuantities = [...form.querySelectorAll('[name="tmed-quantity[]"]')];

      const missingQuantity = ticketNames.find((input, index) =>
        input.value.trim() && !(ticketQuantities[index]?.value.trim())
      );

      if (missingQuantity) {
        const message =
          `Completá la cantidad de "${missingQuantity.value.trim()}" en el ticket.`;

        if (errorElement) {
          errorElement.textContent = message;
        } else {
          toast(message);
        }
        break;
      }

      if (errorElement) errorElement.textContent = '';

      const count = ticketNames.filter(input => input.value.trim()).length;

      if (statusElement) {
        statusElement.textContent = count
          ? `Ticket listo · ${count} medicamento(s) colocado(s). Podés volver a entrar para modificarlo.`
          : 'Ticket listo · sin medicamentos. Podés volver a entrar para modificarlo.';
      }

      ticketWrap.hidden = true;
      consultWrap.hidden = false;

      consultWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
      toast('Ticket guardado. Volviste a la consulta.');
      break;
    }

    case 'vet-ticket-back': {
      const consultWrap = $('#attend-consult-wrap');
      const ticketWrap = $('#attend-ticket-wrap');

      if (!consultWrap || !ticketWrap) break;

      ticketWrap.hidden = true;
      consultWrap.hidden = false;

      consultWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
      break;
    }

    case 'vet-ticket-add-med':
      $('#tmed-rows')?.insertAdjacentHTML('beforeend', ticketMedRow());
      break;

    case 'vet-add-med':
      $('#med-rows').insertAdjacentHTML('beforeend', medicationRow());
      break;

    case 'vet-remove-med':
      element.closest('.med-row')?.remove();
      break;

    case 'public':
      publicProfile(id);
      break;

    case 'public-login':
      user = null;
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
          formWrap(
            'reset-password',
            `
              <p class="hint">
                Por seguridad, confirmá tu propia contraseña de
                administrador para autorizar este cambio.
              </p>
            ` +
            field(
              'adminPassword',
              'Tu contraseña (admin)',
              '',
              'password',
              'required autocomplete="current-password"'
            ) +
            field(
              'password',
              'Nueva contraseña',
              '',
              'password',
              'required minlength="6"'
            ) +
            field(
              'confirm',
              'Confirmar contraseña',
              '',
              'password',
              'required minlength="6"'
            ),
            id
          )
        );
      }
      break;
  }
}

// EVENTOS GENERALES

ui.on('click', event => {
  const element = event.target.closest('[data-action]');

  if (!element) return;

  action(
    element.dataset.action,
    element.dataset.id,
    element
  ).catch(error => toast(error.message));
});

ui.on('submit', async event => {
  const form = event.target;

  if (!form.matches('form[data-form]')) return;

  event.preventDefault();

  const submit = form.querySelector('[type=submit]');
  submit.disabled = true;

  try {
    if (form.dataset.form === 'settings') {
      draft.nextConfig = await clinicData(form);
    }

    await submitForm(form);
  } catch (error) {
    fail(error.message || 'No se pudo completar la operación.');
  } finally {
    if (submit.isConnected) {
      submit.disabled = false;
    }
  }
});

ui.on('input', event => {
  // Total automático del cobro: recalcula al tipear precios.
  if (event.target.matches?.('[data-charge-price]')) {
    updateChargeTotal();
  }

  if (event.target.id === 'list-search') {
    query = event.target.value;
    page = 1;

    const position = event.target.selectionStart;

    renderContent();

    $('#list-search').focus();
    $('#list-search').setSelectionRange(position, position);
  }

  if (event.target.id === 'global-search') {
    const search = event.target.value.trim().toLowerCase();

    ui.setHtml($('#global-results'), search
      ? `
        <section class="card">
          <h2>Resultados</h2>

          ${db.owners
            .filter(owner =>
              JSON.stringify(owner).toLowerCase().includes(search)
            )
            .map(owner => `
              <p>
                ${button(
                  esc(owner.name) + ' · ' + esc(owner.dni),
                  'owner',
                  owner.id,
                  'ghost'
                )}
              </p>
            `)
            .join('')}

          ${
            db.pets
              .filter(pet =>
                JSON.stringify({
                  ...pet,
                  owner: find('owners', pet.ownerId)
                }).toLowerCase().includes(search)
              )
              .map(pet =>
                button(
                  esc(pet.name) + ' · ' + esc(label('owners', pet.ownerId)),
                  'pet',
                  pet.id,
                  'small'
                )
              )
              .join(' ') ||
            '<p class="muted">Sin mascotas coincidentes.</p>'
          }
        </section>
      `
      : '');
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

    if (!canPet(pet) || user.role !== 'owner') return;

    imageData(file)
      .then(photo => {
        if (!photo) return;

        const currentPet = find('pets', petId);
        if (!canPet(currentPet) || user?.role !== 'owner') return;

        if (commit(() => {
          currentPet.photo = photo;
          currentPet.imagePreference = 'photo';
        })) {
          renderContent();
          toast(`Foto de ${currentPet.name} actualizada.`);
        }
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
    agendaDate = element.value || today();
    renderContent();
  }

  if (element.id === 'agenda-mode') {
    agendaMode = element.value;
    renderContent();
  }

  if (element.id === 'agenda-vet') {
    agendaVet = element.value;
    renderContent();
  }

  if (element.closest('form[data-form=booking]')) {
    if (element.name === 'serviceId') {
      updateBooking('service');
    }

    if (
      element.name === 'vetId' ||
      element.name === 'petId'
    ) {
      updateBooking('vet');
    }

    if (element.name === 'date') {
      updateBooking('date');
    }
  }

  // Formulario de usuarios: el vínculo al perfil aparece según el rol.
  if (element.name === 'role') {
    const userForm = element.closest('form[data-form="entity"]');

    if (userForm && String(userForm.dataset.id || '').startsWith('users:')) {
      userForm.querySelectorAll('[data-role-link]').forEach(wrapper => {
        wrapper.hidden = wrapper.dataset.roleLink !== element.value;
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

  if (user) {
    const current = find('users', user.id);

    if (!current?.active) {
      user = null;
      login();
      toast('La sesión ya no está habilitada.');
    } else {
      user = current;
      close();
      shell();
      toast('Datos actualizados desde otra pestaña.');
    }
  }
};
window.addEventListener('storage', onStorage);

// INICIO DE LA APLICACIÓN

applyTheme(currentTheme());

load();

// Migración: las bases creadas antes del rol superadmin no tienen ese
// usuario; se agrega silenciosamente para no bloquear el acceso total.
try {
  if (
    db.configured &&
    Array.isArray(db.users) &&
    !db.users.some(account => account.role === 'superadmin')
  ) {
    const superDemo = DEMO_ACCOUNTS.find(
      account => account.role === 'superadmin'
    );

    if (
      superDemo &&
      !db.users.some(account =>
        account.email.toLowerCase() === superDemo.email.toLowerCase()
      )
    ) {
      db.users.push({ ...superDemo });

      try {
        localStorage.setItem(KEY, JSON.stringify(db));
      } catch {
        // Se continúa sin persistir; el acceso sigue disponible en sesión.
      }
    }
  }
} catch {
  // La migración es opcional y no debe impedir el inicio.
}

if (db.configured) {
  login();

  const qr = new URLSearchParams(
    location.hash.slice(1)
  ).get('qr');

  if (qr) {
    const pet = db.pets.find(item => item.qr === qr);

    if (pet) {
      publicProfile(pet.id);
    }
  }
} else {
  setup();
}
return () => { window.removeEventListener('storage', onStorage); };
}
