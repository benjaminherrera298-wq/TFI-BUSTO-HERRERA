import test from 'node:test';
import assert from 'node:assert/strict';
import { populateSamplePractice } from '../src/data/samplePractice.js';

function practice() {
  return {
    vets: [{ id: 'v1', name: 'Veterinaria', active: true }],
    services: [{ id: 's1', active: true }],
    users: [{ id: 'u1', vetId: 'v1' }],
    owners: [{ id: 'original-owner' }],
    pets: [{ id: 'original-pet', ownerId: 'original-owner', code: '70000', qr: 'original-qr' }]
  };
}

test('la carga demo conserva datos previos, códigos únicos y relaciones entre registros', () => {
  const db = practice();
  const originalPet = structuredClone(db.pets[0]);
  const reference = new Date(2026, 10, 18, 12);
  assert.equal(populateSamplePractice(db, reference), true);
  assert.deepEqual(db.pets[0], originalPet);
  assert.equal(new Set(db.pets.map(pet => pet.code)).size, db.pets.length);

  for (const pet of db.pets) {
    assert.ok(db.owners.some(owner => owner.id === pet.ownerId));
  }
  for (const record of db.clinical) {
    const pet = db.pets.find(item => item.id === record.petId);
    const ticket = db.tickets.find(item => item.id === record.ticketId);
    assert.ok(pet);
    assert.ok(ticket);
    assert.equal(record.ownerId, pet.ownerId);
    assert.equal(ticket.clinicalId, record.id);
    assert.equal(ticket.petId, pet.id);
    assert.equal(ticket.ownerId, pet.ownerId);
  }
  for (const reminder of db.reminders) {
    assert.ok(db.pets.some(pet => pet.id === reminder.petId));
  }
  const pending = db.waitingRoom.find(entry => entry.status === 'Pendiente de cobro');
  assert.equal(db.tickets.find(ticket => ticket.id === pending.ticketId).clinicalId, pending.attentionId);
  assert.equal(db.clinical.find(record => record.id === pending.attentionId).waitingEntryId, pending.id);
  assert.equal(db.tickets.find(ticket => ticket.id === pending.ticketId).date, '2026-11-18');
});

test('repetir la carga demo no duplica ni cambia los datos existentes', () => {
  const db = practice();
  populateSamplePractice(db, new Date(2026, 10, 18, 12));
  const before = structuredClone(db);
  assert.equal(populateSamplePractice(db, new Date(2027, 0, 1, 12)), false);
  assert.deepEqual(db, before);
});
