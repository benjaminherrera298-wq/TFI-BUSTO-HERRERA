<script setup>
import StatusBadge from '../shared/StatusBadge.vue';
defineProps({
  clinicName: String,
  ticket: { type: Object, required: true },
  pet: Object,
  owner: Object,
  paid: Boolean,
  paidAtLabel: String,
  medications: { type: Array, required: true },
  formatDate: { type: Function, required: true },
  formatMoney: { type: Function, required: true }
});
const emit = defineEmits(['action']);
function medicationDetail(medication) {
  return [medication.dose ? 'Dosis: ' + medication.dose : '', medication.quantity ? 'Cant.: ' + medication.quantity : '', medication.route ? 'Vía: ' + medication.route : '', medication.notes ? 'Obs.: ' + medication.notes : ''].filter(Boolean).join(' · ') || '—';
}
</script>

<template>
  <div class="receipt-shell">
    <article class="payment-receipt">
      <header class="receipt-header">
        <div class="receipt-brand"><span class="receipt-mark">+</span><div><small>COMPROBANTE VETERINARIO</small><h3>{{ clinicName || 'Gestión veterinaria' }}</h3></div></div>
        <div class="receipt-state"><span>{{ paid ? 'Pago realizado' : 'Ticket pendiente' }}</span><StatusBadge :status="ticket.status" /></div>
      </header>
      <section class="receipt-ticket-title"><div><small>NÚMERO DE COMPROBANTE</small><strong>{{ ticket.number }}</strong></div><div><small>FECHA Y HORA</small><strong>{{ formatDate(ticket.date) + (ticket.time ? ' · ' + ticket.time : '') }}</strong></div></section>
      <section class="receipt-data-grid">
        <div><small>Mascota</small><strong>{{ pet?.name || ticket.petName || 'No disponible' }}</strong></div>
        <div><small>Código mascota</small><strong>{{ pet?.code || ticket.petCode || '—' }}</strong></div>
        <div><small>Propietario</small><strong>{{ owner?.name || ticket.ownerName || 'No disponible' }}</strong></div>
        <div><small>Veterinario</small><strong>{{ ticket.vetName || 'No disponible' }}</strong></div>
      </section>
      <section class="receipt-care-summary"><p><small>Motivo</small>{{ ticket.reason || '—' }}</p><p><small>Atención realizada</small>{{ ticket.performed || '—' }}</p></section>
      <div class="table-wrap receipt-lines-wrap"><table class="ticket-lines receipt-lines"><thead><tr><th>Concepto</th><th>Detalle</th><th>Importe</th></tr></thead>
        <tbody>
          <tr v-for="(medication, index) in medications" :key="index"><td>{{ medication.name || 'Medicamento' }}</td><td>{{ medicationDetail(medication) }}</td><td>{{ Number.isFinite(Number(medication.price)) ? formatMoney(Number(medication.price)) : '—' }}</td></tr>
          <tr v-if="Number(ticket.serviceAmount) > 0"><td>Atención / servicios</td><td>Servicio veterinario</td><td>{{ formatMoney(Number(ticket.serviceAmount)) }}</td></tr>
          <tr v-if="!medications.length && !(Number(ticket.serviceAmount) > 0)"><td colspan="3">Sin conceptos cargados.</td></tr>
        </tbody>
      </table></div>
      <section class="receipt-total"><span>Total abonado</span><strong>{{ ticket.total > 0 ? formatMoney(ticket.total) : 'A definir' }}</strong></section>
      <p v-if="ticket.paidAt" class="receipt-paid-at">Cobrado el {{ paidAtLabel }}</p>
      <footer class="receipt-footer"><div class="receipt-barcode" aria-hidden="true"></div><strong>{{ ticket.number }}</strong><small>Conservá este comprobante como constancia del pago.</small></footer>
    </article>
    <div class="form-actions receipt-actions"><button type="button" class="" data-action="close" data-id="" @click.stop="emit('action', 'close', '', $event.currentTarget)">Cerrar</button><button type="button" class="primary" data-action="print" data-id="" @click.stop="emit('action', 'print', '', $event.currentTarget)">Imprimir comprobante</button></div>
  </div>
</template>
