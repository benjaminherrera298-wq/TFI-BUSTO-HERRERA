<script setup>
import RecordListLayout from '../../components/shared/RecordListLayout.vue';
import StatusBadge from '../../components/shared/StatusBadge.vue';

defineProps({ list: { type: Object, required: true }, rows: { type: Array, required: true } });
const emit = defineEmits(['search', 'filter', 'page', 'action']);
</script>

<template>
  <RecordListLayout :list="list" @search="emit('search', $event)" @filter="emit('filter', $event)"
                    @page="emit('page', $event)" @action="(...args) => emit('action', ...args)">
    <div class="table-wrap"><table>
      <thead><tr><th>Nombre</th><th>Usuario / correo</th><th>Rol</th><th>Último acceso</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody><tr v-for="row in rows" :key="row.account.id">
        <td>{{ row.account.name }}</td><td>{{ row.account.email }}<template v-if="row.account.phone"><br><small>{{ row.account.phone }}</small></template></td>
        <td>{{ row.roleName }}</td><td>{{ row.lastAccess }}</td><td><StatusBadge :status="row.account.active ? 'Activo' : 'Inactivo'" /></td>
        <td><button type="button" class="small" data-action="edit" :data-id="'users:' + row.account.id"
                    @click.stop="emit('action', 'edit', 'users:' + row.account.id)">Editar</button>{{ ' ' }}<button
                    type="button" class="small" data-action="reset-password" :data-id="row.account.id"
                    @click.stop="emit('action', 'reset-password', row.account.id)">Restablecer</button><template v-if="!row.isCurrent">{{ ' ' }}<button
                    type="button" class="small" data-action="toggle" :data-id="'users:' + row.account.id"
                    @click.stop="emit('action', 'toggle', 'users:' + row.account.id)">{{ row.account.active ? 'Desactivar' : 'Activar' }}</button></template></td>
      </tr></tbody>
    </table></div>
  </RecordListLayout>
</template>
