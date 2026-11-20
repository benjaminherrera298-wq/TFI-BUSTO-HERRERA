import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderer, createSSRApp, h, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { loadVueComponent } from './helpers/loadVueComponent.js';
import { mountVueComponent } from './helpers/mountVueComponent.js';

const load = path => loadVueComponent(new URL(path, import.meta.url));
const PetProfile = await load('../src/views/pets/PetProfileView.vue');
const OwnerProfile = await load('../src/views/people/OwnerProfileView.vue');
const VetProfile = await load('../src/views/people/VetProfileView.vue');
const PetImagePicker = await load('../src/components/pets/PetImagePicker.vue');
const EntityForm = await load('../src/components/forms/EntityForm.vue');
const markup = (component, props) => renderToString(createSSRApp(component, props));
const pet = { id: 'pet-one', name: 'Luna <prueba>', ownerId: 'owner-one', code: '41001', species: 'Gato', breed: 'Mestizo', sex: 'Hembra', birth: '2020-01-01', weight: 5, color: 'Negro', observations: 'Datos ficticios', active: true };
const owner = { id: 'owner-one', name: 'Ana de prueba', dni: '30111222', phone: '3815550123', email: 'ana@example.com', address: 'Calle ficticia 123' };
const image = { src: '', alt: pet.name, isAvatar: false };
const clinical = { record: { id: 'clinical-one', title: 'Consulta de prueba', type: 'Consulta', date: '2026-01-01', info: 'Atención ficticia', visible: true }, medications: [], authorName: 'Profesional de prueba', formatDate: value => value };
const petProps = extra => ({ clinicName: 'Veterinaria prueba', pet, owner, image, age: 6, tabs: ['Resumen', 'Historia clínica'], tab: 'Resumen', records: [clinical], sectionRecords: [clinical], reminders: [{ id: 'reminder-one', title: 'Vacuna pendiente', date: '2026-12-01' }], notices: [{ id: 'notice-one', title: 'Aviso vigente', message: 'Mensaje ficticio' }], formatDate: value => value, ...extra });

test('el perfil Vue de mascota conserva resumen, avisos, cuidados y última atención sin HTML sin escapar', async () => {
  const html = await markup(PetProfile, petProps({ canManage: true }));
  for (const text of ['Luna &lt;prueba&gt;', 'Datos del paciente', 'Datos del propietario', 'Consulta de prueba', 'Vacuna pendiente', 'Aviso vigente', '41001', 'Historia clínica']) assert.ok(html.includes(text), text);
  assert.match(html, /data-action="edit" data-id="pets:pet-one"/);
  assert.match(html, /data-action="qr" data-id="pet-one"/);
  assert.match(html, /data-action="print-qr"/);
  const denied = await markup(PetProfile, petProps({ pet: null }));
  assert.match(denied, /No tenés permiso para consultar esta mascota\./);
  assert.doesNotMatch(denied, /<h1|data-action/);
});

test('el perfil clínico presenta los controles recibidos para propietario y veterinario', async () => {
  const vet = await markup(PetProfile, petProps({ tab: 'Historia clínica', isVet: true }));
  assert.doesNotMatch(vet, /data-action="(?:edit|qr|print-qr|print-history)"/);
  assert.match(vet, /data-action="clinical"/);
  assert.match(vet, /Consulta de prueba/);
  const own = await markup(PetProfile, petProps({ tab: 'Historia clínica', isOwner: true, sectionRecords: [] }));
  assert.match(own, /data-action="print-history"/);
  assert.doesNotMatch(own, /data-action="clinical"/);
  assert.match(own, /Sin registros en esta sección\./);
});

test('los botones del perfil emiten una sola acción, actualizan props y se desmontan', async () => {
  const events = [];
  const props = petProps({ onAction: (...args) => events.push(args) });
  const view = mountVueComponent(PetProfile, props);
  let stopped = 0;
  for (const action of ['nav', 'edit', 'qr', 'print-qr', 'tab', 'owner']) {
    view.find(node => node.props['data-action'] === action).props.onClick({ stopPropagation() { stopped++; } });
  }
  assert.deepEqual(events, [['nav', 'pets'], ['edit', 'pets:pet-one'], ['qr', 'pet-one'], ['print-qr', 'pet-one'], ['tab', 'Resumen'], ['owner', 'owner-one']]);
  assert.equal(stopped, 6);
  view.update({ ...props, pet: { ...pet, name: 'Luna actualizada' } });
  await nextTick();
  assert.equal(view.find(node => node.tag === 'h1').text, 'Luna actualizada');
  view.unmount();
  assert.equal(view.root.children.length, 0);
});

