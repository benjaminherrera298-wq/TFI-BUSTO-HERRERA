import test from 'node:test';
import assert from 'node:assert/strict';

// Este DOM mínimo permite probar el ciclo de vida con el renderizador de Vue.
// No representa un navegador: no comprueba CSS, foco ni interpreta HTML.
class MemoryNode {
  constructor(nodeType = 1, nodeValue = '') {
    this.nodeType = nodeType;
    this.nodeValue = nodeValue;
    this.childNodes = [];
    this.parentNode = null;
  }
  get firstChild() { return this.childNodes[0] ?? null; }
  get nextSibling() {
    return this.parentNode?.childNodes[this.parentNode.childNodes.indexOf(this) + 1] ?? null;
  }
  get textContent() {
    return this.nodeType === 1 ? this.childNodes.map(child => child.textContent).join('') : this.nodeValue;
  }
  set textContent(value) {
    for (const child of [...this.childNodes]) this.removeChild(child);
    if (value) this.insertBefore(new MemoryNode(3, String(value)), null);
  }
  insertBefore(child, anchor) {
    child.parentNode?.removeChild(child);
    const index = anchor ? this.childNodes.indexOf(anchor) : this.childNodes.length;
    assert.ok(index >= 0, 'El punto de inserción debe pertenecer al padre.');
    this.childNodes.splice(index, 0, child);
    child.parentNode = this;
  }
  removeChild(child) {
    const index = this.childNodes.indexOf(child);
    assert.ok(index >= 0, 'Solo se pueden retirar hijos del contenedor.');
    this.childNodes.splice(index, 1);
    child.parentNode = null;
    child.onRemove?.();
  }
  contains(child) {
    return this === child || this.childNodes.some(node => node.contains(child));
  }
}

test('el adaptador actualiza una instancia y la desmonta antes de reemplazar su padre', async t => {
  const previousDocument = globalThis.document;
  const previousNode = globalThis.Node;
  globalThis.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
  globalThis.document = {
    createElement: () => new MemoryNode(),
    createTextNode: text => new MemoryNode(3, text),
    createComment: text => new MemoryNode(8, text)
  };
  t.after(() => {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
    if (previousNode === undefined) delete globalThis.Node;
    else globalThis.Node = previousNode;
  });

  // La importación debe ocurrir después de instalar el documento de prueba.
  const { h, onUnmounted } = await import('vue');
  const { createScreenRenderer } = await import('../src/legacy/screenRenderer.js');
  const screens = createScreenRenderer();
  t.after(() => screens.dispose());
  const events = [];
  let mounts = 0;
  const Child = {
    props: ['label'],
    setup(props) {
      mounts++;
      onUnmounted(() => events.push('desmontar hijo'));
      return () => h('p', props.label);
    }
  };
  const parent = new MemoryNode();
  screens.setComponent(parent, { setup: () => () => h('div') }, {});
  const target = parent.firstChild;
  target.onRemove = () => events.push('retirar contenedor');
  screens.setComponent(target, Child, { label: 'Primero' });
  const paragraph = target.firstChild;
  screens.setComponent(target, Child, { label: 'Actualizado' });
  assert.equal(mounts, 1);
  assert.equal(target.firstChild, paragraph);
  assert.equal(paragraph.textContent, 'Actualizado');

  screens.clear(parent);
  assert.deepEqual(events, ['desmontar hijo', 'retirar contenedor']);
  assert.equal(target.firstChild, null);

  const other = new MemoryNode();
  screens.setComponent(other, Child, { label: 'Otra vista' });
  screens.dispose();
  assert.equal(other.firstChild, null);
  assert.equal(parent.childNodes.length, 0);
  assert.equal(events.filter(event => event === 'desmontar hijo').length, 2);
  screens.dispose();
  assert.equal(events.filter(event => event === 'desmontar hijo').length, 2);

  // Configuración agrega un tercer nivel: app → content → settings-notices.
  const nested = createScreenRenderer();
  t.after(() => nested.dispose());
  const nestedEvents = [];
  const app = new MemoryNode();
  nested.setComponent(app, { setup: () => () => h('main') }, {});
  const content = app.firstChild;
  nested.setComponent(content, { setup: () => () => h('section') }, {});
  const notices = content.firstChild;
  notices.onRemove = () => nestedEvents.push('retirar host de avisos');
  content.onRemove = () => nestedEvents.push('retirar content');
  nested.setComponent(notices, {
    setup() {
      onUnmounted(() => nestedEvents.push('desmontar avisos'));
      return () => h('p', 'Avisos de prueba');
    }
  }, {});
  nested.clear(app);
  assert.deepEqual(nestedEvents, ['desmontar avisos', 'retirar host de avisos', 'retirar content']);
  assert.equal(notices.firstChild, null);
  nested.dispose();
  assert.equal(app.childNodes.length, 0);
  assert.equal(nestedEvents.filter(event => event === 'desmontar avisos').length, 1);
});
