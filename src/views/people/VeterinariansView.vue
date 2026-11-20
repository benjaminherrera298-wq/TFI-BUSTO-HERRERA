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
      <thead><tr><th>Profesional</th><th>Matrícula / especialidad</th><th>Servicios</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody><tr v-for="row in rows" :key="row.vet.id">
        <td>{{ row.vet.name }}</td><td>{{ row.vet.license }}<br><small>{{ row.vet.specialty }}</small></td>
        <td><div class="wrap">{{ row.serviceNames.join(', ') }}</div></td><td><StatusBadge :status="row.vet.active ? 'Activo' : 'Inactivo'" /></td>
        <td><button type="button" class="small" data-action="vet" :data-id="row.vet.id"
                    @click.stop="emit('action', 'vet', row.vet.id)">Perfil</button>{{ ' ' }}<button
                    type="button" class="small" data-action="edit" :data-id="'vets:' + row.vet.id"
                    @click.stop="emit('action', 'edit', 'vets:' + row.vet.id)">Editar</button>{{ ' ' }}<button
                    type="button" class="small" data-action="toggle" :data-id="'vets:' + row.vet.id"
                    @click.stop="emit('action', 'toggle', 'vets:' + row.vet.id)">{{ row.vet.active ? 'Desactivar' : 'Activar' }}</button><template v-if="row.accountId">{{ ' ' }}<button
                    type="button" class="small" data-action="reset-password" :data-id="row.accountId"
                    @click.stop="emit('action', 'reset-password', row.accountId)">Cambiar contraseña</button></template></td>
      </tr></tbody>
    </table></div>
  </RecordListLayout>
</template>
