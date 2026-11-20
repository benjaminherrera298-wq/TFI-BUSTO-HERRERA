<script setup>
defineProps({
  current: { type: Object, default: null },
  pets: { type: Array, required: true },
  categories: { type: Array, required: true },
  selectedCategory: { type: String, required: true },
  date: { type: String, required: true },
  reminderId: { type: String, default: '' }
});
const emit = defineEmits(['action']);
</script>

<template>
  <div class="hint">Anotá cuándo te toca una pipeta, desparasitación, vacuna u otro cuidado. Los que indique tu veterinario aparecen solos en el calendario.</div>
  <br>
  <form data-form="owner-reminder" :data-id="reminderId">
    <div class="form-grid">
      <label class="field">
        Mascota
        <select name="petId" required :value="current?.petId || pets[0]?.id">
          <option v-for="pet in pets" :key="pet.id" :value="pet.id" :selected="String(pet.id) === String(current?.petId || pets[0]?.id)">{{ pet.name }}</option>
        </select>
      </label>
      <label class="field">
        Tipo de cuidado
        <select name="category" :value="selectedCategory"><option v-for="category in categories" :key="category" :value="category" :selected="category === selectedCategory">{{ category }}</option></select>
      </label>
      <label class="field">Fecha<input name="date" type="date" :value="date" required></label>
      <label class="field">Detalle (opcional)<input name="title" type="text" :value="current?.title || ''" maxlength="80" placeholder="Ej: segunda dosis"></label>
      <label class="field full">Nota (opcional)<textarea name="note" maxlength="240">{{ current?.note || '' }}</textarea></label>
    </div>
    <div data-form-error class="error" role="alert"></div>
    <div class="form-actions">
      <button type="button" class="" data-action="close" data-id="" @click.stop="emit('action', 'close', '', $event.currentTarget)">Cancelar</button>
      <button class="primary" type="submit">Guardar</button>
    </div>
  </form>
</template>
