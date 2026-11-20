<script setup>
import { computed, ref } from 'vue';
import AppIcon from '../../components/shared/AppIcon.vue';
import HomeWaitingPatients from '../../components/home/HomeWaitingPatients.vue';
import HomePendingTickets from '../../components/home/HomePendingTickets.vue';

const props = defineProps({
  clinicName: { type: String, required: true },
  greeting: { type: String, required: true },
  dateLabel: { type: String, required: true },
  isAdmin: Boolean,
  isSuperadmin: Boolean,
  isVet: Boolean,
  vetId: { type: String, default: '' },
  canUsePersonalAgenda: Boolean,
  waitingRows: { type: Array, default: () => [] },
  ticketRows: { type: Array, default: () => [] },
  agendaEntries: { type: Array, default: () => [] },
  owners: { type: Array, default: () => [] },
  pets: { type: Array, default: () => [] }
});
const emit = defineEmits(['action']);
const search = ref('');
const searchText = computed(() => search.value.trim().toLowerCase());
const matchingOwners = computed(() => props.owners.filter(owner => JSON.stringify(owner).toLowerCase().includes(searchText.value)));
const matchingPets = computed(() => props.pets.filter(row => JSON.stringify({ ...row.pet, owner: row.owner }).toLowerCase().includes(searchText.value)));
</script>

<template>
  <div class="heading">
    <div>
      <div class="eyebrow">{{ clinicName }}</div>
      <h1>{{ greeting }}</h1>
      <p>{{ dateLabel }}</p>
    </div>
    <div class="row"></div>
  </div>
  <div class="toolbar">
    <input id="global-search" v-model="search" aria-label="Buscar mascota, propietario, DNI, teléfono o código"
           placeholder="Buscar mascota, propietario, DNI, teléfono o código..." @input.stop>
    <button v-if="isAdmin" type="button" class="scan-btn" data-action="admin-scan" data-id=""
            @click.stop="emit('action', 'admin-scan', '', $event.currentTarget)"><AppIcon name="qr" /> Escanear / Código</button>
  </div>
  <div id="global-results" class="search-results">
    <section v-if="searchText" class="card">
      <h2>Resultados</h2>
      <p v-for="owner in matchingOwners" :key="owner.id">
        <button type="button" class="ghost" data-action="owner" :data-id="owner.id"
                @click.stop="emit('action', 'owner', owner.id, $event.currentTarget)">{{ owner.name }} · {{ owner.dni }}</button>
      </p>
      <template v-for="(row, index) in matchingPets" :key="row.pet.id"><template v-if="index">{{ ' ' }}</template><button
                type="button" class="small" data-action="pet" :data-id="row.pet.id"
                @click.stop="emit('action', 'pet', row.pet.id, $event.currentTarget)">{{ row.pet.name }} · {{ row.ownerName }}</button></template>
      <p v-if="!matchingPets.length" class="muted">Sin mascotas coincidentes.</p>
    </section>
  </div>
  <HomeWaitingPatients v-if="isAdmin || isVet" :rows="waitingRows" :is-admin="isAdmin" :is-superadmin="isSuperadmin" :vet-id="vetId"
                       @action="(action, id, element) => emit('action', action, id, element)" />
  <HomePendingTickets v-if="isAdmin" :rows="ticketRows" @action="(action, id, element) => emit('action', action, id, element)" />
  <section v-if="canUsePersonalAgenda" class="card">
    <div class="row between">
      <h2>Mis próximos recordatorios</h2>
      <button type="button" class="small" data-action="nav" data-id="agenda" @click.stop="emit('action', 'nav', 'agenda', $event.currentTarget)">Ver mi agenda</button>
    </div>
    <article v-for="row in agendaEntries" :key="row.entry.id" class="timeline">
      <b>{{ row.entry.title }}</b>
      <p class="muted">{{ row.dateLabel }} · {{ row.entry.time || 'Todo el día' }}</p>
      <button type="button" class="small" data-action="agenda-open" :data-id="row.entry.id" @click.stop="emit('action', 'agenda-open', row.entry.id, $event.currentTarget)">Ver anotación</button>
    </article>
    <p v-if="!agendaEntries.length" class="muted">No tenés recordatorios pendientes. Agregá una anotación en tu agenda.</p>
  </section>
</template>
