<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import ToastMessage from './components/shared/ToastMessage.vue';
import { viewComponents } from './views/viewComponents.js';
import { createScreenRenderer } from './legacy/screenRenderer';
import { startVeterinaryApplication } from './legacy/veterinaryApplication';

const container = ref(null);
const message = ref('');
const visible = ref(false);
const handlers = {};
const screens = createScreenRenderer();
let timer;
let stop;

function dispatch(type, event) { return handlers[type]?.(event); }
function showView(target, name, props) {
  const component = viewComponents[name];
  if (!component) throw new Error('No existe la vista ' + name);
  const { body, ...frameProps } = props;
  const values = name === 'ModalFrame'
    ? { ...frameProps, bodyComponent: viewComponents[body.view], bodyProps: body.props }
    : props;
  screens.setComponent(target, component, values);
}
function notify(text) {
  message.value = String(text);
  visible.value = true;
  clearTimeout(timer);
  timer = setTimeout(() => { visible.value = false; }, 4200);
}

onMounted(() => {
  const roles = { admin: 'admin', veterinario: 'vet', propietario: 'owner', superadmin: 'superadmin' };
  const requestedRole = new URLSearchParams(location.search).get('rol');
  stop = startVeterinaryApplication({
    root: container.value,
    lockedRole: roles[requestedRole] ?? null,
    showView,
    showCatalog: (target, props) => showView(target, 'CatalogView', props),
    showNotices: (target, props) => showView(target, 'NoticesView', props),
    showPets: (target, props) => showView(target, 'PetsView', props),
    notify,
    on: (type, handler) => { handlers[type] = handler; }
  });
});

onBeforeUnmount(() => {
  stop?.();
  clearTimeout(timer);
  screens.dispose();
});
</script>

<template>
  <div ref="container" class="application-root" @click="dispatch('click', $event)" @submit="dispatch('submit', $event)"
       @input="dispatch('input', $event)" @change="dispatch('change', $event)">
    <div id="app"></div>
    <dialog id="modal" aria-labelledby="modal-title"></dialog>
    <ToastMessage :message="message" :visible="visible" />
  </div>
</template>
