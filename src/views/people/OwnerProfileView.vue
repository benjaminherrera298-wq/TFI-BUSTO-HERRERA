<script setup>
import PetImage from '../../components/pets/PetImage.vue';

defineProps({
  clinicName: { type: String, default: '' },
  owner: Object,
  pets: { type: Array, default: () => [] },
  isOwner: Boolean,
  canManage: Boolean
});
const emit = defineEmits(['action']);
</script>

<template>
  <div v-if="!owner" class="empty">Perfil no disponible.</div>
  <template v-else>
    <div class="heading">
      <div><div class="eyebrow">{{ clinicName }}</div><h1>{{ owner.name }}</h1><p>Perfil del propietario</p></div>
      <div class="row">
        <button type="button" class="" data-action="edit" :data-id="'owners:' + owner.id"
                @click.stop="emit('action', 'edit', 'owners:' + owner.id)">{{ isOwner ? 'Editar mis datos' : 'Editar propietario' }}</button>
        <button v-if="!isOwner && canManage" type="button" class="primary" data-action="pet-owner" :data-id="owner.id"
                @click.stop="emit('action', 'pet-owner', owner.id)">+ Agregar mascota</button>
      </div>
    </div>
    <section class="card">
      <div class="form-grid">
        <p><small>DNI</small><br>{{ owner.dni }}</p>
        <p><small>Teléfono</small><br>{{ owner.phone }}</p>
        <p><small>Correo</small><br>{{ owner.email }}</p>
        <p><small>Dirección</small><br>{{ owner.address }}</p>
      </div>
    </section>
    <h2>Mascotas vinculadas</h2>
    <div class="grid">
      <article v-for="row in pets" :key="row.pet.id" class="card">
        <PetImage :image="row.image" />
        <h2>{{ row.pet.name }}</h2>
        <p>{{ row.pet.species }} · {{ row.pet.breed }}</p>
        <button type="button" class="primary" data-action="pet" :data-id="row.pet.id"
                @click.stop="emit('action', 'pet', row.pet.id)">Ver perfil</button>
      </article>
      <p v-if="!pets.length" class="muted">Todavía no hay mascotas vinculadas.</p>
    </div>
  </template>
</template>
