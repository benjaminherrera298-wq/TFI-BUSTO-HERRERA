<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue';
import ClinicalRecordCard from './ClinicalRecordCard.vue';
import MedicationRow from './MedicationRow.vue';

const props = defineProps({
  pet: { type: Object, required: true },
  age: { type: Number, required: true },
  record: { type: Object, default: null },
  entryId: { type: String, default: '' },
  clinicalId: { type: String, default: '' },
  history: { type: Array, required: true },
  initialReason: { type: String, default: '' },
  legacyPerformed: { type: String, default: '' },
  medications: { type: Array, required: true },
  today: { type: String, required: true },
  categories: { type: Array, required: true },
  formatDate: { type: Function, required: true }
});
const emit = defineEmits(['action', 'typeChange']);
const quickFilters = [['Historia clínica', ''], ['Vacunas', 'Vacuna'], ['Tratamientos', 'Tratamiento'], ['Desparasitación', 'Desparasitación'], ['Pipetas', 'Pipeta'], ['Estudios', 'Estudio']];
const showingForm = ref(Boolean(props.record));
const historyFilter = ref(null);
const attentionType = ref('Consulta');
const fields = reactive({});
const medicationsDraft = ref([]);
const historyWrap = ref(null);
const formWrap = ref(null);
let medicationId = 0;

function reset() {
  const record = props.record || {};
  showingForm.value = Boolean(props.record);
  historyFilter.value = null;
  attentionType.value = record.type === 'Vacuna' ? 'Vacuna' : 'Consulta';
  Object.assign(fields, {
    weight: record.weight || props.pet.weight || '', temperature: record.temperature || '',
    attObservations: record.attObservations || props.legacyPerformed || '', attProcedures: record.attProcedures || '',
    attTreatments: record.attTreatments || '', attIndications: record.attIndications || '', attRecommendations: record.attRecommendations || '',
    nextCategory: record.nextCategory || 'Control', nextDate: record.nextDate || '', nextNote: record.nextNote || '',
    vaccineName: record.vaccineName || '', vaccineType: record.vaccineType || '', vaccineDose: record.vaccineDose || '',
    vaccineLot: record.vaccineLot || '', vaccineNext: record.vaccineNext || ''
  });
  medicationsDraft.value = props.medications.map(medication => ({ key: ++medicationId, values: { ...medication } }));
}
watch(() => [props.record, props.pet, props.entryId, props.clinicalId], reset, { immediate: true });
const vaccineMode = computed(() => attentionType.value === 'Vacuna');
const activeFilter = computed(() => historyFilter.value ?? (vaccineMode.value ? 'Vacuna' : ''));
const visibleHistory = computed(() => props.history.filter(item => !historyFilter.value || item.record.type === historyFilter.value));
const nextDateMin = computed(() => props.record?.nextDate && props.record.nextDate < props.today ? props.record.nextDate : props.today);

