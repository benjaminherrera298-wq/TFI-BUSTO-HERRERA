<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import ToastMessage from './components/ToastMessage.vue';
import { createScreenRenderer } from './services/screenRenderer';
import { startVeterinaryApplication } from './services/veterinaryApplication';

const container = ref(null);
const message = ref('');
const visible = ref(false);
const handlers = {};
const screens = createScreenRenderer();
let timer;
let stop;

function dispatch(type, event) { return handlers[type]?.(event); }
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
    setHtml: screens.setHtml,
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
  <div ref="container" @click="dispatch('click', $event)" @submit="dispatch('submit', $event)"
       @input="dispatch('input', $event)" @change="dispatch('change', $event)">
    <div id="app"></div>
    <dialog id="modal" aria-labelledby="modal-title"></dialog>
    <ToastMessage :message="message" :visible="visible" />
  </div>
</template>
