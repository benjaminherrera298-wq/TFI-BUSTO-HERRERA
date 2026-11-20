import test from 'node:test';
import assert from 'node:assert/strict';
import { createSSRApp, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { loadVueComponent } from './helpers/loadVueComponent.js';
import { mountVueComponent } from './helpers/mountVueComponent.js';

const load = path => loadVueComponent(new URL('../src/' + path, import.meta.url));
const ScheduleTable = await load('components/schedules/ScheduleTable.vue');
const SchedulesView = await load('views/schedules/SchedulesView.vue');
const OwnerSchedulesView = await load('views/schedules/OwnerSchedulesView.vue');
const OwnerAgendaView = await load('views/agenda/OwnerAgendaView.vue');
const PersonalAgendaView = await load('views/agenda/PersonalAgendaView.vue');
const AgendaDaySection = await load('components/agenda/AgendaDaySection.vue');
const AgendaNoteForm = await load('components/agenda/AgendaNoteForm.vue');
const OwnerReminderForm = await load('components/agenda/OwnerReminderForm.vue');
const RemindersView = await load('views/reminders/RemindersView.vue');
const render = (component, props) => renderToString(createSSRApp(component, props));
const event = value => ({ target: { value }, currentTarget: {}, stopPropagation() { this.stopped = true; } });
const scheduleRow = { schedule: { id: 's1', start: '09:00', end: '12:00', duration: 30, active: true }, vetName: 'Profesional <prueba>', serviceName: 'Ecografía', dayName: 'Lunes', status: 'Horario limitado' };

test('ScheduleTable conserva estados, datos, vacío y acciones sin duplicación', async () => {
  const html = await render(ScheduleTable, { rows: [scheduleRow] });
  for (const text of ['Profesional', 'Servicio', 'Día', 'Franja', 'Duración', 'Estado', 'Horario limitado', 'Ecografía', '09:00 – 12:00']) assert.ok(html.includes(text), text);
  assert.match(html, /Profesional &lt;prueba&gt;/);
  assert.match(html, /data-id="schedules:s1"/);
  assert.match(await render(ScheduleTable, { rows: [] }), /No hay registros para mostrar\./);
  const events = [];
  const view = mountVueComponent(ScheduleTable, { rows: [scheduleRow], onAction: (action, id) => events.push([action, id]) });
  for (const action of ['edit', 'toggle']) {
    const click = event();
    view.find(node => node.props['data-action'] === action).props.onClick(click);
    assert.equal(click.stopped, true);
  }
  assert.deepEqual(events, [['edit', 'schedules:s1'], ['toggle', 'schedules:s1']]);
  view.unmount();
});

test('SchedulesView conserva el buscador al actualizar filas y comunica búsqueda y página', async () => {
  const events = [];
  const values = { clinicName: 'Prueba', rows: [scheduleRow], query: '', pageNumber: 1, totalPages: 2, totalRecords: 9, onSearch: value => events.push(['search', value]), onPage: value => events.push(['page', value]) };
  const view = mountVueComponent(SchedulesView, values);
  const search = view.find(node => node.props.id === 'list-search');
  search.props.onInput(event('Ecografía'));
  view.find(node => node.props['data-action'] === 'page' && node.props['data-id'] === 2).props.onClick(event());
  assert.deepEqual(events, [['search', 'Ecografía'], ['page', 2]]);
  view.update({ ...values, rows: [], query: 'Ecografía' });
  await nextTick();
  assert.equal(view.find(node => node.props.id === 'list-search'), search);
  assert.equal(search.props.value, 'Ecografía');
  view.unmount();
});

test('OwnerSchedulesView mantiene la consulta sin acciones administrativas', async () => {
  const html = await render(OwnerSchedulesView, { clinic: { name: 'Prueba', address: 'Dirección', phone: '3815550000', start: '08:00', end: '20:00' }, openDays: 'Lunes · Martes', specialists: [{ vet: { id: 'v1', name: 'Profesional', specialty: 'Cirugía', license: 'MP 123' }, schedules: [scheduleRow] }] });
  for (const text of ['Solo lectura.', 'Lunes · Martes', '08:00 – 20:00', 'Especialista', 'Ecografía', '09:00 – 12:00']) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /data-action="(?:create|edit|toggle)"/);
  const empty = await render(OwnerSchedulesView, { clinic: { name: 'Prueba' }, openDays: '—', specialists: [] });
  assert.match(empty, /No hay atenciones especiales/);
});

