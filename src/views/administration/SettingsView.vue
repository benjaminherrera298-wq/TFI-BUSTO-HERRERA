<script setup>
import ClinicFields from '../../components/forms/ClinicFields.vue';

defineProps({ clinicName: String, config: { type: Object, required: true } });
const emit = defineEmits(['action']);
</script>

<template>
  <div class="heading">
    <div><div class="eyebrow">{{ clinicName }}</div><h1>Configuración</h1><p>Los datos de tu veterinaria se reutilizan en todo el sistema.</p></div>
    <div class="row"></div>
  </div>
  <section class="card">
    <form data-form="settings" data-id="">
      <div class="form-grid"><ClinicFields :config="config" /></div>
      <div data-form-error class="error" role="alert"></div>
      <div class="form-actions">
        <button type="button" class="" data-action="close" data-id="" @click.stop="emit('action', 'close', '')">Cancelar</button>
        <button class="primary" type="submit">Guardar</button>
      </div>
    </form>
  </section>
  <section id="settings-notices" aria-label="Avisos de la veterinaria"></section>
</template>
