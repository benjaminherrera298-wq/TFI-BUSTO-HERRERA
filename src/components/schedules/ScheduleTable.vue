<script setup>
defineProps({ rows: { type: Array, required: true } });
const emit = defineEmits(['action']);
</script>

<template>
  <div v-if="rows.length" class="table-wrap">
    <table>
      <thead><tr><th>Profesional</th><th>Servicio</th><th>Día</th><th>Franja</th><th>Duración</th><th>Estado</th><th></th></tr></thead>
      <tbody>
        <tr v-for="row in rows" :key="row.schedule.id">
          <td>{{ row.vetName }}</td>
          <td>{{ row.serviceName }}</td>
          <td>{{ row.dayName }}</td>
          <td>{{ row.schedule.start }} – {{ row.schedule.end }}</td>
          <td>{{ row.schedule.duration }} min</td>
          <td><span :class="'badge ' + (row.status === 'Inactivo' ? 'pending' : '')">{{ row.status }}</span></td>
          <td><button type="button" class="small" data-action="edit" :data-id="'schedules:' + row.schedule.id"
                      @click.stop="emit('action', 'edit', 'schedules:' + row.schedule.id, $event.currentTarget)">Editar</button>{{ ' ' }}<button
                      type="button" class="small" data-action="toggle" :data-id="'schedules:' + row.schedule.id"
                      @click.stop="emit('action', 'toggle', 'schedules:' + row.schedule.id, $event.currentTarget)">{{ row.schedule.active ? 'Desactivar' : 'Activar' }}</button></td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-else class="empty">No hay registros para mostrar.</div>
</template>
