<script setup>
defineProps({
  rows: { type: Array, required: true },
  isAdmin: Boolean,
  isSuperadmin: Boolean,
  vetId: { type: String, default: '' }
});
const emit = defineEmits(['action']);
</script>

<template>
  <section class="card">
    <div v-if="isAdmin" class="row between">
      <h2>Mascotas en espera</h2>
      <button type="button" class="small" data-action="nav" data-id="waitingRoom" @click.stop="emit('action', 'nav', 'waitingRoom', $event.currentTarget)">Ver sala de espera</button>
    </div>
    <h2 v-else>Pacientes en espera</h2>
    <div v-if="rows.length" class="grid">
      <article v-for="row in rows" :key="row.entry.id" class="card waiting-card">
        <div class="row between">
          <h2>{{ row.entry.petName }}</h2>
          <span :class="'badge ' + (row.entry.status === 'Esperando' ? 'waiting' : row.entry.status === 'En atención' ? 'blue' : '')">{{ row.entry.status }}</span>
        </div>
        <p v-if="row.pet">{{ row.pet.species }} · {{ row.pet.breed }}</p>
        <p class="muted">Propietario: {{ row.ownerName }}<br>Ingreso: {{ row.time }}<template v-if="row.entry.vetName"><br>Veterinario: {{ row.entry.vetName }}</template></p>
        <p><small>Motivo informado:</small> {{ row.entry.reason || '—' }}</p>
        <div class="row">
          <template v-if="isAdmin">
            <button v-if="row.pet" type="button" class="small" data-action="pet" :data-id="row.pet.id"
                    @click.stop="emit('action', 'pet', row.pet.id, $event.currentTarget)">Ver mascota</button>
            <template v-if="row.entry.status === 'Esperando'">
              <button type="button" class="small" data-action="admin-edit-reason" :data-id="row.entry.id"
                      @click.stop="emit('action', 'admin-edit-reason', row.entry.id, $event.currentTarget)">{{ row.entry.reason ? 'Editar motivo' : 'Cargar motivo' }}</button>{{ ' ' }}<button
                      type="button" class="small danger" data-action="admin-cancel-entry" :data-id="row.entry.id"
                      @click.stop="emit('action', 'admin-cancel-entry', row.entry.id, $event.currentTarget)">Cancelar ingreso</button>
            </template>
            <button v-else type="button" class="small" data-action="admin-release-entry" :data-id="row.entry.id"
                    @click.stop="emit('action', 'admin-release-entry', row.entry.id, $event.currentTarget)">Volver a espera</button>
            <button v-if="isSuperadmin && ['Esperando', 'En atención'].includes(row.entry.status)" type="button" class="small primary"
                    data-action="vet-attend" :data-id="row.entry.id" @click.stop="emit('action', 'vet-attend', row.entry.id, $event.currentTarget)">{{ row.entry.status === 'En atención' ? 'Continuar atención' : 'Atender' }}</button>
          </template>
          <template v-else>
            <span v-if="row.entry.vetId && row.entry.vetId !== vetId" class="muted">En atención con otro veterinario</span>
            <button v-else type="button" class="primary small" data-action="vet-attend" :data-id="row.entry.id"
                    @click.stop="emit('action', 'vet-attend', row.entry.id, $event.currentTarget)">{{ row.entry.status === 'En atención' ? 'Continuar atención' : 'Atender' }}</button>
          </template>
        </div>
      </article>
    </div>
    <div v-else class="empty">{{ isAdmin ? 'No hay mascotas en la sala de espera. Usá "Escanear" para registrar un ingreso.' : 'No hay pacientes en la sala de espera en este momento.' }}</div>
  </section>
</template>
