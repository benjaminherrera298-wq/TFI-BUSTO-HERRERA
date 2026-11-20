<script setup>
defineProps({
  entry: { type: Object, default: null },
  date: { type: String, required: true },
  entryId: { type: String, default: '' }
});
const emit = defineEmits(['action']);
</script>

<template>
  <p class="muted">Guardá una operación, un pendiente o algo que quieras recordar en tu agenda personal.</p>
  <form data-form="agenda-note" :data-id="entryId">
    <div class="form-grid">
      <label class="field">Título<input name="title" type="text" :value="entry?.title || ''" required maxlength="160" placeholder="Ej.: Operación de Luna"></label>
      <label class="field">Fecha<input name="date" type="date" :value="entry?.date || date" required min="1000-01-01" max="9999-12-31"></label>
      <label class="field">Hora (opcional)<input name="time" type="time" :value="entry?.time || ''"></label>
      <label class="field full">Notas<textarea name="note">{{ entry?.note || '' }}</textarea></label>
    </div>
    <div data-form-error class="error" role="alert"></div>
    <div class="form-actions">
      <button type="button" class="" data-action="close" data-id="" @click.stop="emit('action', 'close', '', $event.currentTarget)">Cancelar</button>
      <button class="primary" type="submit">Guardar</button>
    </div>
  </form>
</template>
