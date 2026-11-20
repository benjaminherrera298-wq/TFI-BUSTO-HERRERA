<script setup>
import RecordListLayout from '../../components/shared/RecordListLayout.vue';
import StatusBadge from '../../components/shared/StatusBadge.vue';

defineProps({ list: { type: Object, required: true }, rows: { type: Array, required: true }, canManage: Boolean });
const emit = defineEmits(['search', 'filter', 'page', 'action']);
</script>

<template>
  <RecordListLayout :list="list" @search="emit('search', $event)" @filter="emit('filter', $event)"
                    @page="emit('page', $event)" @action="(...args) => emit('action', ...args)">
    <div class="table-wrap"><table>
      <thead><tr><th>Nombre</th><th>DNI</th><th>Contacto</th><th>Mascotas</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody><tr v-for="row in rows" :key="row.owner.id">
        <td>{{ row.owner.name }}</td><td>{{ row.owner.dni }}</td>
        <td>{{ row.owner.phone }}<br><small>{{ row.owner.email }}</small></td>
        <td>{{ row.petCount }}</td><td><StatusBadge :status="row.owner.active ? 'Activo' : 'Inactivo'" /></td>
        <td><button type="button" class="small" data-action="owner" :data-id="row.owner.id"
                    @click.stop="emit('action', 'owner', row.owner.id)">Ver perfil</button>{{ ' ' }}<button
                    type="button" class="small" data-action="edit" :data-id="'owners:' + row.owner.id"
                    @click.stop="emit('action', 'edit', 'owners:' + row.owner.id)">Editar</button><template v-if="canManage">{{ ' ' }}<button
                    type="button" class="small" data-action="toggle" :data-id="'owners:' + row.owner.id"
                    @click.stop="emit('action', 'toggle', 'owners:' + row.owner.id)">{{ row.owner.active ? 'Desactivar' : 'Activar' }}</button></template></td>
      </tr></tbody>
    </table></div>
  </RecordListLayout>
</template>