test('el propietario conserva datos y mascotas vinculadas con sus acciones de perfil', async () => {
  const values = { clinicName: 'Veterinaria prueba', owner, pets: [{ pet, image }], canManage: true };
  const html = await markup(OwnerProfile, values);
  assert.match(html, /Perfil del propietario/);
  assert.match(html, /30111222/);
  assert.match(html, /Luna &lt;prueba&gt;/);
  assert.match(html, /data-action="pet-owner"/);
  const own = await markup(OwnerProfile, { ...values, isOwner: true, pets: [] });
  assert.match(own, /Editar mis datos/);
  assert.doesNotMatch(own, /data-action="pet-owner"/);
  assert.match(own, /Todavía no hay mascotas vinculadas\./);
  const events = [];
  const view = mountVueComponent(OwnerProfile, { ...values, onAction: (...args) => events.push(args) });
  view.find(node => node.props['data-action'] === 'pet').props.onClick({ stopPropagation() {} });
  assert.deepEqual(events, [['pet', 'pet-one']]);
  view.unmount();
});

test('el perfil veterinario conserva servicios y tabla de disponibilidad', async () => {
  const vet = { id: 'vet-one', name: 'Profesional de prueba', license: 'MP 999', specialty: 'Clínica general' };
  const html = await markup(VetProfile, { clinicName: 'Veterinaria prueba', vet, serviceNames: ['Consulta', 'Vacunación'], schedule: { rows: [] } });
  assert.match(html, /Consulta · Vacunación/);
  assert.match(html, /Configurar horarios/);
  assert.match(html, /data-id="vets:vet-one"/);
  assert.match(html, /No hay registros para mostrar\./);
  assert.match(await markup(VetProfile, { restricted: true }), /Acceso restringido\./);
  assert.match(await markup(VetProfile, {}), /Profesional no disponible\./);
});

test('la galería Vue conserva grupos, selección de avatar, restauración y eventos', async () => {
  const avatars = [{ id: 'dog', label: 'Perro de prueba', group: 'Perros', src: 'data:image/png;base64,AA==' }];
  const values = { pet: { ...pet, avatarId: 'dog', photo: 'data:image/png;base64,AA==' }, avatars, usingAvatar: true };
  const html = await markup(PetImagePicker, values);
  for (const text of ['Perros', 'Gatos', 'Otros animales', 'Usar mi foto', 'PNG, JPG o WebP de hasta 1 MB.', 'aria-pressed="true"']) assert.ok(html.includes(text), text);
  const events = [];
  const view = mountVueComponent(PetImagePicker, { ...values, onAction: (...args) => events.push(args) });
  for (const action of ['owner-pet-upload', 'owner-pet-use-photo', 'owner-pet-avatar-pick']) view.find(node => node.props['data-action'] === action).props.onClick({ stopPropagation() {} });
  assert.deepEqual(events, [['owner-pet-upload', 'pet-one'], ['owner-pet-use-photo', 'pet-one'], ['owner-pet-avatar-pick', 'pet-one:dog']]);
  view.unmount();
});

const formProps = extra => ({ collection: 'pets', item: {}, id: '', owners: [['owner-one', 'Ana de prueba']], vets: [['vet-one', 'Profesional de prueba']], services: [['service-one', 'Consulta']], pets: [['pet-one', 'Luna']], dayNames: ['Domingo', 'Lunes'], careCategories: ['Vacunas', 'Control'], roleOptions: [['owner', 'Propietario'], ['vet', 'Veterinario']], today: '2026-11-19', defaultDuration: 30, maxMoney: 1_000_000_000, ...extra });

