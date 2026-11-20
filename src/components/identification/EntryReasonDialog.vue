<script setup>
import { ref } from 'vue';

const props = defineProps({ entry: { type: Object, required: true }, pet: Object, entryTime: String });
const emit = defineEmits(['action']);
const reason = ref(props.entry.reason || '');
</script>

<template>
  <p class="muted">{{ pet?.species || '' }} {{ pet?.breed || '' }} · Ingreso: {{ entryTime }} · Estado: {{ entry.status }}</p>
  <form data-form="admin-entry-reason" :data-id="entry.id">
    <label class="field full">Motivo de consulta (lo verá el veterinario al atender)<textarea v-model="reason" name="reason"></textarea></label>
    <div data-form-error class="error" role="alert"></div>
    <div class="form-actions">
      <button type="button" class="" data-action="close" data-id="" @click.stop="emit('action', 'close', '')">Cancelar</button>
      <button class="primary" type="submit">Guardar motivo</button>
    </div>
  </form>
</template>
