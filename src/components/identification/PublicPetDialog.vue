<script setup>
import PetImage from '../pets/PetImage.vue';

defineProps({ pet: { type: Object, required: true }, image: { type: Object, required: true } });
const emit = defineEmits(['action']);
</script>

<template>
  <div class="center">
    <PetImage :image="image" large />
    <h2>{{ pet.name }}</h2>
    <p>{{ pet.breed }}</p>
    <p>Esta mascota pertenece a una cuenta registrada.</p>
    <button type="button" class="primary" data-action="public-login" :data-id="pet.qr"
            @click.stop="emit('action', 'public-login', pet.qr)">Iniciar sesión</button>
  </div>
</template>
