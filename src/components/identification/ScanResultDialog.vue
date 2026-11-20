<script setup>
import { ref } from 'vue';

defineProps({ pet: { type: Object, required: true }, owner: Object, existing: Object, entryTime: String, age: Number });
const emit = defineEmits(['action']);
const reason = ref('');
</script>

<template>
  <template v-if="existing">
    <p><b>{{ pet.name }}</b> ya tiene un ingreso activo en la sala de espera (estado: {{ existing.status }}, ingreso {{ entryTime }}). No se generó un nuevo registro.</p>
    <div class="form-actions">
      <button type="button" class="ghost" data-action="admin-scan" data-id="" @click.stop="emit('action', 'admin-scan', '')">Volver a escanear</button>
      <button type="button" class="primary" data-action="nav" data-id="waitingRoom" @click.stop="emit('action', 'nav', 'waitingRoom')">Ver sala de espera</button>
    </div>
  </template>
  <template v-else>
    <div class="owner-box">
      <h3>Datos de la mascota</h3>
      <div class="form-grid">
        <p><small>Nombre</small><br>{{ pet.name }}</p>
        <p><small>Especie</small><br>{{ pet.species }}</p>
        <p><small>Raza</small><br>{{ pet.breed }}</p>
        <p><small>Edad</small><br>{{ age }} años</p>
        <p><small>Peso</small><br>{{ pet.weight }} kg</p>
        <p><small>Sexo</small><br>{{ pet.sex }}</p>
      </div>
    </div>
    <div class="owner-box">
      <h3>Datos del propietario</h3>
      <div class="form-grid">
        <p><small>Nombre y apellido</small><br>{{ owner?.name }}</p>
        <p><small>DNI</small><br>{{ owner?.dni }}</p>
        <p><small>Teléfono</small><br>{{ owner?.phone }}</p>
        <p><small>Email</small><br>{{ owner?.email }}</p>
        <p><small>Dirección</small><br>{{ owner?.address }}</p>
      </div>
    </div>
    <form data-form="admin-entry" :data-id="pet.id">
      <label class="field full">Motivo de consulta (lo verá el veterinario al atender)<textarea v-model="reason" name="reason"></textarea></label>
      <div data-form-error class="error" role="alert"></div>
      <div class="form-actions">
        <button type="button" class="ghost" data-action="admin-scan" data-id="" @click.stop="emit('action', 'admin-scan', '')">Volver a escanear</button>
        <button class="primary" type="submit">Confirmar ingreso</button>
      </div>
    </form>
  </template>
</template>