test('los nueve formularios de entidades conservan campos y restricciones nativas', async () => {
  const expected = {
    pets: ['name', 'species', 'breed', 'sex', 'birth', 'weight', 'color', 'photo', 'ownerId', 'observations'],
    owners: ['name', 'dni', 'phone', 'email', 'address'],
    vets: ['name', 'license', 'specialty', 'serviceIds', 'email', 'password'],
    services: ['name', 'duration', 'description', 'vetIds'],
    schedules: ['vetId', 'serviceId', 'day', 'start', 'end', 'duration'],
    products: ['name', 'category', 'description', 'price', 'stock', 'photo'],
    notices: ['title', 'date', 'message', 'expires', 'active'],
    users: ['name', 'email', 'password', 'phone', 'role', 'vetId', 'ownerId', 'ownerDni', 'ownerAddress'],
    reminders: ['petId', 'title', 'category', 'date']
  };
  for (const [collection, fields] of Object.entries(expected)) {
    const html = await markup(EntityForm, formProps({ collection }));
    assert.match(html, new RegExp(`data-form="entity" data-id="${collection}:"`));
    for (const name of fields) assert.ok(html.includes(`name="${name}"`), `${collection}: ${name}`);
    assert.match(html, /data-form-error(?:="")? class="error" role="alert"/);
    assert.match(html, /type="submit">Guardar/);
  }
  const ownerHtml = await markup(EntityForm, formProps({ collection: 'owners' }));
  assert.match(ownerHtml, /data-person-name/);
  assert.match(ownerHtml, /data-digits="9"/);
  assert.match(ownerHtml, /data-phone/);
  const product = await markup(EntityForm, formProps({ collection: 'products' }));
  assert.match(product, /name="price"[^>]*max="1000000000"/);
  const petHtml = await markup(EntityForm, formProps());
  assert.match(petHtml, /name="birth"[^>]*max="2026-11-19"/);
  assert.match(petHtml, /name="weight"[^>]*max="100000"/);
  assert.match(petHtml, /data-action="inline-owner"/);
});

test('el formulario conserva contraseñas vacías al editar y habilita los vínculos del rol elegido', async () => {
  const item = { name: 'Persona ficticia', role: 'vet', password: 'no-debe-aparecer', vetId: 'vet-one' };
  const before = structuredClone(item);
  const html = await markup(EntityForm, formProps({ collection: 'users', item, id: 'user-one' }));
  assert.doesNotMatch(html, /no-debe-aparecer/);
  assert.match(html, /Nueva contraseña \(vacío conserva la actual\)/);
  assert.match(html, /data-role-link="owner" hidden/);
  assert.match(html, /name="ownerId" disabled/);
  assert.doesNotMatch(html, /name="vetId" disabled/);
  assert.deepEqual(item, before);
  const principal = await markup(EntityForm, formProps({ collection: 'users', item: { role: 'owner', principal: true } }));
  assert.match(principal, /name="role" disabled/);
  assert.doesNotMatch(principal, /name="ownerId" disabled/);
});

test('el recordatorio conserva la primera opción nativa si su categoría anterior no existe', () => {
  // Este host incluye las propiedades de select que utiliza v-model al montar.
  // No comprueba CSS ni reemplaza las pruebas de Chrome.
  const node = tag => ({
    tagName: tag.toUpperCase(), children: [], parent: null, props: {}, value: '', selectedIndex: -1,
    addEventListener() {},
    get options() { return this.children.filter(child => child.tagName === 'OPTION'); }
  });
  const remove = element => {
    if (element.parent) element.parent.children.splice(element.parent.children.indexOf(element), 1);
    element.parent = null;
  };
  const insert = (element, parent, anchor) => {
    remove(element);
    const index = anchor ? parent.children.indexOf(anchor) : parent.children.length;
    parent.children.splice(index, 0, element);
    element.parent = parent;
  };
  const renderer = createRenderer({
    createElement: node, createText: () => node('#text'), createComment: () => node('#comment'),
    insert, remove, parentNode: element => element.parent,
    nextSibling: element => element.parent?.children[element.parent.children.indexOf(element) + 1] ?? null,
    setText(element, text) { element.text = text; },
    setElementText(element, text) { element.text = text; element.children = []; },
    patchProp(element, key, previous, value) { element.props[key] = value; element[key] = value; },
    insertStaticContent(content, parent, anchor) { const element = node('#static'); insert(element, parent, anchor); return [element, element]; }
  });
  const root = node('root');
  renderer.render(h(EntityForm, formProps({ collection: 'reminders', reminderCategory: 'Consulta', careCategories: ['Vacunación', 'Control'] })), root);
  const find = element => element.props.name === 'category' ? element : element.children.map(find).find(Boolean);
  const select = find(root);
  assert.equal(select.selectedIndex, 0);
  assert.equal(select.options[select.selectedIndex].value, 'Vacunación');
  renderer.render(null, root);
});
