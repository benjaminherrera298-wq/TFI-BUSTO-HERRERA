import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderer, createSSRApp, h, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { loadVueComponent } from './helpers/loadVueComponent.js';

const CatalogView = await loadVueComponent(new URL('../src/views/catalog/CatalogView.vue', import.meta.url));
const products = [
  { id: 'p1', name: 'Alimento & cuidado', category: 'Nutrición', description: 'Bolsa <sellada>', price: 12500, stock: 3, active: true, photo: 'data:image/png;base64,Zm90bw==' },
  { id: 'p2', name: 'Correa', category: 'Accesorios', description: 'Correa regulable', price: 3000, stock: 0, active: false, photo: '' }
];
const props = (extra = {}) => ({
  clinicName: 'Veterinaria prueba', clinicPhone: '3815550123',
  products, categories: ['Nutrición', 'Accesorios'], canManage: true,
  query: '', category: '',
  formatMoney: value => Number(value || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }),
  ...extra
});
const html = values => renderToString(createSSRApp(CatalogView, props(values)));

test('la vista real conserva textos, tarjetas, imágenes, ícono y estados de los productos', async () => {
  const markup = await html();
  assert.match(markup, /class="heading"/);
  assert.match(markup, /<h1>Catálogo<\/h1>/);
  assert.match(markup, /Productos disponibles en Veterinaria prueba\. Consultas: 3815550123\./);
  assert.match(markup, /id="list-search"[^>]*aria-label="Buscar registros"/);
  assert.match(markup, /placeholder="Buscar por nombre o datos\.\.\."/);
  assert.match(markup, /class="grid"/);
  assert.equal((markup.match(/<article class="card"/g) || []).length, 2);
  assert.match(markup, /class="product-img"[^>]*src="data:image\/png;base64,Zm90bw=="/);
  assert.match(markup, /<svg\b/);
  assert.match(markup, /Alimento &amp; cuidado/);
  assert.match(markup, /Bolsa &lt;sellada&gt;/);
  assert.ok(markup.includes(props().formatMoney(12500)));
  assert.match(markup, /Disponible/);
  assert.match(markup, /Sin stock/);
  assert.match(markup, /3 unidades · Publicado/);
  assert.match(markup, /0 unidades · Inactivo/);
});

test('los controles administrativos dependen del permiso recibido', async () => {
  const manage = await html();
  assert.match(manage, /\+ Nuevo producto/);
  assert.match(manage, /data-action="edit"[^>]*data-id="products:p1"/);
  assert.match(manage, /Desactivar/);
  assert.match(manage, /Activar/);
  const readOnly = await html({ canManage: false, products: [products[0]] });
  assert.doesNotMatch(readOnly, /data-action="(?:create|edit|toggle)"/);
  assert.match(readOnly, /Alimento &amp; cuidado/);
});

test('el catálogo vacío conserva el mensaje y solo muestra filtros cuando hay categorías', async () => {
  const markup = await html({ products: [], categories: [], canManage: false });
  assert.match(markup, /<p class="empty">No se encontraron productos\.<\/p>/);
  assert.doesNotMatch(markup, /<article|id="list-filter"/);
  const withCategories = await html({ products: [], categories: ['Accesorios'] });
  assert.match(withCategories, /id="list-filter"/);
  assert.match(withCategories, /<option value(?:="")?(?: selected)?>Todos<\/option>/);
  assert.match(withCategories, /Accesorios/);
});

// Host mínimo en memoria para ejecutar los eventos y actualizaciones de Vue.
// No simula el diseño, el foco ni el comportamiento nativo de un navegador.
function mount(values) {
  const node = (tag, text = '') => ({ tag, text, props: {}, children: [], parent: null });
  const remove = element => {
    if (element.parent) element.parent.children.splice(element.parent.children.indexOf(element), 1);
    element.parent = null;
  };
  const insert = (element, parent, anchor = null) => {
    remove(element);
    element.parent = parent;
    const index = anchor ? parent.children.indexOf(anchor) : parent.children.length;
    parent.children.splice(index, 0, element);
  };
  const renderer = createRenderer({
    createElement: tag => node(tag), createText: text => node('#text', text),
    createComment: text => node('#comment', text),
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
  const update = extra => renderer.render(h(CatalogView, props(extra)), root);
  update(values);
  return { root, find, update, unmount: () => renderer.render(null, root) };
}

test('los cambios de propiedades actualizan el catálogo sin reemplazar el campo de búsqueda', async () => {
  const view = mount({});
  const search = view.find(element => element.props.id === 'list-search');
  view.update({ query: 'correa', category: 'Accesorios', products: [products[1]] });
  await nextTick();
  assert.equal(view.find(element => element.props.id === 'list-search'), search);
  assert.equal(search.props.value, 'correa');
  assert.equal(view.find(element => element.props.id === 'list-filter').props.value, 'Accesorios');
  assert.equal(view.find(element => element.tag === 'article').children.find(element => element.tag === 'h2').text, 'Correa');
  view.unmount();
});

test('búsqueda, filtro y botones emiten una sola acción y frenan la delegación anterior', () => {
  const events = [];
  const view = mount({
    onSearch: value => events.push(['search', value]),
    onFilter: value => events.push(['filter', value]),
    onCreate: () => events.push(['create']),
    onEdit: id => events.push(['edit', id]),
    onToggle: id => events.push(['toggle', id])
  });
  let stopped = 0;
  const event = value => ({ target: { value }, stopPropagation() { stopped++; } });
  view.find(element => element.props.id === 'list-search').props.onInput(event('alimento'));
  view.find(element => element.props.id === 'list-filter').props.onChange(event('Nutrición'));
  view.find(element => element.props['data-action'] === 'create').props.onClick(event());
  view.find(element => element.props['data-action'] === 'edit' && element.props['data-id'] === 'products:p1').props.onClick(event());
  view.find(element => element.props['data-action'] === 'toggle' && element.props['data-id'] === 'products:p1').props.onClick(event());
  assert.deepEqual(events, [['search', 'alimento'], ['filter', 'Nutrición'], ['create'], ['edit', 'p1'], ['toggle', 'p1']]);
  assert.equal(stopped, 5);
  view.unmount();
});
