<script setup>
defineProps({ title: String, bodyComponent: Object, bodyProps: Object });
const emit = defineEmits(['action']);
</script>
<template>
  <div class="modal-head">
    <h2 id="modal-title">{{ title }}</h2>
    <button type="button" class="ghost" data-action="close" data-id="" @click.stop="emit('action', 'close', '')">✕</button>
  </div>
  <component :is="bodyComponent" v-bind="bodyProps" />
</template>
