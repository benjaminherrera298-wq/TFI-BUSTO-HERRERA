<script setup>
import StatusBadge from '../shared/StatusBadge.vue';

defineProps({
  record: { type: Object, required: true },
  medications: { type: Array, default: () => [] },
  authorName: { type: String, default: '' },
  formatDate: { type: Function, required: true }
});
</script>

<template>
  <article class="timeline">
    <div class="row between"><b>{{ record.title }}</b><StatusBadge :status="record.type" /></div>
    <p>{{ record.info }}</p>
    <p v-if="record.reason"><small>Motivo de consulta:</small> {{ record.reason }}</p>
    <p v-if="record.type === 'Vacuna' && (record.vaccineName || record.vaccineType || record.vaccineDose || record.vaccineLot || record.vaccineNext)"><small>Vacuna:</small> {{ (record.vaccineName || '—') + (record.vaccineType ? ' · Tipo: ' + record.vaccineType : '') + (record.vaccineDose ? ' · Dosis: ' + record.vaccineDose : '') + (record.vaccineLot ? ' · Lote: ' + record.vaccineLot : '') + (record.vaccineNext ? ' · Próxima aplicación: ' + formatDate(record.vaccineNext) : '') }}</p>
    <p v-if="record.diagnosis">{{ '\n              ' }}<small>Diagnóstico:</small>{{ '\n              ' + record.diagnosis + '\n            ' }}</p>
    <template v-if="medications.length">
      <p><small>Medicamentos:</small></p>
      <ul><li v-for="(medication, index) in medications" :key="index">{{ medication.name + (medication.dose ? ' · ' + medication.dose : '') + (medication.quantity ? ' · Cant. ' + medication.quantity : '') + (medication.route ? ' · ' + medication.route : '') }}</li></ul>
    </template>
    <small>{{ formatDate(record.date) + (record.time ? ' · ' + record.time : '') + ' · ' + authorName + (record.weight ? ' · ' + record.weight + ' kg' : '') + (record.temperature ? ' · ' + record.temperature + ' °C' : '') + (!record.visible ? ' · Nota interna' : '') }}</small>
  </article>
</template>
