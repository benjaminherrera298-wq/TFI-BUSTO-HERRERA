<script setup>
import ScheduleTable from '../../components/schedules/ScheduleTable.vue';
import Pagination from '../../components/shared/Pagination.vue';

defineProps({
  clinicName: { type: String, required: true },
  rows: { type: Array, required: true },
  query: { type: String, default: '' },
  pageNumber: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
  totalRecords: { type: Number, default: 0 }
});
const emit = defineEmits(['action', 'search', 'page']);
</script>

<template>
  <div class="heading">
    <div>
      <div class="eyebrow">{{ clinicName }}</div>
      <h1>Horarios de atención</h1>
      <p>Disponibilidad habitual por profesional, servicio y día.</p>
    </div>
    <div class="row"><button type="button" class="primary" data-action="create" data-id="schedules" @click.stop="emit('action', 'create', 'schedules', $event.currentTarget)">+ Nueva franja</button></div>
  </div>
  <div class="hint">Estas franjas indican los horarios habituales de atención de cada profesional. Las notas y recordatorios personales se guardan desde Mi agenda. Los propietarios solo ven las franjas dentro de los días y horas de apertura de Configuración.</div>
  <section class="card">
    <div class="toolbar"><input id="list-search" aria-label="Buscar registros" placeholder="Buscar por nombre o datos..." :value="query" @input.stop="emit('search', $event.target.value)"></div>
    <ScheduleTable :rows="rows" @action="(action, id, element) => emit('action', action, id, element)" />
    <Pagination :page-number="pageNumber" :total-pages="totalPages" :total-records="totalRecords" @page="emit('page', $event)" />
  </section>
</template>
