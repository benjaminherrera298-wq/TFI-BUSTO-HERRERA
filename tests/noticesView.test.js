import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderer, createSSRApp, h, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { loadVueComponent } from './helpers/loadVueComponent.js';

const NoticesView = await loadVueComponent(new URL('../src/views/notices/NoticesView.vue', import.meta.url));
const notices = [
  { id: 'n1', title: 'Cierre & cuidados', message: 'Aviso <importante>', date: '2026-11-19', expires: '2026-11-20', active: true },
  { id: 'n2', title: 'Nuevo horario', message: 'Información para publicar', date: '2026-11-19', expires: '', active: false }
];
const props = (extra = {}) => ({
  clinicName: 'Veterinaria prueba', notices, canManage: false,
  inSettings: false, query: '', formatDate: value => `Fecha ${value}`, ...extra
});
const html = values => renderToString(createSSRApp(NoticesView, props(values)));

test('Avisos conserva encabezado, tarjetas, estados, fechas y texto escapado', async () => {
  const markup = await html();
  assert.match(markup, /class="eyebrow">Veterinaria prueba/);
  assert.match(markup, /<h1>Avisos<\/h1>/);
  assert.match(markup, /Información publicada por la veterinaria\./);
  assert.equal((markup.match(/<article class="card notice"/g) || []).length, 2);
  assert.match(markup, /Cierre &amp; cuidados/);
  assert.match(markup, /Aviso &lt;importante&gt;/);
  assert.match(markup, /Publicado/);
  assert.match(markup, /Borrador/);
  assert.match(markup, /Veterinaria prueba · Fecha 2026-11-19/);
  assert.match(markup, / · Hasta Fecha 2026-11-20/);
  assert.match(markup, /id="list-search"[^>]*aria-label="Buscar registros"/);
  assert.match(markup, /placeholder="Buscar por nombre o datos\.\.\."/);
  assert.doesNotMatch(markup, /data-action="(?:create|edit|toggle|delete-notice)"/);
});

test('Configuración usa su encabezado y muestra los controles según el permiso recibido', async () => {
  const markup = await html({ canManage: true, inSettings: true });
  assert.match(markup, /<h2>Avisos de la veterinaria<\/h2>/);
  assert.match(markup, /Informá cierres por fecha, feriados y cambios en los días u horarios de atención\./);
  assert.doesNotMatch(markup, /<h1>|class="eyebrow"/);
  assert.match(markup, /\+ Nuevo aviso/);
  assert.match(markup, /data-action="edit"[^>]*data-id="notices:n1"/);
  assert.match(markup, /data-action="toggle"[^>]*data-id="notices:n1"/);
  assert.match(markup, /Desactivar/);
  assert.match(markup, /Publicar/);
  assert.match(markup, /class="danger"[^>]*data-action="delete-notice"[^>]*data-id="n1"/);
});

test('el mensaje vacío solo aparece dentro de Configuración', async () => {
  const standalone = await html({ notices: [] });
  assert.doesNotMatch(standalone, /No hay avisos para mostrar|<article/);
  const settings = await html({ notices: [], inSettings: true });
  assert.match(settings, /<div class="empty">No hay avisos para mostrar\.<\/div>/);
});

// Ejecuta eventos Vue en un árbol de memoria; no comprueba layout ni foco real.
function mount(values) {
  const node = (tag, text = '') => ({ tag, text, props: {}, children: [], parent: null });
  const remove = element => {
    if (element.parent) element.parent.children.splice(element.parent.children.indexOf(element), 1);
    element.parent = null;
  };
  const insert = (element, parent, anchor = null) => {
    remove(element);
    element.parent = parent;
    parent.children.splice(anchor ? parent.children.indexOf(anchor) : parent.children.length, 0, element);
  };
  const renderer = createRenderer({
    createElement: tag => node(tag), createText: text => node('#text', text), createComment: text => node('#comment', text),
    setText: (element, text) => { element.text = text; },
    setElementText: (element, text) => { element.text = text; element.children = []; },
    patchProp: (element, key, previous, value) => { element.props[key] = value; },
    insert, remove, parentNode: element => element.parent,
    nextSibling: element => element.parent?.children[element.parent.children.indexOf(element) + 1] ?? null,
    insertStaticContent(content, parent, anchor) {
      const element = node('#static', content);
      insert(element, parent, anchor);
      return [element, element];
    }
  });
  const root = node('root');
  const find = predicate => {
    const visit = element => predicate(element) ? element : element.children.map(visit).find(Boolean);
    return visit(root);
  };
  const update = extra => renderer.render(h(NoticesView, props(extra)), root);
  update(values);
  return { find, update, unmount: () => renderer.render(null, root) };
}

test('las nuevas propiedades actualizan avisos sin reemplazar el buscador', async () => {
  const view = mount({});
  const search = view.find(element => element.props.id === 'list-search');
  view.update({ query: 'horario', notices: [{ ...notices[1], title: 'Horario actualizado' }] });
  await nextTick();
  assert.equal(view.find(element => element.props.id === 'list-search'), search);
  assert.equal(search.props.value, 'horario');
  assert.ok(view.find(element => element.tag === 'h2' && element.text === 'Horario actualizado'));
  view.unmount();
});

test('el buscador y las acciones emiten una sola vez y detienen la delegación anterior', () => {
  const events = [];
  const view = mount({
    canManage: true,
    onSearch: value => events.push(['search', value]), onCreate: () => events.push(['create']),
    onEdit: id => events.push(['edit', id]), onToggle: id => events.push(['toggle', id]), onDelete: id => events.push(['delete', id])
  });
  let stopped = 0;
  const event = value => ({ target: { value }, stopPropagation() { stopped++; } });
  view.find(element => element.props.id === 'list-search').props.onInput(event('horario'));
  for (const [action, id] of [['create', 'notices'], ['edit', 'notices:n1'], ['toggle', 'notices:n1'], ['delete-notice', 'n1']]) {
    view.find(element => element.props['data-action'] === action && element.props['data-id'] === id).props.onClick(event());
  }
  assert.deepEqual(events, [['search', 'horario'], ['create'], ['edit', 'n1'], ['toggle', 'n1'], ['delete', 'n1']]);
  assert.equal(stopped, 5);
  view.unmount();
});
