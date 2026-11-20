<script setup>
import { computed } from 'vue';
const props = defineProps({ medication: { type: Object, required: true }, price: [String, Number], maxMoney: { type: Number, required: true } });
const emit = defineEmits(['price']);
const detail = computed(() => [props.medication.quantity ? 'Cant. ' + props.medication.quantity : '', props.medication.dose ? 'Dosis: ' + props.medication.dose : '', props.medication.route ? 'Vía: ' + props.medication.route : '', props.medication.notes ? 'Obs.: ' + props.medication.notes : ''].filter(Boolean).join(' · '));
</script>
<template>
  <div class="charge-row" data-charge-row>
    <div class="charge-info"><b>{{ medication.name || 'Concepto' }}</b><template v-if="detail"><br><small>{{ detail }}</small></template></div>
    <input type="hidden" name="med-name[]" :value="medication.name || ''">
    <input type="hidden" name="med-quantity[]" :value="medication.quantity || ''">
    <input type="hidden" name="med-dose[]" :value="medication.dose || ''">
    <input type="hidden" name="med-route[]" :value="medication.route || ''">
    <input type="hidden" name="med-notes[]" :value="medication.notes || ''">
    <label class="field">Precio ($)<input name="med-price[]" type="number" :value="price" min="0" step="1" data-charge-price required :max="maxMoney" @input="emit('price', $event.target.value)"></label>
  </div>
</template>
