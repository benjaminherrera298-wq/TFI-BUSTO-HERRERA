import { createRenderer, h } from 'vue';

export function mountVueComponent(Component, values) {
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
  const update = extra => renderer.render(h(Component, extra), root);
  update(values);
  return { root, find, update, unmount: () => renderer.render(null, root) };
}
