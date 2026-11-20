<script setup>
import ClinicalRecordCard from './ClinicalRecordCard.vue';

defineProps({
  pet: { type: Object, required: true },
  ownerName: String,
  age: Number,
  tab: String,
  issuedDate: String,
  records: { type: Array, default: () => [] }
});
const emit = defineEmits(['action']);
</script>

<template>
  <div class="center">
    <h2>{{ pet.name }}</h2>
    <p class="muted">{{ pet.species }} · {{ pet.breed }} · {{ pet.sex }} · {{ age }} años · {{ pet.weight }} kg</p>
    <p class="muted">Propietario: {{ ownerName || 'No disponible' }} · Código <b style="letter-spacing:0.2rem;">{{ pet.code || '—' }}</b></p>
    <p class="muted"><small>Sección: {{ tab }} · {{ records.length }} registro(s) · Emitido el {{ issuedDate }}</small></p>
  </div>
  <div>
    <ClinicalRecordCard v-for="row in records" :key="row.record.id" v-bind="row" />
    <p v-if="!records.length" class="muted">Sin registros en esta sección.</p>
  </div>
  <div class="row"><button type="button" class="primary" data-action="print" data-id="" @click.stop="emit('action', 'print', '')">Imprimir</button></div>
</template>
