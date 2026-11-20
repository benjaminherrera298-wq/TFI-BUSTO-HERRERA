<script setup>
import { computed, ref, watch } from 'vue';
import StatusBadge from '../shared/StatusBadge.vue';
import ChargeMedicationRow from './ChargeMedicationRow.vue';
const props = defineProps({
  ticket: { type: Object, required: true },
  pet: Object,
  owner: Object,
  medications: { type: Array, required: true },
  maxMoney: { type: Number, required: true },
  formatDate: { type: Function, required: true },
  formatMoney: { type: Function, required: true }
});
const emit = defineEmits(['action']);
const medicationPrices = ref([]);
const serviceAmount = ref('');
watch(() => [props.ticket, props.medications], () => {
  medicationPrices.value = props.medications.map(medication => medication.price ?? '');
  serviceAmount.value = props.ticket.serviceAmount ?? '';
}, { immediate: true });
const total = computed(() => Math.round([...medicationPrices.value, serviceAmount.value].reduce((sum, raw) => {
  const amount = Number(raw);
  return Number.isFinite(amount) && amount > 0 ? sum + amount : sum;
}, 0)));
</script>

<template>
  <div class="ticket-payment-shell">
    <section class="ticket-payment-summary">
      <div class="ticket-payment-kicker">Ticket en espera</div>
      <div class="ticket-payment-title"><div><span>Ticket {{ ticket.number }}</span><h3>{{ pet?.name || ticket.petName || 'Mascota' }}</h3></div><StatusBadge :status="ticket.status" /></div>
      <div class="ticket-payment-data">
        <span><small>Propietario</small>{{ owner?.name || ticket.ownerName || 'No disponible' }}</span>
        <span><small>Código mascota</small><b>{{ pet?.code || ticket.petCode || '—' }}</b></span>
        <span><small>Fecha</small>{{ formatDate(ticket.date) }}</span>
        <span><small>Hora</small>{{ ticket.time || '—' }}</span>
        <span><small>Veterinario</small>{{ ticket.vetName || 'No disponible' }}</span>
      </div>
      <div class="ticket-payment-care"><p><small>Motivo</small>{{ ticket.reason || '—' }}</p><p><small>Atención realizada</small>{{ ticket.performed || '—' }}</p></div>
    </section>
    <form class="ticket-payment-form" data-form="charge" :data-id="ticket.id">
      <section class="ticket-price-panel">
        <div class="ticket-price-heading"><div><span>Detalle del cobro</span><h3>Conceptos y precios</h3></div><small>El total se calcula automáticamente.</small></div>
        <div id="charge-med-rows">
          <ChargeMedicationRow v-for="(medication, index) in medications" :key="index" :medication="medication" :price="medicationPrices[index]" :max-money="maxMoney" @price="medicationPrices[index] = $event" />
          <p v-if="!medications.length" class="muted">Sin medicamentos indicados por el veterinario.</p>
        </div>
        <div class="ticket-service-price"><label class="field">Monto por atención / servicios ($)<input v-model="serviceAmount" name="serviceAmount" type="number" min="0" step="1" data-charge-price :max="maxMoney"></label></div>
        <div class="ticket-charge-total"><span>Total a cobrar</span><b id="charge-total">{{ formatMoney(total) }}</b></div>
      </section>
      <div data-form-error class="error" role="alert"></div>
      <div class="form-actions"><button type="button" class="" data-action="close" data-id="" @click.stop="emit('action', 'close', '', $event.currentTarget)">Cancelar</button><button class="primary" type="submit">Confirmar cobro</button></div>
    </form>
  </div>
</template>