function filterHistory(value) {
  historyFilter.value = value;
  attentionType.value = value || 'Consulta';
  emit('typeChange', attentionType.value);
}
async function toggleForm() {
  showingForm.value = !showingForm.value;
  await nextTick();
  (showingForm.value ? formWrap.value : historyWrap.value)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function addMedication() { medicationsDraft.value.push({ key: ++medicationId, values: {} }); }
function changeMedication(row, changes) { Object.assign(row.values, changes); }
function removeMedication(key) { medicationsDraft.value = medicationsDraft.value.filter(row => row.key !== key); }
</script>

<template>
  <div id="attend-layout" :class="showingForm ? 'attend-single' : 'attend-layout'">
    <aside id="attend-pet-info" class="attend-pet" :hidden="showingForm">
      <h3>{{ pet.name }}</h3><p class="muted">{{ pet.species }} · {{ pet.breed }}</p>
      <ul><li><small>Edad</small><br>{{ age }} años</li><li><small>Sexo</small><br>{{ pet.sex }}</li><li><small>Peso</small><br>{{ pet.weight }} kg</li><li><small>Nacimiento</small><br>{{ formatDate(pet.birth) }}</li></ul>
      <p v-if="pet.observations"><small>Observaciones</small><br>{{ pet.observations }}</p>
    </aside>
    <div class="attend-main">
      <div id="attend-history-wrap" ref="historyWrap" :hidden="showingForm">
        <div class="row between attend-history-head"><h3 style="margin:0;">Historia clínica</h3><small id="attend-history-count" class="muted">{{ visibleHistory.length }} registro(s)</small></div>
        <div class="attend-quick" role="group" aria-label="Búsqueda rápida en historia clínica">
          <button v-for="[label, type] in quickFilters" :key="label" type="button" :class="['small', { active: activeFilter === type }]"
                  data-action="vet-history-filter" :data-id="type" @click.stop="filterHistory(type)">{{ label }}</button>
        </div>
        <div id="attend-history-list" class="attend-history">
          <div v-for="item in history" :key="item.record.id" :data-history-type="item.record.type || ''" :hidden="Boolean(historyFilter && item.record.type !== historyFilter)"><ClinicalRecordCard v-bind="item" /></div>
          <p v-if="!history.length" class="muted">Sin atenciones anteriores registradas.</p>
        </div>
        <div v-if="history.length" id="attend-history-empty" class="empty" :hidden="visibleHistory.length > 0">Sin registros en esta sección.</div>
      </div>
      <div class="attend-toggle-row"><button type="button" class="primary" data-action="vet-toggle-attention" data-id="" @click.stop="toggleForm">{{ showingForm ? '← Volver al historial' : vaccineMode ? 'Registrar vacuna' : 'Registrar atención' }}</button></div>
      <div id="attend-form-wrap" ref="formWrap" :hidden="!showingForm">
        <form data-form="attention" :data-id="entryId + '|' + clinicalId">
          <input type="hidden" name="attType" :value="attentionType">
          <div id="attend-consult-wrap">
            <h3 id="attend-form-title">{{ vaccineMode ? 'Datos de la vacuna' : 'Datos de la consulta' }}</h3>
            <div class="owner-box"><h3>Motivo de consulta</h3><p>{{ initialReason || '—' }}</p><input type="hidden" name="reason" :value="initialReason"></div>
            <div class="form-grid">
              <label class="field">Peso (kg)<input v-model="fields.weight" name="weight" type="number" min="0.01" step="0.01" max="100000"></label>
              <label class="field">Temperatura (°C)<input v-model="fields.temperature" name="temperature" type="number" step="0.1" min="0.1" max="100"></label>
            </div>
            <div id="attend-consult-fields" :hidden="vaccineMode">
              <div class="form-grid">
                <label class="field full">Observaciones<textarea v-model="fields.attObservations" name="attObservations"></textarea></label>
                <label class="field full">Procedimientos<textarea v-model="fields.attProcedures" name="attProcedures"></textarea></label>
                <label class="field full">Tratamientos<textarea v-model="fields.attTreatments" name="attTreatments"></textarea></label>
                <label class="field full">Indicaciones<textarea v-model="fields.attIndications" name="attIndications"></textarea></label>
                <label class="field full">Recomendaciones<textarea v-model="fields.attRecommendations" name="attRecommendations"></textarea></label>
              </div>
              <h3>Medicación de la consulta</h3><p class="muted">Información completa: nombre, dosis, cantidad, vía de administración y observaciones.</p>
              <div id="med-rows"><MedicationRow v-for="row in medicationsDraft" :key="row.key" :medication="row.values" @change="changeMedication(row, $event)" @remove="removeMedication(row.key)" /></div>
              <button type="button" class="small" data-action="vet-add-med" data-id="" @click.stop="addMedication">+ Agregar medicamento</button>
              <h3>Próximo cuidado</h3><p class="muted">Opcional. Si cargás una fecha, le aparece al propietario en su calendario con el color del tipo elegido.</p>
              <div class="form-grid">
                <label class="field">Tipo<select v-model="fields.nextCategory" name="nextCategory"><option v-for="category in categories" :key="category" :value="category">{{ category }}</option></select></label>
                <label class="field">Fecha<input v-model="fields.nextDate" name="nextDate" type="date" :min="nextDateMin"></label>
                <label class="field">Nota para el propietario<input v-model="fields.nextNote" name="nextNote" type="text"></label>
              </div>
              <p class="muted" style="margin:0.4rem 0 0;">Al guardar se genera el ticket para Administración con estos mismos datos. No hay que volver a rellenarlo.</p>
            </div>
            <div id="attend-vaccine-fields" :hidden="!vaccineMode">
              <div class="form-grid">
                <label class="field">Nombre de la vacuna<input v-model="fields.vaccineName" name="vaccineName" type="text"></label>
                <label class="field">Tipo de vacuna<input v-model="fields.vaccineType" name="vaccineType" type="text"></label>
                <label class="field">Dosis<input v-model="fields.vaccineDose" name="vaccineDose" type="text"></label>
                <label class="field">Lote<input v-model="fields.vaccineLot" name="vaccineLot" type="text"></label>
                <label class="field">Próxima aplicación<input v-model="fields.vaccineNext" name="vaccineNext" type="date" :min="today"></label>
              </div>
              <p class="muted" style="margin:0.4rem 0 0;">Al guardar se genera el ticket para Administración con estos datos. No hay que volver a rellenarlo.</p>
            </div>
            <div data-form-error class="error" role="alert"></div>
            <div id="attend-consult-actions" class="form-actions" :hidden="vaccineMode"><button type="button" class="" data-action="close" data-id="" @click.stop="emit('action', 'close', '', $event.currentTarget)">Cancelar</button><button class="primary" type="submit">Guardar consulta</button></div>
            <div id="attend-vaccine-actions" class="form-actions" :hidden="!vaccineMode"><button type="button" class="" data-action="close" data-id="" @click.stop="emit('action', 'close', '', $event.currentTarget)">Cancelar</button><button class="primary" type="submit">Guardar vacuna</button></div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
