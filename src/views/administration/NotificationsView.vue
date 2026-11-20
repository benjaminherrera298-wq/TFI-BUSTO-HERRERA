<script setup>
import StatusBadge from '../../components/shared/StatusBadge.vue';

defineProps({ clinicName: String, rows: { type: Array, default: () => [] } });
const emit = defineEmits(['action']);
</script>

<template>
  <div class="heading">
    <div><div class="eyebrow">{{ clinicName }}</div><h1>Notificaciones</h1><p>Eventos y actualizaciones de tu actividad.</p></div>
    <div class="row"><button type="button" class="" data-action="read-all" data-id="" @click.stop="emit('action', 'read-all', '')">Marcar todas como leídas</button></div>
  </div>
  <article v-for="row in rows" :key="row.notification.id" class="card notification">
    <div class="row between">
      <div><p>{{ row.notification.message }}</p><small>{{ row.date }}</small></div>
      <StatusBadge v-if="row.read" status="Leída" />
      <button v-else type="button" class="small" data-action="read" :data-id="row.notification.id"
              @click.stop="emit('action', 'read', row.notification.id)">Marcar como leída</button>
    </div>
  </article>
</template>
