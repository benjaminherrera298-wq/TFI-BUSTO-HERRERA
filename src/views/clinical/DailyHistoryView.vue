<script setup>
import StatusBadge from '../../components/shared/StatusBadge.vue';
defineProps({ clinicName: String, allowed: Boolean, isSuperadmin: Boolean, rows: { type: Array, default: () => [] } });
const emit = defineEmits(['action']);
</script>

<template>
  <div class="heading"><div><div class="eyebrow">{{ clinicName }}</div><h1>Historia clínica del día</h1><p>{{ !allowed ? 'Esta sección es exclusiva del panel del veterinario.' : isSuperadmin ? 'Todas las atenciones de hoy, de todos los profesionales. Podés editar cualquiera si hace falta corregirla.' : 'Pacientes que atendiste hoy. Podés editar la información si hace falta corregirla.' }}</p></div><div class="row"></div></div>
  <template v-if="allowed">
    <article v-for="row in rows" :key="row.record.id" class="card">
      <div class="row between"><h2>{{ row.pet?.name || 'Mascota' }}</h2><StatusBadge v-if="row.ticket" :status="row.ticket.status" /></div>
      <p class="muted">Propietario: {{ row.ownerName }} · Hora: {{ row.record.time || '—' }}</p>
      <p><small>Motivo de consulta:</small> {{ row.record.reason || '—' }}</p>
      <p><small>Atención realizada:</small> {{ row.record.performed || '—' }}</p>
      <p v-if="row.medications.length"><small>Medicamentos:</small> {{ row.medications.map(medication => medication.name).join(', ') }}</p>
      <div class="row">
        <button v-if="row.pet" type="button" class="small" data-action="pet" :data-id="row.pet.id" @click.stop="emit('action', 'pet', row.pet.id, $event.currentTarget)">Ver mascota</button>
        <button type="button" class="small" data-action="vet-edit-attention" :data-id="row.record.id" @click.stop="emit('action', 'vet-edit-attention', row.record.id, $event.currentTarget)">Editar</button>
      </div>
    </article>
    <div v-if="!rows.length" class="empty">Todavía no atendiste pacientes hoy.</div>
  </template>
</template>