const note = { id: 'a1', title: 'Anotación <prueba>', date: '2026-11-19', time: '09:00', note: 'Nota de prueba', done: false };
const personalProps = extra => ({ clinicName: 'Prueba', date: '2026-11-19', today: '2026-11-19', mode: 'month', period: 'Noviembre 2026', month: '2026-11', monthDays: [{ date: '2026-11-19', label: '19 nov 2026', entries: [note] }], daySections: [{ date: '2026-11-19', label: 'Jueves · 19 nov 2026', entries: [note] }], ...extra });

test('PersonalAgendaView presenta las tres vistas, anotaciones y controles con eventos únicos', async () => {
  const month = await render(PersonalAgendaView, personalProps());
  assert.match(month, /personal-agenda-calendar/);
  assert.match(month, /aria-pressed="true"/);
  assert.match(month, /Anotación &lt;prueba&gt;/);
  assert.match(month, /data-action="agenda-toggle"/);
  const week = await render(PersonalAgendaView, personalProps({ mode: 'week' }));
  assert.match(week, /personal-agenda-week/);
  assert.doesNotMatch(week, /class="personal-agenda-calendar"/);
  const day = await render(PersonalAgendaView, personalProps({ mode: 'day' }));
  assert.doesNotMatch(day, /class="personal-agenda-calendar"|class="personal-agenda-week"/);
  const events = [];
  const view = mountVueComponent(PersonalAgendaView, personalProps({ onDate: value => events.push(['date', value]), onMode: value => events.push(['mode', value]), onAction: (action, id) => events.push([action, id]) }));
  view.find(node => node.props.id === 'agenda-date').props.onChange(event('2026-11-20'));
  view.find(node => node.props.id === 'agenda-mode').props.onChange(event('week'));
  view.find(node => node.props['data-action'] === 'agenda-edit').props.onClick(event());
  assert.deepEqual(events, [['date', '2026-11-20'], ['mode', 'week'], ['agenda-edit', 'a1']]);
  view.unmount();
});

test('la tarjeta de agenda refleja los cambios de estado de los registros anteriores', async () => {
  const entry = { ...note };
  const day = { date: entry.date, label: 'Fecha de prueba', entries: [entry] };
  const view = mountVueComponent(AgendaDaySection, { day });
  assert.equal(view.find(node => node.tag === 'span' && node.props.class === 'badge').text, 'Pendiente');
  entry.done = true;
  view.update({ day: { ...day, entries: [entry] } });
  await nextTick();
  assert.equal(view.find(node => node.tag === 'span' && node.props.class === 'badge').text, 'Completado');
  assert.equal(view.find(node => node.props['data-action'] === 'agenda-toggle').text, 'Marcar pendiente');
  view.unmount();
});

const careItem = extra => ({ id: 'r1', title: 'Pipeta', petName: 'Luna', date: '2026-11-19', dateLabel: '19 nov 2026', time: '', category: 'Pipeta', color: '#7ab2c6', done: false, note: 'Nota <prueba>', kind: 'owner', ...extra });
const ownerProps = extra => ({ month: '2026-11', monthLabel: 'Noviembre 2026', today: '2026-11-19', todayLabel: 'Jueves, 19 nov 2026', selectedDate: '2026-11-19', selectedLabel: 'Jueves 19 nov 2026', days: Array.from({ length: 42 }, (_, index) => ({ date: index === 0 ? '2026-11-19' : '2026-12-' + String(index).padStart(2, '0'), label: 'Fecha de prueba', items: index === 0 ? Array.from({ length: 4 }, (_, i) => careItem({ id: 'r' + i })) : [] })), categories: [['Pipeta', '#7ab2c6']], upcoming: [careItem()], selectedItems: [careItem(), careItem({ id: 'r2', kind: 'vet', by: 'Profesional' })], ...extra });

