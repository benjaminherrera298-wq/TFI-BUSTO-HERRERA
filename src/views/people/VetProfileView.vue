<script setup>
import ScheduleTable from '../../components/schedules/ScheduleTable.vue';

defineProps({
  clinicName: { type: String, default: '' },
  vet: Object,
  restricted: Boolean,
  serviceNames: { type: Array, default: () => [] },
  schedule: { type: Object, default: () => ({ rows: [] }) }
});
const emit = defineEmits(['action']);
</script>

<template>
  <p v-if="restricted">Acceso restringido.</p>
  <p v-else-if="!vet">Profesional no disponible.</p>
  <template v-else>
    <div class="heading">
      <div><div class="eyebrow">{{ clinicName }}</div><h1>{{ vet.name }}</h1><p>{{ vet.license }} · {{ vet.specialty }}</p></div>
      <div class="row"><button type="button" class="" data-action="edit" :data-id="'vets:' + vet.id"
                               @click.stop="emit('action', 'edit', 'vets:' + vet.id)">Editar / asignar servicios</button></div>
    </div>
    <section class="card">
      <h2>Servicios y disponibilidad</h2>
      <p>{{ serviceNames.join(' · ') }}</p>
      <button type="button" class="" data-action="nav" data-id="schedules" @click.stop="emit('action', 'nav', 'schedules')">Configurar horarios</button>
      <ScheduleTable v-bind="schedule" @action="(...args) => emit('action', ...args)" />
    </section>
  </template>
</template>
