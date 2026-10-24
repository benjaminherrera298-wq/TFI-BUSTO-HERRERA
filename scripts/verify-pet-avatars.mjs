import assert from 'node:assert/strict';
import { setImmediate as nextTurn } from 'node:timers/promises';
import { startVeterinaryApplication } from '../src/services/veterinaryApplication.js';
import { PET_AVATARS } from '../src/services/petAvatars.js';

// Exercise the real application entry point and delegated event handlers.
// These mocks capture rendered HTML; they do not assess browser layout.
const KEY = 'veterinaria-prototipo-v1';
const firstPhoto = 'data:image/png;base64,Zmlyc3Q=';
const secondPhoto = 'data:image/jpeg;base64,c2Vjb25k';
const uploadedPhoto = 'data:image/webp;base64,dXBsb2Fk';
const fixture = {
  configured: true,
  samplePracticeVersion: 1,
  config: { name: 'Veterinaria prueba', logo: '', days: [1, 2, 3, 4, 5] },
  users: [{ id: 'test-owner-user', name: 'Persona prueba', email: 'owner@example.com', password: '123456', role: 'owner', ownerId: 'test-owner', active: true }],
  owners: [{ id: 'test-owner', name: 'Persona prueba', active: true }, { id: 'other-owner', name: 'Otra persona', active: true }],
  pets: [
    { id: 'pet-one', name: 'Manchas', ownerId: 'test-owner', photo: firstPhoto, code: '41001', active: true },
    { id: 'pet-two', name: 'Michi', ownerId: 'test-owner', photo: secondPhoto, code: '41002', active: true },
    { id: 'other-pet', name: 'Mascota ajena', ownerId: 'other-owner', photo: '', code: '41003', active: true }
  ],
  vets: [], services: [], appointments: [], clinical: [], tickets: [], waitingRoom: [], reminders: [], products: [], notices: [], notifications: []
};
const storage = new Map([[KEY, JSON.stringify(fixture)]]);
let rejectWrites = false;
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => {
    if (rejectWrites && key === KEY) throw new Error('Simulated storage limit');
    storage.set(key, String(value));
  },
  removeItem: key => storage.delete(key)
};
globalThis.document = { documentElement: { dataset: {} }, querySelector: () => null };
globalThis.window = { addEventListener() {}, removeEventListener() {}, scrollTo() {} };
globalThis.location = { hash: '', pathname: '/', search: '' };
globalThis.history = { replaceState() {} };
globalThis.FormData = class {
  constructor(form) { this.entries = Object.entries(form.values); }
  [Symbol.iterator]() { return this.entries[Symbol.iterator](); }
};
globalThis.FileReader = class {
  readAsDataURL(file) {
    queueMicrotask(() => {
      this.result = file.data;
      this.onload();
    });
  }
};

function createSession() {
  const handlers = new Map();
  const nodes = new Map();
  const notifications = [];
  for (const id of ['app', 'content', 'modal', 'form-error', 'owner-pet-photo-input']) {
    nodes.set(`#${id}`, {
      id, html: '', open: false, clicks: 0,
      showModal() { this.open = true; },
      close() { this.open = false; },
      click() { this.clicks++; }
    });
  }
  const ui = {
    lockedRole: 'owner',
    root: { querySelector: selector => nodes.get(selector) ?? null, querySelectorAll: () => [] },
    on: (eventName, callback) => handlers.set(eventName, callback),
    setHtml: (node, html) => { assert.ok(node, 'Render target must exist'); node.html = html; },
    notify: message => notifications.push(message)
  };
  const stop = startVeterinaryApplication(ui);
  return {
    nodes, notifications, stop,
    async click(action, id = '') {
      const target = { dataset: { action, id }, closest: () => target };
      handlers.get('click')({ target });
      await nextTurn();
    },
    async login() {
      const submit = { disabled: false, isConnected: true };
      const form = {
        dataset: { form: 'login' }, values: { email: 'owner@example.com', password: '123456' },
        matches: selector => selector === 'form[data-form]',
        querySelector: () => submit
      };
      await handlers.get('submit')({ target: form, preventDefault() {} });
      assert.equal(nodes.get('#form-error').textContent, undefined, 'Login must succeed');
      assert.match(nodes.get('#content').html, /Manchas/);
    },
    async upload(file) {
      const input = nodes.get('#owner-pet-photo-input');
      input.files = [file];
      input.value = 'fake-file';
      handlers.get('change')({ target: input });
      await nextTurn();
    }
  };
}
const saved = () => JSON.parse(storage.get(KEY));
const pet = id => saved().pets.find(item => item.id === id);
const card = (session, name) => session.nodes.get('#content').html.split('<article').slice(1).find(html => html.includes(`>${name}</h2>`));
const dalmatian = PET_AVATARS.find(avatar => avatar.label === 'Dálmata');
assert.ok(dalmatian, 'Catalog must include the requested Dalmatian');
assert.equal(new Set(PET_AVATARS.map(avatar => avatar.id)).size, PET_AVATARS.length, 'Catalog IDs must be unique');
for (const group of ['Perros', 'Gatos', 'Otros animales']) {
  assert.ok(PET_AVATARS.filter(avatar => avatar.group === group).length >= 2, `Variety required in ${group}`);
}

