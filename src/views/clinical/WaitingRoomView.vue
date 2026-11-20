<script setup>
import AppIcon from '../../components/shared/AppIcon.vue';
import StatusBadge from '../../components/shared/StatusBadge.vue';

defineProps({
  clinicName: { type: String, required: true },
  active: { type: Array, required: true },
  paid: { type: Array, required: true },
  totalEntries: { type: Number, required: true },
  isSuperadmin: Boolean,
  formatDate: { type: Function, required: true },
  formatMoney: { type: Function, required: true }
});
const emit = defineEmits(['action']);
</script>

<template>
  <div class="heading">
    <div><div class="eyebrow">{{ clinicName }}</div><h1>Sala de espera</h1><p>Mascotas ingresadas mediante escaneo de QR o código de 5 dígitos, a la espera de ser atendidas.</p></div>
    <div class="row">
      <button type="button" class="scan-btn" data-action="admin-scan" data-id="" @click.stop="emit('action', 'admin-scan', '', $event.currentTarget)"><AppIcon name="qr" /> Escanear / Código</button>
      <button v-if="paid.length" type="button" class="small danger" data-action="admin-clear-paid" data-id="" @click.stop="emit('action', 'admin-clear-paid', '', $event.currentTarget)">Quitar finalizados</button>
    </div>
  </div>
  <template v-if="totalEntries">
    <div class="grid">
      <article v-for="row in active" :key="row.entry.id" class="card waiting-card">
        <div class="row between"><h2>{{ row.entry.petName }}</h2><StatusBadge :status="row.entry.status" /></div>
        <p v-if="row.pet">{{ row.pet.species }} · {{ row.pet.breed }}</p>
        <p class="muted">Propietario: {{ row.ownerName }}<br>Ingreso: {{ row.time }}<template v-if="row.entry.vetName"><br>Veterinario: {{ row.entry.vetName }}</template></p>
        <p><small>Motivo informado:</small> {{ row.entry.reason || '—' }}</p>
        <div v-if="row.ticket" class="owner-box">
          <h3>{{ 'Ticket ' + row.ticket.number + ' · ' + formatDate(row.ticket.date) + (row.ticket.time ? ' · ' + row.ticket.time : '') }}</h3>
          <p><small>Veterinario:</small> {{ row.ticket.vetName || 'No disponible' }}</p>
          <p><small>Motivo:</small> {{ row.ticket.reason }}</p>
          <p><small>Atención realizada:</small> {{ row.ticket.performed }}</p>
          <p v-if="row.medications.length"><small>Medicamentos:</small> {{ row.medications.map(medication => medication.name).join(', ') }}</p>
          <p><small>Monto a pagar:</small> <b>{{ row.ticket.total > 0 ? formatMoney(row.ticket.total) : 'A definir' }}</b></p>
        </div>
        <div class="row">
          <button v-if="row.pet" type="button" class="small" data-action="pet" :data-id="row.pet.id" @click.stop="emit('action', 'pet', row.pet.id, $event.currentTarget)">Ver mascota</button>
          <template v-if="row.entry.status === 'Esperando'"><button type="button" class="small" data-action="admin-edit-reason" :data-id="row.entry.id" @click.stop="emit('action', 'admin-edit-reason', row.entry.id, $event.currentTarget)">{{ row.entry.reason ? 'Editar motivo' : 'Cargar motivo' }}</button>{{ ' ' }}<button type="button" class="small danger" data-action="admin-cancel-entry" :data-id="row.entry.id" @click.stop="emit('action', 'admin-cancel-entry', row.entry.id, $event.currentTarget)">Cancelar ingreso</button></template>
          <button v-if="row.entry.status === 'En atención'" type="button" class="small" data-action="admin-release-entry" :data-id="row.entry.id" @click.stop="emit('action', 'admin-release-entry', row.entry.id, $event.currentTarget)">Volver a espera</button>
          <button v-if="row.entry.status === 'Pendiente de cobro' && row.ticket" type="button" class="small primary" data-action="admin-charge" :data-id="row.ticket.id" @click.stop="emit('action', 'admin-charge', row.ticket.id, $event.currentTarget)">Cobrar</button>
          <button v-if="isSuperadmin && ['Esperando', 'En atención'].includes(row.entry.status)" type="button" class="small primary" data-action="vet-attend" :data-id="row.entry.id" @click.stop="emit('action', 'vet-attend', row.entry.id, $event.currentTarget)">{{ row.entry.status === 'En atención' ? 'Continuar atención' : 'Atender' }}</button>
        </div>
      </article>
    </div>
    <details v-if="paid.length" class="card">
      <summary><b>Finalizados · {{ paid.length }}</b> <span class="muted">Tickets ya cobrados</span></summary><br>
      <div class="grid">
        <article v-for="row in paid" :key="row.entry.id" class="card waiting-card">
          <div class="row between"><h2>{{ row.entry.petName }}</h2><StatusBadge :status="row.entry.status" /></div>
          <p class="muted">Propietario: {{ row.ownerName }}<br>Ingreso: {{ row.time }}<template v-if="row.ticket"><br>Código de ticket: <b>{{ row.ticket.number }}</b></template></p>
          <template v-if="row.ticket">
            <p><small>Medicamentos:</small> {{ row.medications.length ? row.medications.map(medication => medication.name + (Number.isFinite(Number(medication.price)) ? ' · ' + formatMoney(Number(medication.price)) : '')).join(', ') : '—' }}</p>
            <p><small>Total:</small> <b>{{ row.ticket.total > 0 ? formatMoney(row.ticket.total) : 'A definir' }}</b></p>
            <div class="row"><button type="button" class="small" data-action="admin-ticket" :data-id="row.ticket.id" @click.stop="emit('action', 'admin-ticket', row.ticket.id, $event.currentTarget)">Ver ticket</button></div>
          </template>
        </article>
      </div>
    </details>
  </template>
  <div v-else class="empty">No hay mascotas en la sala de espera. Usá "Escanear" para registrar un ingreso.</div>
</template>
