import { Fragment, h, render } from 'vue';

// Los generadores de las pantallas existentes producen HTML escapado.
// Este adaptador lo convierte en nodos de Vue, sin usar v-html.
export function createScreenRenderer() {
  const mounted = new Set();

  function toVNode(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const props = {};
    for (const attribute of node.attributes) {
      if (/^on/i.test(attribute.name)) {
        // Único evento inline original: cantidades enteras de medicamentos.
        if (attribute.name === 'oninput' && node.name === 'tmed-quantity[]') {
          props.onInput = event => {
            event.target.value = event.target.value.replace(/[^0-9]/g, '');
          };
        }
      } else {
        props[attribute.name] = attribute.value;
      }
    }
    return h(node.localName, props, [...node.childNodes].map(toVNode).filter(v => v !== null));
  }

  function setHtml(target, html) {
    if (!target) throw new Error('No se encontró el contenedor de la pantalla.');
    // Las pantallas pueden contener regiones renderizadas independientemente.
    for (const child of [...mounted]) {
      if (child !== target && target.contains(child)) {
        render(null, child);
        mounted.delete(child);
      }
    }
    const template = document.createElement('template');
    template.innerHTML = String(html);
    const nodes = [...template.content.childNodes].map(toVNode).filter(v => v !== null);
    // Render síncrono: el módulo de negocio consulta formularios inmediatamente.
    render(h(Fragment, { key: Symbol('screen') }, nodes), target);
    mounted.add(target);
  }

  function dispose() {
    for (const target of [...mounted].reverse()) render(null, target);
    mounted.clear();
  }

  return { setHtml, dispose };
}
