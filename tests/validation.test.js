import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_MONEY, requiredText, personName, phoneNumber, documentNumber,
  emailAddress, passwordValue, numericValue, realDate, clockTime,
  validateOwner, assertUniqueOwner, validateEntity, clinicalMeasurements
} from '../src/services/validation.js';

test('los textos obligatorios se recortan y respetan su longitud máxima', () => {
  assert.equal(requiredText('  Control  ', 'Motivo', 7), 'Control');
  for (const value of [undefined, null, '   ', 'x'.repeat(8)]) {
    assert.throws(() => requiredText(value, 'Motivo', 7), /Motivo/);
  }
});

test('los nombres admiten tildes, apóstrofos y guiones y rechazan números', () => {
  for (const value of ['María José', "Ana O'Neill", 'María-José', 'D’Arcy']) {
    assert.equal(personName(` ${value} `), value);
  }
  for (const value of ['Ana123', '12345', '   ']) {
    assert.throws(() => personName(value));
  }
});

test('los teléfonos conservan el formato y controlan la cantidad de dígitos', () => {
  assert.equal(phoneNumber(' +54 (381) 555-0123 '), '+54 (381) 555-0123');
  assert.equal(phoneNumber('123456'), '123456');
  assert.equal(phoneNumber('1'.repeat(20)), '1'.repeat(20));
  assert.equal(phoneNumber('', false), '');
  for (const value of ['', '12345', '1'.repeat(21), 'teléfonoABC']) {
    assert.throws(() => phoneNumber(value), /teléfono/);
  }
});

test('los documentos admiten DNI y permiten CUIT solo cuando se solicita', () => {
  for (const value of ['1234567', '12345678', '123456789']) {
    assert.equal(documentNumber(value), value);
  }
  assert.equal(documentNumber('20301234567', true), '20301234567');
  for (const value of ['123456', '30.111.222', 'ABC1234', '20301234567']) {
    assert.throws(() => documentNumber(value), /DNI/);
  }
});

test('los correos se normalizan y se rechazan formatos incompletos', () => {
  assert.equal(emailAddress(' ANA@Example.com '), 'ana@example.com');
  for (const value of ['', 'sin-correo', 'ana@dominio', 'ana @example.com', `${'a'.repeat(250)}@example.com`]) {
    assert.throws(() => emailAddress(value), /correo/);
  }
});

test('las contraseñas conservan sus espacios y respetan los límites', () => {
  assert.equal(passwordValue(' clave '), ' clave ');
  assert.equal(passwordValue('x'.repeat(128)).length, 128);
  for (const value of ['     ', '12345', 'x'.repeat(129)]) {
    assert.throws(() => passwordValue(value), /contraseña/);
  }
});

test('los números aceptan límites válidos y campos opcionales vacíos', () => {
  assert.equal(numericValue('0', 'Cantidad'), 0);
  assert.equal(numericValue(' 5 ', 'Cantidad', { min: 1, max: 5 }), 5);
  assert.equal(numericValue('1', 'Cantidad', { min: 1, max: 5 }), 1);
  assert.equal(numericValue('', 'Peso', { optional: true }), null);
  assert.equal(numericValue('-2', 'Variación', { min: -5 }), -2);
});

test('los números rechazan vacíos obligatorios, texto, exponentes y desbordes', () => {
  for (const value of ['', ' ', 'abc', '1e3', 'Infinity', NaN, Infinity, '-1', '1000000001']) {
    assert.throws(() => numericValue(value, 'Importe'), /Importe/);
  }
  assert.throws(() => numericValue('2.5', 'Stock', { integer: true }), /entero/);
});

test('los importes del catálogo admiten dos decimales y rechazan separadores ajenos al formulario', () => {
  assert.equal(numericValue('12.34', 'Precio', { decimals: 2 }), 12.34);
  assert.equal(numericValue('12.3400', 'Precio', { decimals: 2 }), 12.34);
  for (const value of ['12.345', '12,34', '1.000,50']) {
    assert.throws(() => numericValue(value, 'Precio', { decimals: 2 }), /Precio/);
  }
});

test('los importes usados para cobros respetan el máximo y la regla de enteros', () => {
  const options = { max: MAX_MONEY, integer: true };
  assert.equal(numericValue(String(MAX_MONEY), 'Cobro', options), MAX_MONEY);
  for (const value of ['-1', '0.5', String(MAX_MONEY + 1), '1e308']) {
    assert.throws(() => numericValue(value, 'Cobro', options), /Cobro/);
  }
});