test('OwnerAgendaView conserva calendario, leyenda, límite de chips y permisos de recordatorios', async () => {
  const html = await render(OwnerAgendaView, ownerProps());
  assert.equal((html.match(/class="cal-cell /g) || []).length, 42);
  assert.equal((html.match(/class="cal-chip"/g) || []).length, 3);
  assert.match(html, /<em>\+1<\/em>/);
  assert.match(html, /Agregado por vos/);
  assert.match(html, /Indicado por Profesional/);
  assert.equal((html.match(/data-action="cal-edit"/g) || []).length, 1);
  assert.equal((html.match(/data-action="cal-delete"/g) || []).length, 1);
  assert.match(html, /Nota &lt;prueba&gt;/);
  const empty = await render(OwnerAgendaView, ownerProps({ upcoming: [], selectedItems: [] }));
  assert.match(empty, /No hay cuidados próximos\./);
  assert.match(empty, /No hay nada para este día\./);
});

test('OwnerAgendaView emite navegación y edición sin mutar los cuidados recibidos', () => {
  const events = [];
  const values = ownerProps({ onAction: (action, id) => events.push([action, id]) });
  const before = structuredClone(values.selectedItems);
  const view = mountVueComponent(OwnerAgendaView, values);
  for (const action of ['cal-prev', 'cal-day', 'cal-new', 'cal-edit', 'cal-delete']) {
    const click = event();
    view.find(node => node.props['data-action'] === action).props.onClick(click);
    assert.equal(click.stopped, true);
  }
  assert.deepEqual(events, [['cal-prev', ''], ['cal-day', '2026-11-19'], ['cal-new', '2026-11-19'], ['cal-edit', 'r1'], ['cal-delete', 'r1']]);
  assert.deepEqual(values.selectedItems, before);
  view.unmount();
  assert.equal(view.root.children.length, 0);
});

test('los formularios de agenda conservan nombres, límites y datos para el guardado anterior', async () => {
  const personal = await render(AgendaNoteForm, { entry: note, entryId: 'a1', date: '2026-11-19' });
  assert.match(personal, /data-form="agenda-note" data-id="a1"/);
  assert.match(personal, /name="title"[^>]*maxlength="160"/);
  assert.match(personal, /min="1000-01-01" max="9999-12-31"/);
  assert.match(personal, /name="note">Nota de prueba<\/textarea>/);
  const care = await render(OwnerReminderForm, { current: { petId: 'p1', title: 'Control', note: 'Dato <prueba>' }, pets: [{ id: 'p1', name: 'Luna' }], categories: ['Pipeta', 'Control'], selectedCategory: 'Control', date: '2026-11-19', reminderId: 'r1' });
  assert.match(care, /data-form="owner-reminder" data-id="r1"/);
  assert.match(care, /value="Control" selected/);
  assert.match(care, /name="title"[^>]*maxlength="80"/);
  assert.match(care, /name="note" maxlength="240">Dato &lt;prueba&gt;/);
});

test('RemindersView conserva estados y acciones de consulta y gestión', async () => {
  const rows = [{ reminder: { id: 'r1', title: 'Control', petId: 'p1', done: false }, petName: 'Luna', dateLabel: '19 nov 2026', status: 'Pendiente' }];
  const manage = await render(RemindersView, { clinicName: 'Prueba', rows, canManage: true });
  assert.match(manage, /class="badge pending"/);
  assert.match(manage, /data-action="create"/);
  assert.match(manage, /data-id="reminders:r1"/);
  const owner = await render(RemindersView, { clinicName: 'Prueba', rows, canManage: false });
  assert.match(owner, /data-action="pet"/);
  assert.doesNotMatch(owner, /data-action="(?:create|edit|reminder-done)"/);
  const empty = await render(RemindersView, { clinicName: 'Prueba', rows: [], canManage: false });
  assert.match(empty, /<h1>Recordatorios<\/h1>/);
  assert.doesNotMatch(empty, /Sin recordatorios/, 'Se mantiene el estado vacío anterior, sin texto nuevo.');
});
