// TP4, punto 2. Ejecutar: node scripts/verify-pet-profile-qr.mjs
import assert from 'node:assert/strict';
import { getPetProfileByQr } from '../src/services/petProfile.js';

const owner = { id: 'u-luna', role: 'owner', ownerId: 'o1' };

function scenario() {
  return {
    pets: [
      // El QR es distinto del id y Luna no es el primer elemento.
      { id: 'p-toby', qr: 'qr-toby', name: 'Toby', ownerId: 'o1' },
      { id: 'p-luna', qr: 'qr-luna', name: 'Luna', ownerId: 'o1' }
    ],
    clinical: [
      { id: 'luna-control', petId: 'p-luna', date: '2026-10-20', type: 'Consulta', visible: true },
      { id: 'toby-control', petId: 'p-toby', date: '2026-10-23', type: 'Consulta', visible: true },
      { id: 'luna-interna', petId: 'p-luna', date: '2026-10-22', type: 'Consulta', visible: false },
      { id: 'luna-vacuna', petId: 'p-luna', date: '2026-10-21', type: 'Vacuna', visible: true }
    ]
  };
}

// CP-01: ficha correcta, aislamiento entre mascotas y permisos existentes.
{
  const db = scenario();
  const before = structuredClone(db);
  for (const role of ['owner', 'vet', 'admin', 'superadmin']) {
    const profile = getPetProfileByQr(db, 'qr-luna', { ...owner, role });
    assert.ok(profile);
    assert.strictEqual(profile.pet, db.pets[1]);
    assert.equal(profile.pet.id, 'p-luna');
    assert.equal(profile.pet.name, 'Luna');
    assert.deepEqual(profile.records, role === 'owner'
      ? [db.clinical[3], db.clinical[0]]
      : [db.clinical[2], db.clinical[3], db.clinical[0]]);
    assert.ok(profile.records.every(record => record.petId === 'p-luna'));
  }
  assert.equal(getPetProfileByQr(db, 'qr-luna', null), null);
  assert.equal(getPetProfileByQr(db, 'qr-luna', { ...owner, ownerId: 'otra-persona' }), null);
  assert.deepEqual(db, before, 'La consulta no debe modificar la base ni su orden');
  console.log('OK CP-01: ficha de Luna y solo sus atenciones, según permisos.');
}

// CP-02: Luna sin atenciones; las de Toby siguen presentes.
{
  const db = scenario();
  db.clinical = db.clinical.filter(record => record.petId === 'p-toby');
  const profile = getPetProfileByQr(db, 'qr-luna', owner);
  assert.ok(profile);
  assert.strictEqual(profile.pet, db.pets[1]);
  assert.equal(profile.pet.name, 'Luna');
  assert.deepEqual(profile.records, []);
  console.log('OK CP-02: ficha de Luna con historial vacío.');
}

// CP-03: hay mascotas y atenciones, pero ninguna tiene el QR consultado.
{
  const db = scenario();
  const profile = getPetProfileByQr(db, 'qr-inexistente', owner);
  assert.strictEqual(profile, null, 'Un QR inexistente debe indicar ausencia de ficha');
  assert.equal(profile?.pet, undefined, 'No debe devolver la ficha de Luna ni de Toby');
  assert.equal(profile?.records, undefined, 'No debe devolver atenciones ajenas');
  console.log('OK CP-03: QR inexistente devuelve null, sin ficha ni historial.');
}
