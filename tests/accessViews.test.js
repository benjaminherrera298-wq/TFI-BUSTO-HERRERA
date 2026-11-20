import test from 'node:test';
import assert from 'node:assert/strict';
import { createSSRApp, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { loadVueComponent } from './helpers/loadVueComponent.js';
import { mountVueComponent } from './helpers/mountVueComponent.js';

const load = path => loadVueComponent(new URL('../src/' + path, import.meta.url));
const LoginView = await load('views/auth/LoginView.vue');
const SetupView = await load('views/auth/SetupView.vue');
const RecoveryView = await load('views/auth/RecoveryView.vue');
const ApplicationShell = await load('components/layout/ApplicationShell.vue');
const HomeView = await load('views/home/HomeView.vue');
const HomeWaitingPatients = await load('components/home/HomeWaitingPatients.vue');
const clinic = { name: 'Clínica <prueba>', logo: '' };
const render = (component, props) => renderToString(createSSRApp(component, props));

test('LoginView conserva el acceso, recordatorio, demo, imagen y textos escapados', async () => {
  const html = await render(LoginView, { clinic, remembered: 'owner@example.com', accounts: [{ id: 'demo', roleLabel: 'Propietario', email: 'demo@example.com' }] });
  assert.match(html, /class="auth auth-login"/);
  assert.match(html, /veterinary-owner-dog\.png/);
  assert.match(html, /Clínica &lt;prueba&gt;/);
  assert.match(html, /data-form="login"/);
  assert.match(html, /name="email"[^>]*value="owner@example.com"/);
  assert.match(html, /name="remember"[^>]*checked/);
  assert.match(html, /autocomplete="current-password"/);
  assert.match(html, /data-action="recover"/);
  assert.match(html, /data-action="demo"[^>]*data-id="demo@example.com"/);
});

test('SetupView presenta los cinco pasos y conserva atributos y campos de configuración', async () => {
  const first = await render(SetupView, { clinic, step: 0, config: { name: 'Prueba', days: [1, 3] }, code: '123456' });
  assert.match(first, /data-form="setup"/);
  for (const name of ['name', 'identifier', 'address', 'phone', 'email', 'logo', 'days', 'start', 'end', 'duration']) assert.ok(first.includes(`name="${name}"`), name);
  assert.match(first, /name="identifier"[^>]*data-digits="11"/);
  assert.equal((first.match(/type="checkbox"[^>]*checked/g) || []).length, 2);
  assert.doesNotMatch(first, /data-action="close"/);
  const second = await render(SetupView, { clinic, step: 1, verificationEmail: 'qa@example.com', code: '123456' });
  assert.match(second, /data-form="verify"/);
  assert.match(second, /qa@example\.com/);
  assert.match(second, /pattern="\[0-9\]\{6\}"/);
  const third = await render(SetupView, { clinic, step: 2, code: '123456' });
  assert.match(third, /data-form="admin"/);
  assert.match(third, /data-person-name/);
  assert.match(third, /name="confirm"/);
  const fourth = await render(SetupView, { clinic, step: 3, verificationEmail: 'admin@example.com', code: '123456' });
  assert.match(fourth, /Verificá tu cuenta/);
  const last = await render(SetupView, { clinic, step: 4, code: '123456' });
  assert.doesNotMatch(last, /<form/);
  assert.match(last, /data-action="login"/);
});

test('RecoveryView conserva los formularios de contacto, código y nueva contraseña', async () => {
  const first = await render(RecoveryView, { clinic, code: '123456' });
  assert.match(first, /data-form="recover"/);
  assert.match(first, /name="contact"/);
  assert.doesNotMatch(first, /data-action="resend"|data-action="close"/);
  const code = await render(RecoveryView, { clinic, recovery: { id: 'u1' }, code: '123456' });
  assert.match(code, /Código simulado: 123456/);
  assert.match(code, /name="code"/);
  assert.match(code, /data-action="resend"/);
  const verified = await render(RecoveryView, { clinic, recovery: { id: 'u1', verified: true }, code: '123456' });
  assert.match(verified, /name="password"/);
  assert.match(verified, /name="confirm"/);
  assert.doesNotMatch(verified, /Código simulado/);
});

const shellProps = extra => ({ clinic, user: { role: 'owner', name: 'Ana', email: 'ana@example.com' }, firstName: 'Ana', accountLabel: 'An', panelLabel: 'Portal del propietario', roleLabel: 'Propietario', navigation: [{ key: 'pets', icon: 'pet', label: 'Mis mascotas' }], route: 'pets', darkTheme: true, ...extra });

test('ApplicationShell muestra solo las opciones recibidas y usa Vue para menú y cuenta', async () => {
  const html = await render(ApplicationShell, shellProps());
  assert.match(html, /class="nav-item active"[^>]*data-action="nav"[^>]*data-id="pets"[^>]*aria-current="page"/);
  assert.doesNotMatch(html, /notification-button|account-menu/);
  assert.match(html, /<main id="content" class="content"><\/main>/);
  const events = [];
  const view = mountVueComponent(ApplicationShell, shellProps({ onAction: (...args) => events.push(args.slice(0, 2)) }));
  let stopped = 0;
  const event = () => ({ currentTarget: {}, stopPropagation() { stopped++; } });
  view.find(node => node.props['data-action'] === 'account').props.onClick(event());
  await nextTick();
  assert.ok(view.find(node => node.props.class === 'account-menu'));
  view.find(node => node.props['data-action'] === 'nav' && node.props['data-id'] === 'ownerProfile').props.onClick(event());
  view.find(node => node.props['data-action'] === 'theme').props.onClick(event());
  assert.deepEqual(events, [['nav', 'ownerProfile'], ['theme', '']]);
  assert.equal(stopped, 3);
  view.unmount();
  assert.equal(view.root.children.length, 0);
});

const waitingRow = { entry: { id: 'e1', petName: 'Luna', status: 'Esperando', reason: 'Control', vetId: '' }, pet: { id: 'p1', species: 'Gato', breed: 'Mestizo' }, ownerName: 'Ana', time: '10:00' };

test('HomeView compone espera, tickets y agenda con datos recibidos, sin copiar el almacenamiento', async () => {
  const html = await render(HomeView, {
    clinicName: clinic.name, greeting: 'Buenos días, Ana', dateLabel: 'Fecha de prueba', isAdmin: true, canUsePersonalAgenda: true,
    waitingRows: [waitingRow], ticketRows: [{ ticket: { id: 't1', number: 'T-1', status: 'Pendiente de cobro', reason: 'Control', time: '10:00', vetName: 'Profesional' }, pet: { id: 'p1' }, petName: 'Luna', ownerName: 'Ana', dateLabel: '1 ene', amountLabel: 'A definir' }],
    agendaEntries: [{ entry: { id: 'a1', title: 'Anotación de prueba', time: '' }, dateLabel: '1 ene' }]
  });
  for (const text of ['Buenos días, Ana', 'Mascotas en espera', 'Tickets en espera', 'Anotación de prueba', 'A definir']) assert.ok(html.includes(text), text);
  for (const action of ['admin-scan', 'admin-charge', 'admin-edit-reason', 'agenda-open']) assert.ok(html.includes(`data-action="${action}"`), action);
  assert.match(html, /id="global-search"/);
  assert.match(html, /id="global-results" class="search-results"/);
});

test('la espera del inicio conserva las acciones del veterinario y del superadministrador', async () => {
  const busy = { ...waitingRow, entry: { ...waitingRow.entry, status: 'En atención', vetId: 'v2' } };
  const vet = await render(HomeWaitingPatients, { rows: [busy], vetId: 'v1' });
  assert.match(vet, /En atención con otro veterinario/);
  assert.doesNotMatch(vet, /data-action="vet-attend"/);
  const superadmin = await render(HomeWaitingPatients, { rows: [busy], isAdmin: true, isSuperadmin: true });
  assert.match(superadmin, /data-action="admin-release-entry"/);
  assert.match(superadmin, /data-action="vet-attend"/);
  const events = [];
  const view = mountVueComponent(HomeWaitingPatients, { rows: [waitingRow], vetId: 'v1', onAction: (action, id) => events.push([action, id]) });
  let stopped = 0;
  view.find(node => node.props['data-action'] === 'vet-attend').props.onClick({ currentTarget: {}, stopPropagation() { stopped++; } });
  assert.deepEqual(events, [['vet-attend', 'e1']]);
  assert.equal(stopped, 1);
  view.unmount();
});
