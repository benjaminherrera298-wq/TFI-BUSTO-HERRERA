<script setup>
defineProps({ list: { type: Object, required: true } });
const emit = defineEmits(['search', 'filter', 'page', 'action']);
</script>

<template>
  <div class="heading">
    <div><div class="eyebrow">{{ list.clinicName }}</div><h1>{{ list.title }}</h1><p>{{ list.subtitle }}</p></div>
    <div class="row"><button v-if="list.canCreate" type="button" class="primary" data-action="create" :data-id="list.collection"
                             @click.stop="emit('action', 'create', list.collection)">+ Agregar</button></div>
  </div>
  <section class="card">
    <div class="toolbar">
      <input id="list-search" aria-label="Buscar registros" placeholder="Buscar por nombre o datos..." :value="list.query"
             @input.stop="emit('search', $event.target.value)">
      <select id="list-filter" aria-label="Filtrar" :value="list.statusFilter" @change.stop="emit('filter', $event.target.value)">
        <option value="">Todos</option><option value="Activo">Activo</option><option value="Inactivo">Inactivo</option>
      </select>
    </div>
    <slot v-if="list.totalRecords" />
    <div v-else class="empty">No hay registros para mostrar.</div>
    <div class="pagination">
      <small>{{ list.totalRecords }} registros · Página {{ list.pageNumber }} de {{ list.totalPages }}</small>
      <div class="row">
        <button type="button" class="small" data-action="page" :data-id="Math.max(1, list.pageNumber - 1)"
                @click.stop="emit('page', Math.max(1, list.pageNumber - 1))">←</button>
        <button type="button" class="small" data-action="page" :data-id="Math.min(list.totalPages, list.pageNumber + 1)"
                @click.stop="emit('page', Math.min(list.totalPages, list.pageNumber + 1))">→</button>
      </div>
    </div>
  </section>
</template>
