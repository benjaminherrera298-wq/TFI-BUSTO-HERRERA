import test from 'node:test';
import assert from 'node:assert/strict';
import { createSSRApp, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { loadVueComponent } from './helpers/loadVueComponent.js';
import { mountVueComponent } from './helpers/mountVueComponent.js';

const PetCard = await loadVueComponent(new URL('../src/components/pets/PetCard.vue', import.meta.url));
const props = (extra = {}) => ({
  pet: { id: 'p1', name: 'Luna <prueba>', code: '41001', cardColor: 'sky' },
  image: { src: 'data:image/png;base64,AA==', alt: 'Luna · Retrato', isAvatar: true },
  background: '#B5D5DE', colors: [{ id: 'sky', name: 'Celeste agua', value: '#B5D5DE' }],
  pickerOpen: true, ...extra
});

test('PetCard conserva clases, imagen, código, controles y texto escapado', async () => {
  const html = await renderToString(createSSRApp(PetCard, props()));
  assert.match(html, /class="card owner-pet-card has-color"/);
  assert.match(html, /profile-photo pet-illustration/);
  assert.match(html, /Luna &lt;prueba&gt;/);
  assert.match(html, /41001/);
  assert.match(html, /owner-pet-color-swatch active/);
  assert.match(html, /data-id="p1:default"/);
  assert.match(html, /Ingresar al perfil →/);
  const empty = await renderToString(createSSRApp(PetCard, props({ image: { src: '' }, pickerOpen: false })));
  assert.match(empty, /profile-photo pet-avatar/);
  assert.doesNotMatch(empty, /<img|owner-pet-color-picker/);
});

test('PetCard emite una sola acción sin mutar sus propiedades ni propagar el clic anterior', async () => {
  const events = [];
  const values = props(Object.fromEntries(['open', 'qr', 'photo', 'color', 'pickColor'].map(name =>
    ['on' + name[0].toUpperCase() + name.slice(1), value => events.push([name, value])])));
  const original = structuredClone(values.pet);
  const view = mountVueComponent(PetCard, values);
  let stopped = 0;
  for (const action of ['pet', 'qr', 'owner-pet-photo', 'owner-pet-color', 'owner-pet-color-pick']) {
    view.find(node => node.props['data-action'] === action).props.onClick({ stopPropagation() { stopped++; } });
  }
  assert.deepEqual(events, [['open', 'p1'], ['qr', 'p1'], ['photo', 'p1'], ['color', 'p1'], ['pickColor', { petId: 'p1', colorId: 'sky' }]]);
  assert.equal(stopped, 5);
  assert.deepEqual(values.pet, original);
  const article = view.find(node => node.tag === 'article');
  view.update({ ...values, pet: { ...values.pet, name: 'Nombre actualizado' }, pickerOpen: false });
  await nextTick();
  assert.equal(view.find(node => node.tag === 'article'), article);
  assert.equal(view.find(node => node.tag === 'h2').text, 'Nombre actualizado');
  view.unmount();
  assert.equal(view.root.children.length, 0);
});