let session = createSession();
await session.login();
assert.match(card(session, 'Michi'), new RegExp(secondPhoto));
await session.click('owner-pet-photo', 'pet-one');
assert.equal(session.nodes.get('#modal').open, true);
assert.match(session.nodes.get('#modal').html, /Dálmata/);
assert.match(session.nodes.get('#modal').html, /Gatos/);
assert.match(session.nodes.get('#modal').html, /Otros animales/);
await session.click('owner-pet-avatar-pick', `pet-one:${dalmatian.id}`);
assert.equal(pet('pet-one').avatarId, dalmatian.id);
assert.equal(pet('pet-one').imagePreference, 'avatar');
assert.equal(pet('pet-one').photo, firstPhoto, 'Choosing an icon must preserve the saved photo');
assert.match(card(session, 'Manchas'), /pet-illustration/);
assert.equal(pet('pet-two').photo, secondPhoto);
assert.equal(pet('pet-two').avatarId, undefined, 'Another pet must retain its photo');
assert.match(card(session, 'Michi'), new RegExp(secondPhoto));
assert.equal(session.nodes.get('#modal').open, false);

session.stop();
session = createSession();
await session.login();
assert.equal(pet('pet-one').avatarId, dalmatian.id);
assert.match(card(session, 'Manchas'), /pet-illustration/, 'Selected icon must render after restart');
await session.click('owner-pet-photo', 'pet-one');
assert.match(session.nodes.get('#modal').html, /Usar mi foto/);
assert.match(session.nodes.get('#modal').html, /aria-pressed="true"/);
await session.click('owner-pet-use-photo', 'pet-one');
assert.equal(pet('pet-one').imagePreference, 'photo');
assert.match(card(session, 'Manchas'), new RegExp(firstPhoto));
assert.doesNotMatch(card(session, 'Manchas'), /pet-illustration/);

const beforeInvalid = storage.get(KEY);
await session.click('owner-pet-avatar-pick', `other-pet:${dalmatian.id}`);
await session.click('owner-pet-avatar-pick', 'pet-one:invalid-avatar');
await session.click('owner-pet-photo', 'other-pet');
assert.equal(storage.get(KEY), beforeInvalid, 'Foreign pets and invalid icons must not mutate stored data');
assert.equal(session.nodes.get('#modal').open, false, 'Foreign pet gallery must not open');

await session.click('owner-pet-avatar-pick', `pet-one:${dalmatian.id}`);
await session.click('owner-pet-upload', 'pet-one');
assert.equal(session.nodes.get('#owner-pet-photo-input').clicks, 1, 'Upload control must open the file picker');
await session.upload({ type: 'image/webp', size: 200, data: uploadedPhoto });
assert.equal(pet('pet-one').photo, uploadedPhoto);
assert.equal(pet('pet-one').imagePreference, 'photo');
assert.match(card(session, 'Manchas'), new RegExp(uploadedPhoto));
assert.equal(pet('pet-two').photo, secondPhoto);

const beforeRejectedPhoto = storage.get(KEY);
await session.click('owner-pet-upload', 'pet-one');
await session.upload({ type: 'text/plain', size: 200, data: 'invalid' });
assert.equal(storage.get(KEY), beforeRejectedPhoto, 'Invalid file must not replace a valid photo');
assert.match(session.notifications.at(-1), /PNG, JPG o WebP/);

rejectWrites = true;
await session.click('owner-pet-avatar-pick', `pet-one:${dalmatian.id}`);
rejectWrites = false;
assert.equal(storage.get(KEY), beforeRejectedPhoto, 'Storage failure must preserve persisted state');
await session.click('nav', 'pets');
assert.match(card(session, 'Manchas'), new RegExp(uploadedPhoto), 'Storage failure must roll back in-memory avatar selection');
assert.doesNotMatch(card(session, 'Manchas'), /pet-illustration/);

await session.click('logout');
const beforeLoggedOut = storage.get(KEY);
await session.click('owner-pet-avatar-pick', `pet-one:${dalmatian.id}`);
assert.equal(storage.get(KEY), beforeLoggedOut, 'Logged-out users must not change an avatar');
session.stop();
console.log(`PASS: owner gallery, ${PET_AVATARS.length} icons, per-pet selection, preserved photos, restart persistence, photo restore, permission/catalog rejection, mocked upload, invalid file rejection, and storage rollback.`);
