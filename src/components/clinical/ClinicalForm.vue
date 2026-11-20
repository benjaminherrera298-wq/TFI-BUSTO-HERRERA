<script setup>
import { reactive } from 'vue';
const props = defineProps({
  pet: { type: Object, required: true },
  responsibleName: String,
  administrative: Boolean,
  today: { type: String, required: true },
  categories: { type: Array, required: true }
});
const emit = defineEmits(['action']);
const values = reactive({ type: 'Consulta', date: props.today, title: '', weight: props.pet.weight ?? '', diagnosis: '', info: '', nextDate: '', nextCategory: '', visible: 'true' });
</script>

<template>
  <div class="hint">Responsable: <b>{{ responsibleName }}</b>. Se registra automáticamente con tu cuenta {{ administrative ? ' administrativa' : '' }}.</div>
  <br>
  <form data-form="clinical" :data-id="pet.id">
    <div class="form-grid">
      <label class="field">Tipo de registro<select v-model="values.type" name="type"><option v-for="type in ['Consulta', 'Vacuna', 'Tratamiento', 'Desparasitación', 'Pipeta', 'Operación', 'Estudio']" :key="type" :value="type">{{ type }}</option></select></label>
      <label class="field">Fecha<input v-model="values.date" name="date" type="date" required :max="today"></label>
      <label class="field">Título / procedimiento<input v-model="values.title" name="title" type="text" required></label>
      <label class="field">Peso (kg)<input v-model="values.weight" name="weight" type="number" min="0.01" step="0.01" max="100000"></label>
      <label class="field">Diagnóstico / resultado<input v-model="values.diagnosis" name="diagnosis" type="text"></label>
      <label class="field full">Información clínica y observaciones<textarea v-model="values.info" name="info"></textarea></label>
      <label class="field">Próximo cuidado (se carga en el calendario del propietario)<input v-model="values.nextDate" name="nextDate" type="date" :min="today"></label>
      <label class="field">Tipo del próximo cuidado<select v-model="values.nextCategory" name="nextCategory"><option value="">Automático según el tipo de registro</option><option v-for="category in categories" :key="category" :value="category">{{ category }}</option></select></label>
      <label class="field">Visibilidad<select v-model="values.visible" name="visible"><option value="true">Compartir con propietario</option><option value="false">Nota interna</option></select></label>
    </div>
    <div data-form-error class="error" role="alert"></div>
    <div class="form-actions"><button type="button" class="" data-action="close" data-id="" @click.stop="emit('action', 'close', '', $event.currentTarget)">Cancelar</button><button class="primary" type="submit">Guardar</button></div>
  </form>
</template>
