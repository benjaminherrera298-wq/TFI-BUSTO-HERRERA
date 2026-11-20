<script setup>
import RecordListLayout from '../../components/shared/RecordListLayout.vue';
import StatusBadge from '../../components/shared/StatusBadge.vue';

defineProps({ list: { type: Object, required: true }, rows: { type: Array, required: true }, editable: Boolean });
const emit = defineEmits(['search', 'filter', 'page', 'action']);
</script>

<template>
  <RecordListLayout :list="list" @search="emit('search', $event)" @filter="emit('filter', $event)"
                    @page="emit('page', $event)" @action="(...args) => emit('action', ...args)">
    <div class="table-wrap"><table>
      <thead><tr><th>Servicio</th><th>Duración</th><th>Profesionales</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody><tr v-for="row in rows" :key="row.service.id">
        <td>{{ row.service.name }}</td><td>{{ row.service.duration }} min</td><td><div class="wrap">{{ row.vetNames.join(', ') || 'Sin asignar' }}</div></td>
        <td><StatusBadge :status="row.service.active ? 'Activo' : 'Inactivo'" /></td>
        <td><template v-if="editable"><button type="button" class="small" data-action="edit" :data-id="'services:' + row.service.id"
                    @click.stop="emit('action', 'edit', 'services:' + row.service.id)">Editar / asignar</button>{{ ' ' }}<button
                    type="button" class="small" data-action="toggle" :data-id="'services:' + row.service.id"
                    @click.stop="emit('action', 'toggle', 'services:' + row.service.id)">{{ row.service.active ? 'Desactivar' : 'Activar' }}</button></template><template v-else>{{ row.service.description }}</template></td>
      </tr></tbody>
    </table></div>
  </RecordListLayout>
</template>
