// Las mismas reglas se ejecutan al guardar, aunque se omita la validación HTML.
export const MAX_MONEY = 1_000_000_000;

export function requiredText(value, label, max = 200) {
  const text = String(value ?? '').trim();
  if (!text || text.length > max) throw new Error(`${label}: completá el campo (hasta ${max} caracteres).`);
  return text;
}

export function personName(value) {
  const text = requiredText(value, 'Nombre y apellido', 160);
  if (!/^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u.test(text)) {
    throw new Error('El nombre debe contener letras; puede incluir espacios, tildes, apóstrofos y guiones.');
  }
  return text;
}

export function phoneNumber(value, required = true) {
  const text = String(value ?? '').trim();
  if (!text && !required) return '';
  const digits = text.replace(/\D/g, '');
  if (!/^\+?[\d ()-]+$/.test(text) || digits.length < 6 || digits.length > 20) {
    throw new Error('Ingresá un teléfono de 6 a 20 dígitos. Podés usar +, espacios, paréntesis y guiones.');
  }
  return text;
}

export function documentNumber(value, cuit = false) {
  const text = String(value ?? '').trim();
  if (!(cuit ? /^(?:\d{7,9}|\d{11})$/ : /^\d{7,9}$/).test(text)) {
    throw new Error(cuit ? 'Ingresá un DNI de 7 a 9 dígitos o un CUIT de 11, sin separadores.' : 'Ingresá un DNI de 7 a 9 dígitos, solo números.');
  }
  return text;
}

export function emailAddress(value) {
  const text = String(value ?? '').trim().toLowerCase();
  if (text.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) throw new Error('Ingresá un correo electrónico válido.');
  return text;
}

export function passwordValue(value) {
  const text = String(value ?? '');
  if (!text.trim() || text.length < 6 || text.length > 128) throw new Error('La contraseña debe tener entre 6 y 128 caracteres.');
  return text;
}

export function numericValue(value, label, { min = 0, max = 1_000_000_000, integer = false, optional = false, decimals } = {}) {
  const text = String(value ?? '').trim();
  if (!text && optional) return null;
  const number = Number(text);
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) || !Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number)) || (decimals != null && (text.split('.')[1] || '').replace(/0+$/, '').length > decimals)) {
    throw new Error(`${label}: ingresá ${integer ? 'un número entero' : 'un número'} entre ${min} y ${max}.`);
  }
  return number;
}

export function realDate(value, label = 'Fecha', { optional = false, latest } = {}) {
  const text = String(value ?? '').trim();
  if (!text && optional) return '';
  const date = new Date(`${text}T12:00:00Z`);
  if (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(text) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== text) {
    throw new Error(`${label}: elegí una fecha válida.`);
  }
  if (latest && text > latest) throw new Error(`${label}: la fecha no puede ser futura.`);
  return text;
}

export function clockTime(value) {
  const text = String(value ?? '');
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(text)) throw new Error('Ingresá una hora válida.');
  return text;
}

export function validateOwner(data) {
  data.name = personName(data.name);
  data.dni = documentNumber(data.dni);
  data.phone = phoneNumber(data.phone);
  data.email = emailAddress(data.email);
  data.address = requiredText(data.address, 'Dirección', 300);
  return data;
}

export function assertUniqueOwner(owners, data, id = '') {
  if (owners.some(owner => owner.id !== id && String(owner.dni).trim() === data.dni)) throw new Error('Ya existe un propietario con ese DNI.');
  if (owners.some(owner => owner.id !== id && String(owner.email || '').trim().toLowerCase() === data.email)) throw new Error('Ya existe un propietario con ese correo.');
}

export function validateEntity(collection, data, old, today) {
  if (['pets', 'services', 'products'].includes(collection)) data.name = requiredText(data.name, 'Nombre');
  if (collection === 'owners') validateOwner(data);
  if (collection === 'vets') {
    data.name = personName(data.name);
    data.license = requiredText(data.license, 'Matrícula');
    data.specialty = requiredText(data.specialty, 'Especialidad');
    if (!old) { data.email = emailAddress(data.email); data.password = passwordValue(data.password); }
  }
  if (collection === 'users') {
    data.name = personName(data.name);
    data.email = emailAddress(data.email);
    data.phone = phoneNumber(data.phone, !old);
    if (!old || data.password) data.password = passwordValue(data.password);
    if (!['owner', 'vet', 'admin', 'superadmin'].includes(data.role || old?.role)) throw new Error('Elegí un rol válido.');
  }
  if (collection === 'pets') {
    data.weight = numericValue(data.weight, 'Peso (kg)', { min: 0.01, max: 100_000 });
    data.birth = realDate(data.birth, 'Nacimiento', { latest: today });
    if (!['Perro', 'Gato', 'Otro'].includes(data.species)) throw new Error('Elegí una especie válida.');
  }
  if (['services', 'schedules'].includes(collection)) data.duration = numericValue(data.duration, 'Duración', { min: 5, max: 240, integer: true });
  if (collection === 'schedules') {
    data.day = numericValue(data.day, 'Día', { max: 6, integer: true });
    data.start = clockTime(data.start); data.end = clockTime(data.end);
  }
  if (collection === 'products') {
    data.category = requiredText(data.category, 'Categoría');
    data.price = numericValue(data.price, 'Precio', { decimals: 2 });
    data.stock = numericValue(data.stock, 'Stock', { integer: true });
  }
  if (collection === 'notices') {
    data.title = requiredText(data.title, 'Título');
    data.message = requiredText(data.message, 'Mensaje', 4000);
    data.date = realDate(data.date, 'Publicación');
    data.expires = realDate(data.expires, 'Expiración', { optional: true });
  }
  if (collection === 'reminders') {
    data.title = requiredText(data.title, 'Recordatorio');
    data.date = realDate(data.date);
  }
  return data;
}

export function clinicalMeasurements(data) {
  const weight = numericValue(data.weight, 'Peso (kg)', { min: 0.01, max: 100_000, optional: true });
  const temperature = numericValue(data.temperature, 'Temperatura (°C)', { min: 0.1, max: 100, optional: true });
  // Son límites de captura de datos, no un diagnóstico ni un rango de normalidad.
  return { weight, temperature };
}
