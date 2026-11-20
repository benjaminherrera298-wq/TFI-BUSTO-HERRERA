<script setup>
defineProps({ medication: { type: Object, required: true } });
const emit = defineEmits(['change', 'remove']);
function update(name, value) { emit('change', { [name]: value }); }
</script>

<template>
  <div class="owner-box full med-row">
    <div class="form-grid">
      <label class="field">Nombre<input name="med-name[]" type="text" :value="medication.name || ''" @input="update('name', $event.target.value)"></label>
      <label class="field">Dosis<input name="med-dose[]" type="text" :value="medication.dose || ''" @input="update('dose', $event.target.value)"></label>
      <label class="field">Cantidad<input name="med-quantity[]" type="number" :value="medication.quantity || ''" min="1" max="1000000" step="1" inputmode="numeric" @input="update('quantity', $event.target.value)"></label>
      <label class="field">Vía de administración<input name="med-route[]" type="text" :value="medication.route || ''" @input="update('route', $event.target.value)"></label>
      <label class="field full">Observaciones<textarea name="med-notes[]" :value="medication.notes || ''" @input="update('notes', $event.target.value)"></textarea></label>
    </div>
    <button type="button" class="small danger" data-action="vet-remove-med" data-id="" @click.stop="emit('remove')">Quitar medicamento</button>
  </div>
</template>
