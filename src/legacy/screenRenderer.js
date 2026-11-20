import { h, render } from 'vue';

// Monta las vistas y desmonta sus regiones internas antes de reemplazar un padre.
export function createScreenRenderer() {
  const mounted = new Set();

  function prepareTarget(target) {
    if (!target) throw new Error('No se encontró el contenedor de la pantalla.');
    // Desmontamos de hijos a padres antes de retirar sus contenedores.
    for (const child of [...mounted].reverse()) {
      if (child !== target && target.contains(child)) {
        render(null, child);
        mounted.delete(child);
      }
    }
  }

  function clear(target) {
    prepareTarget(target);
    render(null, target);
    mounted.delete(target);
  }

  function setComponent(target, component, props) {
    prepareTarget(target);
    // Sin una clave nueva, las actualizaciones reutilizan la instancia del componente.
    render(h(component, props), target);
    mounted.add(target);
  }

  function dispose() {
    for (const target of [...mounted].reverse()) clear(target);
  }

  return { setComponent, clear, dispose };
}
