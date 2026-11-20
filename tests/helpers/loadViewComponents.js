import { readFile } from 'node:fs/promises';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { loadVueComponent } from './loadVueComponent.js';

let components;

// Resuelve el mismo registro explícito de vistas que utiliza App.vue.
export async function loadViewComponents() {
  if (!components) {
    components = (async () => {
      const registryUrl = new URL('../../src/views/viewComponents.js', import.meta.url);
      const source = await readFile(registryUrl, 'utf8');
      const result = {};
      for (const [, name, relativePath] of source.matchAll(/import\s+(\w+)\s+from\s+['"]([^'"]+\.vue)['"]/g)) {
        result[name] = await loadVueComponent(new URL(relativePath, registryUrl));
      }
      return result;
    })();
  }
  return components;
}

export async function renderApplicationView(name, props = {}) {
  const registry = await loadViewComponents();
  const Component = registry[name];
  if (!Component) throw new Error('Vista no registrada en la aplicación: ' + name);
  let normalizedProps = props;
  if (name === 'ModalFrame') {
    const { body, ...frameProps } = props;
    normalizedProps = { ...frameProps, bodyComponent: registry[body.view], bodyProps: body.props };
  }
  if (name === 'ModalFrame' && !normalizedProps.bodyComponent) {
    throw new Error('Contenido de diálogo no registrado: ' + props.body.view);
  }
  return renderToString(createSSRApp(Component, normalizedProps));
}

// Las operaciones reales son síncronas al montar Vue en el navegador.
// En SSR el arnés espera también el HTML de las vistas que esas operaciones abren.
export function withViewRendering(props, rendered) {
  return Object.fromEntries(Object.entries(props).map(([name, value]) => [name,
    /^on[A-Z]/.test(name) && typeof value === 'function'
      ? async (...args) => { const result = await value(...args); await rendered(); return result; }
      : value
  ]));
}
