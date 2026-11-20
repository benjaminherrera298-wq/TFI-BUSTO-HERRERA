<script setup>
defineProps({
  message: String, prefix: String, boldText: String, suffix: String, description: String,
  backLabel: { type: String, default: 'Volver' },
  confirmLabel: String, confirmAction: String, confirmId: { type: String, default: '' },
  confirmClass: { type: String, default: 'primary' }
});
const emit = defineEmits(['action']);
</script>
<template>
  <p v-if="boldText">{{ prefix }}<b>{{ boldText }}</b>{{ suffix }}</p>
  <p v-else>{{ message }}</p>
  <p v-if="description" class="muted">{{ description }}</p>
  <div class="form-actions">
    <button type="button" class="" data-action="close" data-id="" @click.stop="emit('action', 'close', '')">{{ backLabel }}</button>
    <button type="button" :class="confirmClass" :data-action="confirmAction" :data-id="confirmId"
            @click.stop="emit('action', confirmAction, confirmId)">{{ confirmLabel }}</button>
  </div>
</template>