test('las fechas validan días reales y años bisiestos', () => {
  assert.equal(realDate('2024-02-29'), '2024-02-29');
  assert.equal(realDate('2000-02-29'), '2000-02-29');
  for (const value of ['2026-02-29', '2100-02-29', '2026-02-30', '2026-04-31', '2026-13-01', '18/11/2026', '']) {
    assert.throws(() => realDate(value), /fecha válida/);
  }
});

test('las fechas opcionales y el límite de fecha no dependen del reloj de la prueba', () => {
  assert.equal(realDate('', 'Fecha', { optional: true }), '');
  assert.equal(realDate('2026-11-18', 'Nacimiento', { latest: '2026-11-18' }), '2026-11-18');
  assert.throws(() => realDate('2026-11-19', 'Nacimiento', { latest: '2026-11-18' }), /futura/);
});

test('las horas admiten desde 00:00 hasta 23:59 y exigen HH:mm', () => {
  for (const value of ['00:00', '12:30', '23:59']) assert.equal(clockTime(value), value);
  for (const value of ['24:00', '12:60', '9:00', '', ' 12:30 ']) {
    assert.throws(() => clockTime(value), /hora válida/);
  }
});

test('los propietarios se normalizan sin rechazar direcciones alfanuméricas', () => {
  const data = { name: ' Ana Pérez ', dni: ' 30111222 ', phone: ' +54 381 555-0123 ', email: ' ANA@Example.com ', address: ' Av. San Martín 123, piso 2 ' };
  assert.equal(validateOwner(data), data);
  assert.deepEqual(data, { name: 'Ana Pérez', dni: '30111222', phone: '+54 381 555-0123', email: 'ana@example.com', address: 'Av. San Martín 123, piso 2' });
});

test('los duplicados de propietarios se rechazan y la edición del mismo perfil se permite', () => {
  const owners = [{ id: 'o1', dni: '30111222', email: ' ANA@Example.com ' }];
  const before = structuredClone(owners);
  assert.throws(() => assertUniqueOwner(owners, { dni: '30111222', email: 'otra@example.com' }), /DNI/);
  assert.throws(() => assertUniqueOwner(owners, { dni: '32222333', email: 'ana@example.com' }), /correo/);
  assert.doesNotThrow(() => assertUniqueOwner(owners, { dni: '30111222', email: 'ana@example.com' }, 'o1'));
  assert.deepEqual(owners, before);
});

test('los productos validan precio y stock antes de guardarse', () => {
  assert.deepEqual(validateEntity('products', { name: ' Alimento 3 kg ', category: ' Nutrición ', price: '12.50', stock: '3' }), {
    name: 'Alimento 3 kg', category: 'Nutrición', price: 12.5, stock: 3
  });
  assert.throws(() => validateEntity('products', { name: 'Alimento', category: 'Nutrición', price: '12.345', stock: '3' }), /Precio/);
  assert.throws(() => validateEntity('products', { name: 'Alimento', category: 'Nutrición', price: '12', stock: '2.5' }), /Stock/);
});

test('las mascotas validan especie, peso y nacimiento con una fecha de referencia explícita', () => {
  const data = { name: 'Luna', species: 'Gato', weight: '4.5', birth: '2020-01-01' };
  assert.equal(validateEntity('pets', { ...data }, null, '2026-11-18').weight, 4.5);
  assert.throws(() => validateEntity('pets', { ...data, weight: '-1' }, null, '2026-11-18'), /Peso/);
  assert.throws(() => validateEntity('pets', { ...data, birth: '2026-11-19' }, null, '2026-11-18'), /futura/);
  assert.throws(() => validateEntity('pets', { ...data, species: 'Inválida' }, null, '2026-11-18'), /especie/);
});

test('las mediciones clínicas distinguen ausencia de valor y valores fuera de límites', () => {
  assert.deepEqual(clinicalMeasurements({}), { weight: null, temperature: null });
  assert.deepEqual(clinicalMeasurements({ weight: '6.2', temperature: '38.3' }), { weight: 6.2, temperature: 38.3 });
  assert.throws(() => clinicalMeasurements({ weight: '0' }), /Peso/);
  assert.throws(() => clinicalMeasurements({ temperature: '-999' }), /Temperatura/);
});
